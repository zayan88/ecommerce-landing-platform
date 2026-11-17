/**
 * AI-written product description (copy / paste, no AI key in the store): the merchant copies a ready prompt into
 * ChatGPT / Claude and pastes the plain-text answer back into the description box. Pure helpers (edge-safe, testable).
 */

export interface DescriptionPromptInput {
  title: string;
  /** What the merchant already wrote in the description box: specs, use, anything real about the product. */
  notes: string;
  price?: number;
  brandName?: string;
}

const MAX_NOTES = 3000;
export const DESCRIPTION_MAX = 3000;

export function buildDescriptionPrompt(i: DescriptionPromptInput): string {
  const notes = (i.notes || "").trim().slice(0, MAX_NOTES);
  return [
    "أنت كاتب إعلانات (Copywriter) محترف لمتاجر الدفع عند الاستلام في مصر.",
    "اكتب وصف المنتج التالي ليظهر في صفحة المنتج.",
    "",
    `اسم المنتج: ${(i.title || "").trim() || "(اكتب اسم المنتج)"}`,
    i.price && i.price > 0 ? `السعر: ${i.price} جنيه` : "",
    i.brandName ? `اسم المتجر: ${i.brandName}` : "",
    "معلومات المنتج من التاجر (اعتمد عليها فقط):",
    notes || "(مفيش معلومات، اكتب وصف عام مناسب للاسم وبدون مواصفات رقمية)",
    "",
    "الشروط:",
    "- اللغة: عربي مصري بسيط ومحترم، بنبرة واثقة ومقنعة وخفيفة.",
    "- السطر الأول: جملة قوية تقول أكبر فايدة للعميل.",
    "- بعدها من 4 لـ 6 نقاط قصيرة، كل نقطة في سطر وتبدأ بـ ✅ وتشرح ميزة حقيقية.",
    "- في الآخر سطر واحد عن طريقة الاستخدام أو لمين المنتج مناسب.",
    "- ممنوع تخترع مواصفات أو أرقام أو شهادات أو نتائج مش موجودة في المعلومات فوق.",
    "- ممنوع وعود طبية أو مبالغات غير حقيقية.",
    "- الطول الإجمالي أقل من 900 حرف.",
    "- رد بالنص النهائي فقط، نص عادي بدون عناوين وبدون علامات تنسيق (مفيش ** ولا # ولا جداول) وبدون أي شرح قبله أو بعده.",
  ]
    .filter((l) => l !== "")
    .join("\n");
}

/** The AI's answer → plain text for the description box: strips code fences / markdown marks, keeps the lines. */
export function cleanAiDescription(raw: string): string {
  let t = String(raw || "").replace(/\r\n/g, "\n");
  t = t.replace(/```[a-zA-Z]*\n?/g, "").replace(/```/g, "");
  t = t
    .split("\n")
    .map((line) =>
      line
        .replace(/^\s{0,3}#{1,6}\s*/, "") // headings
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/__(.+?)__/g, "$1")
        .replace(/^\s*[-*•]\s+/, "✅ ") // plain bullets become the ✅ style
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
        .trimEnd()
    )
    .join("\n");
  t = t.replace(/\n{3,}/g, "\n\n").trim();
  return t.slice(0, DESCRIPTION_MAX);
}
