/**
 * Editable content of the store's built-in home page (settings.home_content). Every text can be changed from
 * Admin > Settings > Home page; empty / missing fields fall back to the defaults below (Arabic or English, by store language).
 * Pure and edge-safe: used by the home route, the admin editor and the tests.
 */
import type { Lang } from "@/lib/i18n";

export interface TitleDesc {
  title: string;
  desc: string;
}
export interface Faq {
  q: string;
  a: string;
}

export const HOME_SECTIONS = ["trust", "features", "compare", "steps", "warranty", "reviews", "faq"] as const;
export type HomeSection = (typeof HOME_SECTIONS)[number];

export interface HomeContent {
  tagline: string;
  hero_badge: string;
  hero_title: string;
  hero_highlight: string;
  hero_text: string;
  hero_cta: string;
  hero_image: string;
  trust: TitleDesc[];
  products_badge: string;
  products_title: string;
  products_sub: string;
  features_badge: string;
  features_title: string;
  features_sub: string;
  features: TitleDesc[];
  compare_badge: string;
  compare_title: string;
  compare_sub: string;
  compare_old_title: string;
  compare_old: string[];
  compare_new_title: string;
  compare_new: string[];
  steps_badge: string;
  steps_title: string;
  steps: TitleDesc[];
  warranty_title: string;
  warranty_text: string;
  warranty_chips: string[];
  reviews_title: string;
  faq_badge: string;
  faq_title: string;
  faq: Faq[];
  footer_text: string;
  footer_chips: string[];
  /** Sections the merchant hid. */
  hide: Partial<Record<HomeSection, boolean>>;
}

export function defaultHomeContent(lang: Lang, brand: string): HomeContent {
  if (lang === "en") {
    return {
      tagline: "Quality and innovation in one place",
      hero_badge: "Smart, modern products you can trust",
      hero_title: "Shop great products",
      hero_highlight: "at the best quality and price",
      hero_text: `At ${brand}, your comfort and safety come first: inspect the product yourself in front of the courier before you pay anything, pay on delivery, and enjoy a free 14-day exchange.`,
      hero_cta: "See our products and offers",
      hero_image: "",
      trust: [
        { title: "Inspect before paying", desc: "Check your order at your ease" },
        { title: "Shipping to all areas", desc: "Delivered to your door" },
        { title: "14-day exchange", desc: "A simple, no-fuss guarantee" },
        { title: "Customer follow-up", desc: "Phone confirmation of every order" },
      ],
      products_badge: "Offers and products available now",
      products_title: "Pick your product and enjoy the best offers",
      products_sub: "All products are in stock and ready to ship to your door, with cash on delivery.",
      features_badge: `${brand} guarantees`,
      features_title: "Why trust us?",
      features_sub: "Shop with total peace of mind. Our system is built to protect the buyer.",
      features: [
        { title: "1. Inspect before you receive", desc: "You have the full right to open the parcel and check that the product matches its description before handing any money to the courier." },
        { title: "2. Direct shipping", desc: "We work with trusted couriers so your order reaches your door within the delivery time shown on each product." },
        { title: "3. 14-day exchange and return", desc: "If there is a manufacturing defect or the product does not match, we offer a free instant exchange or a full refund, no complications." },
      ],
      compare_badge: "The real comparison",
      compare_title: `Why is ${brand} far better than ordinary products?`,
      compare_sub: `See the practical difference between buying from an ordinary market and buying from ${brand}`,
      compare_old_title: "Ordinary products on the market",
      compare_old: [
        "Cheap imitation materials that break within days.",
        "No real warranty and no after-sales service when a defect appears.",
        "The courier makes you pay before you can open and check the parcel.",
        "Long delivery delays with no contact or follow-up.",
      ],
      compare_new_title: `${brand} genuine, certified solutions`,
      compare_new: [
        "Durable premium materials tested to the highest quality standards.",
        "A 14-day exchange and return guarantee with support.",
        "Your full right to open the parcel and inspect it in front of the courier before paying.",
        "Fast, tracked delivery to your door.",
      ],
      steps_badge: "A comfortable shopping experience",
      steps_title: `How do you shop from ${brand} in 3 simple steps?`,
      steps: [
        { title: "Choose your product", desc: "Browse the offers, press the order button and enter your details in under 30 seconds." },
        { title: "Confirmation and shipping", desc: "Our team calls you to confirm the order and address, then your order is shipped." },
        { title: "Inspect and receive", desc: "Inspect your order in front of the courier, then pay cash on delivery." },
      ],
      warranty_title: `${brand} 100% guarantee`,
      warranty_text: "We are fully confident in the quality of our products, so we give you a real 14-day guarantee: if you find a manufacturing defect or the product is not exactly what you saw, we replace it free or refund you in full.",
      warranty_chips: ["✓ 14-day exchange guarantee", "✓ Full inspection before paying", "✓ Support"],
      reviews_title: "What our customers say",
      faq_badge: "Quick answers",
      faq_title: "Frequently asked questions",
      faq: [
        { q: "Can I open the parcel and inspect it before paying?", a: "Yes, absolutely. You may inspect the product in front of the courier and confirm its quality before paying anything." },
        { q: "When will my order arrive after confirmation?", a: "Delivery time is shown on every product page and is confirmed by our team when they call you." },
        { q: "What payment methods are available?", a: "Cash on delivery, plus the transfer methods shown at checkout when the store enables them." },
        { q: "What if I want to exchange or return the product?", a: "We offer a 14-day exchange and return guarantee. Contact us and we will arrange the pickup and replacement." },
      ],
      footer_text: "Your trusted online store",
      footer_chips: ["💵 Cash on delivery", "🔄 14-day guarantee"],
      hide: {},
    };
  }
  return {
    tagline: "الجودة والابتكار في مكان واحد",
    hero_badge: "منتجات عصرية وذكية تثق فيها",
    hero_title: "تسوق أرقى المنتجات",
    hero_highlight: "بأعلى جودة وأفضل سعر",
    hero_text: `في ${brand}، راحتك وأمانك هما أولويتنا: عاين وافحص المنتج بنفسك أمام مندوب الشحن قبل دفع أي مبلغ، مع الدفع عند الاستلام وضمان استبدال مجاني 14 يوماً.`,
    hero_cta: "شاهد منتجاتنا وعروضنا",
    hero_image: "",
    trust: [
      { title: "معاينة قبل الدفع", desc: "افحص طلبك براحتك" },
      { title: "شحن لجميع المناطق", desc: "لحد باب بيتك" },
      { title: "استبدال 14 يوماً", desc: "ضمان بدون تعقيد" },
      { title: "متابعة مع العميل", desc: "تأكيد هاتفي لكل طلب" },
    ],
    products_badge: "العروض والمنتجات المتاحة الآن",
    products_title: "اختر منتجك واستمتع بأقوى العروض",
    products_sub: "جميع المنتجات متوفرة وجاهزة للشحن لباب بيتك مع الدفع عند الاستلام.",
    features_badge: `ضمانات ${brand}`,
    features_title: "لماذا تثق بنا؟",
    features_sub: "تسوق وأنت مطمئن البال. نظامنا مبني بالكامل لحماية حق المشتري.",
    features: [
      { title: "1. فحص الشحنة قبل الاستلام", desc: "لك كامل الحق في فتح الطرد ومعاينة المنتج والتأكد من مطابقته للمواصفات المعروضة قبل تسليم أي مبلغ للمندوب." },
      { title: "2. شحن مباشر", desc: "نتعامل مع شركات شحن موثوقة لضمان وصول طلبك لباب بيتك في الموعد الموضّح على كل منتج." },
      { title: "3. استبدال واسترجاع 14 يوم", desc: "في حال وجود أي عيب صناعة أو عدم مطابقة، نوفر لك استبدالاً فورياً مجانياً أو استرداد كامل أموالك دون أي تعقيد." },
    ],
    compare_badge: "المقارنة الحقيقية",
    compare_title: `لماذا ${brand} أفضل بمراحل من المنتجات التقليدية؟`,
    compare_sub: `شاهد الفرق العملي بين الشراء من السوق التقليدي والشراء من ${brand}`,
    compare_old_title: "المنتجات العادية في السوق",
    compare_old: [
      "خامات بلاستيكية ومقلدة تتلف وتنكسر سريعاً بعد أيام قليلة.",
      "لا يوجد أي ضمان حقيقي ولا خدمة ما بعد البيع إذا ظهر عيب بالمنتج.",
      "مندوب الشحن يجبرك على دفع الحساب قبل أن تفتح وتفحص محتويات الطرد.",
      "تأخير طويل في التوصيل لعدة أسابيع دون أي تواصل أو متابعة.",
    ],
    compare_new_title: `حلول ${brand} الأصلية المعتمدة`,
    compare_new: [
      "خامات فاخرة متينة ومختبرة بأعلى معايير الجودة لتتحمل الاستخدام الشاق.",
      "ضمان استبدال واسترجاع لمدة 14 يوماً مع دعم فني.",
      "حقك الكامل في فتح الطرد ومعاينة المنتج أمام المندوب قبل دفع مليم واحد.",
      "شحن سريع لباب بيتك مع متابعة للطلب.",
    ],
    steps_badge: "تجربة تسوق مريحة",
    steps_title: `كيف تتسوق من ${brand} في 3 خطوات بسيطة؟`,
    steps: [
      { title: "اختر منتجك", desc: 'تصفح العروض واضغط على زر "طلب المنتج" ثم اكتب بياناتك في أقل من 30 ثانية.' },
      { title: "تأكيد وشحن", desc: "يتصل بك فريقنا هاتفياً لتأكيد الأوردر ومراجعة العنوان ثم يتم شحن طلبك." },
      { title: "معاينة واستلام", desc: "عاين طلبك وافحصه وتأكد من جودته أمام المندوب، ثم ادفع نقداً عند الاستلام." },
    ],
    warranty_title: `شهادة ضمان ${brand} 100%`,
    warranty_text: "نحن واثقون تماماً من جودة وفائدة منتجاتنا. لذلك نمنحك ضماناً حقيقياً لمدة 14 يوماً كاملاً: إذا وجدت أي عيب صناعة أو لم يكن المنتج مطابقاً تماماً لما رأيته، سنقوم باستبداله فوراً مجاناً أو استرداد كامل المبلغ دون أي تعقيد.",
    warranty_chips: ["✓ ضمان استبدال 14 يوم", "✓ معاينة كاملة قبل الدفع", "✓ دعم فني"],
    reviews_title: "ماذا يقول عملاؤنا؟",
    faq_badge: "إجابات سريعة",
    faq_title: "الأسئلة الأكثر شيوعاً",
    faq: [
      { q: "هل مسموح لي بفتح الشحنة وفحصها قبل الدفع؟", a: "نعم بكل تأكيد! يحق لك فحص ومعاينة المنتج والتأكد من جودته ومطابقته التامة أمام المندوب قبل دفع أي مبالغ نقدية." },
      { q: "متى سيصلني الطلب بعد تأكيده؟", a: "موعد التوصيل موضّح في صفحة كل منتج، ويؤكده لك فريقنا عند الاتصال بك." },
      { q: "ما هي طرق الدفع المتاحة في المتجر؟", a: "الدفع نقداً عند الاستلام، بالإضافة إلى طرق التحويل الظاهرة في صفحة الطلب لو المتجر فعّلها." },
      { q: "ماذا لو أردت استبدال أو إرجاع المنتج؟", a: "نقدم ضمان استبدال واسترجاع لمدة 14 يوماً. تواصل معنا وسنرتب استلام المنتج وإرسال البديل." },
    ],
    footer_text: "متجرك الإلكتروني الموثوق",
    footer_chips: ["💵 الدفع عند الاستلام", "🔄 ضمان 14 يوم"],
    hide: {},
  };
}

const str = (v: unknown, max: number): string =>
  typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ").trim().slice(0, max) : "";

const strList = (v: unknown, max: number, items: number): string[] =>
  (Array.isArray(v) ? v : []).map((x) => str(x, max)).filter(Boolean).slice(0, items);

const pairList = (v: unknown, n: number): TitleDesc[] =>
  (Array.isArray(v) ? v : [])
    .slice(0, n)
    .map((x: any) => ({ title: str(x?.title, 80), desc: str(x?.desc, 300) }))
    .filter((x) => x.title || x.desc);

const IMG_RE = /^(https?:\/\/[^\s]+|\/[^\s]*)$/i;

/**
 * What the merchant saved, cleaned. A field that is MISSING falls back to the default text; a field saved EMPTY
 * ("" or []) means the merchant deleted that element, so it stays empty (this is how deleting a button sticks).
 */
export function sanitizeHomeContent(raw: unknown): Partial<HomeContent> {
  const r: Record<string, any> = raw && typeof raw === "object" ? (raw as Record<string, any>) : {};
  const out: Partial<HomeContent> = {};
  const S: [keyof HomeContent, number][] = [
    ["tagline", 80], ["hero_badge", 100], ["hero_title", 120], ["hero_highlight", 120], ["hero_text", 500], ["hero_cta", 50],
    ["products_badge", 80], ["products_title", 120], ["products_sub", 300],
    ["features_badge", 80], ["features_title", 120], ["features_sub", 300],
    ["compare_badge", 80], ["compare_title", 160], ["compare_sub", 300], ["compare_old_title", 100], ["compare_new_title", 100],
    ["steps_badge", 80], ["steps_title", 160],
    ["warranty_title", 120], ["warranty_text", 600],
    ["reviews_title", 100], ["faq_badge", 80], ["faq_title", 120], ["footer_text", 160],
  ];
  for (const [k, max] of S) {
    if (typeof r[k] === "string") (out as any)[k] = str(r[k], max);
  }
  if (typeof r.hero_image === "string") {
    const img = str(r.hero_image, 500);
    if (img === "" || IMG_RE.test(img)) out.hero_image = img;
  }
  const pairs: [keyof HomeContent, number][] = [["trust", 4], ["features", 3], ["steps", 3]];
  for (const [k, n] of pairs) {
    if (Array.isArray(r[k])) (out as any)[k] = pairList(r[k], n);
  }
  const lists: [keyof HomeContent, number, number][] = [["compare_old", 200, 6], ["compare_new", 200, 6], ["warranty_chips", 60, 4], ["footer_chips", 60, 4]];
  for (const [k, max, n] of lists) {
    if (Array.isArray(r[k])) (out as any)[k] = strList(r[k], max, n);
  }
  if (Array.isArray(r.faq)) {
    out.faq = r.faq
      .slice(0, 8)
      .map((x: any) => ({ q: str(x?.q, 160), a: str(x?.a, 600) }))
      .filter((x: Faq) => x.q && x.a);
  }
  const hide: Partial<Record<HomeSection, boolean>> = {};
  for (const s of HOME_SECTIONS) if (r.hide && r.hide[s] === true) hide[s] = true;
  if (Object.keys(hide).length) out.hide = hide;
  return out;
}

/** Defaults overridden by what the merchant saved. */
export function mergeHomeContent(defaults: HomeContent, saved: unknown): HomeContent {
  const o = sanitizeHomeContent(saved);
  return { ...defaults, ...o, hide: o.hide || {} } as HomeContent;
}
