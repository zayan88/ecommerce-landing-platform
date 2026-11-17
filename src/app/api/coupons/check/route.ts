import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";
import { applyCoupon, bestAutoCoupon, computeShipping, sanitizeCoupons, sanitizeShipping } from "@/lib/commerce";
import { allowPublic, clientIp } from "@/lib/public-rate-limit";

export const runtime = "edge";

/**
 * Public: does this coupon work for this product/offer, and what would the order total be?
 * The browser sends ids only (never an amount); the same rules decide the real order in /api/orders.
 * It never reveals other coupons: it answers for the one code that was sent.
 */
const noStore = { "Cache-Control": "no-store" };

export async function POST(req: NextRequest) {
  // 40 checks per 10 minutes per address: a coupon code cannot be guessed by brute force
  if (!(await allowPublic("coupon", clientIp(req), 10 * 60 * 1000, 40, true))) {
    return NextResponse.json({ valid: false, reason: "محاولات كتير، جرّب بعد شوية" }, { status: 429, headers: noStore });
  }
  const body = await req.json().catch(() => null);
  const productId = typeof body?.product_id === "string" ? body.product_id.slice(0, 120) : "";
  if (!productId) return NextResponse.json({ valid: false, reason: "بيانات غير صحيحة" }, { status: 400, headers: noStore });
  const product = await dbStore.getProduct(productId);
  if (!product || product.status !== "active") return NextResponse.json({ valid: false, reason: "المنتج غير متاح" }, { status: 404, headers: noStore });

  const offer = typeof body?.offer_id === "string" ? (product.offers || []).find((o) => o.id === body.offer_id) : undefined;
  const base = Number(product.base_price);
  const subtotal = offer ? Number(offer.price) : base;
  if (!Number.isFinite(subtotal) || subtotal <= 0) return NextResponse.json({ valid: false, reason: "تعذر حساب السعر" }, { status: 400, headers: noStore });

  const settings = await dbStore.getSettings();
  const cfg = sanitizeShipping(settings.shipping_config);
  const all = sanitizeCoupons(settings.coupons);
  const ctx = { subtotal, quantity: offer ? Number(offer.quantity) || 1 : 1, productId: product.id, usage: ((settings as any).coupon_usage || {}) as Record<string, number> };
  const typed = typeof body?.code === "string" && body.code.trim() !== "";
  // a typed code is checked as typed; with no code the automatic discount (if any) is what the order would get
  const c = typed ? applyCoupon(all, body.code, ctx) : bestAutoCoupon(all, ctx);
  const discount = c.ok ? c.discount : 0;
  const after = subtotal - discount;
  const shipping = c.ok && c.free_shipping ? 0 : computeShipping(cfg, { total: after, productId: product.id, offerFree: Boolean(offer?.free_shipping), governorate: typeof body?.governorate === "string" ? body.governorate : undefined });
  return NextResponse.json(
    {
      valid: c.ok,
      auto: Boolean(c.auto),
      code: c.ok ? c.code : undefined,
      free_shipping: Boolean(c.ok && c.free_shipping),
      discount,
      shipping,
      final: after + shipping,
      reason: c.ok || !typed ? undefined : c.reason || "الكوبون ده مش صحيح أو منتهي",
    },
    { headers: noStore }
  );
}
