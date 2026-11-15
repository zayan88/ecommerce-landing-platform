import { kvStore } from "@/lib/db/kv";
import { sha256 } from "@/lib/crypto/sha256";
import { getOrdersRepo, ordersBackend } from "@/lib/db/orders-repo";

/**
 * Spam / duplicate protection for the public order endpoint.
 * Everything here is best-effort: KV is eventually consistent, so every KV
 * failure fails OPEN (a guard problem must never block a legitimate order).
 * Edge-safe: Web Crypto globals only.
 *
 * With ORDERS_BACKEND=d1 the durable half of both guards lives in D1 (tables `rate_limits` and
 * `order_dedupe`) and is atomic across isolates; no KV key is read or written. Same limits, same
 * responses, and a D1 failure still fails open.
 */

// ───────────────────────── ID generation ─────────────────────────

function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  let out = "";
  for (let i = 0; i < buf.length; i++) out += (buf[i] < 16 ? "0" : "") + buf[i].toString(16);
  return out;
}

/** `ord-<epoch ms>-<8 hex>` */
export function generateOrderId(now: number = Date.now()): string {
  return `ord-${now}-${randomHex(4)}`;
}

/** Uniform 0000..9999 from the CSPRNG (rejection sampling, no modulo bias). */
function randomFourDigits(): string {
  const buf = new Uint32Array(1);
  const limit = 4294960000; // largest multiple of 10000 below 2^32
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return String(buf[0] % 10000).padStart(4, "0");
}

/** Visible order number `EG-YYMMDD-XXXX` (XXXX = 4 digits; support chat matches /EG-\d{6}-\d{4}/). */
export function generateOrderNumber(now: Date = new Date()): string {
  return `EG-${now.toISOString().slice(2, 10).replace(/-/g, "")}-${randomFourDigits()}`;
}

/** Generates an order number, regenerating up to `maxRetries` times while `isTaken` says it collides. */
export function generateUniqueOrderNumber(
  isTaken: (orderNumber: string) => boolean,
  maxRetries = 3,
  now: Date = new Date()
): string {
  let candidate = generateOrderNumber(now);
  for (let i = 0; i < maxRetries && isTaken(candidate); i++) {
    candidate = generateOrderNumber(now);
  }
  return candidate;
}

// ───────────────────────── Client IP ─────────────────────────

/** cf-connecting-ip → x-real-ip → first x-forwarded-for. Returns "" when unknown. */
export function getOrderClientIp(headers: Headers): string {
  return (
    (headers.get("cf-connecting-ip") || "").trim() ||
    (headers.get("x-real-ip") || "").trim() ||
    (headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    ""
  );
}

// ───────────────────────── Per-IP rate limit ─────────────────────────

export const ORDER_RATE_WINDOW_MS = 10 * 60 * 1000;
export const ORDER_RATE_MAX = 5;

type RateEntry = { count: number; first: number };
const rateMem = new Map<string, RateEntry>();

/** KV key for an IP's counter (hashed: no raw IPs in key names). */
export function orderRateKey(ip: string): string {
  return `order_rl:${sha256(encodeURIComponent(ip))}`;
}

function pruneMap<V>(map: Map<string, V>, isStale: (v: V) => boolean, maxSize = 2000): void {
  if (map.size <= maxSize) return;
  map.forEach((v, k) => {
    if (isStale(v)) map.delete(k);
  });
}

/**
 * Checks the per-IP budget and, when allowed, consumes one slot.
 * Unknown IP or any KV failure → allowed.
 */
export async function consumeOrderRateLimit(
  ip: string
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  if (!ip) return { allowed: true, retryAfterSec: 0 };
  try {
    const now = Date.now();
    const key = orderRateKey(ip);
    const useD1 = ordersBackend() === "d1";

    if (useD1) {
      try {
        // One atomic upsert: counts this attempt and returns the window (correct across isolates).
        const repo = getOrdersRepo();
        const res = await repo.consumeRateLimit(key, now, ORDER_RATE_WINDOW_MS, ORDER_RATE_MAX);
        if (Math.random() < 0.02) await repo.pruneExpired(now).catch(() => {});
        if (res.count > ORDER_RATE_MAX) {
          return {
            allowed: false,
            retryAfterSec: Math.max(1, Math.ceil((res.windowStart + ORDER_RATE_WINDOW_MS - now) / 1000)),
          };
        }
        return { allowed: true, retryAfterSec: 0 };
      } catch (err) {
        // Fall through to this isolate's in-memory counter (never to KV).
        console.warn("[Order Guard] D1 rate-limit failed (memory fallback)", (err as Error)?.message);
      }
    }

    let entry: RateEntry | null = rateMem.get(key) || null;
    if (!useD1) try {
      const fromKv = await kvStore.get<RateEntry>(key);
      if (
        fromKv &&
        typeof fromKv.count === "number" &&
        typeof fromKv.first === "number" &&
        (!entry || fromKv.count > entry.count)
      ) {
        entry = fromKv;
      }
    } catch (err) {
      console.warn("[Order Guard] rate-limit read failed (fail open)", err);
    }
    // Re-read memory: a concurrent request in this isolate may have advanced it while we awaited KV.
    const memNow = rateMem.get(key);
    if (memNow && (!entry || memNow.count > entry.count)) entry = memNow;
    if (entry && now - entry.first > ORDER_RATE_WINDOW_MS) entry = null;

    if (entry && entry.count >= ORDER_RATE_MAX) {
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil((entry.first + ORDER_RATE_WINDOW_MS - now) / 1000)),
      };
    }

    const next: RateEntry = { count: (entry?.count || 0) + 1, first: entry?.first || now };
    rateMem.set(key, next);
    pruneMap(rateMem, (v) => now - v.first > ORDER_RATE_WINDOW_MS);
    if (!useD1) try {
      const ok = await kvStore.put(key, next);
      if (!ok) console.warn("[Order Guard] rate-limit write failed (fail open)");
    } catch (err) {
      console.warn("[Order Guard] rate-limit write failed (fail open)", err);
    }
    return { allowed: true, retryAfterSec: 0 };
  } catch (err) {
    console.warn("[Order Guard] rate-limit error (fail open)", err);
    return { allowed: true, retryAfterSec: 0 };
  }
}

// ───────────────────────── Duplicate guard ─────────────────────────

export const ORDER_DEDUPE_WINDOW_MS = 15 * 60 * 1000;

/** The order fields returned to the storefront; stored in the dedupe pointer so a repeat can be answered verbatim. */
export interface PublicOrderSnapshot {
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

type DedupeEntry = { order_id: string; ts: number; order: PublicOrderSnapshot };

const dedupeMem = new Map<string, DedupeEntry>();
const inflight = new Map<string, Promise<PublicOrderSnapshot | null>>();

/** `order_dedupe:<sha256(phone|product)>` — the raw phone never appears in a key name. */
export function orderDedupeKey(normalizedPhone: string, productId: string): string {
  return `order_dedupe:${sha256(`${normalizedPhone}|${encodeURIComponent(productId)}`)}`;
}

/** A pointer is usable only if well-formed and younger than the dedupe window. */
export function isFreshDedupeEntry(entry: unknown, now: number = Date.now()): entry is DedupeEntry {
  const e = entry as DedupeEntry | null;
  return Boolean(
    e &&
      typeof e === "object" &&
      typeof e.ts === "number" &&
      now - e.ts >= 0 &&
      now - e.ts <= ORDER_DEDUPE_WINDOW_MS &&
      e.order &&
      typeof e.order.id === "string" &&
      typeof e.order.order_number === "string"
  );
}

/** A claim whose owner never finished (crashed isolate) may be taken over after this long. */
export const ORDER_DEDUPE_PENDING_TTL_MS = 20 * 1000;
/** Waits (ms) while another request is still creating the same order: ~4.2s in total, 6 D1 queries. */
const DEDUPE_POLL_DELAYS_MS = [100, 200, 400, 800, 1200, 1500];
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * D1 half of beginOrder: an atomic claim on (phone + product) in table `order_dedupe`.
 * Exactly one of N concurrent identical requests — in any isolate — gets the claim; the others wait
 * for the winner's order and return it. Any D1 failure fails open (order proceeds unguarded).
 */
async function beginOrderD1(key: string, release: (o: PublicOrderSnapshot | null) => void): Promise<OrderSlot> {
  const claimId = randomHex(8);
  let claimed = false;
  try {
    const repo = getOrdersRepo();
    const claim = () => repo.claimDedupe(key, claimId, Date.now(), ORDER_DEDUPE_WINDOW_MS, ORDER_DEDUPE_PENDING_TTL_MS);
    let outcome = await claim();
    for (const delay of DEDUPE_POLL_DELAYS_MS) {
      if (outcome.state !== "pending") break;
      await sleep(delay);
      outcome = await claim();
    }
    if (outcome.state === "existing") {
      dedupeMem.set(key, { order_id: outcome.order.id, ts: Date.now(), order: outcome.order });
      release(outcome.order);
      return { existing: outcome.order, settle: async () => {} };
    }
    claimed = outcome.state === "claimed"; // still "pending" after the wait → proceed unguarded
  } catch (err) {
    console.warn("[Order Guard] D1 dedupe claim failed (fail open)", (err as Error)?.message);
  }

  return {
    existing: null,
    settle: async (order) => {
      try {
        if (!order) {
          if (claimed) await getOrdersRepo().releaseDedupe(key, claimId);
          return;
        }
        const now = Date.now();
        dedupeMem.set(key, { order_id: order.id, ts: now, order });
        pruneMap(dedupeMem, (v) => now - v.ts > ORDER_DEDUPE_WINDOW_MS);
        if (claimed) await getOrdersRepo().settleDedupe(key, claimId, order.id, now);
      } catch (err) {
        console.warn("[Order Guard] D1 dedupe settle failed (fail open)", (err as Error)?.message);
      } finally {
        release(order);
      }
    },
  };
}

export interface OrderSlot {
  /** Set when the same phone + product already ordered inside the window. */
  existing: PublicOrderSnapshot | null;
  /** Call exactly once when `existing` is null: with the created order, or null if creation was abandoned. */
  settle: (order: PublicOrderSnapshot | null) => Promise<void>;
}

/**
 * Looks for a recent order with the same key (memory → in-flight request in this isolate → KV).
 * If none, reserves the key so a concurrent double-click in the same isolate waits for this one.
 */
export async function beginOrder(key: string): Promise<OrderSlot> {
  const noop = async () => {};
  try {
    const mem = dedupeMem.get(key);
    if (isFreshDedupeEntry(mem)) return { existing: mem.order, settle: noop };

    const pending = inflight.get(key);
    if (pending) {
      const done = await pending.catch(() => null);
      if (done) return { existing: done, settle: noop };
    }

    // Reserve before the first await below so concurrent requests see it.
    let resolveInflight: (o: PublicOrderSnapshot | null) => void = () => {};
    let reserved = false;
    if (!inflight.has(key)) {
      inflight.set(
        key,
        new Promise<PublicOrderSnapshot | null>((resolve) => {
          resolveInflight = resolve;
        })
      );
      reserved = true;
    }
    const release = (o: PublicOrderSnapshot | null) => {
      if (reserved) {
        reserved = false;
        inflight.delete(key);
        resolveInflight(o);
      }
    };

    if (ordersBackend() === "d1") return beginOrderD1(key, release);

    try {
      const fromKv = await kvStore.get<DedupeEntry>(key);
      if (isFreshDedupeEntry(fromKv)) {
        dedupeMem.set(key, fromKv);
        release(fromKv.order);
        return { existing: fromKv.order, settle: noop };
      }
    } catch (err) {
      console.warn("[Order Guard] dedupe read failed (fail open)", err);
    }

    return {
      existing: null,
      settle: async (order) => {
        try {
          if (!order) return;
          const now = Date.now();
          const entry: DedupeEntry = { order_id: order.id, ts: now, order };
          dedupeMem.set(key, entry);
          pruneMap(dedupeMem, (v) => now - v.ts > ORDER_DEDUPE_WINDOW_MS);
          const ok = await kvStore.put(key, entry);
          if (!ok) console.warn("[Order Guard] dedupe write failed (fail open)");
        } catch (err) {
          console.warn("[Order Guard] dedupe write failed (fail open)", err);
        } finally {
          release(order);
        }
      },
    };
  } catch (err) {
    console.warn("[Order Guard] dedupe error (fail open)", err);
    return { existing: null, settle: noop };
  }
}
