import { z } from "zod";

// Canonical Egyptian mobile number as stored: 01XXXXXXXXX (010, 011, 012, 015)
export const egyptianPhoneRegex = /^01[0125][0-9]{8}$/;

/**
 * Normalizes an Egyptian mobile number to 01XXXXXXXXX.
 * Strips spaces / dashes / dots / parentheses, converts Arabic-Indic digits,
 * and accepts +20 / 0020 / 20 country prefixes (with or without the leading 0 after them).
 * Returns null when the result is not a valid Egyptian mobile number.
 */
export function normalizeEgyptianPhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let s = raw
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\s\-.()‎‏]/g, "");

  if (s.startsWith("+20")) s = s.slice(3);
  else if (s.startsWith("0020")) s = s.slice(4);
  else if (s.startsWith("20") && s.length >= 12) s = s.slice(2);

  if (/^1[0-9]{9}$/.test(s)) s = `0${s}`;
  return egyptianPhoneRegex.test(s) ? s : null;
}

const PHONE_ERROR = "يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678)";

/** Optional free-text field: trimmed, length-capped, empty → undefined. */
const optionalText = (max: number, tooLong: string) =>
  z
    .string()
    .trim()
    .max(max, tooLong)
    .nullish()
    .transform((v) => v || undefined);

/**
 * Tracking metadata must never cost us an order: wrong types are ignored,
 * over-long values are truncated (or dropped when a truncated value would be meaningless).
 */
const trackingText = (max: number, onTooLong: "truncate" | "drop") =>
  z.unknown().transform((v): string | undefined => {
    if (typeof v !== "string") return undefined;
    const s = v.trim();
    if (!s) return undefined;
    if (s.length <= max) return s;
    return onTooLong === "truncate" ? s.slice(0, max) : undefined;
  });

export const orderFormSchema = z
  .object({
    customer_name: z
      .string()
      .trim()
      .min(2, "يرجى كتابة الاسم بالكامل")
      .max(100, "الاسم طويل جداً"),
    customer_phone: z
      .string()
      .max(20, PHONE_ERROR)
      .transform((v, ctx) => {
        const normalized = normalizeEgyptianPhone(v);
        if (!normalized) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: PHONE_ERROR });
          return z.NEVER;
        }
        return normalized;
      }),
    customer_phone2: z
      .string()
      .max(20, "رقم الهاتف الإضافي غير صحيح")
      .nullish()
      .transform((v, ctx) => {
        if (!v || !v.trim()) return undefined;
        const normalized = normalizeEgyptianPhone(v);
        if (!normalized) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "رقم الهاتف الإضافي غير صحيح" });
          return z.NEVER;
        }
        return normalized;
      }),
    governorate: optionalText(100, "اسم المحافظة طويل جداً"),
    shipping_governorate: optionalText(100, "اسم المحافظة طويل جداً"),
    city: optionalText(100, "اسم المدينة طويل جداً"),
    shipping_city: optionalText(100, "اسم المدينة طويل جداً"),
    address: optionalText(300, "العنوان طويل جداً (الحد الأقصى 300 حرف)"),
    shipping_address: optionalText(300, "العنوان طويل جداً (الحد الأقصى 300 حرف)"),
    notes: optionalText(500, "الملاحظات طويلة جداً (الحد الأقصى 500 حرف)"),
    customer_notes: optionalText(500, "الملاحظات طويلة جداً (الحد الأقصى 500 حرف)"),

    // Selection
    product_id: z.string().trim().min(1, "معرف المنتج مطلوب").max(120, "معرف المنتج غير صالح"),
    landing_page_slug: z
      .string()
      .trim()
      .min(1, "معرف صفحة الهبوط مطلوب")
      .max(120, "معرف صفحة الهبوط غير صالح"),
    offer_id: optionalText(120, "العرض المختار غير متاح، يرجى تحديث الصفحة"),
    // With an offer the server takes the quantity from the offer; without one it must be 1..5 (see superRefine).
    quantity: z
      .number()
      .int("الكمية غير صالحة")
      .min(1, "الكمية يجب أن تكون 1 على الأقل")
      .max(1000, "الكمية غير صالحة"),

    // Payment method
    payment_method: z.enum(["cod", "safqa", "card", "vodafone_cash", "instapay"]).default("cod"),
    // Transfer reference the customer typed (manual methods only)
    payment_reference: trackingText(60, "truncate"),
    coupon_code: trackingText(20, "truncate"),

    // Tracking metadata (lenient)
    utm_source: trackingText(300, "truncate"),
    utm_medium: trackingText(300, "truncate"),
    utm_campaign: trackingText(300, "truncate"),
    utm_content: trackingText(300, "truncate"),
    utm_term: trackingText(300, "truncate"),
    referrer: trackingText(300, "truncate"),
    fbp: trackingText(200, "drop"),
    fbc: trackingText(500, "drop"),
    event_id: trackingText(200, "drop"),

    // Honeypot: hidden from humans, must stay empty. Handled by the route (no validation error on purpose).
    website: z.unknown().transform((v) => (typeof v === "string" ? v.trim() : "")),
  })
  .superRefine((data, ctx) => {
    const address = data.address || data.shipping_address || "";
    if (address.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["address"],
        message: "يرجى كتابة العنوان بالتفصيل (الشارع / المنطقة / رقم المنزل)",
      });
    }
    if (!data.offer_id && data.quantity > 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quantity"],
        message: "الحد الأقصى للكمية في الطلب الواحد 5 قطع",
      });
    }
  });

export type OrderFormInput = z.infer<typeof orderFormSchema>;
