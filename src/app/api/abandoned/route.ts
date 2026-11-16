import { NextRequest, NextResponse } from "next/server";
import { captureAbandoned, normalizeEgyptPhone } from "@/lib/db/abandoned-repo";
import { getOrdersRepo } from "@/lib/db/orders-repo";

export const runtime = "edge";

/**
 * Public: the checkout form reports a started-but-not-submitted order (valid Egyptian mobile + name).
 * Always answers 200 with no body details, so it cannot be used to probe anything. Per-IP limit:
 * 30 reports / 10 minutes. Off (a silent no-op) unless ORDERS_BACKEND=d1.
 */
const ok = () => NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return ok();
    const phone = normalizeEgyptPhone((body as any).phone);
    if (!phone) return ok();

    const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim().slice(0, 64);
    try {
      const rate = await getOrdersRepo().consumeRateLimit(`ab:${ip}`, Date.now(), 10 * 60 * 1000, 30);
      if (rate.count > 30) return ok();
    } catch {
      return ok(); // KV mode / D1 not bound: feature off
    }

    await captureAbandoned({
      phone,
      name: (body as any).name,
      governorate: (body as any).governorate,
      product_id: (body as any).product_id,
      product_title: (body as any).product_title,
      landing_slug: (body as any).landing_slug,
      offer_title: (body as any).offer_title,
      amount: (body as any).amount,
      utm_source: (body as any).utm_source,
    });
  } catch (err) {
    console.error("[abandoned] capture failed", (err as Error)?.message);
  }
  return ok();
}
