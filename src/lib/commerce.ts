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
  /** The code the customer types. For an automatic discount it is just the internal name. */
  code: string;
  /** "discount" takes money off; "free_shipping" removes the shipping fee. */
  kind: "discount" | "free_shipping";
  type: "fixed" | "percent";
  value: number;
  /** Applied without a code when the conditions are met. */
  auto: boolean;
  /** The order total must reach this for the coupon to apply. 0 = no minimum. */
  min_order: number;
  /** The quantity of items must reach this. 0 = no minimum. */
  min_qty: number;
  /** Only these products. Empty = every product. */
  product_ids: string[];
  /** Total number of orders that may use it. 0 = unlimited. */
  max_uses: number;
  /** "YYYY-MM-DD" (Egypt time). Empty = no limit. */
  starts_at: string;
  ends_at: string;
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

const day = (v: unknown): string => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.trim()) ? v.trim() : "");

export function sanitizeCoupons(input: unknown): Coupon[] {
  const out: Coupon[] = [];
  for (const c of (Array.isArray(input) ? input : []).slice(0, 30)) {
    const code = normalizeCouponCode(c?.code);
    if (!/^[A-Z0-9_-]{2,20}$/.test(code) || out.some((x) => x.code === code)) continue;
    const kind = c?.kind === "free_shipping" ? "free_shipping" : "discount";
    const type = c?.type === "percent" ? "percent" : "fixed";
    let value = money(c?.value, 100000);
    if (type === "percent") value = Math.min(100, value);
    if (kind === "discount" && value <= 0) continue;
    const ids = (Array.isArray(c?.product_ids) ? c.product_ids : []).filter((x: unknown) => typeof x === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(x)).slice(0, 100);
    out.push({
      code,
      kind,
      type,
      value: kind === "free_shipping" ? 0 : value,
      auto: Boolean(c?.auto),
      min_order: money(c?.min_order),
      min_qty: money(c?.min_qty, 1000),
      product_ids: Array.from(new Set<string>(ids)),
      max_uses: money(c?.max_uses, 10_000_000),
      starts_at: day(c?.starts_at),
      ends_at: day(c?.ends_at),
      enabled: c?.enabled !== false,
    });
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
  /** The coupon removes the shipping fee. */
  free_shipping?: boolean;
  code?: string;
  /** Applied automatically (no code typed). */
  auto?: boolean;
  /** Arabic reason shown to the customer when not ok. */
  reason?: string;
}

export interface CouponContext {
  /** Order total before shipping and before the coupon. */
  subtotal: number;
  quantity?: number;
  productId?: string;
  /** Orders that already used each code. */
  usage?: Record<string, number>;
  now?: number;
}

const EGYPT = "+02:00";

function evaluate(c: Coupon, ctx: CouponContext): CouponResult {
  const now = ctx.now ?? Date.now();
  if (!c.enabled) return { ok: false, discount: 0, reason: "الكوبون ده مش صحيح أو منتهي" };
  if (c.starts_at && now < Date.parse(`${c.starts_at}T00:00:00.000${EGYPT}`)) return { ok: false, discount: 0, reason: "الكوبون ده لسه مابدأش" };
  if (c.ends_at && now > Date.parse(`${c.ends_at}T23:59:59.999${EGYPT}`)) return { ok: false, discount: 0, reason: "الكوبون ده انتهى" };
  if (c.max_uses > 0 && (ctx.usage?.[c.code] || 0) >= c.max_uses) return { ok: false, discount: 0, reason: "الكوبون ده خلص عدد مرات استخدامه" };
  if (c.product_ids.length > 0 && !(ctx.productId && c.product_ids.includes(ctx.productId))) {
    return { ok: false, discount: 0, reason: "الكوبون ده مش على المنتج ده" };
  }
  if (c.min_order > 0 && ctx.subtotal < c.min_order) return { ok: false, discount: 0, reason: `الكوبون ده للطلبات من ${c.min_order} ج.م وأكتر` };
  if (c.min_qty > 0 && (ctx.quantity ?? 1) < c.min_qty) return { ok: false, discount: 0, reason: `الكوبون ده لو طلبت ${c.min_qty} قطع أو أكتر` };
  if (c.kind === "free_shipping") return { ok: true, discount: 0, free_shipping: true, code: c.code };
  const raw = c.type === "percent" ? Math.round((ctx.subtotal * c.value) / 100) : c.value;
  const discount = Math.max(0, Math.min(Math.round(ctx.subtotal), raw));
  return { ok: discount > 0, discount, code: c.code };
}

/** One coupon the customer typed. `ctx` may also be just the subtotal (older callers). */
export function applyCoupon(coupons: Coupon[] | undefined, rawCode: unknown, ctx: CouponContext | number): CouponResult {
  const code = normalizeCouponCode(rawCode);
  if (!code) return { ok: false, discount: 0 };
  const c = (coupons || []).find((x) => x.code === code);
  if (!c) return { ok: false, discount: 0, reason: "الكوبون ده مش صحيح أو منتهي" };
  return evaluate(c, typeof ctx === "number" ? { subtotal: ctx } : ctx);
}

/** The best automatic coupon whose conditions are met (the biggest discount; free shipping when nothing takes money off). */
export function bestAutoCoupon(coupons: Coupon[] | undefined, ctx: CouponContext): CouponResult {
  let best: CouponResult = { ok: false, discount: 0 };
  for (const c of coupons || []) {
    if (!c.auto) continue;
    const r = evaluate(c, ctx);
    if (!r.ok) continue;
    if (!best.ok || r.discount > best.discount) best = { ...r, auto: true };
  }
  return best;
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
  /** There is at least one active automatic discount (the checkout asks the server for it). */
  has_auto?: boolean;
  popup?: PopupConfig;
  downsell?: { code: string; message: string; delay_seconds: number; on_exit: boolean; auto: boolean };
}

/** What the browser may know: fees, the popup, and ONLY the downsell coupon code (never the full coupon list). */
export function publicCommerce(s: any): PublicCommerce {
  const shipping = sanitizeShipping(s?.shipping_config);
  const out: PublicCommerce = { shipping };
  if (sanitizeCoupons(s?.coupons).some((c) => c.auto && c.enabled)) out.has_auto = true;
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
