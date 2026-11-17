/**
 * Live store chat storage (D1 only): conversations, both directions of messages and the map from a Telegram
 * message to its conversation. Schema: migrations/0006_chat_live.sql. Every value is a bound parameter; with
 * ORDERS_BACKEND=kv the live reply is off and these return null / false (the hand-off still goes to Telegram).
 */
import { getD1Client, type SqlClient } from "./d1";
import { currentStoreId, ordersBackend } from "./orders-repo";

const RETENTION_MS = 1 * 24 * 60 * 60 * 1000;
export const CID_RE = /^[a-f0-9]{24,40}$/;

function repoDb(): { db: SqlClient; store: string } | null {
  if (ordersBackend() !== "d1") return null;
  const db = getD1Client();
  return db ? { db, store: currentStoreId() } : null;
}

export const chatLiveAvailable = (): boolean => repoDb() !== null;

export interface ChatConv {
  cid: string;
  name: string;
  phone: string;
  page: string;
}

export interface ChatLine {
  id: number;
  who: "me" | "shop";
  text: string;
}

export async function upsertConv(c: ChatConv, now = Date.now()): Promise<boolean> {
  const ctx = repoDb();
  if (!ctx || !CID_RE.test(c.cid)) return false;
  await ctx.db.batch([
    {
      sql:
        "INSERT INTO chat_conv (store_id, cid, name, phone, page, created_ms) VALUES (?, ?, ?, ?, ?, ?) " +
        "ON CONFLICT (store_id, cid) DO UPDATE SET name = excluded.name, phone = excluded.phone, page = excluded.page",
      params: [ctx.store, c.cid, c.name.slice(0, 60), c.phone.slice(0, 20), c.page.slice(0, 200), now],
    },
    { sql: "DELETE FROM chat_messages WHERE store_id = ? AND created_ms < ?", params: [ctx.store, now - RETENTION_MS] },
    { sql: "DELETE FROM chat_tg WHERE store_id = ? AND created_ms < ?", params: [ctx.store, now - RETENTION_MS] },
    { sql: "DELETE FROM chat_conv WHERE store_id = ? AND created_ms < ?", params: [ctx.store, now - RETENTION_MS] },
  ]);
  return true;
}

export async function getConv(cid: string): Promise<ChatConv | null> {
  const ctx = repoDb();
  if (!ctx || !CID_RE.test(cid)) return null;
  const r = await ctx.db.query<any>("SELECT cid, name, phone, page FROM chat_conv WHERE store_id = ? AND cid = ?", [ctx.store, cid]);
  const row = r.rows[0];
  return row ? { cid: row.cid, name: row.name, phone: row.phone, page: row.page } : null;
}

export async function addLine(cid: string, who: "me" | "shop", text: string, now = Date.now()): Promise<boolean> {
  const ctx = repoDb();
  if (!ctx || !CID_RE.test(cid)) return false;
  await ctx.db.query("INSERT INTO chat_messages (store_id, cid, who, text, created_ms) VALUES (?, ?, ?, ?, ?)", [ctx.store, cid, who, text.slice(0, 800), now]);
  return true;
}

/** Messages of this conversation after `afterId` (oldest first, at most 100). */
export async function listLines(cid: string, afterId: number): Promise<ChatLine[] | null> {
  const ctx = repoDb();
  if (!ctx || !CID_RE.test(cid)) return null;
  const r = await ctx.db.query<any>(
    "SELECT id, who, text FROM chat_messages WHERE store_id = ? AND cid = ? AND id > ? ORDER BY id ASC LIMIT 100",
    [ctx.store, cid, Math.max(0, Math.floor(afterId) || 0)]
  );
  return r.rows.map((x) => ({ id: Number(x.id), who: x.who === "shop" ? "shop" : "me", text: String(x.text) }));
}

export async function mapTelegramMessage(tgMessageId: number, cid: string, now = Date.now()): Promise<void> {
  const ctx = repoDb();
  if (!ctx || !CID_RE.test(cid) || !Number.isFinite(tgMessageId)) return;
  await ctx.db.query("INSERT OR REPLACE INTO chat_tg (store_id, tg_message_id, cid, created_ms) VALUES (?, ?, ?, ?)", [ctx.store, Math.floor(tgMessageId), cid, now]);
}

export async function cidForTelegramMessage(tgMessageId: number): Promise<string | null> {
  const ctx = repoDb();
  if (!ctx || !Number.isFinite(tgMessageId)) return null;
  const r = await ctx.db.query<any>("SELECT cid FROM chat_tg WHERE store_id = ? AND tg_message_id = ?", [ctx.store, Math.floor(tgMessageId)]);
  return r.rows[0]?.cid ?? null;
}
