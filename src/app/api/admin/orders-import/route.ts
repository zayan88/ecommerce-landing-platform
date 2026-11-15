import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/session";
import { D1UnavailableError } from "@/lib/db/d1";
import { importKvOrdersToD1, ordersStorageStatus, OrdersImportError } from "@/lib/db/orders-import";

export const runtime = "edge";

/**
 * Admin-only (not in the public allow-list of src/middleware.ts; re-checked here as defence in depth).
 *   GET  → read-only totals of KV and D1 (compare before/after).
 *   POST → { offset?, limit?, dry_run? } copies one page of KV orders (+ tombstones, daily counters)
 *          into D1. Idempotent; repeat with `next_offset` until `done` is true.
 * Responses carry counts and order ids only — no customer data.
 */
const noStore = { "Cache-Control": "no-store" };
const unauthorized = () =>
  NextResponse.json({ success: false, error: "غير مصرح. يرجى تسجيل الدخول إلى لوحة التحكم." }, { status: 401, headers: noStore });

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  try {
    return NextResponse.json({ success: true, ...(await ordersStorageStatus()) }, { headers: noStore });
  } catch (err) {
    console.error("[orders-import] status failed", (err as Error)?.message);
    return NextResponse.json({ success: false, error: "تعذر قراءة حالة التخزين" }, { status: 500, headers: noStore });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  try {
    const body: any = await req.json().catch(() => ({}));
    const report = await importKvOrdersToD1({
      offset: Number(body?.offset) || 0,
      limit: Number(body?.limit) || undefined,
      dryRun: body?.dry_run === true,
    });
    return NextResponse.json({ success: true, report }, { headers: noStore });
  } catch (err) {
    if (err instanceof D1UnavailableError) {
      return NextResponse.json(
        { success: false, error: "D1 غير مُعد: لا يوجد ربط DB ولا D1_REST_BASE_URL" },
        { status: 503, headers: noStore }
      );
    }
    if (err instanceof OrdersImportError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 502, headers: noStore });
    }
    console.error("[orders-import] failed", (err as Error)?.message);
    return NextResponse.json({ success: false, error: "تعذر استيراد الطلبات" }, { status: 500, headers: noStore });
  }
}
