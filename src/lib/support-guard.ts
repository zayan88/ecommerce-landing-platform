import { kvStore } from "@/lib/db/kv";
import { sha256 } from "@/lib/crypto/sha256";

/**
 * Abuse guard for the public support chat -> Telegram escalation.
 * Best-effort (memory per isolate + KV); fails OPEN for the chat itself, but a failed
 * guard only means "maybe forward", never "block the customer's chat reply".
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_FORWARDS = 3;
export const MAX_FORWARD_CHARS = 500;

type Entry = { count: number; first: number };
const mem = new Map<string, Entry>();

/** True when this client may still forward a message to Telegram (and consumes one slot). */
export async function allowTelegramForward(ip: string): Promise<boolean> {
  if (!ip) return true;
  try {
    const now = Date.now();
    const key = `chat_fwd:${sha256(encodeURIComponent(ip))}`;
    let entry: Entry | null = mem.get(key) || null;
    try {
      const fromKv = await kvStore.get<Entry>(key);
      if (fromKv && typeof fromKv.count === "number" && typeof fromKv.first === "number" && (!entry || fromKv.count > entry.count)) {
        entry = fromKv;
      }
    } catch {}
    const memNow = mem.get(key);
    if (memNow && (!entry || memNow.count > entry.count)) entry = memNow;
    if (entry && now - entry.first > WINDOW_MS) entry = null;
    if (entry && entry.count >= MAX_FORWARDS) return false;

    const next: Entry = { count: (entry?.count || 0) + 1, first: entry?.first || now };
    mem.set(key, next);
    if (mem.size > 2000) mem.forEach((v, k) => now - v.first > WINDOW_MS && mem.delete(k));
    kvStore.put(key, next).catch(() => {});
    return true;
  } catch {
    return true;
  }
}

/** Collapses whitespace and caps length so one message can't flood the Telegram chat. */
export function clipForwardText(text: string): string {
  const s = (text || "").replace(/\s+/g, " ").trim();
  return s.length > MAX_FORWARD_CHARS ? `${s.slice(0, MAX_FORWARD_CHARS)}…` : s;
}
