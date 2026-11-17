"use client";

import { useConfirm } from "../_components/confirm";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LandingPage, Product, LandingPageContentConfig, DEFAULT_LANDING_PAGE_SECTIONS } from "@/types";
import { Plus, Copy, Check, Search, RefreshCw, FileText, Eye, Pencil, Home } from "lucide-react";
import TablePagination from "@/components/admin/TablePagination";
import CreateLandingPageModal from "./_components/CreateLandingPageModal";

export default function AdminLandingPagesPage() {
  const confirmAsk = useConfirm();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
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

  // The landing page that is the store's home page ("" = the built-in home)
  const [homeSlug, setHomeSlug] = useState("");
  const [homeBusy, setHomeBusy] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      fetch("/api/settings").then((r) => r.json()).then((j) => setHomeSlug(j?.settings?.home_page_slug || "")).catch(() => {});
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

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const setHome = async (slug: string) => {
    setHomeBusy(true);
    try {
      const res = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ home_page_slug: slug }) });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error || "تعذر الحفظ");
      setHomeSlug(slug);
      showToast("success", slug ? "الصفحة دي بقت الصفحة الرئيسية للمتجر" : "رجعت الصفحة الرئيسية الافتراضية");
    } catch (e: any) {
      showToast("error", e.message || "تعذر الحفظ");
    } finally {
      setHomeBusy(false);
    }
  };

  const handleCopyCode = (id: string) => {
    try {
      navigator.clipboard.writeText(id);
    } catch {}
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDuplicate = async (lp: LandingPage) => {
    if (duplicatingId) return;
    setDuplicatingId(lp.id);
    try {
      const taken = new Set(landingPages.map((p) => p.slug));
      const base = `${lp.slug}-copy`;
      let newSlug = base;
      let n = 2;
      while (taken.has(newSlug)) newSlug = `${base}-${n++}`;

      const payload = {
        // no id: the store generates a fresh one
        title: `${lp.title} (نسخة)`,
        slug: newSlug,
        product_id: lp.product_id,
        component_key: lp.component_key,
        meta_pixel_id: lp.meta_pixel_id,
        head_scripts: lp.head_scripts,
        custom_css: lp.custom_css,
        content_config: lp.content_config,
        sections_config: lp.sections_config,
        status: "paused",
        deployment_url: `/p/${newSlug}`,
        deployment_status: "published",
      };
      const res = await fetch("/api/landing-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", `تم إنشاء نسخة "${payload.title}" (متوقفة حتى تفعّلها)`);
        await fetchData();
      } else {
        showToast("error", data.error || "تعذر استنساخ الصفحة");
      }
    } catch {
      showToast("error", "تعذر استنساخ الصفحة");
    } finally {
      setDuplicatingId(null);
    }
  };

  const toggleOne = (id: string) => setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const bulkDelete = async () => {
    if (selected.length === 0 || bulkBusy) return;
    if (!await confirmAsk({ title: "مسح صفحات الهبوط", message: `هتمسح ${selected.length} صفحة هبوط نهائياً. مش هتقدر ترجّعهم.` })) return;
    setBulkBusy(true);
    try {
      const res = await fetch("/api/landing-pages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected }),
      });
      const j = await res.json();
      if (j.success) {
        showToast("success", `تم مسح ${j.deleted} صفحة`);
        setSelected([]);
        await fetchData();
      } else showToast("error", j.error || "تعذر المسح");
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkStatus = async (status: "active" | "paused") => {
    if (selected.length === 0 || bulkBusy) return;
    setBulkBusy(true);
    try {
      const res = await fetch("/api/landing-pages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected, status }),
      });
      const j = await res.json();
      if (j.success) {
        showToast("success", status === "active" ? `اتفعّلت ${j.updated} صفحة` : `اتوقّفت ${j.updated} صفحة`);
        setSelected([]);
        await fetchData();
      } else showToast("error", j.error || "تعذر التحديث");
    } finally {
      setBulkBusy(false);
    }
  };

  const filteredPages = landingPages.filter((lp) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return lp.title?.toLowerCase().includes(q) || lp.slug?.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filteredPages.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedPages = filteredPages.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openPage = (id: string) => router.push(`/admin/landing-pages/${id}`);

  const iconBtn =
    "w-11 h-11 shrink-0 inline-flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer";
  const stop = {
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
  };

  const codeCell = (id: string) => (
    <span className="inline-flex items-center gap-1" {...stop}>
      <span className="font-mono text-xs font-bold text-slate-600" dir="ltr">
        {id.slice(0, 8)}
      </span>
      <button type="button" onClick={() => handleCopyCode(id)} className={iconBtn} title="نسخ الكود" aria-label="نسخ كود الصفحة">
        {copiedId === id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
      </button>
    </span>
  );

  const viewBtn = (lp: LandingPage) => (
    <a
      href={`/p/${lp.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className={iconBtn}
      title="مشاهدة الصفحة"
      aria-label="مشاهدة الصفحة"
      {...stop}
    >
      <Eye className="w-4 h-4" />
    </a>
  );

  const editBtn = (lp: LandingPage, withLabel: boolean) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openPage(lp.id);
      }}
      onKeyDown={(e) => e.stopPropagation()}
      className={`${iconBtn} ${withLabel ? "w-auto px-3 gap-1.5 text-xs font-bold" : ""}`}
      title="تعديل"
      aria-label="تعديل"
    >
      <Pencil className="w-4 h-4" />
      {withLabel && <span>تعديل</span>}
    </button>
  );

  const homeBtn = (lp: LandingPage) => {
    const isHome = homeSlug === lp.slug;
    return (
      <button
        type="button"
        disabled={homeBusy}
        onClick={(e) => {
          e.stopPropagation();
          setHome(isHome ? "" : lp.slug);
        }}
        onKeyDown={(e) => e.stopPropagation()}
        className={`${iconBtn} ${isHome ? "text-emerald-700 bg-emerald-50 border-emerald-300" : ""}`}
        title={isHome ? "دي الصفحة الرئيسية (اضغط للرجوع للافتراضية)" : "اجعلها الصفحة الرئيسية للمتجر"}
        aria-label={isHome ? "الصفحة الرئيسية الحالية" : "اجعلها الصفحة الرئيسية"}
        aria-pressed={isHome}
      >
        <Home className="w-4 h-4" />
      </button>
    );
  };

  const cloneBtn = (lp: LandingPage) => (
    <button
      type="button"
      disabled={duplicatingId === lp.id}
      onClick={(e) => {
        e.stopPropagation();
        handleDuplicate(lp);
      }}
      onKeyDown={(e) => e.stopPropagation()}
      className="min-h-[44px] px-3 inline-flex items-center justify-center rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition cursor-pointer disabled:opacity-50"
      title="استنساخ الصفحة"
      aria-label="استنساخ الصفحة"
    >
      {duplicatingId === lp.id ? "جاري..." : "استنساخ"}
    </button>
  );

  const pausedPill = (lp: LandingPage) =>
    lp.status !== "active" ? (
      <span className="inline-block mr-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 whitespace-nowrap align-middle">
        متوقفة
      </span>
    ) : null;

  return (
    <div className="space-y-6 text-right font-sans max-w-6xl mx-auto pb-16" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-950 font-heading">صفحات الهبوط</h1>
          <p className="text-sm text-slate-500 mt-1">أنشئ صفحات بيع جاهزة وعدّل نصوصها وصورها وأقسامها.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto min-h-[44px] py-2.5 px-5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-600/25 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء صفحة هبوط</span>
        </button>
      </div>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-bold shadow-lg border ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-900 border-red-200"
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Search */}
      <div className="relative w-full sm:w-72">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          placeholder="بحث بالاسم أو الرابط"
          className="w-full pr-9 pl-3.5 min-h-[44px] rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
      </div>

      {selected.length > 0 && (
        <div className="rounded-2xl bg-slate-900 text-white p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-sm font-bold">تم تحديد {selected.length} صفحة</span>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => bulkStatus("active")} disabled={bulkBusy} className="min-h-[40px] px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer disabled:opacity-50">تفعيل</button>
            <button onClick={() => bulkStatus("paused")} disabled={bulkBusy} className="min-h-[40px] px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer disabled:opacity-50">إيقاف</button>
            <button onClick={bulkDelete} disabled={bulkBusy} className="min-h-[40px] px-3 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold cursor-pointer disabled:opacity-50">{bulkBusy ? "جاري..." : "مسح المحدد"}</button>
            <button onClick={() => setSelected([])} className="min-h-[40px] px-3 rounded-lg hover:bg-white/10 text-xs font-bold cursor-pointer">إلغاء التحديد</button>
          </div>
        </div>
      )}

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
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      aria-label="تحديد كل صفحات الصفحة"
                      checked={pagedPages.length > 0 && pagedPages.every((x) => selected.includes(x.id))}
                      onChange={(e) =>
                        setSelected((cur) =>
                          e.target.checked ? Array.from(new Set([...cur, ...pagedPages.map((x) => x.id)])) : cur.filter((id) => !pagedPages.some((x) => x.id === id))
                        )
                      }
                      className="w-4 h-4 cursor-pointer accent-orange-600"
                    />
                  </th>
                  <th className="px-5 py-3.5">اسم الصفحة</th>
                  <th className="px-4 py-3.5">الرابط</th>
                  <th className="px-4 py-3.5">كود الصفحة</th>
                  <th className="px-2 py-3.5 text-center">مشاهدة</th>
                  <th className="px-2 py-3.5 text-center">تعديل</th>
                  <th className="px-2 py-3.5 text-center">استنساخ</th>
                  <th className="px-2 py-3.5 text-center">الرئيسية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedPages.map((lp) => (
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
                    <td className="px-4 py-2" {...stop}>
                      <input type="checkbox" aria-label="تحديد الصفحة" checked={selected.includes(lp.id)} onChange={() => toggleOne(lp.id)} className="w-4 h-4 cursor-pointer accent-orange-600" />
                    </td>
                    <td className="px-5 py-2">
                      <span className="font-black text-slate-900 leading-snug">{lp.title}</span>
                      {pausedPill(lp)}
                    </td>
                    <td className="px-4 py-2">
                      <span className="font-mono text-xs font-bold text-slate-600" dir="ltr">
                        /p/{lp.slug}
                      </span>
                    </td>
                    <td className="px-4 py-2">{codeCell(lp.id)}</td>
                    <td className="px-2 py-2 text-center">{viewBtn(lp)}</td>
                    <td className="px-2 py-2 text-center">{editBtn(lp, true)}</td>
                    <td className="px-2 py-2 text-center">{cloneBtn(lp)}</td>
                    <td className="px-2 py-2 text-center">{homeBtn(lp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked rows */}
          <div className="lg:hidden space-y-3">
            {pagedPages.map((lp) => (
              <div
                key={lp.id}
                tabIndex={0}
                role="link"
                aria-label={`تعديل ${lp.title}`}
                onClick={() => openPage(lp.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") openPage(lp.id);
                }}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 space-y-2 cursor-pointer active:bg-orange-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <div className="flex items-start gap-3">
                  <span {...stop} className="pt-0.5">
                    <input type="checkbox" aria-label="تحديد الصفحة" checked={selected.includes(lp.id)} onChange={() => toggleOne(lp.id)} className="w-5 h-5 cursor-pointer accent-orange-600" />
                  </span>
                  <div className="font-black text-slate-900 leading-snug">
                    {lp.title}
                    {pausedPill(lp)}
                  </div>
                </div>
                <div className="font-mono text-xs font-bold text-slate-500 truncate" dir="ltr">
                  /p/{lp.slug}
                </div>
                <div className="flex items-center justify-between gap-1 pt-1">
                  {codeCell(lp.id)}
                  <div className="flex items-center gap-1">
                    {viewBtn(lp)}
                    {editBtn(lp, false)}
                    {cloneBtn(lp)}
                    {homeBtn(lp)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <TablePagination
            total={filteredPages.length}
            page={currentPage}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
          />
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
