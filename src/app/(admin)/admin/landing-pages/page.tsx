"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LandingPage, Product, LandingPageContentConfig, DEFAULT_LANDING_PAGE_SECTIONS, mergeSections } from "@/types";
import { Plus, Copy, Check, Search, Package, RefreshCw, FileText } from "lucide-react";
import CreateLandingPageModal from "./_components/CreateLandingPageModal";

export default function AdminLandingPagesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Creation Mode: "quick" | "ai_prompt" | "safka"
  const [createMode, setCreateMode] = useState<"quick" | "ai_prompt" | "safka">("quick");

  // New Landing Page Form
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newProductId, setNewProductId] = useState("");
  const [newPixelId, setNewPixelId] = useState("");
  const [customHeadScripts, setCustomHeadScripts] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // AI Code / Content Input State
  const [aiInputText, setAiInputText] = useState("");
  const [aiParseMessage, setAiParseMessage] = useState<string | null>(null);
  const [showContentEditorInCreate, setShowContentEditorInCreate] = useState(false);
  const [activeCreateTab, setActiveCreateTab] = useState<"hero" | "comparison" | "box" | "steps" | "reviews">("hero");
  const [creationContent, setCreationContent] = useState<LandingPageContentConfig>({});

  const initCreationContentForProduct = (prod: Product) => {
    return {
      announcement_bar: "عرض خاص: شحن مجاني لجميع المحافظات + حق المعاينة والتجربة قبل الدفع 💵",
      hero_headline: prod.title_ar,
      hero_subheadline:
        prod.description_ar?.slice(0, 140) ||
        "💡 احصل على أفضل تجربة مع المنتج الأصلي المعتمد وبأعلى معايير الجودة.",
      hero_badge: "4.9 / 5.0 (أكثر من 400 تقييم موثق في مصر)",
      hero_image: prod.images?.[0] || "",
      hero_bullets: [
        "خامات أصلية عالية الجودة تضمن المتانة والتحمل طويل الأمد.",
        "تصميم عملي وعصري يلبي احتياجات الاستخدام اليومي بكل سهولة.",
        "آمن وسهل الاستخدام مع ضمان كامل وحق الفحص والمعاينة قبل الدفع.",
        "شحن سريع ومجاني لجميع محافظات مصر وتأكيد فوري للطلب.",
      ],
      comparison_badge: "ليه ده أفضل اختيار؟",
      comparison_title: "الفرق بين المنتجات التقليدية والمنتج الأصلي",
      comparison_old_title: "المنتجات والبدائل التقليدية",
      comparison_old_points: [
        "خامات رديئة وضعيفة تتلف بسرعة.",
        "بدون ضمان أو معاينة حقيقية قبل الدفع.",
        "صعوبة في الاستخدام ولا تلبي النتيجة المتوقعة.",
      ],
      comparison_new_title: "المنتج الأصلي من متجرنا",
      comparison_new_points: [
        "خامات أصلية 100% مختبرة ومضمونة الجودة.",
        "حق فتح الشحنة والفحص والتجربة قبل الدفع للمندوب.",
        "استبدال واسترجاع مجاني خلال 14 يوماً وخدمة عملاء مستمرة.",
      ],
      comparison_image: prod.images && prod.images.length > 1 ? prod.images[1] : "",
      comparison_image_badge: "أعلى جودة واعتمادية",
      box_title: "محتويات الشحنة الأصلية (طقم كامل متكامل):",
      box_items: [
        "المنتج الأصلي بكافة ملحقاته المعتمدة ومغلف بعناية.",
        "كتالوج ودليل الاستخدام السريع باللغة العربية.",
        "كارت الضمان الرسمي وحق الاستبدال والمعاينة.",
      ],
      box_image: prod.images && prod.images.length > 2 ? prod.images[2] : "",
      how_to_use_title: "طريقة الاستخدام السريعة والمواصفات:",
      how_to_use_steps: [
        { step_num: 1, title: "الخطوة الأولى:", desc: "تجهيز المنتج وتركيب الملحق المناسب بسهولة." },
        { step_num: 2, title: "الخطوة الثانية:", desc: "التشغيل بضغطة زر واحدة واختيار الوضع المطلوب." },
        { step_num: 3, title: "الخطوة الثالثة:", desc: "الاستمتاع بالنتيجة الفورية وبراحة تامة." },
      ],
      how_to_use_image: prod.images && prod.images.length > 3 ? prod.images[3] : "",
      reviews_title: "تجارب حقيقية لعملائنا في مصر:",
      reviews: [
        { name: "أم سليم", location: "التجمع، القاهرة", comment: "المنتج ممتاز ونفس المواصفات المكتوبة بالظبط، والتوصيل كان سريع جداً واستلمت بعد 3 أيام.", rating: 5 },
        { name: "د. محمود كمال", location: "الجيزة", comment: "الخامات ممتازة وخدمة العملاء محترمة وعاينت وجربت مع المندوب قبل ما أدفع.", rating: 5 },
        { name: "هدى عبد الرحمن", location: "الإسكندرية", comment: "اشتريت عرض التوفير والتغليف فندقي ومحترم وأنصح أي حد يشتري منهم.", rating: 5 },
      ],
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lpRes, prodRes] = await Promise.all([
        fetch("/api/landing-pages"),
        fetch("/api/products"),
      ]);
      const [lpJson, prodJson] = await [await lpRes.json(), await prodRes.json()];

      if (lpJson.success) setLandingPages(lpJson.landingPages);
      if (prodJson.success) {
        setProducts(prodJson.products);
        if (prodJson.products.length > 0 && !newProductId) {
          const first = prodJson.products[0];
          setNewProductId(first.id);
          setNewTitle(`صفحة ${first.title_ar}`);
          setNewSlug(first.slug || "new-product");
          setCreationContent(initCreationContentForProduct(first));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProductChange = (prodId: string) => {
    setNewProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setNewTitle(`صفحة ${prod.title_ar}`);
      setNewSlug(prod.slug || `offer-${Date.now().toString().slice(-4)}`);
      setCreationContent(initCreationContentForProduct(prod));
    }
  };

  const handleCopyPrompt = () => {
    const selectedProd = products.find((p) => p.id === newProductId);
    const prodName = selectedProd?.title_ar || "المنتج";
    const promptText = `أنت خبير كتابة صفحات هبوط احترافية ومقنعة (Direct Response Copywriting) للتجارة الإلكترونية في مصر بنظام الدفع عند الاستلام.
المنتج المطلوب هو: "${prodName}".

المطلوب: توليد محتوى كامل ومقنع باللهجة المصرية في صيغة كود JSON فقط لتوليد صفحة هبوط ذات معدل تحويل مرتفع، بالهيكل التالي:

\`\`\`json
{
  "announcement_bar": "عرض خاص: شحن مجاني لجميع المحافظات + حق المعاينة والتجربة قبل الدفع 💵",
  "hero_headline": "${prodName} الأصلي في مصر",
  "hero_subheadline": "جلسة مريحة وحل عملي ونهائي لمشاكل الاستخدام اليومي مع ضمان كامل.",
  "hero_badge": "4.9 / 5.0 (أكثر من 450 تقييم موثق في مصر)",
  "hero_bullets": [
    "خامات أصلية عالية الجودة تضمن المتانة والتحمل طويل الأمد.",
    "تصميم عملي وعصري يلبي احتياجات الاستخدام اليومي بكل سهولة.",
    "آمن وسهل الاستخدام مع ضمان كامل وحق الفحص والمعاينة قبل الدفع.",
    "شحن سريع ومجاني لجميع محافظات مصر وتأكيد فوري للطلب."
  ],
  "comparison_title": "الفرق بين المنتجات التقليدية والمنتج الأصلي",
  "comparison_old_points": [
    "خامات رديئة وضعيفة تتلف بسرعة.",
    "بدون ضمان أو معاينة حقيقية قبل الدفع.",
    "صعوبة في الاستخدام ولا تلبي النتيجة المتوقعة."
  ],
  "comparison_new_points": [
    "خامات أصلية 100% مختبرة ومضمونة الجودة.",
    "حق فتح الشحنة والفحص والتجربة قبل الدفع للمندوب.",
    "استبدال واسترجاع مجاني خلال 14 يوماً وخدمة عملاء مستمرة."
  ],
  "box_title": "محتويات الشحنة الأصلية (طقم كامل متكامل):",
  "box_items": [
    "المنتج الأصلي بكافة ملحقاته المعتمدة ومغلف بعناية.",
    "كتالوج ودليل الاستخدام السريع باللغة العربية.",
    "كارت الضمان الرسمي وحق الاستبدال والمعاينة."
  ],
  "how_to_use_title": "طريقة الاستخدام السريعة والمواصفات:",
  "how_to_use_steps": [
    {"step_num": 1, "title": "الخطوة الأولى:", "desc": "تجهيز المنتج وتركيب الملحق المناسب بسهولة."},
    {"step_num": 2, "title": "الخطوة الثانية:", "desc": "التشغيل بضغطة زر واحدة واختيار الوضع المطلوب."},
    {"step_num": 3, "title": "الخطوة الثالثة:", "desc": "الاستمتاع بالنتيجة الفورية وبراحة تامة."}
  ],
  "reviews_title": "تجارب حقيقية لعملائنا في مصر:",
  "reviews": [
    {"name": "أم سليم", "location": "التجمع، القاهرة", "comment": "المنتج ممتاز ونفس المواصفات المكتوبة بالظبط، والتوصيل كان سريع جداً واستلمت بعد 3 أيام.", "rating": 5},
    {"name": "د. محمود كمال", "location": "الجيزة", "comment": "الخامات ممتازة وخدمة العملاء محترمة وعاينت وجربت مع المندوب قبل ما أدفع.", "rating": 5},
    {"name": "هدى عبد الرحمن", "location": "الإسكندرية", "comment": "اشتريت عرض التوفير والتغليف فندقي ومحترم وأنصح أي حد يشتري منهم.", "rating": 5}
  ]
}
\`\`\`
قم بتخصيص النصوص بدقة للمنتج وأخرج كود الـ JSON فقط بدون أي مقدمات أو كلام خارجي.`;

    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  const handleParseAiResponse = () => {
    if (!aiInputText.trim()) {
      setAiParseMessage("يرجى لصق الرد أو الكود أولاً في الصندوق");
      return;
    }

    try {
      let jsonStr = "";
      const jsonBlockMatch = aiInputText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch && jsonBlockMatch[1]) {
        jsonStr = jsonBlockMatch[1].trim();
      } else {
        const firstBrace = aiInputText.indexOf("{");
        const lastBrace = aiInputText.lastIndexOf("}");
        if (firstBrace > -1 && lastBrace > firstBrace) {
          jsonStr = aiInputText.substring(firstBrace, lastBrace + 1);
        }
      }

      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        if (typeof parsed === "object" && parsed !== null) {
          setCreationContent((prev) => ({
            ...prev,
            ...parsed,
          }));
          if (parsed.hero_headline && !newTitle) {
            setNewTitle(parsed.hero_headline);
          }
          setAiParseMessage("✓ تم استخراج كود الـ JSON بنجاح وتعبئة جميع أقسام صفحة الهبوط!");
          setShowContentEditorInCreate(true);
          return;
        }
      }
    } catch {}

    // Fallback: Smart Arabic text extraction
    const lines = aiInputText.split("\n").map((l) => l.trim()).filter(Boolean);
    const extracted: LandingPageContentConfig = { ...creationContent };
    const bullets: string[] = [];

    lines.forEach((line) => {
      if (/^[-•*]\s*(.+)/.test(line) || /^\d+[\.\-\)]\s*(.+)/.test(line)) {
        const clean = line.replace(/^[-•*\d\.\)\s]+/, "").trim();
        if (clean.length > 5 && bullets.length < 4) {
          bullets.push(clean);
        }
      }
      if (line.includes("العنوان:") || line.includes("عنوان:")) {
        extracted.hero_headline = line.replace(/.*(?:العنوان|عنوان)\s*[:：]/, "").trim();
      }
    });

    if (bullets.length > 0) {
      extracted.hero_bullets = bullets;
    }

    setCreationContent(extracted);
    setAiParseMessage("✓ تم استخراج النصوص وتطبيقها على أقسام الصفحة!");
    setShowContentEditorInCreate(true);
  };

  const handleCreateLandingPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlug || !newTitle || !newProductId) return;

    setIsSubmitting(true);
    try {
      const cleanSlug = newSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");
      const payload = {
        title: newTitle.trim(),
        slug: cleanSlug,
        component_key: "starter-template", // Automatically uses the Universal High-Converting COD Template
        product_id: newProductId,
        meta_pixel_id: newPixelId.trim() || undefined,
        head_scripts: customHeadScripts.trim() || undefined,
        content_config: creationContent,
        status: "active",
        deployment_url: `/p/${cleanSlug}`,
        deployment_status: "published",
        sections_config: DEFAULT_LANDING_PAGE_SECTIONS,
      };

      const res = await fetch("/api/landing-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setAiInputText("");
        setAiParseMessage(null);
        setShowContentEditorInCreate(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyUrl = (slug: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullUrl = `${origin}/p/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };


  const filteredPages = landingPages.filter((lp) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return lp.title?.toLowerCase().includes(q) || lp.slug?.toLowerCase().includes(q);
  });

  const openPage = (id: string) => router.push(`/admin/landing-pages/${id}`);

  const copyButton = (slug: string) => {
    const isCopied = copiedSlug === slug;
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleCopyUrl(slug);
        }}
        onKeyDown={(e) => e.stopPropagation()}
        className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer"
        title="نسخ الرابط"
        aria-label="نسخ الرابط"
      >
        {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
      </button>
    );
  };

  const statusBadge = (status: string) => (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
        status === "active"
          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
          : "bg-amber-100 text-amber-900 border-amber-200"
      }`}
    >
      {status === "active" ? "نشطة" : "متوقفة"}
    </span>
  );

  const thumb = (lp: LandingPage) => {
    const src = lp.content_config?.hero_image || lp.product?.images?.[0];
    return (
      <div className="w-12 h-12 shrink-0 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="w-full h-full object-cover" />
        ) : (
          <Package className="w-5 h-5 text-slate-400" />
        )}
      </div>
    );
  };

  const sectionsCount = (lp: LandingPage) => {
    const merged = mergeSections(lp.sections_config);
    return `${merged.filter((s) => s.enabled).length}/${merged.length}`;
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6 text-right font-sans max-w-6xl mx-auto pb-16" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-950 font-heading">صفحات الهبوط</h1>
          <p className="text-sm text-slate-500 mt-1">
            اضغط على أي صفحة لتعديل أقسامها ونصوصها وصورها أو لفتحها وإيقافها
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto min-h-[44px] py-2.5 px-5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-600/25 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء صفحة هبوط جديدة</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالعنوان أو الرابط..."
            className="w-full pl-9 pr-3.5 min-h-[44px] rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50/50"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 w-full sm:w-auto justify-end">
          <span>إجمالي الصفحات:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-mono text-slate-900">{landingPages.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-600">جاري تحميل صفحات الهبوط...</p>
        </div>
      ) : filteredPages.length > 0 ? (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">صفحة الهبوط</th>
                  <th className="px-4 py-3.5">الرابط</th>
                  <th className="px-4 py-3.5">المنتج والسعر</th>
                  <th className="px-4 py-3.5">الحالة</th>
                  <th className="px-4 py-3.5">الأقسام</th>
                  <th className="px-4 py-3.5">تاريخ الإنشاء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPages.map((lp) => (
                  <tr
                    key={lp.id}
                    tabIndex={0}
                    role="link"
                    aria-label={`تعديل ${lp.title}`}
                    onClick={() => openPage(lp.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") openPage(lp.id);
                    }}
                    className="h-16 cursor-pointer hover:bg-orange-50/40 focus:bg-orange-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500 transition-colors"
                  >
                    <td className="px-5 py-2">
                      <div className="flex items-center gap-3">
                        {thumb(lp)}
                        <span className="font-black text-slate-900 leading-snug">{lp.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-700" dir="ltr">
                          /p/{lp.slug}
                        </span>
                        {copyButton(lp.slug)}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-bold text-slate-900 truncate max-w-[200px]">{lp.product?.title_ar || "منتج"}</div>
                      <div className="font-mono text-xs font-bold text-emerald-600">{lp.product?.base_price || 0} ج.م</div>
                    </td>
                    <td className="px-4 py-2">{statusBadge(lp.status)}</td>
                    <td className="px-4 py-2 font-mono font-bold text-slate-700">{sectionsCount(lp)}</td>
                    <td className="px-4 py-2 text-xs text-slate-500 whitespace-nowrap">{formatDate(lp.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked rows */}
          <div className="lg:hidden space-y-3">
            {filteredPages.map((lp) => (
              <div
                key={lp.id}
                tabIndex={0}
                role="link"
                aria-label={`تعديل ${lp.title}`}
                onClick={() => openPage(lp.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") openPage(lp.id);
                }}
                className="min-h-[72px] bg-white rounded-3xl border border-slate-200 shadow-sm p-4 space-y-3 cursor-pointer active:bg-orange-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <div className="flex items-center gap-3">
                  {thumb(lp)}
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-slate-900 leading-snug truncate">{lp.title}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {lp.product?.title_ar || "منتج"} ·{" "}
                      <span className="font-mono font-bold text-emerald-600">{lp.product?.base_price || 0} ج.م</span>
                    </div>
                  </div>
                  {statusBadge(lp.status)}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-slate-700 truncate" dir="ltr">
                    /p/{lp.slug}
                  </span>
                  <div className="flex items-center gap-2 shrink-0 text-xs text-slate-500">
                    <span>
                      الأقسام <span className="font-mono font-bold text-slate-700">{sectionsCount(lp)}</span>
                    </span>
                    {copyButton(lp.slug)}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400">{formatDate(lp.created_at)}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">لم يتم العثور على أي صفحات هبوط مطابقة</h3>
          <p className="text-xs text-slate-400">يمكنك إنشاء صفحة هبوط جديدة أو مسح كلمة البحث</p>
        </div>
      )}

      <CreateLandingPageModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        products={products}
        createMode={createMode}
        setCreateMode={setCreateMode}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        newSlug={newSlug}
        setNewSlug={setNewSlug}
        newProductId={newProductId}
        newPixelId={newPixelId}
        setNewPixelId={setNewPixelId}
        customHeadScripts={customHeadScripts}
        setCustomHeadScripts={setCustomHeadScripts}
        isSubmitting={isSubmitting}
        copiedPrompt={copiedPrompt}
        aiInputText={aiInputText}
        setAiInputText={setAiInputText}
        aiParseMessage={aiParseMessage}
        setAiParseMessage={setAiParseMessage}
        showContentEditorInCreate={showContentEditorInCreate}
        setShowContentEditorInCreate={setShowContentEditorInCreate}
        activeCreateTab={activeCreateTab}
        setActiveCreateTab={setActiveCreateTab}
        creationContent={creationContent}
        setCreationContent={setCreationContent}
        handleProductChange={handleProductChange}
        handleCopyPrompt={handleCopyPrompt}
        handleParseAiResponse={handleParseAiResponse}
        handleCreateLandingPage={handleCreateLandingPage}
      />
    </div>
  );
}
