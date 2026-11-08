import { z } from "zod";

// Egyptian phone regex: handles 010, 011, 012, 015 with optional +20 or 002 prefix
export const egyptianPhoneRegex = /^(?:\+20|002)?01[0125][0-9]{8}$/;

export const orderFormSchema = z.object({
  customer_name: z
    .string()
    .min(2, "يرجى كتابة الاسم بالكامل")
    .max(100, "الاسم طويل جداً"),
  customer_phone: z
    .string()
    .min(10, "رقم الهاتف غير مكتمل")
    .regex(egyptianPhoneRegex, "يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678)"),
  customer_phone2: z
    .string()
    .nullish(),
  governorate: z
    .string()
    .nullish(),
  shipping_governorate: z
    .string()
    .nullish(),
  city: z
    .string()
    .nullish(),
  shipping_city: z
    .string()
    .nullish(),
  address: z
    .string()
    .nullish(),
  shipping_address: z
    .string()
    .nullish(),
  notes: z
    .string()
    .nullish(),
  customer_notes: z
    .string()
    .nullish(),
  
  // Selection
  product_id: z.string().min(1, "معرف المنتج مطلوب"),
  landing_page_slug: z.string().min(1, "معرف صفحة الهبوط مطلوب"),
  offer_id: z.string().nullish(),
  quantity: z.number().int().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  
  // Payment method
  payment_method: z.enum(["cod", "safqa", "card"]).default("cod"),
  
  // Tracking metadata
  utm_source: z.string().nullish(),
  utm_medium: z.string().nullish(),
  utm_campaign: z.string().nullish(),
  utm_content: z.string().nullish(),
  utm_term: z.string().nullish(),
  referrer: z.string().nullish(),
  fbp: z.string().nullish(),
  fbc: z.string().nullish(),
  event_id: z.string().nullish(),
});

export type OrderFormInput = z.infer<typeof orderFormSchema>;
