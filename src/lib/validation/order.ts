import { z } from "zod";

// Egyptian phone regex: handles 010, 011, 012, 015 with optional +20 or 002 prefix
export const egyptianPhoneRegex = /^(?:\+20|002)?01[0125][0-9]{8}$/;

export const orderFormSchema = z.object({
  customer_name: z
    .string()
    .min(3, "يرجى كتابة الاسم بالكامل (3 أحرف على الأقل)")
    .max(100, "الاسم طويل جداً"),
  customer_phone: z
    .string()
    .min(10, "رقم الهاتف غير مكتمل")
    .regex(egyptianPhoneRegex, "يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678)"),
  customer_phone2: z
    .string()
    .optional()
    .refine((val) => !val || egyptianPhoneRegex.test(val), {
      message: "رقم الهاتف البديل يجب أن يكون رقم مصري صحيح",
    }),
  governorate: z
    .string()
    .min(2, "يرجى اختيار المحافظة"),
  city: z
    .string()
    .optional(),
  address: z
    .string()
    .min(5, "يرجى كتابة العنوان بالتفصيل (اسم الشارع، رقم العمارة، رقم الشقة)")
    .max(300, "العنوان طويل جداً"),
  notes: z
    .string()
    .max(500, "الملاحظات لا يجب أن تتجاوز 500 حرف")
    .optional(),
  
  // Selection
  product_id: z.string().min(1, "معرف المنتج مطلوب"),
  landing_page_slug: z.string().min(1, "معرف صفحة الهبوط مطلوب"),
  offer_id: z.string().optional(),
  quantity: z.number().int().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  
  // Payment method
  payment_method: z.enum(["cod", "safqa", "card"]).default("cod"),
  
  // Tracking metadata
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
  referrer: z.string().optional(),
  fbp: z.string().optional(),
  fbc: z.string().optional(),
  event_id: z.string().optional(),
});

export type OrderFormInput = z.infer<typeof orderFormSchema>;
