/**
 * AI-written product content (copy / paste, no AI key in the store): the merchant copies a ready prompt into
 * ChatGPT / Claude and pastes the answer back. One answer fills the product's title, its description AND the
 * questions & answers the store chat uses. Pure helpers (edge-safe, testable).
 */

export interface DescriptionPromptInput {
  title: string;
  /** What the merchant already wrote in the description box: specs, use, anything real about the product. */
  notes: string;
  price?: number;
  brandName?: string;
}

export interface AiFaqItem {
  q: string;
  keywords: string;
  answer: string;
}

export interface AiProductContent {
  /** "" when the answer had no title (the current title is kept). */
  title: string;
  description: string;
  faq: AiFaqItem[];
}

const MAX_NOTES = 3000;
export const DESCRIPTION_MAX = 3000;
export const AI_TITLE_MAX = 120;
export const AI_FAQ_Q_MAX = 80;
export const AI_FAQ_A_MAX = 600;
export const AI_FAQ_MAX = 15;

export function buildDescriptionPrompt(i: DescriptionPromptInput): string {
  const notes = (i.notes || "").trim().slice(0, MAX_NOTES);
  return [
    "أنت كاتب إعلانات (Copywriter) محترف لمتاجر الدفع عند الاستلام في مصر.",
    "اكتب محتوى صفحة المنتج التالي: العنوان والوصف وأسئلة وأجوبة يرد بيها الشات على العملاء.",
    "",
    `اسم المنتج الحالي: ${(i.title || "").trim() || "(اكتب اسم المنتج)"}`,
    i.price && i.price > 0 ? `السعر: ${i.price} جنيه` : "",
    i.brandName ? `اسم المتجر: ${i.brandName}` : "",
    "معلومات المنتج من التاجر (اعتمد عليها فقط):",
    notes || "(مفيش معلومات، اكتب محتوى عام مناسب للاسم وبدون مواصفات رقمية)",
    "",
    "الشروط:",
    "- اللغة: عربي مصري بسيط ومحترم، بنبرة واثقة ومقنعة وخفيفة.",
    "- العنوان: اسم تجاري قصير وواضح للمنتج (أقل من 70 حرف)، بدون مبالغات.",
    "- الوصف: السطر الأول جملة قوية تقول أكبر فايدة للعميل، بعدها 4 لـ 6 نقاط قصيرة كل نقطة في سطر وتبدأ بـ ✅ وتشرح ميزة حقيقية، وفي الآخر سطر عن طريقة الاستخدام أو لمين المنتج مناسب. أقل من 900 حرف.",
    "- الأسئلة: من 6 لـ 8 أسئلة بيسألها العملاء فعلاً عن المنتج (الاستخدام، المقاس أو الحجم، البطارية أو الطاقة، الصيانة، التركيب، لمين مناسب، إلخ). كل سؤال أقل من 80 حرف، وإجابته من جملة لجملتين (أقل من 250 حرف).",
    "- ممنوع تخترع مواصفات أو أرقام أو شهادات أو نتائج مش موجودة في المعلومات فوق. لو معلومة مش موجودة، متكتبش سؤال عنها.",
    "- متتكلمش عن الشحن أو الضمان أو الاسترجاع أو الدفع، التاجر بيحددهم لوحده.",
    "- ممنوع وعود طبية أو مبالغات غير حقيقية.",
    "- رد بالشكل ده بالظبط، نص عادي بدون علامات تنسيق (مفيش ** ولا # ولا جداول) وبدون أي شرح قبله أو بعده:",
    "",
    "العنوان: (العنوان هنا)",
    "الوصف:",
    "(الجملة القوية)",
    "✅ (ميزة)",
    "✅ (ميزة)",
    "(سطر الاستخدام)",
    "الأسئلة:",
    "س: (السؤال)",
    "كلمات: (كلمتين لتلات كلمات مفتاحية مفصولة بفاصلة)",
    "ج: (الإجابة)",
    "س: (السؤال)",
    "كلمات: (...)",
    "ج: (الإجابة)",
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

const LEAD = String.raw`^\s*(?:[0-9٠-٩]+\s*[.)\-]\s*)?`; // optional "1." / "١)" numbering
const RE_TITLE = new RegExp(LEAD + String.raw`(?:العنوان|عنوان المنتج|Title)\s*[:：]\s*(.*)$`, "i");
const RE_DESC = new RegExp(LEAD + String.raw`(?:الوصف|وصف المنتج|Description)\s*[:：]\s*(.*)$`, "i");
const RE_FAQ_HEAD = new RegExp(LEAD + String.raw`(?:الأسئلة(?:\s*و\s*الأجوبة)?|اسئلة|أسئلة(?:\s*و\s*أجوبة)?|FAQ|Q&A)\s*[:：]?\s*$`, "i");
const RE_Q = new RegExp(LEAD + String.raw`(?:س|سؤال|Q)\s*[:：\-]\s*(.*)$`, "i");
const RE_K = new RegExp(LEAD + String.raw`(?:كلمات(?:\s*مفتاحية)?|الكلمات\s*المفتاحية|Keywords?)\s*[:：]\s*(.*)$`, "i");
const RE_A = new RegExp(LEAD + String.raw`(?:ج|جواب|إجابة|الإجابة|A)\s*[:：\-]\s*(.*)$`, "i");

const unmark = (line: string) =>
  line
    .replace(/^\s{0,3}#{1,6}\s*/, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trimEnd();

/**
 * The AI's answer → title + description + chat Q&A. An answer without the "العنوان: / الوصف: / الأسئلة:" markers is
 * treated as a plain description (the old behaviour), so a free-form reply still works.
 */
export function parseAiProduct(raw: string): AiProductContent {
  const text = String(raw || "").replace(/\r\n/g, "\n").replace(/```[a-zA-Z]*\n?/g, "").replace(/```/g, "");
  const lines = text.split("\n").map(unmark);

  let mode: "none" | "title" | "desc" | "faq" = "none";
  let sawMarker = false;
  let title = "";
  const desc: string[] = [];
  const faq: AiFaqItem[] = [];
  let cur: AiFaqItem | null = null;
  let field: "q" | "k" | "a" = "q";
  const push = () => {
    if (cur && cur.q.trim() && cur.answer.trim()) faq.push(cur);
    cur = null;
  };

  for (const line of lines) {
    let m: RegExpMatchArray | null;
    if (mode !== "faq" && (m = line.match(RE_TITLE))) {
      sawMarker = true;
      mode = "title";
      title = m[1].trim();
      continue;
    }
    if (mode !== "faq" && (m = line.match(RE_DESC))) {
      sawMarker = true;
      mode = "desc";
      if (m[1].trim()) desc.push(m[1].trim());
      continue;
    }
    if (RE_FAQ_HEAD.test(line)) {
      sawMarker = true;
      push();
      mode = "faq";
      continue;
    }
    if (mode === "faq" || (!sawMarker && RE_Q.test(line))) {
      if ((m = line.match(RE_Q))) {
        sawMarker = true;
        mode = "faq";
        push();
        cur = { q: m[1].trim(), keywords: "", answer: "" };
        field = "q";
        continue;
      }
      if (cur && (m = line.match(RE_K))) {
        cur.keywords = m[1].trim();
        field = "k";
        continue;
      }
      if (cur && (m = line.match(RE_A))) {
        cur.answer = m[1].trim();
        field = "a";
        continue;
      }
      if (cur && line.trim()) {
        // continuation line of the current field
        if (field === "a") cur.answer = (cur.answer + " " + line.trim()).trim();
        else if (field === "q") cur.q = (cur.q + " " + line.trim()).trim();
        continue;
      }
      continue;
    }
    if (mode === "desc") desc.push(line);
    else if (mode === "title" && line.trim() && !title) title = line.trim();
  }
  push();

  if (!sawMarker) return { title: "", description: cleanAiDescription(text), faq: [] };

  const seen = new Set<string>();
  const items: AiFaqItem[] = [];
  for (const f of faq) {
    const q = f.q.replace(/\s+/g, " ").trim().slice(0, AI_FAQ_Q_MAX);
    const answer = f.answer.replace(/\s+/g, " ").trim().slice(0, AI_FAQ_A_MAX);
    if (!q || !answer || seen.has(q)) continue;
    seen.add(q);
    const keywords = f.keywords
      .split(/[,،;؛]/)
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 6)
      .join("، ");
    items.push({ q, keywords, answer });
    if (items.length >= AI_FAQ_MAX) break;
  }

  return {
    title: title.replace(/\s+/g, " ").trim().slice(0, AI_TITLE_MAX),
    description: cleanAiDescription(desc.join("\n")),
    faq: items,
  };
}
