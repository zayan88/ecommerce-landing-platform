import { Order, OrderTrackingMeta } from "@/types";
import { kvStore, KvReadResult } from "./kv";

/**
 * Durable order storage on Cloudflare KV — one key per order.
 *
 *   order:<id>            full order JSON (relations stripped → no secrets) + KV metadata
 *   order_deleted:<id>    tombstone; metadata.k lists the ids/serials that must not be resurrected
 *   orders_all            LEGACY single-array store. Read-only backup: never written or deleted here.
 *   orders_migrated_v1    marker written once every legacy order has its own key
 *
 * Why this shape:
 * - A new order is a put to a brand-new key, so two concurrent orders can never overwrite each other
 *   and a failed read can never shrink the list (there is no list to rewrite).
 * - KV list() returns each key's metadata, so the admin listing costs one request per 1000 orders.
 *   The metadata carries the whole "list view" of an order whenever it fits in 1024 bytes; only
 *   orders that do not fit (very long address/notes) need their own read.
 * - Keys are `order:<id>` (not a sortable timestamp key) so getOrder(id) is one read with no pointer
 *   key to keep in sync. Ordering is done in memory: every caller filters over the full listing
 *   anyway, and migrated legacy ids are not guaranteed to be time-sortable.
 * - Edge-safe: Web APIs only.
 */

export const ORDER_KEY_PREFIX = "order:";
export const ORDER_DELETED_PREFIX = "order_deleted:";
export const LEGACY_ORDERS_KEY = "orders_all";
export const ORDERS_MIGRATED_KEY = "orders_migrated_v1";

/** Cloudflare's hard limit is 1024 bytes of serialized metadata; stay a little under it. */
export const ORDER_META_MAX_BYTES = 1000;
/** Legacy orders copied per call (2 KV operations each) — keeps one request far below subrequest limits. */
export const LEGACY_MIGRATION_BATCH = 12;
/**
 * After the marker is written, isolates still running the previous build may append to the legacy
 * array for a short while. Keep reconciling it for this long before trusting the marker blindly.
 */
export const LEGACY_GRACE_MS = 60 * 60 * 1000;

const utf8 = new TextEncoder();
const byteLength = (s: string) => utf8.encode(s).length;

/** Truncate by code points (never splits a surrogate pair). */
function clip(value: unknown, max: number): string {
  const s = value === undefined || value === null ? "" : String(value);
  if (s.length <= max) return s;
  const chars = Array.from(s);
  return chars.length <= max ? s : chars.slice(0, max).join("");
}

export function isSafeKeyPart(id: unknown): id is string {
  return typeof id === "string" && id.length > 0 && byteLength(id) <= 200;
}

export function orderKey(id: string): string {
  return ORDER_KEY_PREFIX + id;
}

/** What is persisted: the order without embedded relations (a landing page can carry meta_capi_token). */
export function sanitizeOrderForStorage(order: Order): Order {
  const { product: _product, landing_page: _landingPage, ...rest } = order as Order & Record<string, any>;
  return rest as Order;
}

// ───────────────────────── Metadata (list view) ─────────────────────────

/** Short keys: the whole object must serialize to ≤ ORDER_META_MAX_BYTES. */
export interface OrderMeta {
  v: 1;
  n: string; // order_number
  c: string; // created_at
  u: string; // updated_at
  st: string; // status
  cn: string; // customer_name
  cp: string; // customer_phone
  g: string; // governorate
  fa: number; // final_amount
  lp: string; // landing_page_slug
  p: string; // product_id
  ss: string; // safqa_status
  si?: string; // safqa_invoice_id
  /** 1 = a field above was truncated; it must not be used for filtering or display. */
  t?: 1;
  /** Remaining list-view fields. Present only when everything fit untruncated. */
  x?: Record<string, any>;
}

const EXTRA_FIELDS: [short: string, field: keyof Order][] = [
  ["li", "landing_page_id"],
  ["o", "offer_id"],
  ["p2", "customer_phone2"],
  ["ci", "city"],
  ["a", "address"],
  ["no", "notes"],
  ["q", "quantity"],
  ["up", "unit_price"],
  ["ta", "total_amount"],
  ["sf", "shipping_fee"],
  ["da", "discount_amount"],
  ["cu", "currency"],
  ["pm", "payment_method"],
  ["iu", "safqa_invoice_url"],
  ["sa", "safqa_synced_at"],
];
const TRACKING_FIELDS: [short: string, field: keyof OrderTrackingMeta][] = [
  ["us", "utm_source"],
  ["uc", "utm_campaign"],
  ["ev", "event_id"],
];

const metaBytes = (meta: OrderMeta) => byteLength(JSON.stringify(meta));

export function buildOrderMeta(order: Order): OrderMeta {
  const o = order as Order & Record<string, any>;
  let truncated = false;
  const core = (value: unknown, max: number): string => {
    const full = value === undefined || value === null ? "" : String(value);
    const out = clip(full, max);
    if (out !== full) truncated = true;
    return out;
  };

  const meta: OrderMeta = {
    v: 1,
    n: core(o.order_number, 40),
    c: core(o.created_at, 40),
    u: core(o.updated_at || o.created_at, 40),
    st: core(o.status, 24),
    cn: core(o.customer_name, 60),
    cp: core(o.customer_phone, 24),
    g: core(o.governorate, 40),
    fa: Number(o.final_amount) || 0,
    lp: core(o.landing_page_slug, 80),
    p: core(o.product_id, 80),
    ss: core(o.safqa_status, 24),
  };
  if (o.safqa_invoice_id) meta.si = core(o.safqa_invoice_id, 64);
  // final_amount must round-trip exactly to be served from metadata
  const exactAmount = typeof o.final_amount === "number" && Number.isFinite(o.final_amount);

  if (!truncated && exactAmount) {
    const x: Record<string, any> = {};
    for (const [short, field] of EXTRA_FIELDS) {
      const value = o[field];
      if (value !== undefined && value !== null) x[short] = value;
    }
    if (o.tracking && typeof o.tracking === "object") {
      for (const [short, field] of TRACKING_FIELDS) {
        const value = o.tracking[field];
        if (value !== undefined && value !== null) x[short] = value;
      }
    }
    const withExtras: OrderMeta = { ...meta, x };
    if (metaBytes(withExtras) <= ORDER_META_MAX_BYTES) return withExtras;
    return meta; // core only: readers fetch the full record
  }

  // Core only. Multi-byte text can still overflow → shrink the longest text field until it fits.
  meta.t = 1;
  const shrinkable: (keyof OrderMeta)[] = ["cn", "g", "lp", "p", "si", "n", "cp", "st", "ss", "c", "u"];
  for (let i = 0; i < 40 && metaBytes(meta) > ORDER_META_MAX_BYTES; i++) {
    let longest: keyof OrderMeta = "cn";
    let longestBytes = -1;
    for (const key of shrinkable) {
      const b = byteLength(String(meta[key] ?? ""));
      if (b > longestBytes) {
        longestBytes = b;
        longest = key;
      }
    }
    const current = Array.from(String(meta[longest] ?? ""));
    (meta as any)[longest] = current.slice(0, Math.floor(current.length / 2)).join("");
  }
  return meta;
}

export function isOrderMeta(meta: unknown): meta is OrderMeta {
  const m = meta as OrderMeta | null;
  return Boolean(m && typeof m === "object" && m.v === 1 && typeof m.n === "string" && typeof m.c === "string");
}

/**
 * Rebuilds the list view of an order from its key metadata.
 * Returns null when the metadata is not lossless (truncated / no extras) — read the record instead.
 * The list view omits only `safqa_response` and the tracking fields other than
 * utm_source / utm_campaign / event_id; getOrder(id) returns the complete record.
 */
export function orderFromMeta(id: string, meta: unknown): Order | null {
  if (!isOrderMeta(meta) || meta.t || !meta.x || typeof meta.x !== "object") return null;
  const order: Record<string, any> = {
    id,
    order_number: meta.n,
    landing_page_slug: meta.lp,
    product_id: meta.p,
    customer_name: meta.cn,
    customer_phone: meta.cp,
    governorate: meta.g,
    final_amount: meta.fa,
    status: meta.st,
    safqa_status: meta.ss,
    created_at: meta.c,
    updated_at: meta.u,
  };
  if (meta.si) order.safqa_invoice_id = meta.si;
  for (const [short, field] of EXTRA_FIELDS) {
    if (meta.x[short] !== undefined) order[field] = meta.x[short];
  }
  const tracking: Record<string, any> = {};
  for (const [short, field] of TRACKING_FIELDS) {
    if (meta.x[short] !== undefined) tracking[field] = meta.x[short];
  }
  if (Object.keys(tracking).length > 0) order.tracking = tracking;
  return order as Order;
}

// ───────────────────────── Records ─────────────────────────

export type OrderReadResult = KvReadResult<Order>;

export async function readOrderRecord(id: string): Promise<OrderReadResult> {
  if (!isSafeKeyPart(id)) return { status: "missing", value: null };
  const res = await kvStore.read<Order>(orderKey(id));
  if (res.status === "found" && (!res.value || typeof res.value !== "object" || !res.value.id)) {
    console.error(`[order-kv] malformed record at ${orderKey(id)}`);
    return { status: "error", value: null };
  }
  return res;
}

/** Writes value + refreshed metadata. A put to the order's own key: cannot affect any other order. */
export async function writeOrderRecord(order: Order): Promise<boolean> {
  if (!isSafeKeyPart(order?.id)) return false;
  const stored = sanitizeOrderForStorage(order);
  return kvStore.putWithMetadata(orderKey(stored.id), stored, buildOrderMeta(stored));
}

export interface OrderEntry {
  id: string;
  meta: OrderMeta | null;
}

/** All order keys (+metadata) under `order:<idPrefix>`. `ok:false` = listing failed, nothing is known. */
export async function listOrderEntries(idPrefix = ""): Promise<{ ok: boolean; entries: OrderEntry[] }> {
  const res = await kvStore.listAll(ORDER_KEY_PREFIX + idPrefix);
  if (!res.ok) return { ok: false, entries: [] };
  return {
    ok: true,
    entries: res.keys.map((k) => ({
      id: k.name.slice(ORDER_KEY_PREFIX.length),
      meta: isOrderMeta(k.metadata) ? k.metadata : null,
    })),
  };
}

/**
 * Order numbers already used today, for the collision check in createOrder.
 * Ids are `ord-<epoch ms>-<hex>`, so a 5-digit ms prefix (~27.8h bucket) narrows the listing to
 * at most two small prefixes instead of the whole order history. Throws when the listing fails.
 */
export async function listRecentOrderNumbers(now: number = Date.now()): Promise<Set<string>> {
  const bucket = (ms: number) => String(ms).slice(0, 5);
  const dayStart = Math.floor(now / 86400000) * 86400000;
  const buckets = Array.from(new Set([bucket(now), bucket(dayStart)]));
  const numbers = new Set<string>();
  for (const b of buckets) {
    const res = await listOrderEntries(`ord-${b}`);
    if (!res.ok) throw new Error("order listing unavailable");
    for (const e of res.entries) if (e.meta?.n) numbers.add(e.meta.n);
  }
  return numbers;
}

/** Runs `fn` over `items` with at most `limit` in flight; preserves order. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

// ───────────────────────── Tombstones ─────────────────────────

/** Records a deletion durably. `tokens` = every id / order number / Safka serial of the deleted order. */
export async function writeOrderTombstone(id: string, tokens: string[]): Promise<boolean> {
  if (!isSafeKeyPart(id)) return false;
  const all = Array.from(new Set([id, ...tokens].filter((t) => typeof t === "string" && t)));
  let k = all.map((t) => clip(t, 64)).slice(0, 6);
  if (byteLength(JSON.stringify({ k })) > ORDER_META_MAX_BYTES) k = [];
  return kvStore.putWithMetadata(
    ORDER_DELETED_PREFIX + id,
    { id, tokens: all, deleted_at: new Date().toISOString() },
    { k }
  );
}

export async function listDeletedOrderTokens(): Promise<{ ok: boolean; tokens: Set<string> }> {
  const res = await kvStore.listAll<{ k?: string[] }>(ORDER_DELETED_PREFIX);
  const tokens = new Set<string>();
  if (!res.ok) return { ok: false, tokens };
  for (const key of res.keys) {
    tokens.add(key.name.slice(ORDER_DELETED_PREFIX.length));
    const k = key.metadata?.k;
    if (Array.isArray(k)) for (const t of k) if (typeof t === "string" && t) tokens.add(t);
  }
  return { ok: true, tokens };
}

export function isTombstoned(order: Order, tokens: Set<string>): boolean {
  return (
    tokens.has(order.id) ||
    (!!order.order_number && tokens.has(order.order_number)) ||
    (!!order.safqa_invoice_id && tokens.has(order.safqa_invoice_id))
  );
}

// ───────────────────────── Legacy "orders_all" migration ─────────────────────────

/** Per isolate: true once the marker is known to be older than the grace period. */
let legacyDone = false;

export function normalizeLegacy(raw: unknown): Order | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, any>;
  const id = String(r.id || r.order_number || "");
  if (!isSafeKeyPart(id)) return null;
  return sanitizeOrderForStorage({ ...r, id } as Order);
}

async function writeMigrationMarker(count: number): Promise<void> {
  const ok = await kvStore.put(ORDERS_MIGRATED_KEY, { v: 1, at: Date.now(), count });
  if (!ok) console.warn("[order-kv] could not write the migration marker (will retry on a later read)");
}

/**
 * Lazy, resumable, idempotent migration of the legacy array into per-order keys.
 *
 * Returns the legacy orders that are NOT in `listedIds` yet, so reads stay complete until the
 * migration finishes (and while the listing is still catching up — KV is eventually consistent).
 *
 * Safety:
 * - `orders_all` is only ever read.
 * - An order is written only after a strict read proved its key does not exist, so a second
 *   isolate migrating at the same time (or a stale listing) cannot roll back a newer per-key record.
 * - Deleted orders (tombstones) are never re-created. If the tombstone listing fails, nothing is written.
 * - The marker is written only when every legacy order is accounted for.
 */
export async function reconcileLegacyOrders(listedIds: Set<string>): Promise<Order[]> {
  if (legacyDone) return [];

  const marker = await kvStore.read<{ at?: number }>(ORDERS_MIGRATED_KEY);
  if (marker.status === "unconfigured") return [];
  if (marker.status === "found") {
    const at = Number(marker.value?.at) || 0;
    if (Date.now() - at > LEGACY_GRACE_MS) {
      legacyDone = true;
      return [];
    }
  }
  const mayMark = marker.status === "missing";

  const legacy = await kvStore.read<unknown[]>(LEGACY_ORDERS_KEY);
  if (legacy.status === "missing") {
    if (mayMark) await writeMigrationMarker(0);
    return [];
  }
  if (legacy.status !== "found" || !Array.isArray(legacy.value)) return []; // unknown → touch nothing

  const seen = new Set<string>();
  const candidates: Order[] = [];
  for (const raw of legacy.value) {
    const order = normalizeLegacy(raw);
    if (!order || seen.has(order.id)) continue;
    seen.add(order.id);
    if (!listedIds.has(order.id)) candidates.push(order);
  }
  if (candidates.length === 0) {
    if (mayMark) await writeMigrationMarker(seen.size);
    return [];
  }

  const deleted = await listDeletedOrderTokens();
  if (!deleted.ok) return candidates; // cannot tell what was deleted → serve, but write nothing

  const pending = candidates.filter((o) => !isTombstoned(o, deleted.tokens));
  const batch = pending.slice(0, LEGACY_MIGRATION_BATCH);
  const migrated = await mapLimit(batch, 4, async (order) => {
    const current = await readOrderRecord(order.id);
    if (current.status === "found") return { order: current.value, done: true }; // already migrated (maybe updated since)
    if (current.status !== "missing") return { order, done: false };
    return { order, done: await writeOrderRecord(order) };
  });

  const allDone = pending.length <= LEGACY_MIGRATION_BATCH && migrated.every((m) => m.done);
  if (allDone && mayMark) await writeMigrationMarker(seen.size);

  return [...migrated.map((m) => m.order), ...pending.slice(LEGACY_MIGRATION_BATCH)];
}

/** Looks an order up in the legacy array (by id or order number) while the migration may be incomplete. */
export async function findLegacyOrder(idOrNumber: string): Promise<OrderReadResult> {
  if (legacyDone) return { status: "missing", value: null };
  const legacy = await kvStore.read<unknown[]>(LEGACY_ORDERS_KEY);
  if (legacy.status === "missing" || legacy.status === "unconfigured") return { status: "missing", value: null };
  if (legacy.status !== "found" || !Array.isArray(legacy.value)) return { status: "error", value: null };

  for (const raw of legacy.value) {
    const order = normalizeLegacy(raw);
    if (!order || (order.id !== idOrNumber && order.order_number !== idOrNumber)) continue;
    // Prefer the per-order record if this one was already migrated (it may have been edited since).
    const current = await readOrderRecord(order.id);
    if (current.status === "found") return current;
    if (current.status !== "missing") return { status: "error", value: null };
    const tomb = await kvStore.read(ORDER_DELETED_PREFIX + order.id);
    if (tomb.status === "found") return { status: "missing", value: null };
    if (tomb.status !== "missing") return { status: "error", value: null };
    return { status: "found", value: order };
  }
  return { status: "missing", value: null };
}

/**
 * Finds a stored order by id (one read) or, failing that, by order number (listing metadata),
 * then in the legacy array. "error" means the store could not be read — callers must not write.
 */
export async function findOrderRecord(idOrNumber: string): Promise<OrderReadResult> {
  if (!isSafeKeyPart(idOrNumber)) return { status: "missing", value: null };

  const direct = await readOrderRecord(idOrNumber);
  if (direct.status !== "missing") return direct;

  const listing = await listOrderEntries();
  if (!listing.ok) return { status: "error", value: null };
  const hit = listing.entries.find((e) => e.meta?.n === idOrNumber);
  if (hit) {
    const byNumber = await readOrderRecord(hit.id);
    if (byNumber.status !== "missing") return byNumber;
  }

  return findLegacyOrder(idOrNumber);
}
