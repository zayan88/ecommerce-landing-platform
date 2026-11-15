import type { Product, ProductOffer } from "@/types";

/** Default 1 / 2 / 3 piece tiers derived from the product price. Merchants edit them in the page editor. */
export function buildDefaultOffers(product: Pick<Product, "id" | "base_price" | "compare_at_price">): ProductOffer[] {
  const compare = product.compare_at_price || Math.round(product.base_price * 1.35);
  return [
    {
      id: `offer-1-${product.id}`,
      product_id: product.id,
      title_ar: "قطعة واحدة (تجربة)",
      quantity: 1,
      price: product.base_price,
      original_price: compare,
      discount_label: "خصم خاص",
      is_popular: false,
      free_shipping: true,
      sort_order: 1,
    },
    {
      id: `offer-2-${product.id}`,
      product_id: product.id,
      title_ar: "قطعتان (الأكثر طلباً - توفير إضافي)",
      quantity: 2,
      price: Math.round(product.base_price * 1.75),
      original_price: compare * 2,
      discount_label: "وفر أكثر + شحن مجاني",
      is_popular: true,
      free_shipping: true,
      sort_order: 2,
    },
    {
      id: `offer-3-${product.id}`,
      product_id: product.id,
      title_ar: "3 قطع (عرض التوفير العائلي الشامل)",
      quantity: 3,
      price: Math.round(product.base_price * 2.45),
      original_price: compare * 3,
      discount_label: "أعلى توفير + شحن مجاني",
      is_popular: false,
      free_shipping: true,
      sort_order: 3,
    },
  ];
}

/** Clean what the merchant typed before it is saved or previewed. */
export function sanitizeOffers(productId: string, offers: ProductOffer[]): ProductOffer[] {
  return offers
    .slice(0, 5)
    .map((o, i) => ({
      id: o.id || `offer-${i + 1}-${productId}`,
      product_id: productId,
      title_ar: String(o.title_ar || "").trim().slice(0, 80) || `${Math.max(1, Math.round(Number(o.quantity) || 1))} قطعة`,
      quantity: Math.min(20, Math.max(1, Math.round(Number(o.quantity) || 1))),
      price: Math.max(0, Math.round(Number(o.price) || 0)),
      original_price: o.original_price ? Math.max(0, Math.round(Number(o.original_price))) : undefined,
      discount_label: String(o.discount_label || "").trim().slice(0, 40) || undefined,
      is_popular: !!o.is_popular,
      free_shipping: !!o.free_shipping,
      sort_order: i + 1,
    }));
}
