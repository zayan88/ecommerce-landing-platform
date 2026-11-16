import type { LandingPageContentConfig } from "@/types";
import { PALETTE_KEYS, isThemeColor } from "@/lib/palettes";

/**
 * AI-assisted page content: the merchant copies a prompt into any AI chat, pastes the JSON
 * answer back. We never accept raw HTML/code — only whitelisted JSON fields, sanitized here.
 * Reviews are requested as paraphrased real opinions about similar products found online;
 * rating/count numbers (proof_rating, proof_reviews_count) stay out of the schema.
 */

const STR_MAX = 300;
const LIST_MAX = 8;

type Kind = "str" | "strlist";
const FIELDS: Record<string, { kind: Kind; hint: string }> = {
  announcement_bar: { kind: "str", hint: "شريط إعلان قصير أعلى الصفحة (عرض/شحن مجاني)" },
  hero_headline: { kind: "str", hint: "العنوان الرئيسي: الفائدة الأكبر في جملة واحدة قوية" },
  hero_subheadline: { kind: "str", hint: "عنوان فرعي يشرح الفكرة في سطرين كحد أقصى" },
  hero_badge: { kind: "str", hint: "شارة صغيرة بجوار الصورة (بدون أرقام تقييم مخترعة)" },
  hero_bullets: { kind: "strlist", hint: "4 إلى 6 مميزات قصيرة للمنتج" },
  comparison_badge: { kind: "str", hint: "شارة قسم المقارنة" },
  comparison_title: { kind: "str", hint: "عنوان قسم المقارنة" },
  comparison_old_title: { kind: "str", hint: "عنوان البدائل التقليدية" },
  comparison_old_points: { kind: "strlist", hint: "عيوب البدائل التقليدية" },
  comparison_new_title: { kind: "str", hint: "عنوان منتجنا" },
  comparison_new_points: { kind: "strlist", hint: "مميزات منتجنا مقابل العيوب" },
  box_title: { kind: "str", hint: "عنوان محتويات الشحنة" },
  box_items: { kind: "strlist", hint: "ما يوجد داخل العلبة" },
  how_to_use_title: { kind: "str", hint: "عنوان طريقة الاستخدام" },
  faq_title: { kind: "str", hint: "عنوان الأسئلة الشائعة" },
  guarantees_title: { kind: "str", hint: "عنوان الضمانات" },
  proof_statements: { kind: "strlist", hint: "3 جمل ثقة قصيرة (الدفع عند الاستلام، فتح الشحنة...)" },
};

function clean(v: unknown, max = STR_MAX): string {
  if (typeof v !== "string") return "";
  return v.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => clean(x)).filter(Boolean).slice(0, LIST_MAX);
}

export function buildAiPrompt(input: { title: string; description: string; brandName: string }): string {
  const lines = Object.entries(FIELDS).map(([k, f]) => `  "${k}": ${f.kind === "strlist" ? '["..."]' : '"..."'}   // ${f.hint}`);
  return `أنت كاتب إعلانات (Direct Response) متخصص في السوق المصري والدفع عند الاستلام.
اكتب محتوى صفحة هبوط لمنتج "${input.title}" لمتجر "${input.brandName}".

معلومات المنتج (اعتمد عليها فقط ولا تخترع مواصفات أو أرقام أو شهادات):
${input.description.trim() || "(لم يضف التاجر وصفاً — اكتب بشكل عام وآمن بدون ادعاءات)"}

القواعد:
- لهجة مصرية ودودة وواثقة، جمل قصيرة.
- ممنوع اختراع نسب أو ضمانات أو مواصفات غير مذكورة.
- آراء العملاء: ابحث على الإنترنت (أمازون، نون، جوميا، فيسبوك، يوتيوب) عن آراء حقيقية لمنتجات مشابهة أو نفس المنتج، وأعد صياغة ما يقوله الناس فعلاً (المزايا المتكررة والعيوب الشائعة) بلهجة مصرية. لا تنسخ حرفياً، ولا تخترع رأياً لم يقله أحد. اكتب 3 إلى 6 آراء بالاسم الأول فقط والمحافظة إن وُجدت.
- ركز على: الدفع عند الاستلام، فتح الشحنة قبل الدفع، الشحن المجاني، ضمان الاستبدال.
- كل نص أقل من ${STR_MAX} حرف، وكل قائمة بحد أقصى ${LIST_MAX} عناصر.

أخرج JSON صالح فقط (بدون شرح وبدون HTML) بهذا الشكل بالضبط:
{
${lines.join(",\n")},
  "how_to_use_steps": [{"title": "...", "desc": "..."}],        // 3 خطوات
  "faq_items": [{"q": "...", "a": "..."}],                       // 4 أسئلة
  "guarantees": [{"icon": "inspect|swap|shipping", "title": "...", "desc": "..."}],  // 3 بالضبط
  "reviews_title": "...",
  "reviews": [{"name": "اسم أول", "location": "المحافظة", "comment": "...", "rating": 5}],   // آراء مشابهة من الويب (3-6)
  "theme_primary": "${PALETTE_KEYS[0]}",   // اختياري، من: ${PALETTE_KEYS.join(" | ")}
  "theme_accent": "${PALETTE_KEYS[0]}"     // اختياري، نفس القائمة
}`;
}

export interface AiParseResult {
  content: LandingPageContentConfig;
  applied: string[];
  error?: string;
}

/** Extract the first JSON object from a pasted AI answer (tolerates ``` fences and chatter). */
function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("no-json");
  return JSON.parse(body.slice(start, end + 1));
}

export function parseAiContent(text: string): AiParseResult {
  let raw: unknown;
  try {
    raw = extractJson(text);
  } catch {
    return { content: {}, applied: [], error: "لم أجد JSON صالح في النص. انسخ رد الذكاء الاصطناعي كاملاً وحاول مرة أخرى." };
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { content: {}, applied: [], error: "الشكل غير صحيح: لازم يكون كائن JSON واحد." };
  }
  const r = raw as Record<string, unknown>;
  const out: LandingPageContentConfig = {};
  const applied: string[] = [];
  const put = (key: keyof LandingPageContentConfig, value: unknown) => {
    (out as Record<string, unknown>)[key] = value;
    applied.push(key);
  };

  for (const [key, f] of Object.entries(FIELDS)) {
    if (!(key in r)) continue;
    if (f.kind === "str") {
      const s = clean(r[key]);
      if (s) put(key as keyof LandingPageContentConfig, s);
    } else {
      const l = cleanList(r[key]);
      if (l.length) put(key as keyof LandingPageContentConfig, l);
    }
  }

  if (Array.isArray(r.how_to_use_steps)) {
    const steps = r.how_to_use_steps
      .map((s, i) => {
        const o = (s || {}) as Record<string, unknown>;
        return { step_num: i + 1, title: clean(o.title, 80), desc: clean(o.desc) };
      })
      .filter((s) => s.title && s.desc)
      .slice(0, 6)
      .map((s, i) => ({ ...s, step_num: i + 1 }));
    if (steps.length) put("how_to_use_steps", steps);
  }

  if (Array.isArray(r.faq_items)) {
    const faq = r.faq_items
      .map((s) => {
        const o = (s || {}) as Record<string, unknown>;
        return { q: clean(o.q, 160), a: clean(o.a, 500) };
      })
      .filter((s) => s.q && s.a)
      .slice(0, 10);
    if (faq.length) put("faq_items", faq);
  }

  if (Array.isArray(r.guarantees)) {
    const icons = ["inspect", "swap", "shipping"] as const;
    const g = r.guarantees
      .map((s, i) => {
        const o = (s || {}) as Record<string, unknown>;
        const icon = icons.find((x) => x === o.icon) || icons[i] || "inspect";
        return { icon, title: clean(o.title, 80), desc: clean(o.desc) };
      })
      .filter((s) => s.title && s.desc)
      .slice(0, 3);
    if (g.length === 3) put("guarantees", g);
  }

  const rt = clean(r.reviews_title, 100);
  if (rt) put("reviews_title", rt);
  if (Array.isArray(r.reviews)) {
    const rv = r.reviews
      .map((s) => {
        const o = (s || {}) as Record<string, unknown>;
        const n = Number(o.rating);
        return {
          name: clean(o.name, 40),
          location: clean(o.location, 40),
          comment: clean(o.comment, 400),
          rating: Number.isFinite(n) ? Math.min(5, Math.max(1, Math.round(n))) : 5,
        };
      })
      .filter((s) => s.name && s.comment)
      .slice(0, 6);
    if (rv.length) put("reviews", rv);
  }

  for (const k of ["theme_primary", "theme_accent"] as const) {
    if (isThemeColor(r[k])) put(k, r[k] as string);
  }

  if (applied.length === 0) {
    return { content: {}, applied: [], error: "الـ JSON صالح لكن مفيهوش حقول معروفة. استخدم البرومبت كما هو." };
  }
  return { content: out, applied };
}
