/**
 * Abandoned checkouts (D1 only): visitors who typed their name + phone but did not place the order.
 * Schema: migrations/0005_abandoned_checkouts.sql.
 *
 * Same rules as orders-repo.ts: every value is a bound parameter, column names / sort come from
 * constants only, nothing here logs parameters (customer PII). With ORDERS_BACKEND=kv this feature is
 * off (a capture per keystroke-pause would eat the KV write budget): the functions return null/false.
 * Edge-safe: no Node APIs.
 */
import { getD1Client, type SqlClient } from "./d1";
import { currentStoreId, ordersBackend } from "./orders-repo";

export type AbandonedStatus = "open" | "contacted" | "converted";
export const ABANDONED_STATUSES: readonly AbandonedStatus[] = ["open", "contacted", "converted"];
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export interface AbandonedCheckout {
  id: string;
  phone: string;
  name: string;
  governorate: string | null;
  product_id: string;
  product_title: string | null;
  landing_slug: string | null;
  offer_title: string | null;
  amount: number;
  utm_source: string | null;
  status: AbandonedStatus;
  created_ms: number;
  updated_ms: number;
}

/** Egyptian mobile number in the 01xxxxxxxxx form, or null. Accepts Arabic digits, +20 / 0020 prefixes, spaces. */
export function normalizeEgyptPhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let d = raw
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[^0-9]/g, "");
  if (d.startsWith("0020")) d = d.slice(4);
  else if (d.startsWith("20") && d.length === 12) d = d.slice(2);
  if (d.length === 10 && d.startsWith("1")) d = "0" + d;
  return /^01[0125]\d{8}$/.test(d) ? d : null;
}

function repoDb(): { db: SqlClient; store: string } | null {
  if (ordersBackend() !== "d1") return null;
  const db = getD1Client();
  return db ? { db, store: currentStoreId() } : null;
}

const clip = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const t = v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
  return t || null;
};

export interface CaptureInput {
  phone: string;
  name?: unknown;
  governorate?: unknown;
  product_id?: unknown;
  product_title?: unknown;
  landing_slug?: unknown;
  offer_title?: unknown;
  amount?: unknown;
  utm_source?: unknown;
}

/** Insert or refresh the abandoned checkout of this phone + product. Returns false when the feature is off. */
export async function captureAbandoned(input: CaptureInput, now: number = Date.now()): Promise<boolean> {
  const ctx = repoDb();
  if (!ctx) return false;
  const productId = clip(input.product_id, 80) || "";
  const id = `${input.phone}:${productId}`;
  const amount = Math.max(0, Math.min(10_000_000, Math.round(Number(input.amount) || 0)));
  await ctx.db.batch([
    {
      sql:
        "INSERT INTO abandoned_checkouts (store_id, id, phone, name, governorate, product_id, product_title, landing_slug, " +
        "offer_title, amount, utm_source, status, created_ms, updated_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?) " +
        "ON CONFLICT (store_id, id) DO UPDATE SET name = excluded.name, governorate = excluded.governorate, " +
        "product_title = excluded.product_title, landing_slug = excluded.landing_slug, offer_title = excluded.offer_title, " +
        "amount = excluded.amount, utm_source = excluded.utm_source, updated_ms = excluded.updated_ms " +
        "WHERE abandoned_checkouts.status != 'converted'",
      params: [
        ctx.store,
        id,
        input.phone,
        clip(input.name, 80) || "",
        clip(input.governorate, 40),
        productId,
        clip(input.product_title, 160),
        clip(input.landing_slug, 120),
        clip(input.offer_title, 120),
        amount,
        clip(input.utm_source, 60),
        now,
        now,
      ],
    },
    { sql: "DELETE FROM abandoned_checkouts WHERE store_id = ? AND updated_ms < ?", params: [ctx.store, now - RETENTION_MS] },
  ]);
  return true;
}

/** The customer placed an order: close every open abandoned checkout of that phone. Best effort. */
export async function markAbandonedConverted(phone: string, now: number = Date.now()): Promise<void> {
  const ctx = repoDb();
  const p = normalizeEgyptPhone(phone);
  if (!ctx || !p) return;
  await ctx.db.query(
    "UPDATE abandoned_checkouts SET status = 'converted', updated_ms = ? WHERE store_id = ? AND phone = ? AND status != 'converted'",
    [now, ctx.store, p]
  );
}

export interface AbandonedList {
  supported: boolean;
  items: AbandonedCheckout[];
  counts: { open: number; contacted: number; converted: number };
}

export async function listAbandoned(opts: { status?: string; limit?: number; offset?: number } = {}): Promise<AbandonedList> {
  const ctx = repoDb();
  const empty = { open: 0, contacted: 0, converted: 0 };
  if (!ctx) return { supported: false, items: [], counts: empty };
  const limit = Math.min(Math.max(Math.floor(Number(opts.limit) || 50), 1), 200);
  const offset = Math.max(Math.floor(Number(opts.offset) || 0), 0);
  const status = ABANDONED_STATUSES.includes(opts.status as AbandonedStatus) ? (opts.status as string) : null;
  const [rows, counts] = await ctx.db.batch([
    {
      sql:
        "SELECT id, phone, name, governorate, product_id, product_title, landing_slug, offer_title, amount, utm_source, status, " +
        "created_ms, updated_ms FROM abandoned_checkouts WHERE store_id = ? " +
        (status ? "AND status = ? " : "") +
        "ORDER BY updated_ms DESC LIMIT ? OFFSET ?",
      params: status ? [ctx.store, status, limit, offset] : [ctx.store, limit, offset],
    },
    { sql: "SELECT status, COUNT(*) AS n FROM abandoned_checkouts WHERE store_id = ? GROUP BY status", params: [ctx.store] },
  ]);
  const out = { ...empty };
  for (const r of counts.rows) {
    if (r.status in out) (out as Record<string, number>)[r.status] = Number(r.n) || 0;
  }
  return { supported: true, items: rows.rows as AbandonedCheckout[], counts: out };
}

export async function setAbandonedStatus(id: string, status: AbandonedStatus): Promise<boolean> {
  const ctx = repoDb();
  if (!ctx || !ABANDONED_STATUSES.includes(status) || typeof id !== "string" || id.length > 200) return false;
  const res = await ctx.db.query(
    "UPDATE abandoned_checkouts SET status = ?, updated_ms = ? WHERE store_id = ? AND id = ? RETURNING id",
    [status, Date.now(), ctx.store, id]
  );
  return res.rows.length === 1;
}

export async function deleteAbandoned(ids: string[]): Promise<number> {
  const ctx = repoDb();
  if (!ctx) return 0;
  const clean = ids.filter((i) => typeof i === "string" && i.length <= 200).slice(0, 100);
  if (clean.length === 0) return 0;
  const res = await ctx.db.query(
    `DELETE FROM abandoned_checkouts WHERE store_id = ? AND id IN (${clean.map(() => "?").join(", ")}) RETURNING id`,
    [ctx.store, ...clean]
  );
  return res.rows.length;
}
