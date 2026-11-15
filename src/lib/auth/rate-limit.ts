import type { NextRequest } from "next/server";
import { kvStore } from "@/lib/db/kv";

/** Failed-login limiter per IP: in-memory per isolate + KV best-effort across isolates. */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;
type Entry = { count: number; first: number };
const mem = new Map<string, Entry>();
const kvKey = (ip: string) => `auth_rl:${ip}`;

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    "unknown"
  );
}

async function readEntry(ip: string): Promise<Entry | null> {
  let e: Entry | null = mem.get(ip) || null;
  try {
    const fromKv = await kvStore.get<Entry>(kvKey(ip));
    if (
      fromKv &&
      typeof fromKv.count === "number" &&
      typeof fromKv.first === "number" &&
      (!e || fromKv.count > e.count)
    ) {
      e = fromKv;
    }
  } catch {}
  if (e && Date.now() - e.first > WINDOW_MS) return null;
  return e;
}

export async function getLoginBlock(ip: string): Promise<{ blocked: boolean; retryAfterSec: number }> {
  const e = await readEntry(ip);
  if (!e || e.count < MAX_FAILS) return { blocked: false, retryAfterSec: 0 };
  return {
    blocked: true,
    retryAfterSec: Math.max(1, Math.ceil((e.first + WINDOW_MS - Date.now()) / 1000)),
  };
}

export async function recordLoginFailure(ip: string): Promise<void> {
  const e = (await readEntry(ip)) || { count: 0, first: Date.now() };
  const next = { count: e.count + 1, first: e.first };
  mem.set(ip, next);
  try {
    await kvStore.put(kvKey(ip), next);
  } catch {}
}

export async function clearLoginFailures(ip: string): Promise<void> {
  mem.delete(ip);
  try {
    await kvStore.delete(kvKey(ip));
  } catch {}
}
