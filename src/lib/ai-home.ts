import { sanitizeHomeContent, type HomeContent } from "@/lib/home-content";

/**
 * AI-written home page (copy / paste, no AI key in the store): the merchant copies a prompt into any AI chat and pastes
 * the JSON answer back. Only whitelisted text fields are accepted, and they go through the same sanitizer the home page
 * uses when it saves (lengths, junk characters). Never HTML, never images.
 */

export type HomeAiLang = "ar" | "en";

interface FieldSpec {
  key: string;
  kind: "str" | "strlist" | "pairs" | "faq";
  hint: string;
  count?: string;
}

const FIELDS: FieldSpec[] = [
  { key: "hero_badge", kind: "str", hint: "شارة صغيرة فوق العنوان (جملة قصيرة)" },
  { key: "hero_title", kind: "str", hint: "العنوان الرئيسي (الجزء الأول)" },
  { key: "hero_highlight", kind: "str", hint: "الجزء الملوّن من العنوان (كلمتين لأربع)" },
  { key: "hero_text", kind: "str", hint: "فقرة تحت العنوان: جملتين أو ثلاثة" },
  { key: "hero_cta", kind: "str", hint: "نص زرار المنتجات (3 لـ 5 كلمات)" },
  { key: "trust", kind: "pairs", hint: "شريط الثقة: عنوان قصير ووصف قصير لكل مربع", count: "4" },
  { key: "products_badge", kind: "str", hint: "شارة قسم المنتجات" },
  { key: "products_title", kind: "str", hint: "عنوان قسم المنتجات" },
  { key: "products_sub", kind: "str", hint: "جملة تحت عنوان المنتجات" },
  { key: "features_badge", kind: "str", hint: "شارة قسم الضمانات" },
  { key: "features_title", kind: "str", hint: "عنوان قسم الضمانات (لماذا تثق بنا)" },
  { key: "features_sub", kind: "str", hint: "جملة تحت العنوان" },
  { key: "features", kind: "pairs", hint: "ثلاث ضمانات: عنوان ووصف", count: "3" },
  { key: "compare_badge", kind: "str", hint: "شارة المقارنة" },
  { key: "compare_title", kind: "str", hint: "عنوان المقارنة" },
  { key: "compare_sub", kind: "str", hint: "جملة تحت عنوان المقارنة" },
  { key: "compare_old_title", kind: "str", hint: "عنوان عمود المنتجات العادية" },
  { key: "compare_old", kind: "strlist", hint: "عيوب المنتجات العادية", count: "3 إلى 5" },
  { key: "compare_new_title", kind: "str", hint: "عنوان عمود متجرنا" },
  { key: "compare_new", kind: "strlist", hint: "مميزات متجرنا", count: "3 إلى 5" },
  { key: "steps_badge", kind: "str", hint: "شارة خطوات الشراء" },
  { key: "steps_title", kind: "str", hint: "عنوان خطوات الشراء" },
  { key: "steps", kind: "pairs", hint: "ثلاث خطوات: عنوان ووصف", count: "3" },
  { key: "warranty_title", kind: "str", hint: "عنوان شهادة الضمان" },
  { key: "warranty_text", kind: "str", hint: "فقرة الضمان" },
  { key: "warranty_chips", kind: "strlist", hint: "علامات قصيرة تبدأ بـ ✓", count: "3" },
  { key: "reviews_title", kind: "str", hint: "عنوان قسم آراء العملاء" },
  { key: "faq_badge", kind: "str", hint: "شارة الأسئلة الشائعة" },
  { key: "faq_title", kind: "str", hint: "عنوان الأسئلة الشائعة" },
  { key: "faq", kind: "faq", hint: "أسئلة وأجوبة عامة عن المتجر", count: "4 إلى 6" },
  { key: "footer_text", kind: "str", hint: "جملة قصيرة في الفوتر" },
  { key: "footer_chips", kind: "strlist", hint: "علامات قصيرة في الفوتر (بإيموجي)", count: "2" },
];

export function buildHomePrompt(input: { brandName: string; about: string; productNames: string[]; lang: HomeAiLang }): string {
  const en = input.lang === "en";
  const shape = (f: FieldSpec) => {
    const v = f.kind === "str" ? '"..."' : f.kind === "strlist" ? '["..."]' : f.kind === "pairs" ? '[{"title":"...","desc":"..."}]' : '[{"q":"...","a":"..."}]';
    return `  "${f.key}": ${v},   // ${f.hint}${f.count ? ` (${f.count})` : ""}`;
  };
  const products = input.productNames.filter(Boolean).slice(0, 12);
  return `أنت كاتب إعلانات (Direct Response) متخصص في السوق المصري والدفع عند الاستلام.
اكتب نصوص الصفحة الرئيسية لمتجر "${input.brandName}".
لغة النصوص: ${en ? "English (clear, friendly, trustworthy)" : "عربي مصري بسيط ومحترم وواثق"}.

عن المتجر (اعتمد على ده فقط ولا تخترع معلومات):
${input.about.trim() || "(التاجر ماكتبش وصف، اكتب نصوص عامة وآمنة بدون ادعاءات)"}
${products.length ? `منتجات المتجر: ${products.join("، ")}` : ""}

القواعد:
- ممنوع تخترع ضمانات أو أرقام أو شهادات أو نتائج أو أسماء عملاء.
- متتكلمش عن مدة التوصيل أو سعر الشحن بالتفصيل، التاجر بيحددهم لوحده.
- النصوص قصيرة وواضحة: العناوين أقل من 80 حرف، والجمل أقل من 200 حرف.
- اكتب كل الحقول اللي تحت.

أخرج JSON صالح فقط (بدون شرح وبدون HTML وبدون صور) بالشكل ده بالضبط:
{
${FIELDS.map(shape).join("\n")}
}`.replace(/\n{3,}/g, "\n\n");
}

export interface HomeAiParseResult {
  content: Partial<HomeContent>;
  applied: string[];
  error?: string;
}

/** The first JSON object in a pasted AI answer (tolerates ``` fences and chatter). */
function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("no-json");
  return JSON.parse(body.slice(start, end + 1));
}

const ALLOWED = new Set(FIELDS.map((f) => f.key));

export function parseHomeAi(text: string): HomeAiParseResult {
  let raw: unknown;
  try {
    raw = extractJson(String(text || ""));
  } catch {
    return { content: {}, applied: [], error: "لم أجد JSON صالح في النص. انسخ رد الذكاء الاصطناعي كاملاً وحاول مرة أخرى." };
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { content: {}, applied: [], error: "الشكل غير صحيح: لازم يكون كائن JSON واحد." };
  }
  // Only the fields the prompt asked for, then the home page's own sanitizer.
  const picked: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) if (ALLOWED.has(k)) picked[k] = v;
  const content = sanitizeHomeContent(picked);
  // A field the AI left empty must not wipe the page (empty = "delete" for the saved page), so drop empties here.
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(content)) {
    if (typeof v === "string" ? v.trim() : Array.isArray(v) ? v.length > 0 : v !== undefined) clean[k] = v;
  }
  const applied = Object.keys(clean);
  if (applied.length === 0) return { content: {}, applied: [], error: "الـ JSON صالح لكن مفيهوش حقول معروفة. استخدم البرومبت كما هو." };
  return { content: clean as Partial<HomeContent>, applied };
}
