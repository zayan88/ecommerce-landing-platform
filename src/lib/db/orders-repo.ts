/**
 * Orders repository — the transactional order data path on Cloudflare D1.
 * Schema: migrations/0001_orders.sql. Design: docs/architecture-kv-d1.md.
 *
 * Backend selection: env ORDERS_BACKEND = "kv" (default) | "d1". With "kv" nothing in this file runs
 * and the existing KV implementation (order-kv.ts / guard.ts / stats.ts) is used unchanged, so
 * rolling back is one setting.
 *
 * SECURITY — rules every query in this file follows:
 *  - values are ALWAYS bound parameters (`?`), never concatenated into the SQL text;
 *  - the only dynamic SQL fragments are column names / sort directions taken from the constant
 *    whitelists below (never from input) and generated `?` placeholder lists;
 *  - nothing here logs SQL parameters (they are customer PII).
 * Edge-safe: no Node APIs.
 */
import type { Order } from "@/types";
import { getD1Client, D1UnavailableError, type SqlClient, type SqlParam, type SqlStatement } from "./d1";

// ───────────────────────── Backend selection ─────────────────────────

export type OrdersBackend = "kv" | "d1";

/** Read per call (next-on-pages fills process.env per request). Anything but "d1" means KV. */
export function ordersBackend(): OrdersBackend {
  return (process.env.ORDERS_BACKEND || "").trim().toLowerCase() === "d1" ? "d1" : "kv";
}

/**
 * Verification period only: with ORDERS_BACKEND=d1 and ORDERS_KV_MIRROR=1 every order write is also
 * copied (best effort) to its KV key, so switching back to KV loses nothing. Costs 1 KV write per
 * order write — leave it off once D1 is trusted.
 */
export function ordersKvMirrorEnabled(): boolean {
  return ordersBackend() === "d1" && (process.env.ORDERS_KV_MIRROR || "").trim() === "1";
}

export function currentStoreId(): string {
  return (process.env.STORE_ID || "").trim() || "default";
}

// ───────────────────────── Column map (whitelists) ─────────────────────────

type ColKind = "text" | "opt" | "num" | "json";
/** Every persisted field of `Order`, in table order. Relations (product, landing_page) are never stored. */
const ORDER_COLS: ReadonlyArray<readonly [name: string, kind: ColKind, fallback?: string | number]> = [
  ["id", "text"],
  ["order_number", "text"],
  ["landing_page_id", "opt"],
  ["landing_page_slug", "text", "direct"],
  ["product_id", "text", ""],
  ["offer_id", "opt"],
  ["customer_name", "text", ""],
  ["customer_phone", "text", ""],
  ["customer_phone2", "opt"],
  ["governorate", "text", ""],
  ["city", "opt"],
  ["address", "text", ""],
  ["notes", "opt"],
  ["quantity", "num", 1],
  ["unit_price", "num", 0],
  ["total_amount", "num", 0],
  ["shipping_fee", "num", 0],
  ["discount_amount", "num", 0],
  ["final_amount", "num", 0],
  ["currency", "text", "EGP"],
  ["status", "text", "pending"],
  ["payment_method", "text", "cod"],
  ["safqa_invoice_id", "opt"],
  ["safqa_invoice_url", "opt"],
  ["safqa_status", "text", "not_synced"],
  ["safqa_response", "json"],
  ["safqa_synced_at", "opt"],
  ["created_at", "text"],
  ["updated_at", "text"],
  ["tracking", "json"],
];
const ORDER_COL_KIND = new Map<string, ColKind>(ORDER_COLS.map(([n, k]) => [n, k]));
const ORDER_COL_FALLBACK = new Map<string, string | number | undefined>(ORDER_COLS.map(([n, , f]) => [n, f]));
/** Columns a patch may change. Identity columns are immutable. */
const IMMUTABLE_COLS = new Set(["id", "order_number", "created_at"]);
const NEVER_STORED = new Set(["product", "landing_page", "store_id", "created_ms", "extra"]);

const INSERT_COLS = ["store_id", ...ORDER_COLS.map(([n]) => n), "extra", "created_ms"];
const INSERT_SQL =
  `INSERT INTO orders (${INSERT_COLS.join(", ")}) VALUES (${INSERT_COLS.map(() => "?").join(", ")}) ` +
  `ON CONFLICT DO NOTHING RETURNING id`;

/** ORDER BY whitelist: API name → column. Input never reaches the SQL text. */
const SORT_COLUMNS: Record<string, string> = {
  created_at: "created_ms",
  updated_at: "updated_at",
  final_amount: "final_amount",
  status: "status",
  order_number: "order_number",
};
const SORT_DIRECTIONS: Record<string, string> = { asc: "ASC", desc: "DESC" };

/** Resolves "id or order number" to the row id inside SQL. Params: [store, key, key, key]. */
const RESOLVE_ID_SQL =
  "(SELECT id FROM orders WHERE store_id = ? AND (id = ? OR order_number = ?) ORDER BY (id = ?) DESC LIMIT 1)";
const resolveParams = (store: string, key: string): SqlParam[] => [store, key, key, key];

function toColumnValue(kind: ColKind, value: unknown, fallback?: string | number): SqlParam {
  if (kind === "num") {
    const n = Number(value);
    return Number.isFinite(n) && value !== null && value !== "" && value !== undefined ? n : Number(fallback) || 0;
  }
  if (kind === "json") {
    if (value === undefined || value === null) return null;
    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }
  if (value === undefined || value === null) return kind === "opt" ? null : String(fallback ?? "");
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
  return String(value);
}

function orderToParams(store: string, order: Order): SqlParam[] {
  const o = order as Order & Record<string, any>;
  const params: SqlParam[] = [store];
  for (const [name, kind, fallback] of ORDER_COLS) params.push(toColumnValue(kind, o[name], fallback));
  const extra: Record<string, any> = {};
  for (const key of Object.keys(o)) {
    if (!ORDER_COL_KIND.has(key) && !NEVER_STORED.has(key) && o[key] !== undefined) extra[key] = o[key];
  }
  params.push(Object.keys(extra).length > 0 ? JSON.stringify(extra) : null);
  params.push(Date.parse(String(o.created_at)) || Date.now());
  return params;
}

function parseJson(text: unknown): any {
  if (typeof text !== "string" || !text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export function rowToOrder(row: Record<string, any>): Order {
  const extra = parseJson(row.extra);
  const order: Record<string, any> = extra && typeof extra === "object" && !Array.isArray(extra) ? { ...extra } : {};
  for (const [name, kind] of ORDER_COLS) {
    const v = row[name];
    if (v === null || v === undefined) continue;
    if (kind === "json") {
      const parsed = parseJson(v);
      if (parsed !== undefined) order[name] = parsed;
    } else order[name] = v;
  }
  return order as Order;
}

// ───────────────────────── Public types ─────────────────────────

export interface OrderListFilter {
  status?: string;
  landing_page_slug?: string;
  product_id?: string;
  governorate?: string;
  /** Substring of customer name / phone / order number / governorate. */
  search?: string;
  /** created_at range, epoch ms, inclusive. */
  created_from?: number;
  created_to?: number;
  limit?: number;
  offset?: number;
  sort?: string;
  dir?: string;
}

/** Storefront view of an order, returned verbatim when the duplicate guard matches. */
export interface DedupeSnapshot {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  final_amount: number;
  shipping_fee: number;
  governorate: string;
  address: string;
  landing_page_slug: string;
  event_id: string;
}
export type DedupeOutcome =
  | { state: "claimed" }
  | { state: "existing"; order: DedupeSnapshot }
  | { state: "pending" };

export interface DayStats {
  visits: number;
  checkout_starts: number;
}
export type ImportOutcome = "inserted" | "updated" | "unchanged" | "conflict";
export interface DeleteTarget {
  /** Order id or order number. */
  key: string;
  /** Extra identifiers to tombstone (e.g. a Safka serial of a virtual order). */
  tokens?: string[];
}

export interface OrdersRepo {
  insertOrder(order: Order): Promise<boolean>;
  insertOrderWithUniqueNumber(order: Order, nextNumber: () => string, maxAttempts?: number): Promise<Order | null>;
  getOrder(idOrNumber: string): Promise<Order | null>;
  listOrders(filter?: OrderListFilter): Promise<Order[]>;
  countOrders(filter?: OrderListFilter): Promise<number>;
  updateOrder(idOrNumber: string, patch: Partial<Order>, source?: string): Promise<Order | null>;
  getStatusHistory(orderId: string): Promise<{ from_status: string | null; to_status: string; source: string; changed_at: string }[]>;
  deleteOrders(targets: DeleteTarget[]): Promise<{ deleted: number; tokens: string[] }>;
  listDeletedTokens(): Promise<Set<string>>;
  addDeletedTokens(tokens: string[]): Promise<void>;
  claimDedupe(key: string, claimId: string, now: number, windowMs: number, pendingTtlMs: number): Promise<DedupeOutcome>;
  settleDedupe(key: string, claimId: string, orderId: string, now: number): Promise<void>;
  releaseDedupe(key: string, claimId: string): Promise<void>;
  consumeRateLimit(ipKey: string, now: number, windowMs: number, max: number): Promise<{ count: number; windowStart: number }>;
  addDayStats(day: string, visits: number, checkoutStarts: number): Promise<void>;
  importDayStats(rows: ({ day: string } & DayStats)[]): Promise<void>;
  readDayStats(fromDay: string, toDay: string): Promise<Record<string, DayStats>>;
  importOrders(orders: Order[]): Promise<Record<string, ImportOutcome>>;
  pruneExpired(now: number): Promise<void>;
}

// ───────────────────────── D1 implementation ─────────────────────────

const chunk = <T>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};
const cleanTokens = (tokens: unknown[]): string[] =>
  Array.from(new Set(tokens.filter((t): t is string => typeof t === "string" && t.length > 0 && t.length <= 200)));
const toInt = (v: unknown, fallback: number): number => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? n : fallback;
};

function buildWhere(store: string, f: OrderListFilter = {}): { sql: string; params: SqlParam[] } {
  const parts = ["store_id = ?"];
  const params: SqlParam[] = [store];
  const eq = (column: "status" | "landing_page_slug" | "product_id" | "governorate", value: unknown) => {
    if (typeof value === "string" && value) {
      parts.push(`${column} = ?`);
      params.push(value);
    }
  };
  eq("status", f.status);
  eq("landing_page_slug", f.landing_page_slug);
  eq("product_id", f.product_id);
  eq("governorate", f.governorate);
  if (Number.isFinite(f.created_from)) {
    parts.push("created_ms >= ?");
    params.push(Math.floor(f.created_from as number));
  }
  if (Number.isFinite(f.created_to)) {
    parts.push("created_ms <= ?");
    params.push(Math.floor(f.created_to as number));
  }
  if (typeof f.search === "string" && f.search) {
    // instr() instead of LIKE: no wildcard semantics to escape and no 50-byte LIKE pattern limit (D1).
    const q = f.search.slice(0, 120).toLowerCase();
    parts.push(
      "(instr(lower(customer_name), ?) > 0 OR instr(customer_phone, ?) > 0 OR " +
        "instr(lower(order_number), ?) > 0 OR instr(lower(governorate), ?) > 0)"
    );
    params.push(q, q, q, q);
  }
  return { sql: parts.join(" AND "), params };
}

export function createD1OrdersRepo(db: SqlClient, store: string = "default"): OrdersRepo {
  const historyInsert = (orderId: string, status: string, source: string, at: string): SqlStatement => ({
    // Only when the order row exists and has no history yet (keeps inserts/imports idempotent).
    sql:
      "INSERT INTO order_status_history (store_id, order_id, from_status, to_status, source, changed_at) " +
      "SELECT ?, ?, NULL, ?, ?, ? WHERE EXISTS (SELECT 1 FROM orders WHERE store_id = ? AND id = ?) " +
      "AND NOT EXISTS (SELECT 1 FROM order_status_history WHERE store_id = ? AND order_id = ?)",
    params: [store, orderId, status, source, at, store, orderId, store, orderId],
  });

  const repo: OrdersRepo = {
    async insertOrder(order) {
      const res = await db.batch([
        { sql: INSERT_SQL, params: orderToParams(store, order) },
        historyInsert(order.id, String(order.status || "pending"), "create", String(order.created_at)),
      ]);
      return res[0].rows.length === 1;
    },

    async insertOrderWithUniqueNumber(order, nextNumber, maxAttempts = 6) {
      let candidate: Order = order;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (attempt > 0) candidate = { ...candidate, order_number: nextNumber() };
        if (await repo.insertOrder(candidate)) return candidate;
      }
      return null;
    },

    async getOrder(idOrNumber) {
      if (typeof idOrNumber !== "string" || !idOrNumber) return null;
      const res = await db.query(
        "SELECT * FROM orders WHERE store_id = ? AND (id = ? OR order_number = ?) ORDER BY (id = ?) DESC LIMIT 1",
        resolveParams(store, idOrNumber)
      );
      return res.rows[0] ? rowToOrder(res.rows[0]) : null;
    },

    async listOrders(filter = {}) {
      const where = buildWhere(store, filter);
      const column = SORT_COLUMNS[String(filter.sort || "created_at")] || SORT_COLUMNS.created_at;
      const direction = SORT_DIRECTIONS[String(filter.dir || "desc").toLowerCase()] || SORT_DIRECTIONS.desc;
      const limit = filter.limit === undefined ? -1 : Math.min(Math.max(toInt(filter.limit, 50), 1), 100000);
      const offset = Math.max(toInt(filter.offset, 0), 0);
      const res = await db.query(
        `SELECT * FROM orders WHERE ${where.sql} ORDER BY ${column} ${direction}, id ${direction} LIMIT ? OFFSET ?`,
        [...where.params, limit, offset]
      );
      return res.rows.map(rowToOrder);
    },

    async countOrders(filter = {}) {
      const where = buildWhere(store, filter);
      const res = await db.query<{ n: number }>(`SELECT COUNT(*) AS n FROM orders WHERE ${where.sql}`, where.params);
      return Number(res.rows[0]?.n) || 0;
    },

    async updateOrder(idOrNumber, patch, source = "admin") {
      if (typeof idOrNumber !== "string" || !idOrNumber) return null;
      const sets: string[] = [];
      const params: SqlParam[] = [];
      const p = patch as Record<string, any>;
      for (const key of Object.keys(p)) {
        const kind = ORDER_COL_KIND.get(key); // whitelist: unknown keys are ignored
        if (!kind || IMMUTABLE_COLS.has(key) || p[key] === undefined) continue;
        sets.push(`${key} = ?`);
        params.push(toColumnValue(kind, p[key], ORDER_COL_FALLBACK.get(key)));
      }
      const now = new Date().toISOString();
      if (!("updated_at" in p) || p.updated_at === undefined) {
        sets.push("updated_at = ?");
        params.push(now);
      }
      const statements: SqlStatement[] = [];
      if (typeof p.status === "string" && p.status) {
        statements.push({
          sql:
            "INSERT INTO order_status_history (store_id, order_id, from_status, to_status, source, changed_at) " +
            `SELECT store_id, id, status, ?, ?, ? FROM orders WHERE store_id = ? AND id = ${RESOLVE_ID_SQL} AND status <> ?`,
          params: [p.status, String(source).slice(0, 24), now, store, ...resolveParams(store, idOrNumber), p.status],
        });
      }
      statements.push({
        sql: `UPDATE orders SET ${sets.join(", ")} WHERE store_id = ? AND id = ${RESOLVE_ID_SQL} RETURNING *`,
        params: [...params, store, ...resolveParams(store, idOrNumber)],
      });
      const res = await db.batch(statements);
      const row = res[res.length - 1].rows[0];
      return row ? rowToOrder(row) : null;
    },

    async getStatusHistory(orderId) {
      const res = await db.query(
        "SELECT from_status, to_status, source, changed_at FROM order_status_history WHERE store_id = ? AND order_id = ? ORDER BY id",
        [store, orderId]
      );
      return res.rows as any;
    },

    async deleteOrders(targets) {
      const now = new Date().toISOString();
      const statements: SqlStatement[] = [];
      const deleteIndexes: number[] = [];
      const tokens = new Set<string>();
      for (const target of targets) {
        if (typeof target?.key !== "string" || !target.key) continue;
        const key = target.key;
        // Tombstones first (same transaction): every identifier of the order, so nothing can resurrect it.
        for (const token of cleanTokens([key, ...(target.tokens || [])])) {
          tokens.add(token);
          statements.push({
            sql: "INSERT OR IGNORE INTO deleted_orders (store_id, token, order_id, deleted_at) VALUES (?, ?, ?, ?)",
            params: [store, token, key, now],
          });
        }
        for (const column of ["id", "order_number", "safqa_invoice_id"] as const) {
          statements.push({
            sql:
              "INSERT OR IGNORE INTO deleted_orders (store_id, token, order_id, deleted_at) " +
              `SELECT store_id, ${column}, id, ? FROM orders WHERE store_id = ? AND id = ${RESOLVE_ID_SQL} ` +
              `AND ${column} IS NOT NULL AND ${column} <> ''`,
            params: [now, store, ...resolveParams(store, key)],
          });
        }
        statements.push({
          sql: `DELETE FROM order_status_history WHERE store_id = ? AND order_id = ${RESOLVE_ID_SQL}`,
          params: [store, ...resolveParams(store, key)],
        });
        deleteIndexes.push(statements.length);
        statements.push({
          sql: `DELETE FROM orders WHERE store_id = ? AND id = ${RESOLVE_ID_SQL} RETURNING id, order_number, safqa_invoice_id`,
          params: [store, ...resolveParams(store, key)],
        });
      }
      if (statements.length === 0) return { deleted: 0, tokens: [] };
      const res = await db.batch(statements);
      let deleted = 0;
      for (const i of deleteIndexes) {
        for (const row of res[i].rows) {
          deleted++;
          for (const t of cleanTokens([row.id, row.order_number, row.safqa_invoice_id])) tokens.add(t);
        }
      }
      return { deleted, tokens: Array.from(tokens) };
    },

    async listDeletedTokens() {
      const res = await db.query<{ token: string }>("SELECT token FROM deleted_orders WHERE store_id = ?", [store]);
      return new Set(res.rows.map((r) => r.token));
    },

    async addDeletedTokens(tokens) {
      const now = new Date().toISOString();
      for (const group of chunk(cleanTokens(tokens), 200)) {
        await db.batch(
          group.map((token) => ({
            sql: "INSERT OR IGNORE INTO deleted_orders (store_id, token, order_id, deleted_at) VALUES (?, ?, NULL, ?)",
            params: [store, token, now],
          }))
        );
      }
    },

    async claimDedupe(key, claimId, now, windowMs, pendingTtlMs) {
      const res = await db.batch([
        {
          // Atomic claim. An existing row is taken over only when it is no longer valid:
          // settled but older than the window / pending but abandoned / its order was deleted.
          sql:
            "INSERT INTO order_dedupe (store_id, dedupe_key, claim_id, order_id, created_ms) VALUES (?, ?, ?, NULL, ?) " +
            "ON CONFLICT (store_id, dedupe_key) DO UPDATE SET claim_id = excluded.claim_id, order_id = NULL, created_ms = excluded.created_ms " +
            "WHERE (order_dedupe.order_id IS NOT NULL AND order_dedupe.created_ms < ?) " +
            "OR (order_dedupe.order_id IS NULL AND order_dedupe.created_ms < ?) " +
            "OR order_dedupe.created_ms > ? " +
            "OR (order_dedupe.order_id IS NOT NULL AND NOT EXISTS " +
            "(SELECT 1 FROM orders o WHERE o.store_id = order_dedupe.store_id AND o.id = order_dedupe.order_id)) " +
            "RETURNING claim_id",
          params: [store, key, claimId, now, now - windowMs, now - pendingTtlMs, now + 60000],
        },
        {
          sql:
            "SELECT d.order_id AS d_order_id, o.id, o.order_number, o.customer_name, o.customer_phone, o.final_amount, " +
            "o.shipping_fee, o.governorate, o.address, o.landing_page_slug, o.tracking " +
            "FROM order_dedupe d LEFT JOIN orders o ON o.store_id = d.store_id AND o.id = d.order_id " +
            "WHERE d.store_id = ? AND d.dedupe_key = ?",
          params: [store, key],
        },
      ]);
      if (res[0].rows.length === 1) return { state: "claimed" };
      const row = res[1].rows[0];
      if (!row || !row.d_order_id || !row.id) return { state: "pending" };
      const tracking = parseJson(row.tracking);
      return {
        state: "existing",
        order: {
          id: row.id,
          order_number: row.order_number,
          customer_name: row.customer_name,
          customer_phone: row.customer_phone,
          final_amount: row.final_amount,
          shipping_fee: row.shipping_fee,
          governorate: row.governorate,
          address: row.address,
          landing_page_slug: row.landing_page_slug,
          event_id: String(tracking?.event_id || ""),
        },
      };
    },

    async settleDedupe(key, claimId, orderId, now) {
      await db.query(
        "UPDATE order_dedupe SET order_id = ?, created_ms = ? WHERE store_id = ? AND dedupe_key = ? AND claim_id = ?",
        [orderId, now, store, key, claimId]
      );
    },

    async releaseDedupe(key, claimId) {
      await db.query(
        "DELETE FROM order_dedupe WHERE store_id = ? AND dedupe_key = ? AND claim_id = ? AND order_id IS NULL",
        [store, key, claimId]
      );
    },

    async consumeRateLimit(ipKey, now, windowMs, max) {
      const cutoff = now - windowMs;
      // One atomic statement: start a new window when the old one expired, else count (capped at max + 1).
      const res = await db.query<{ count: number; window_start: number }>(
        "INSERT INTO rate_limits (store_id, ip_key, count, window_start) VALUES (?, ?, 1, ?) " +
          "ON CONFLICT (store_id, ip_key) DO UPDATE SET " +
          "count = CASE WHEN rate_limits.window_start < ? THEN 1 ELSE MIN(rate_limits.count + 1, ?) END, " +
          "window_start = CASE WHEN rate_limits.window_start < ? THEN excluded.window_start ELSE rate_limits.window_start END " +
          "RETURNING count, window_start",
        [store, ipKey, now, cutoff, max + 1, cutoff]
      );
      const row = res.rows[0];
      return { count: Number(row?.count) || 1, windowStart: Number(row?.window_start) || now };
    },

    async addDayStats(day, visits, checkoutStarts) {
      await db.query(
        "INSERT INTO stats_daily (store_id, day, visits, checkout_starts) VALUES (?, ?, ?, ?) " +
          "ON CONFLICT (store_id, day) DO UPDATE SET visits = stats_daily.visits + excluded.visits, " +
          "checkout_starts = stats_daily.checkout_starts + excluded.checkout_starts",
        [store, day, toInt(visits, 0), toInt(checkoutStarts, 0)]
      );
    },

    /** Import helper: never lowers a counter, so re-running the import cannot double count. */
    async importDayStats(rows) {
      for (const group of chunk(rows, 100)) {
        await db.batch(
          group.map((r) => ({
            sql:
              "INSERT INTO stats_daily (store_id, day, visits, checkout_starts) VALUES (?, ?, ?, ?) " +
              "ON CONFLICT (store_id, day) DO UPDATE SET visits = MAX(stats_daily.visits, excluded.visits), " +
              "checkout_starts = MAX(stats_daily.checkout_starts, excluded.checkout_starts)",
            params: [store, String(r.day), toInt(r.visits, 0), toInt(r.checkout_starts, 0)],
          }))
        );
      }
    },

    async readDayStats(fromDay, toDay) {
      const res = await db.query<{ day: string; visits: number; checkout_starts: number }>(
        "SELECT day, visits, checkout_starts FROM stats_daily WHERE store_id = ? AND day >= ? AND day <= ?",
        [store, fromDay, toDay]
      );
      const out: Record<string, DayStats> = {};
      for (const r of res.rows) out[r.day] = { visits: Number(r.visits) || 0, checkout_starts: Number(r.checkout_starts) || 0 };
      return out;
    },

    /**
     * Idempotent bulk import (KV → D1). Per order: inserted (new), updated (the incoming copy is
     * newer than the stored one), unchanged, or conflict (its order number belongs to another id).
     * Callers must filter out tombstoned orders first.
     */
    async importOrders(orders) {
      const outcome: Record<string, ImportOutcome> = {};
      const time = (v: unknown) => Date.parse(String(v || "")) || 0;
      for (const group of chunk(orders, 25)) {
        const ids = group.map((o) => o.id);
        const existing = await db.query<{ id: string; updated_at: string }>(
          `SELECT id, updated_at FROM orders WHERE store_id = ? AND id IN (${ids.map(() => "?").join(", ")})`,
          [store, ...ids]
        );
        const storedAt = new Map(existing.rows.map((r) => [r.id, time(r.updated_at)]));
        const statements: SqlStatement[] = [];
        const tracked: { id: string; index: number; kind: ImportOutcome }[] = [];
        for (const order of group) {
          const stored = storedAt.get(order.id);
          if (stored === undefined) {
            tracked.push({ id: order.id, index: statements.length, kind: "inserted" });
            statements.push({ sql: INSERT_SQL, params: orderToParams(store, order) });
            statements.push(historyInsert(order.id, String(order.status || "pending"), "import", String(order.updated_at || order.created_at)));
          } else if (time(order.updated_at) > stored) {
            const o = order as Order & Record<string, any>;
            const cols = ORDER_COLS.filter(([n]) => !IMMUTABLE_COLS.has(n));
            tracked.push({ id: order.id, index: statements.length, kind: "updated" });
            statements.push({
              sql: `UPDATE orders SET ${cols.map(([n]) => `${n} = ?`).join(", ")} WHERE store_id = ? AND id = ? RETURNING id`,
              params: [...cols.map(([n, kind, fallback]) => toColumnValue(kind, o[n], fallback)), store, order.id],
            });
          } else outcome[order.id] = "unchanged";
        }
        if (statements.length === 0) continue;
        const res = await db.batch(statements);
        for (const t of tracked) outcome[t.id] = res[t.index].rows.length === 1 ? t.kind : "conflict";
      }
      return outcome;
    },

    async pruneExpired(now) {
      const cutoff = now - 24 * 60 * 60 * 1000;
      await db.batch([
        { sql: "DELETE FROM order_dedupe WHERE store_id = ? AND created_ms < ?", params: [store, cutoff] },
        { sql: "DELETE FROM rate_limits WHERE store_id = ? AND window_start < ?", params: [store, cutoff] },
      ]);
    },
  };
  return repo;
}

/** The repository for this request. Throws D1UnavailableError when ORDERS_BACKEND=d1 but D1 is not bound. */
export function getOrdersRepo(): OrdersRepo {
  const db = getD1Client();
  if (!db) throw new D1UnavailableError();
  return createD1OrdersRepo(db, currentStoreId());
}
