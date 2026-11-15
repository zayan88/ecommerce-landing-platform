/**
 * One-time (re-runnable) copy of the KV order data into D1.
 *
 * Sources: per-order keys `order:<id>`, the legacy `orders_all` array, tombstones `order_deleted:<id>`
 * and the daily counters `stats:day:<YYYY-MM-DD>`. KV is only READ here — nothing is changed or removed,
 * so KV stays a complete backup and ORDERS_BACKEND=kv keeps working.
 *
 * Idempotent: orders are keyed by id (a newer KV copy updates the D1 row, an identical one is left
 * alone), tombstones are INSERT OR IGNORE, counters never go down. A tombstoned order — deleted in KV
 * or already deleted in D1 — is never (re)created.
 *
 * Paged (`offset` / `limit`) so a call stays inside the Workers free limits
 * (50 D1 queries and 1,000 KV operations per invocation). Works whatever ORDERS_BACKEND is.
 */
import type { Order } from "@/types";
import { kvStore } from "./kv";
import {
  LEGACY_ORDERS_KEY,
  isTombstoned,
  listDeletedOrderTokens,
  listOrderEntries,
  mapLimit,
  normalizeLegacy,
  readOrderRecord,
  sanitizeOrderForStorage,
} from "./order-kv";
import { isD1Available } from "./d1";
import { getOrdersRepo, ordersBackend, ordersKvMirrorEnabled } from "./orders-repo";

export const IMPORT_PAGE_DEFAULT = 100;
export const IMPORT_PAGE_MAX = 300;
const STATS_KEY_PREFIX = "stats:day:";
const STATS_DAYS_MAX = 400;

export interface OrdersImportReport {
  dry_run: boolean;
  source: { kv_order_keys: number; legacy_orders: number; legacy_only: number; total: number };
  page: { offset: number; limit: number; processed: number };
  inserted: number;
  updated: number;
  unchanged: number;
  /** Order ids whose order number already belongs to a different order in D1 (not imported). */
  conflicts: string[];
  skipped_deleted: number;
  /** Listed in KV but gone when read (deleted meanwhile). */
  skipped_missing: number;
  /** Ids that could not be read from KV — re-run the same page. */
  failed_reads: string[];
  tombstones: { kv: number; d1: number };
  stats_days: number;
  d1_orders_total: number;
  next_offset: number;
  done: boolean;
}

export class OrdersImportError extends Error {}

export async function importKvOrdersToD1(opts: { offset?: number; limit?: number; dryRun?: boolean } = {}): Promise<OrdersImportReport> {
  const dryRun = Boolean(opts.dryRun);
  const offset = Math.max(Math.floor(Number(opts.offset) || 0), 0);
  const limit = Math.min(Math.max(Math.floor(Number(opts.limit) || IMPORT_PAGE_DEFAULT), 1), IMPORT_PAGE_MAX);
  const repo = getOrdersRepo(); // throws D1UnavailableError when D1 is not bound

  // 1. Tombstones first. If KV cannot say what was deleted, nothing is written.
  const kvDeleted = await listDeletedOrderTokens();
  if (!kvDeleted.ok) throw new OrdersImportError("KV tombstone listing failed — nothing was imported");
  if (!dryRun) await repo.addDeletedTokens(Array.from(kvDeleted.tokens));
  const deleted = await repo.listDeletedTokens();
  kvDeleted.tokens.forEach((t) => deleted.add(t));

  // 2. Every candidate id: per-order keys, plus legacy-array orders that have no key yet.
  const listing = await listOrderEntries();
  if (!listing.ok) throw new OrdersImportError("KV order listing failed — nothing was imported");
  const legacyRead = await kvStore.read<unknown[]>(LEGACY_ORDERS_KEY);
  if (legacyRead.status === "error") throw new OrdersImportError("KV legacy orders could not be read — nothing was imported");
  const legacy = new Map<string, Order>();
  if (legacyRead.status === "found" && Array.isArray(legacyRead.value)) {
    for (const raw of legacyRead.value) {
      const order = normalizeLegacy(raw);
      if (order && !legacy.has(order.id)) legacy.set(order.id, order);
    }
  }
  const keyIds = new Set(listing.entries.map((e) => e.id));
  const legacyOnly = Array.from(legacy.keys()).filter((id) => !keyIds.has(id));
  const allIds = [...Array.from(keyIds), ...legacyOnly].sort();
  const pageIds = allIds.slice(offset, offset + limit);

  // 3. Read this page's full records (the per-key record wins over the legacy copy).
  const failedReads: string[] = [];
  let skippedMissing = 0;
  const loaded = await mapLimit(pageIds, 6, async (id): Promise<Order | null> => {
    if (!keyIds.has(id)) return legacy.get(id) || null;
    let res = await readOrderRecord(id);
    if (res.status === "error") res = await readOrderRecord(id); // one retry
    if (res.status === "found") return sanitizeOrderForStorage({ ...res.value, id });
    if (res.status === "missing") skippedMissing++;
    else failedReads.push(id);
    return null;
  });

  let skippedDeleted = 0;
  const toImport: Order[] = [];
  for (const order of loaded) {
    if (!order) continue;
    if (isTombstoned(order, deleted)) skippedDeleted++;
    else toImport.push(order);
  }

  // 4. Write.
  const tally = { inserted: 0, updated: 0, unchanged: 0 };
  const conflicts: string[] = [];
  if (!dryRun && toImport.length > 0) {
    const outcomes = await repo.importOrders(toImport);
    for (const order of toImport) {
      const outcome = outcomes[order.id];
      if (outcome === "conflict" || !outcome) conflicts.push(order.id);
      else tally[outcome]++;
    }
  }

  // 5. Daily visit counters (first page only; counters never decrease, so repeats are harmless).
  let statsDays = 0;
  if (offset === 0) {
    const statKeys = await kvStore.listAll(STATS_KEY_PREFIX);
    if (statKeys.ok) {
      const names = statKeys.keys.map((k) => k.name).sort().slice(-STATS_DAYS_MAX);
      const values = await mapLimit(names, 6, (name) => kvStore.get<{ visits?: number; checkout_starts?: number }>(name).catch(() => null));
      const rows = names
        .map((name, i) => ({
          day: name.slice(STATS_KEY_PREFIX.length),
          visits: Number(values[i]?.visits) || 0,
          checkout_starts: Number(values[i]?.checkout_starts) || 0,
        }))
        .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.day) && (r.visits > 0 || r.checkout_starts > 0));
      statsDays = rows.length;
      if (!dryRun && rows.length > 0) await repo.importDayStats(rows);
    }
  }

  const nextOffset = offset + pageIds.length;
  return {
    dry_run: dryRun,
    source: { kv_order_keys: keyIds.size, legacy_orders: legacy.size, legacy_only: legacyOnly.length, total: allIds.length },
    page: { offset, limit, processed: pageIds.length },
    ...tally,
    conflicts,
    skipped_deleted: skippedDeleted,
    skipped_missing: skippedMissing,
    failed_reads: failedReads,
    tombstones: { kv: kvDeleted.tokens.size, d1: (await repo.listDeletedTokens()).size },
    stats_days: statsDays,
    d1_orders_total: await repo.countOrders(),
    next_offset: nextOffset,
    done: nextOffset >= allIds.length,
  };
}

/** Read-only totals of both stores, to compare before / after the import and before switching. */
export async function ordersStorageStatus() {
  const d1Available = isD1Available();
  let d1: { orders: number; tombstones: number } | null = null;
  let d1Error: string | undefined;
  if (d1Available) {
    try {
      const repo = getOrdersRepo();
      d1 = { orders: await repo.countOrders(), tombstones: (await repo.listDeletedTokens()).size };
    } catch (e) {
      d1Error = (e as Error)?.message || "D1 query failed";
    }
  }
  const [listing, kvDeleted, legacyRead] = await Promise.all([
    listOrderEntries(),
    listDeletedOrderTokens(),
    kvStore.read<unknown[]>(LEGACY_ORDERS_KEY),
  ]);
  return {
    backend: ordersBackend(),
    kv_mirror: ordersKvMirrorEnabled(),
    d1: { available: d1Available, ...(d1 || {}), ...(d1Error ? { error: d1Error } : {}) },
    kv: {
      available: kvStore.isAvailable(),
      order_keys: listing.ok ? listing.entries.length : null,
      tombstones: kvDeleted.ok ? kvDeleted.tokens.size : null,
      legacy_orders: legacyRead.status === "found" && Array.isArray(legacyRead.value) ? legacyRead.value.length : 0,
    },
  };
}
