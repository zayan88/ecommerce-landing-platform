/**
 * Small per-address limiter for PUBLIC endpoints (coupon check, analytics...).
 * durable = true: counted in D1 (shared by every isolate, one write per call: use for rare calls only);
 * durable = false: per-isolate memory only (free, a partial brake for high-volume calls).
 * A storage failure never blocks a visitor (fails open).
 */
import type { NextRequest } from "next/server";
import { getOrdersRepo } from "@/lib/db/orders-repo";

const mem = new Map<string, { n: number; start: number }>();

export function clientIp(req: NextRequest): string {
  return (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim().slice(0, 64);
}

export async function allowPublic(bucket: string, ip: string, windowMs: number, max: number, durable: boolean): Promise<boolean> {
  const key = `${bucket}:${ip}`;
  if (durable) {
    try {
      const r = await getOrdersRepo().consumeRateLimit(key, Date.now(), windowMs, max);
      return r.count <= max;
    } catch {
      // KV mode / D1 hiccup: fall through to the in-memory counter
    }
  }
  const now = Date.now();
  const cur = mem.get(key);
  if (!cur || now - cur.start > windowMs) {
    mem.set(key, { n: 1, start: now });
    if (mem.size > 5000) mem.clear();
    return true;
  }
  cur.n++;
  return cur.n <= max;
}
