/**
 * Payment receipts (customer screenshots of a Vodafone Cash / InstaPay transfer).
 * D1 table `payment_receipts` (migrations/0007) when the orders backend is D1, else the KV store.
 * Private by design: only the admin can read one (/api/receipts/[id]); the image is deleted as soon as the merchant
 * decides the order (see settleReceipt in store.ts) or the order is deleted. Edge-safe, every SQL value is bound.
 */
import { getD1Client, type SqlClient } from "./d1";
import { kvStore } from "./kv";
import { currentStoreId, ordersBackend } from "./orders-repo";
import { base64ToBytes, bytesToBase64, contentTypeFor, type MediaExt } from "@/lib/media";

export const RECEIPT_ID_RE = /^[a-f0-9]{20}$/;
export const MAX_RECEIPT_BYTES = 800_000;
const MAX_AGE_MS = 45 * 24 * 60 * 60 * 1000;
/** An upload that no order picked up within this time is junk. */
const UNATTACHED_MAX_AGE_MS = 3 * 60 * 60 * 1000;
const KV_PREFIX = "receipt:";

function d1(): { db: SqlClient; store: string } | null {
  if (ordersBackend() !== "d1") return null;
  const db = getD1Client();
  return db ? { db, store: currentStoreId() } : null;
}

export function newReceiptId(): string {
  const b = new Uint8Array(10);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

export async function saveReceipt(bytes: Uint8Array, ext: MediaExt, now = Date.now()): Promise<string | null> {
  const id = newReceiptId();
  const ct = contentTypeFor(ext);
  const ctx = d1();
  if (ctx) {
    await ctx.db.batch([
      { sql: "INSERT INTO payment_receipts (store_id, id, ct, b64, size, created_ms) VALUES (?, ?, ?, ?, ?, ?)", params: [ctx.store, id, ct, bytesToBase64(bytes), bytes.length, now] },
      { sql: "DELETE FROM payment_receipts WHERE store_id = ? AND created_ms < ?", params: [ctx.store, now - MAX_AGE_MS] },
    ]);
    // Junk uploads that no order picked up within 3 hours (the customer attaches a receipt within minutes).
    // Best effort: a failure here must never block the upload.
    try {
      await ctx.db.query(
        "DELETE FROM payment_receipts WHERE store_id = ? AND created_ms < ? AND id NOT IN (" +
          "SELECT json_extract(tracking, '$.payment.receipt_id') FROM orders WHERE store_id = ? AND tracking IS NOT NULL " +
          "AND json_extract(tracking, '$.payment.receipt_id') IS NOT NULL)",
        [ctx.store, now - UNATTACHED_MAX_AGE_MS, ctx.store]
      );
    } catch {
      /* ignore */
    }
    return id;
  }
  const ok = await kvStore.put(KV_PREFIX + id, { ct, b64: bytesToBase64(bytes), size: bytes.length, created_ms: now });
  return ok ? id : null;
}

export async function getReceipt(id: string): Promise<{ ct: string; bytes: Uint8Array } | null> {
  if (!RECEIPT_ID_RE.test(id)) return null;
  const ctx = d1();
  if (ctx) {
    const r = await ctx.db.query<any>("SELECT ct, b64 FROM payment_receipts WHERE store_id = ? AND id = ?", [ctx.store, id]);
    const row = r.rows[0];
    return row ? { ct: String(row.ct), bytes: base64ToBytes(String(row.b64)) } : null;
  }
  const rec = await kvStore.get<any>(KV_PREFIX + id);
  return rec?.b64 ? { ct: String(rec.ct), bytes: base64ToBytes(rec.b64) } : null;
}

export async function receiptExists(id: string): Promise<boolean> {
  if (!RECEIPT_ID_RE.test(id)) return false;
  const ctx = d1();
  if (ctx) {
    const r = await ctx.db.query<any>("SELECT 1 AS x FROM payment_receipts WHERE store_id = ? AND id = ?", [ctx.store, id]);
    return r.rows.length > 0;
  }
  return Boolean(await kvStore.get<any>(KV_PREFIX + id));
}

/** Removes the image for good. Safe to call twice. */
export async function deleteReceipt(id: string): Promise<void> {
  if (!RECEIPT_ID_RE.test(id)) return;
  const ctx = d1();
  if (ctx) {
    await ctx.db.query("DELETE FROM payment_receipts WHERE store_id = ? AND id = ?", [ctx.store, id]);
    return;
  }
  // KV has no delete in our wrapper: blank the record so nothing readable stays behind
  await kvStore.put(KV_PREFIX + id, { ct: "", b64: "", size: 0, created_ms: 0 });
}
