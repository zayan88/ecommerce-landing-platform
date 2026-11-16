import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/session";
import { dbStore } from "@/lib/db/store";
import { sendOrdersToShipping } from "@/lib/shipping";

export const runtime = "edge";

const noStore = { "Cache-Control": "no-store" };
const deny = () => NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401, headers: noStore });

/** Which courier is connected (no secrets). */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return deny();
  const s = await dbStore.getSettings();
  const provider = s.shipping_provider || "none";
  return NextResponse.json(
    { success: true, provider, configured: provider === "bosta" ? Boolean((s.bosta_api_key || "").trim()) : false },
    { headers: noStore }
  );
}

/** Sends the given orders (ids or order numbers, at most 50) to the connected courier. */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return deny();
  const body = await req.json().catch(() => null);
  const ids: string[] = Array.isArray(body?.order_ids) ? body.order_ids.filter((x: unknown) => typeof x === "string" && x.length <= 120).slice(0, 50) : [];
  if (ids.length === 0) return NextResponse.json({ success: false, error: "اختار طلب واحد على الأقل" }, { status: 400, headers: noStore });
  const s = await dbStore.getSettings();
  if ((s.shipping_provider || "none") === "none") {
    return NextResponse.json({ success: false, error: "مفيش شركة شحن متربطة. اربطها من الإعدادات." }, { status: 400, headers: noStore });
  }
  const origin = new URL(req.url).origin;
  const { results } = await sendOrdersToShipping(ids, origin);
  const okCount = results.filter((r) => r.ok && !r.skipped).length;
  return NextResponse.json({ success: true, sent: okCount, results }, { headers: noStore });
}
