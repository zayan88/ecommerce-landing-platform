import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";
import { applyCoupon, computeShipping, sanitizeCoupons, sanitizeShipping } from "@/lib/commerce";

export const runtime = "edge";

/**
 * Public: does this coupon work for this product/offer, and what would the order total be?
 * The browser sends ids only (never an amount); the same rules decide the real order in /api/orders.
 * It never reveals other coupons: it answers for the one code that was sent.
 */
const noStore = { "Cache-Control": "no-store" };

export async function POST(req: NextRequest) {
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
  const c = applyCoupon(sanitizeCoupons(settings.coupons), body?.code, subtotal);
  const after = subtotal - (c.ok ? c.discount : 0);
  const shipping = computeShipping(cfg, { total: after, productId: product.id, offerFree: Boolean(offer?.free_shipping) });
  return NextResponse.json(
    { valid: c.ok, discount: c.ok ? c.discount : 0, shipping, final: after + shipping, reason: c.ok ? undefined : c.reason || "الكوبون ده مش صحيح أو منتهي" },
    { headers: noStore }
  );
}
