/**
 * Durable visit / checkout-start counters.
 *
 * Why: dbStore.logAnalyticsEvent keeps events in per-isolate memory only, so it cannot give real visit totals.
 * Design (free Cloudflare KV plan = 1,000 writes/day, orders must never lose their write budget):
 *  - events are counted in a module-level buffer (no KV traffic per event);
 *  - the buffer is flushed to ONE KV key per Cairo day (`stats:day:YYYY-MM-DD`) at most once every
 *    FLUSH_INTERVAL_MS per isolate, opportunistically when a later request arrives (no timers);
 *  - a flush is read-merge-write using the strict kvStore.read(): on a read error nothing is written
 *    and the deltas are put back into the buffer;
 *  - never throws, never awaited by the response path.
 */
import { kvStore } from "@/lib/db/kv";

export type StatKind = "visit" | "checkout_start";
export interface DayStats {
  visits: number;
  checkout_starts: number;
}

// Write budget: free KV = 1,000 writes/day and each order needs 3, so ≥250 orders/day leaves ~250 writes
// for everything else. One flush per isolate per hour caps this at 24 writes/day/isolate (was 144).
export const FLUSH_INTERVAL_MS = 60 * 60 * 1000;
const SESSION_CAP = 5000;
const KEY_PREFIX = "stats:day:";

const cairoFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Cairo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** YYYY-MM-DD of an instant in Egypt time. */
export function cairoDate(d: Date | string | number = new Date()): string {
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return "";
  const parts = cairoFmt.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

// State lives on globalThis so every route bundle in the same isolate shares ONE buffer
// (separately bundled routes would otherwise each keep their own copy of this module).
interface StatsState {
  buffer: Map<string, DayStats>;
  seen: Map<string, true>;
  lastFlush: number;
  flushing: boolean;
}
const G = globalThis as any;
const state: StatsState =
  G.__statsState ||
  (G.__statsState = {
    buffer: new Map<string, DayStats>(),
    seen: new Map<string, true>(),
    lastFlush: Date.now(), // first flush no earlier than one interval after the isolate starts
    flushing: false,
  });
const buffer = state.buffer;
const seenSessions = state.seen;

function bump(day: string, kind: StatKind, n = 1) {
  const cur = buffer.get(day) || { visits: 0, checkout_starts: 0 };
  if (kind === "visit") cur.visits += n;
  else cur.checkout_starts += n;
  buffer.set(day, cur);
}

function waitUntil(p: Promise<unknown>) {
  try {
    const ctx = (globalThis as any)[Symbol.for("__cloudflare-request-context__")];
    if (ctx?.ctx?.waitUntil) ctx.ctx.waitUntil(p);
  } catch {}
}

async function flushBuffer(): Promise<void> {
  if (state.flushing || buffer.size === 0 || !kvStore.isAvailable()) return;
  state.flushing = true;
  state.lastFlush = Date.now();
  const snapshot = Array.from(buffer.entries());
  buffer.clear();
  try {
    for (const [day, delta] of snapshot) {
      let ok = false;
      try {
        const key = KEY_PREFIX + day;
        const res = await kvStore.read<DayStats>(key);
        if (res.status === "found" || res.status === "missing") {
          const base = res.status === "found" && res.value ? res.value : { visits: 0, checkout_starts: 0 };
          const merged: DayStats = {
            visits: (Number(base.visits) || 0) + delta.visits,
            checkout_starts: (Number(base.checkout_starts) || 0) + delta.checkout_starts,
          };
          ok = await kvStore.put(key, merged);
        }
      } catch {
        ok = false;
      }
      if (!ok) {
        // keep the counts for the next flush window
        bump(day, "visit", delta.visits);
        bump(day, "checkout_start", delta.checkout_starts);
      }
    }
  } finally {
    state.flushing = false;
  }
}

/** Fire-and-forget. Safe to call from any request handler. */
export function recordStat(kind: StatKind, sessionId?: string): void {
  try {
    if (kind === "visit" && sessionId) {
      if (seenSessions.has(sessionId)) return;
      if (seenSessions.size >= SESSION_CAP) {
        const oldest = seenSessions.keys().next().value;
        if (oldest !== undefined) seenSessions.delete(oldest);
      }
      seenSessions.set(sessionId, true);
    }
    bump(cairoDate(), kind);
    if (Date.now() - state.lastFlush >= FLUSH_INTERVAL_MS) {
      const p = flushBuffer().catch(() => {});
      waitUntil(p);
    }
  } catch {
    /* stats must never break a request */
  }
}

/** Stored counts for each day (missing day = zeros) plus this isolate's unflushed buffer. */
export async function readDayStats(days: string[]): Promise<Record<string, DayStats>> {
  const out: Record<string, DayStats> = {};
  for (let i = 0; i < days.length; i += 10) {
    const batch = days.slice(i, i + 10);
    const vals = await Promise.all(batch.map((d) => kvStore.get<DayStats>(KEY_PREFIX + d).catch(() => null)));
    batch.forEach((d, j) => {
      const v = vals[j];
      out[d] = { visits: Number(v?.visits) || 0, checkout_starts: Number(v?.checkout_starts) || 0 };
    });
  }
  Array.from(buffer.entries()).forEach(([day, delta]) => {
    if (out[day]) {
      out[day].visits += delta.visits;
      out[day].checkout_starts += delta.checkout_starts;
    }
  });
  return out;
}
