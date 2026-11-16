import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/session";
import { dbStore } from "@/lib/db/store";

export const runtime = "edge";

/**
 * Admin-only "anything new?" check for the orders page (replaces polling the full order list).
 *
 *   GET /api/admin/orders-pulse            → first call: latest order, pending count, total (capped)
 *   GET /api/admin/orders-pulse?since=<ms> → later calls: how many orders were created after <ms>
 *
 * D1 backend: ONE batch of three index-only statements; rows read per call are bounded
 * (1 + at most 201 pending + the new orders; the first call also counts up to 10,001 index rows).
 * KV backend: `supported: false` and nothing is read — a KV "pulse" would need a list operation
 * per poll and the free plan allows 1,000 a day. The page then refreshes on a long interval instead.
 * The response carries counts and one timestamp only, no customer data.
 */
const noStore = { "Cache-Control": "no-store" };
/** Seconds between polls the client should use. */
const D1_POLL_SECONDS = 60;
const KV_POLL_SECONDS = 300;

export async function GET(req: NextRequest) {
  // Not in the public allow-list of src/middleware.ts; re-checked here as defence in depth.
  if (!isAdminRequest(req)) {
    return NextResponse.json(
      { success: false, error: "غير مصرح. يرجى تسجيل الدخول إلى لوحة التحكم." },
      { status: 401, headers: noStore }
    );
  }
  try {
    const raw = req.nextUrl.searchParams.get("since");
    const since = raw !== null && /^\d{1,15}$/.test(raw) ? Number(raw) : undefined;
    const pulse = await dbStore.getOrdersPulse(since);
    if (!pulse.supported) {
      return NextResponse.json(
        { success: true, supported: false, backend: "kv", poll_interval_sec: KV_POLL_SECONDS },
        { headers: noStore }
      );
    }
    const { supported, ...data } = pulse;
    return NextResponse.json(
      { success: true, supported: true, backend: "d1", poll_interval_sec: D1_POLL_SECONDS, ...data },
      { headers: noStore }
    );
  } catch (err) {
    console.error("[orders-pulse]", (err as Error)?.message);
    return NextResponse.json({ success: false, error: "تعذر قراءة حالة الطلبات" }, { status: 500, headers: noStore });
  }
}
