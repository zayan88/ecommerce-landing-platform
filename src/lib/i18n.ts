/**
 * Storefront languages (Arabic default, English optional). The visitor's choice lives in a cookie, the admin stays Arabic.
 * Merchant-written content (product text, reviews, FAQ answers...) is shown as the merchant wrote it; this dictionary
 * only covers the fixed interface text of the store. Pure and edge-safe.
 */
export type Lang = "ar" | "en";
export const LANG_COOKIE = "store_lang";

export const normalizeLang = (v: unknown): Lang => (v === "en" ? "en" : "ar");
export const dirOf = (l: Lang): "rtl" | "ltr" => (l === "en" ? "ltr" : "rtl");

type Entry = { ar: string; en: string };

const D: Record<string, Entry> = {
  // ── generic ──
  "currency": { ar: "ج.م", en: "EGP" },
  "close": { ar: "إغلاق", en: "Close" },
  "free_shipping": { ar: "شحن مجاني", en: "Free shipping" },
  "lang_switch_label": { ar: "English", en: "عربي" },
  "lang_switch_aria": { ar: "Switch to English", en: "التبديل إلى العربية" },

  // ── offers selector ──
  "offers.title": { ar: "اختر الباقة المناسبة لك (المعاينة قبل الدفع):", en: "Choose your package (inspect before you pay):" },
  "offers.free_ship_badge": { ar: "✓ شحن مجاني", en: "✓ Free shipping" },
  "offers.aria": { ar: "اختر الباقة", en: "Choose a package" },
  "offers.one_piece": { ar: "قطعة واحدة", en: "1 piece" },
  "offers.two_pieces": { ar: "قطعتان", en: "2 pieces" },
  "offers.n_pieces": { ar: "{n} قطع", en: "{n} pieces" },
  "offers.badge_popular": { ar: "الأكثر طلباً ⭐", en: "Most popular ⭐" },
  "offers.badge_best": { ar: "أعلى توفير 🔥", en: "Best value 🔥" },

  // ── sticky bar / urgency / trust ──
  "sticky.cta": { ar: "أكّد طلبك الآن 🛒", en: "Confirm your order 🛒" },
  "sticky.inspect": { ar: "✓ معاينة وفحص قبل الدفع", en: "✓ Inspect before you pay" },
  "sticky.plus_free": { ar: " + شحن مجاني", en: " + free shipping" },
  "sticky.inspect_short": { ar: "✓ معاينة قبل الدفع", en: "✓ Inspect before paying" },
  "urgency.free": { ar: "شحن مجاني لكل المحافظات", en: "Free shipping to all governorates" },
  "urgency.inspect": { ar: "معاينة وفحص قبل الدفع", en: "Inspect before you pay" },
  "urgency.cod": { ar: "الدفع عند الاستلام", en: "Cash on delivery" },

  // ── guarantees ──
  "guar.aria": { ar: "ضماناتنا", en: "Our guarantees" },
  "guar.inspect_t": { ar: "معاينة قبل الدفع", en: "Inspect before paying" },
  "guar.inspect_d": { ar: "افتح الشحنة وجرّب قدام المندوب", en: "Open the parcel and try it in front of the courier" },
  "guar.swap_t": { ar: "استبدال مجاني 14 يوم", en: "Free 14-day exchange" },
  "guar.swap_d": { ar: "لو فيه أي عيب صناعة", en: "For any manufacturing defect" },
  "guar.ship_t": { ar: "شحن مجاني", en: "Free shipping" },
  "guar.ship_d": { ar: "لكل محافظات مصر", en: "To all Egyptian governorates" },

  // ── social proof ──
  "proof.aria": { ar: "ليه تثق فينا", en: "Why trust us" },
  "proof.p1": { ar: "الدفع عند الاستلام بعد المعاينة", en: "Cash on delivery after inspection" },
  "proof.p2": { ar: "شحن مجاني لكل المحافظات", en: "Free shipping to all governorates" },
  "proof.p3": { ar: "استبدال مجاني خلال 14 يوم", en: "Free exchange within 14 days" },
  "proof.p4": { ar: "فريق التأكيد بيتصل بيك قبل الشحن", en: "Our team calls you to confirm before shipping" },
  "proof.coverage": { ar: "مصر كلها", en: "All of Egypt" },
  "proof.from_reviews": { ar: "من {n} تقييم", en: "from {n} reviews" },
  "proof.we_deliver": { ar: "بنوصّل:", en: "We deliver to:" },

  // ── footer ──
  "footer.contact": { ar: "تواصل معنا", en: "Contact us" },
  "footer.whatsapp": { ar: "واتساب", en: "WhatsApp" },
  "footer.call": { ar: "اتصال", en: "Call" },
  "footer.order_form": { ar: "يمكنك الطلب مباشرة من النموذج في الصفحة.", en: "You can order directly from the form on the page." },
  "footer.info": { ar: "معلومات مهمة", en: "Important information" },
  "footer.policy": { ar: "سياسة الاستبدال والاسترجاع", en: "Exchange & return policy" },
  "footer.cod_line": { ar: "الدفع عند الاستلام • {ship} • معاينة قبل الدفع", en: "Cash on delivery • {ship} • Inspect before paying" },
  "footer.rights": { ar: "جميع الحقوق محفوظة.", en: "All rights reserved." },

  // ── popups ──
  "popup.title": { ar: "استنى! عندنا لك كوبون", en: "Wait! We have a coupon for you" },
  "popup.use": { ar: "استخدم الكوبون واطلب", en: "Use the coupon and order" },
  "popup.no": { ar: "لا شكراً", en: "No thanks" },

  // ── FAQ defaults ──
  "faq.title": { ar: "أسئلة بتدور في بالك؟ جاوبنا عليها", en: "Questions on your mind? We have answers" },
  "faq.a1_paid": { ar: "الشحن لكل محافظات مصر لحد باب بيتك ({ship}). تكلفة الشحن بتظهر لك قبل ما تأكد الطلب، والتوصيل بياخد من 5 لـ 7 أيام عمل.", en: "Delivery to every governorate, right to your door ({ship}). The shipping cost is shown before you confirm; delivery takes 5 to 7 working days." },
  "faq.q1": { ar: "الشحن بكام وهيوصل إمتى؟", en: "How much is shipping and when will it arrive?" },
  "faq.a1": { ar: "الشحن مجاني 100% لكل محافظات مصر لحد باب بيتك، والتوصيل بياخد من 5 لـ 7 أيام عمل.", en: "Shipping is 100% free to every governorate, right to your door. Delivery takes 5 to 7 working days." },
  "faq.q2": { ar: "أقدر أفتح الشحنة وأفحص المنتج قبل ما أدفع؟", en: "Can I open the parcel and inspect the product before paying?" },
  "faq.a2": { ar: "طبعاً. بتفتح الشحنة وتعاين وتجرّب قدام المندوب، ولو مش مقتنع ماتدفعش ولا مليم.", en: "Of course. Open the parcel and try the product in front of the courier. If you are not convinced, pay nothing." },
  "faq.q3": { ar: "المنتج أصلي ولا هيجيلي حاجة تانية؟", en: "Is the product genuine, or will I get something else?" },
  "faq.a3": { ar: "اللي هيوصلك هو نفس المنتج اللي في الصور. وعشان كده المعاينة قبل الدفع حقك، تتأكد بنفسك قبل ما تدفع.", en: "You get the same product as in the photos. That is why inspecting before paying is your right: check it yourself first." },
  "faq.q4": { ar: "لو طلع فيه عيب صناعة أعمل إيه؟", en: "What if it has a manufacturing defect?" },
  "faq.a4": { ar: "عندك ضمان 14 يوم باستبدال مجاني لحد باب البيت. كلمنا وهنبدّله لك من غير أي مصاريف.", en: "You have a 14-day warranty with a free exchange to your door. Contact us and we replace it at no cost." },
  "faq.q5": { ar: "استخدامه صعب؟", en: "Is it hard to use?" },
  "faq.a5": { ar: "لأ خالص، بيشتغل في 3 خطوات بسيطة موضحة في الصفحة، وفي كتيب إرشادات جوه العلبة.", en: "Not at all. It works in 3 simple steps shown on the page, with a guide inside the box." },
  "faq.q6": { ar: "هتتصلوا بيا إمتى؟", en: "When will you call me?" },
  "faq.a6": { ar: "بعد ما تسجّل الطلب، فريق التأكيد بيتصل بيك على رقمك خلال ساعات لتأكيد العنوان وميعاد التوصيل.", en: "After you place the order, our confirmation team calls you within hours to confirm the address and delivery time." },

  // ── checkout form ──
  "co.coupon_bad": { ar: "الكوبون ده مش صحيح", en: "This coupon is not valid" },
  "co.coupon_err": { ar: "تعذر التحقق من الكوبون، جرّب تاني", en: "Could not check the coupon, please try again" },
  "co.v_name": { ar: "يرجى كتابة الاسم بالكامل", en: "Please enter your full name" },
  "co.v_phone": { ar: "يرجى كتابة رقم هاتف مصري صحيح (11 رقم يبدأ بـ 010 أو 011 أو 012 أو 015)", en: "Please enter a valid Egyptian mobile number (11 digits starting with 010, 011, 012 or 015)" },
  "co.v_addr": { ar: "يرجى كتابة العنوان بالتفصيل (المدينة أو الشارع أو علامة مميزة)", en: "Please enter your detailed address (city, street or a landmark)" },
  "co.min_order": { ar: "أقل قيمة للطلب {n} {cur}", en: "Minimum order value is {n} {cur}" },
  "co.err_send": { ar: "تعذر إرسال الطلب، يرجى التأكد من البيانات", en: "Could not send the order, please check your details" },
  "co.err_conn": { ar: "حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى", en: "Connection error, please try again" },
  "co.banner": { ar: "الشحن علينا لحد باب بيتك + معاينة كاملة قبل ما تدفع", en: "We ship to your door + full inspection before you pay" },
  "co.h2": { ar: "اطلب دلوقتي.. وادفع بس لما الشحنة توصلك وتعاينها", en: "Order now… and pay only when the parcel arrives and you inspect it" },
  "co.sub": { ar: "مش هتدفع ولا جنيه دلوقتي. سيب بياناتك، ولما المندوب يوصلك افتح الشحنة وعاينها براحتك، وبعدين ادفع.", en: "You pay nothing now. Leave your details; when the courier arrives, open the parcel, inspect it at your ease, then pay." },
  "co.name": { ar: "اسمك بالكامل", en: "Your full name" },
  "co.name_ph": { ar: "مثال: محمد السيد", en: "e.g. Mohamed El-Sayed" },
  "co.phone": { ar: "رقم موبايلك (هنكلمك نأكد معاك الشحن)", en: "Your mobile number (we will call to confirm shipping)" },
  "co.safe": { ar: "🔒 في أمان تام", en: "🔒 Safe and private" },
  "co.gov": { ar: "محافظتك", en: "Your governorate" },
  "co.addr": { ar: "عنوانك بالتفصيل", en: "Your detailed address" },
  "co.addr_ph": { ar: "المدينة، اسم الشارع، أو أقرب علامة مميزة", en: "City, street name or nearest landmark" },
  "co.note": { ar: "عندك ملاحظة للمندوب؟", en: "A note for the courier?" },
  "co.optional": { ar: "(اختياري)", en: "(optional)" },
  "co.note_ph": { ar: "رقم العمارة والشقة، أو الوقت الأنسب لك للاستلام...", en: "Building and flat number, or the best time for delivery..." },
  "co.has_coupon": { ar: "عندك كوبون خصم؟", en: "Have a discount coupon?" },
  "co.coupon_ph": { ar: "كود الكوبون", en: "Coupon code" },
  "co.apply": { ar: "تطبيق", en: "Apply" },
  "co.applied": { ar: "✓ اتطبّق خصم {n} {cur}", en: "✓ {n} {cur} discount applied" },
  "co.order_price": { ar: "سعر الطلب ({item}):", en: "Order price ({item}):" },
  "co.product": { ar: "المنتج", en: "Product" },
  "co.auto_disc": { ar: "خصم تلقائي:", en: "Automatic discount:" },
  "co.coupon_disc": { ar: "خصم الكوبون ({code}):", en: "Coupon discount ({code}):" },
  "co.ship_to": { ar: "الشحن والتوصيل إلى {gov}:", en: "Shipping and delivery to {gov}:" },
  "co.free_all": { ar: "مجاناً بالكامل علينا 🎁", en: "Completely free on us 🎁" },
  "co.min_hint": { ar: "أقل قيمة للطلب {n} {cur}. اختار عرض أكبر عشان تكمّل.", en: "Minimum order is {n} {cur}. Choose a bigger offer to continue." },
  "co.total_due": { ar: "المبلغ المطلوب عند الاستلام:", en: "Amount due on delivery:" },
  "co.pay_note": { ar: "✓ هتدفع للمندوب بس لما تستلم الشحنة وتعاينها بنفسك.", en: "✓ You pay the courier only when you receive and inspect the parcel yourself." },
  "co.pay_method": { ar: "طريقة الدفع", en: "Payment method" },
  "co.cod_t": { ar: "الدفع عند الاستلام", en: "Cash on delivery" },
  "co.cod_d": { ar: "ادفع للمندوب بعد ما تفتح الشحنة وتعاينها", en: "Pay the courier after opening and inspecting the parcel" },
  "co.vf_t": { ar: "فودافون كاش", en: "Vodafone Cash" },
  "co.vf_d": { ar: "حوّل المبلغ على رقم المتجر", en: "Transfer the amount to the store's number" },
  "co.ip_t": { ar: "إنستاباي", en: "InstaPay" },
  "co.ip_d": { ar: "حوّل المبلغ على عنوان المتجر", en: "Transfer the amount to the store's address" },
  "co.transfer": { ar: "حوّل {amt} {cur} على:", en: "Transfer {amt} {cur} to:" },
  "co.copy": { ar: "نسخ الرقم", en: "Copy number" },
  "co.copied": { ar: "تم النسخ ✓", en: "Copied ✓" },
  "co.holder": { ar: "باسم:", en: "Account name:" },
  "co.ref_ph": { ar: "رقم العملية أو آخر 4 أرقام من رقم التحويل (اختياري)", en: "Transaction number or last 4 digits of the transfer (optional)" },
  "co.transfer_note": { ar: "بنأكد الطلب لما التحويل يوصلنا ونكلمك. لو حوّلت بعد ما تبعت الطلب، ابعت صورة الإيصال لنا على واتساب.", en: "We confirm the order once the transfer reaches us and we call you. If you transfer after sending the order, send us the receipt on WhatsApp." },
  "co.submitting": { ar: "جاري تسجيل طلبك...", en: "Placing your order..." },
  "co.cta": { ar: "أكّد طلبي.. وهدفع عند الاستلام 🛒", en: "Confirm my order… I pay on delivery 🛒" },
  "co.preview_only": { ar: "معاينة فقط — الطلب غير مفعّل داخل المحرر", en: "Preview only — ordering is disabled inside the editor" },
  "co.trust_line": { ar: "🔒 مفيش دفع أونلاين • معاينة كاملة قبل الدفع للمندوب • استبدال فوري لو في أي عيب", en: "🔒 No online payment • Full inspection before paying the courier • Instant exchange for any defect" },
  "co.ship_days_free": { ar: "شحن مجاني (5-7 أيام)", en: "Free shipping (5-7 days)" },
  "co.ship_days": { ar: "{text} (5-7 أيام)", en: "{text} (5-7 days)" },
  "co.inspect": { ar: "معاينة قبل الدفع", en: "Inspect before paying" },
  "co.swap14": { ar: "استبدال 14 يوم", en: "14-day exchange" },

  // ── store chat ──
  "chat.nudge_p1": { ar: "عندك سؤال عن المنتج؟ اسألنا 👋", en: "Any question about the product? Ask us 👋" },
  "chat.nudge_p2": { ar: "الدفع عند الاستلام وتفحص المنتج قبل ما تدفع 👌", en: "Pay on delivery and inspect the product before you pay 👌" },
  "chat.nudge_p3": { ar: "شحن مجاني لكل المحافظات. اطلب دلوقتي 🚚", en: "Free shipping to all governorates. Order now 🚚" },
  "chat.nudge_h1": { ar: "أهلاً! محتاج مساعدة؟ اسألنا 👋", en: "Hi! Need help? Ask us 👋" },
  "chat.nudge_h2": { ar: "شحن مجاني والدفع عند الاستلام 🚚", en: "Free shipping and cash on delivery 🚚" },
  "chat.no_reply": { ar: "لسه محدش قدر يرد دلوقتي. سيب اسمك ورقمك وهنرد عليك على واتساب في أقرب وقت.", en: "Nobody could reply yet. Leave your name and number and we will answer you on WhatsApp soon." },
  "chat.try_later": { ar: "جرّب بعد شوية", en: "Please try again in a moment" },
  "chat.send_fail": { ar: "تعذر الإرسال دلوقتي، جرّب تاني.", en: "Could not send right now, please try again." },
  "chat.sent_wait": { ar: "وصلت رسالتك لفريق الدعم، هيرد عليك هنا في الشات. استنى دقايق...", en: "Your message reached our support team. They will reply here in the chat. Please wait a few minutes..." },
  "chat.fail_short": { ar: "تعذر الإرسال", en: "Could not send" },
  "chat.fail_retry": { ar: "تعذر الإرسال، جرّب تاني", en: "Could not send, please try again" },
  "chat.order_now": { ar: "اطلب دلوقتي", en: "Order now" },
  "chat.name_ph": { ar: "اسمك", en: "Your name" },
  "chat.phone_ph": { ar: "رقم الواتساب 01xxxxxxxxx", en: "WhatsApp number" },
  "chat.sending": { ar: "جاري الإرسال...", en: "Sending..." },
  "chat.send_msg": { ar: "ابعت رسالتي", en: "Send my message" },
  "chat.whatsapp_us": { ar: "كلمنا على واتساب", en: "Chat with us on WhatsApp" },
  "chat.input_ph": { ar: "اكتب رسالتك...", en: "Type your message..." },
  "chat.send": { ar: "إرسال", en: "Send" },
  "chat.hide": { ar: "إخفاء", en: "Hide" },
  "chat.order_now_short": { ar: "اطلب الآن", en: "Order now" },
  "chat.ask": { ar: "اسأل", en: "Ask" },
  "chat.new_reply": { ar: "رد جديد", en: "New reply" },
};

/** Translate a key; `{n}` style variables are replaced. Unknown key → the key itself. */
export function tr(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const e = D[key];
  let s = e ? e[lang] : key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** Register more entries (used by files that own their own strings). */
export function addStrings(more: Record<string, Entry>): void {
  Object.assign(D, more);
}

/** The generated default offer labels ("خصم خاص" ...) in English; the merchant's own label text is shown as written. */
const OFFER_LABELS_EN: Record<string, string> = {
  "خصم خاص": "Special discount",
  "وفر أكثر + شحن مجاني": "Save more + free shipping",
  "أعلى توفير + شحن مجاني": "Best value + free shipping",
};
export function offerLabel(lang: Lang, label: string): string {
  return lang === "en" ? OFFER_LABELS_EN[label] || label : label;
}

const CURRENCY_EN: Record<string, string> = { "ج.م": "EGP", "ر.س": "SAR", "د.إ": "AED", "د.ك": "KWD", "د.ب": "BHD", "ر.ع": "OMR", "ر.ق": "QAR", "د.أ": "JOD" };
/** The merchant's currency symbol written for English readers (Arabic symbols → ISO code). */
export const currencyEn = (symbol: string): string => CURRENCY_EN[symbol] || symbol;

/** Every dictionary entry (for tests): both languages must exist and use the same {placeholders}. */
export function i18nEntries(): [string, { ar: string; en: string }][] {
  return Object.entries(D);
}
