/**
 * Shipping fee, minimum order, coupons, popup and downsell settings: shared by the server (the order route
 * is the only place that decides the real amount) and the checkout form (which only shows the same numbers).
 * Pure functions, no imports: edge-safe and usable from tests.
 */

export interface ShippingConfig {
  /** Fee charged per order when nothing else applies. 0 = free. */
  default_fee: number;
  /** Orders at or above this total (after the coupon) ship free. 0 = off. */
  free_over: number;
  /** Orders below this total are refused. 0 = off. */
  min_order: number;
  /** Per-product fee overrides (product id -> fee, 0 = free). A product not listed uses default_fee. */
  product_fees: Record<string, number>;
}

export const DEFAULT_SHIPPING: ShippingConfig = { default_fee: 0, free_over: 0, min_order: 0, product_fees: {} };

export interface Coupon {
  code: string;
  type: "fixed" | "percent";
  value: number;
  /** The order total must reach this for the coupon to apply. 0 = no minimum. */
  min_order: number;
  enabled: boolean;
}

export interface PopupConfig {
  enabled: boolean;
  title: string;
  body: string;
  button_text: string;
  /** "checkout" scrolls to the order form, "close" just closes. */
  button_target: "checkout" | "close";
  delay_seconds: number;
  image_url: string;
  /** "session": at most once per browser session; "always": on every page load. */
  frequency: "session" | "always";
}

export interface DownsellConfig {
  /** Show the coupon when the visitor moves to leave (desktop: mouse leaves the top; mobile: tab hidden is not used). */
  on_exit: boolean;
  /** Show the coupon automatically after `delay_seconds`. */
  auto: boolean;
  delay_seconds: number;
  /** Code of one of the merchant's coupons. */
  coupon_code: string;
  message: string;
}

const money = (n: unknown, max = 1_000_000): number => {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.min(max, Math.max(0, v)) : 0;
};

export function sanitizeShipping(input: unknown): ShippingConfig {
  const i = input && typeof input === "object" ? (input as Record<string, any>) : {};
  const fees: Record<string, number> = {};
  const raw = i.product_fees && typeof i.product_fees === "object" && !Array.isArray(i.product_fees) ? (i.product_fees as Record<string, unknown>) : {};
  for (const [id, fee] of Object.entries(raw).slice(0, 300)) {
    if (/^[A-Za-z0-9_-]{1,80}$/.test(id) && fee !== null && fee !== "" && Number.isFinite(Number(fee))) fees[id] = money(fee, 100000);
  }
  return { default_fee: money(i.default_fee, 100000), free_over: money(i.free_over), min_order: money(i.min_order), product_fees: fees };
}

export function normalizeCouponCode(v: unknown): string {
  return typeof v === "string" ? v.trim().toUpperCase().slice(0, 20) : "";
}

export function sanitizeCoupons(input: unknown): Coupon[] {
  const out: Coupon[] = [];
  for (const c of (Array.isArray(input) ? input : []).slice(0, 30)) {
    const code = normalizeCouponCode(c?.code);
    if (!/^[A-Z0-9_-]{2,20}$/.test(code) || out.some((x) => x.code === code)) continue;
    const type = c?.type === "percent" ? "percent" : "fixed";
    let value = money(c?.value, 100000);
    if (type === "percent") value = Math.min(100, value);
    if (value <= 0) continue;
    out.push({ code, type, value, min_order: money(c?.min_order), enabled: c?.enabled !== false });
  }
  return out;
}

const clean = (v: unknown, max: number): string =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";

const safeImage = (v: unknown): string => {
  const s = typeof v === "string" ? v.trim().slice(0, 500) : "";
  return /^https?:\/\/[^\s"'<>]+$/i.test(s) || /^\/[^\s"'<>]*$/.test(s) ? s : "";
};

export function sanitizePopup(input: unknown): PopupConfig {
  const i = input && typeof input === "object" ? (input as Record<string, any>) : {};
  return {
    enabled: Boolean(i.enabled),
    title: clean(i.title, 80),
    body: clean(i.body, 300),
    button_text: clean(i.button_text, 30) || "اطلب دلوقتي",
    button_target: i.button_target === "close" ? "close" : "checkout",
    delay_seconds: Math.min(300, money(i.delay_seconds, 300)),
    image_url: safeImage(i.image_url),
    frequency: i.frequency === "always" ? "always" : "session",
  };
}

export function sanitizeDownsell(input: unknown, coupons: Coupon[]): DownsellConfig {
  const i = input && typeof input === "object" ? (input as Record<string, any>) : {};
  const code = normalizeCouponCode(i.coupon_code);
  return {
    on_exit: Boolean(i.on_exit),
    auto: Boolean(i.auto),
    delay_seconds: Math.max(1, Math.min(300, money(i.delay_seconds, 300) || 30)),
    coupon_code: coupons.some((c) => c.code === code) ? code : "",
    message: clean(i.message, 200),
  };
}

export interface CouponResult {
  ok: boolean;
  discount: number;
  code?: string;
  /** Arabic reason shown to the customer when not ok. */
  reason?: string;
}

/** Discount of a coupon for an order of `subtotal` (before shipping). Never more than the subtotal. */
export function applyCoupon(coupons: Coupon[] | undefined, rawCode: unknown, subtotal: number): CouponResult {
  const code = normalizeCouponCode(rawCode);
  if (!code) return { ok: false, discount: 0 };
  const c = (coupons || []).find((x) => x.code === code);
  if (!c || !c.enabled) return { ok: false, discount: 0, reason: "الكوبون ده مش صحيح أو منتهي" };
  if (c.min_order > 0 && subtotal < c.min_order) {
    return { ok: false, discount: 0, reason: `الكوبون ده للطلبات من ${c.min_order} ج.م وأكتر` };
  }
  const raw = c.type === "percent" ? Math.round((subtotal * c.value) / 100) : c.value;
  const discount = Math.max(0, Math.min(Math.round(subtotal), raw));
  return { ok: discount > 0, discount, code: c.code };
}

/** The shipping fee of an order. `total` is the order total after the coupon, before shipping. */
export function computeShipping(cfg: ShippingConfig, opts: { total: number; productId: string; offerFree?: boolean }): number {
  if (opts.offerFree) return 0;
  if (cfg.free_over > 0 && opts.total >= cfg.free_over) return 0;
  const override = cfg.product_fees[opts.productId];
  return Number.isFinite(override) ? override : cfg.default_fee;
}

/** Short customer-facing text for "how much is shipping" (used where pages used to say "free shipping"). */
export function shippingHint(cfg: ShippingConfig): { free: boolean; text: string } {
  const anyPaid = cfg.default_fee > 0 || Object.values(cfg.product_fees).some((f) => f > 0);
  if (!anyPaid) return { free: true, text: "شحن مجاني" };
  if (cfg.free_over > 0) return { free: false, text: `شحن مجاني للطلبات من ${cfg.free_over} ج.م` };
  return { free: false, text: "الشحن لكل المحافظات" };
}

export interface PublicCommerce {
  shipping: ShippingConfig;
  popup?: PopupConfig;
  downsell?: { code: string; message: string; delay_seconds: number; on_exit: boolean; auto: boolean };
}

/** What the browser may know: fees, the popup, and ONLY the downsell coupon code (never the full coupon list). */
export function publicCommerce(s: any): PublicCommerce {
  const shipping = sanitizeShipping(s?.shipping_config);
  const out: PublicCommerce = { shipping };
  const popup = s?.popup ? sanitizePopup(s.popup) : null;
  if (popup && popup.enabled && (popup.title || popup.body)) out.popup = popup;
  const coupons = sanitizeCoupons(s?.coupons);
  const d = s?.downsell ? sanitizeDownsell(s.downsell, coupons) : null;
  const coupon = d ? coupons.find((c) => c.code === d.coupon_code) : undefined;
  if (d && coupon && coupon.enabled && (d.on_exit || d.auto)) {
    out.downsell = { code: coupon.code, message: d.message, delay_seconds: d.delay_seconds, on_exit: d.on_exit, auto: d.auto };
  }
  return out;
}
