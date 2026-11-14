"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LandingPage, Product, LandingPageSectionConfig, DEFAULT_LANDING_PAGE_SECTIONS } from "@/types";
import {
  Layers,
  Plus,
  ExternalLink,
  Copy,
  Check,
  PauseCircle,
  PlayCircle,
  Sparkles,
  Calendar,
  Globe,
  Tag,
  X,
  AlertCircle,
  ShieldCheck,
  Trash2,
  Zap,
  Wand2,
  Package,
  Sliders,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  RotateCcw,
} from "lucide-react";

export default function AdminLandingPagesPage() {
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Section Customizer State
  const [customizingLp, setCustomizingLp] = useState<LandingPage | null>(null);
  const [customSections, setCustomSections] = useState<LandingPageSectionConfig[]>([]);
  const [isSavingSections, setIsSavingSections] = useState(false);
  const [sectionSaveSuccess, setSectionSaveSuccess] = useState(false);

  // Creation Mode: "quick" | "ai_prompt" | "safka"
  const [createMode, setCreateMode] = useState<"quick" | "ai_prompt" | "safka">("quick");

  // New Landing Page Form
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newProductId, setNewProductId] = useState("");
  const [newPixelId, setNewPixelId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

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
          setNewProductId(prodJson.products[0].id);
          setNewTitle(`صفحة ${prodJson.products[0].title_ar}`);
          setNewSlug(prodJson.products[0].slug || "new-product");
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
    }
  };

  const handleCopyPrompt = () => {
    const selectedProd = products.find((p) => p.id === newProductId);
    const prodName = selectedProd?.title_ar || "المنتج";
    const promptText = `أنت خبير كتابة صفحات هبوط (Direct Response Copywriter) للتجارة الإلكترونية في مصر بنظام الدفع عند الاستلام.
المنتج هو: "${prodName}".
المطلوب استخراج وكتابة الآتي باللهجة المصرية المقنعة والمختصرة جداً بدون رغي أو حشو:
1. عنوان جذاب مباشر في سطر واحد يوضح الفائدة الأساسية.
2. 4 مميزات أساسية للمنتج (كل ميزة في جملة واحدة واضحة).
3. محتويات العلبة (بتستلم إيه لما تفتح الشحنة).
4. باقات العروض:
   - قطعة واحدة
   - قطعتان (وفر أكثر + شحن مجاني)
   - 3 قطع (العرض العائلي الشامل)`;

    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
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

  const handleDeleteLandingPage = async (id: string, title: string) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف صفحة الهبوط "${title}"؟`)) {
      return;
    }
    try {
      const res = await fetch(`/api/landing-pages?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Section Customizer Methods
  const openSectionCustomizer = (lp: LandingPage) => {
    setCustomizingLp(lp);
    const existing =
      lp.sections_config && lp.sections_config.length > 0
        ? JSON.parse(JSON.stringify(lp.sections_config))
        : JSON.parse(JSON.stringify(DEFAULT_LANDING_PAGE_SECTIONS));
    setCustomSections(existing);
    setSectionSaveSuccess(false);
  };

  const handleToggleSection = (id: string) => {
    setCustomSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    setCustomSections((prev) => {
      const copy = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleResetSections = () => {
    setCustomSections(JSON.parse(JSON.stringify(DEFAULT_LANDING_PAGE_SECTIONS)));
  };

  const handleSaveSections = async () => {
    if (!customizingLp) return;
    setIsSavingSections(true);
    try {
      const res = await fetch("/api/landing-pages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: customizingLp.id,
          sections_config: customSections,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSectionSaveSuccess(true);
        setLandingPages((prev) =>
          prev.map((lp) =>
            lp.id === customizingLp.id ? { ...lp, sections_config: customSections } : lp
          )
        );
        setTimeout(() => {
          setCustomizingLp(null);
          setSectionSaveSuccess(false);
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingSections(false);
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-950 font-heading">
            إدارة صفحات الهبوط المستقلة (COD Funnels)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            أنشئ صفحات هبوط احترافية ومستقلة لإعلانات فيسبوك وتيك توك مع التحكم الكامل في إظهار وإخفاء وترتيب الأقسام
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 shadow-md shadow-emerald-600/25 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء صفحة هبوط جديدة</span>
        </button>
      </div>

      {/* Landing Pages Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {landingPages.map((lp) => {
          const fullUrl = `/p/${lp.slug}`;
          const isCopied = copiedSlug === lp.slug;
          const activeSectionsCount = lp.sections_config
            ? lp.sections_config.filter((s) => s.enabled).length
            : DEFAULT_LANDING_PAGE_SECTIONS.length;
          const totalSectionsCount = lp.sections_config
            ? lp.sections_config.length
            : DEFAULT_LANDING_PAGE_SECTIONS.length;

          return (
            <div
              key={lp.id}
              className={`bg-white rounded-3xl border transition-all shadow-xs flex flex-col justify-between overflow-hidden ${
                lp.status === "active" ? "border-gray-200 hover:border-emerald-300" : "border-amber-200 bg-amber-50/20"
              }`}
            >
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      قالب COD رشيق ومعدّل
                    </span>
                    <h3 className="text-base font-bold text-gray-900 leading-snug pt-1">
                      {lp.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleDeleteLandingPage(lp.id, lp.title)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    title="حذف صفحة الهبوط"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-gray-100 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-gray-500">
                    <span>الرابط المباشر:</span>
                    <span className="font-mono text-slate-800 font-bold dir-ltr">/p/{lp.slug}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span>المنتج المرتبط:</span>
                    <span className="font-bold text-slate-900 truncate max-w-[170px]">{lp.product?.title_ar || "منتج"}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span>السعر:</span>
                    <span className="font-bold text-emerald-600 font-mono">{lp.product?.base_price || 0} ج.م</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleCopyUrl(lp.slug)}
                    className="py-1.5 px-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center gap-1 shadow-2xs transition"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                        <span>نسخ الرابط</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => openSectionCustomizer(lp)}
                    className="py-1.5 px-2.5 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-xs font-bold text-indigo-700 flex items-center gap-1 shadow-2xs transition cursor-pointer"
                    title="تخصيص وترتيب أقسام الصفحة"
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    <span>تخصيص الأقسام ({activeSectionsCount}/{totalSectionsCount})</span>
                  </button>
                </div>

                <a
                  href={fullUrl}
                  target="_blank"
                  className="py-1.5 px-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold flex items-center gap-1 shadow-xs transition"
                >
                  <span>معاينة</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION CUSTOMIZER MODAL */}
      {customizingLp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 max-h-[90vh] flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-gray-900 font-heading flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  <span>تخصيص وترتيب أقسام صفحة الهبوط</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  تحكّم في إظهار أو إخفاء أي قسم، واستخدم الأسهم لتغيير مكان وترتيب كل قسم
                </p>
              </div>
              <button
                onClick={() => setCustomizingLp(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Sections */}
            <div className="overflow-y-auto pr-1 space-y-2 py-1 max-h-[50vh]">
              {customSections.map((sec, index) => {
                const isFirst = index === 0;
                const isLast = index === customSections.length - 1;

                return (
                  <div
                    key={sec.id}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      sec.enabled
                        ? "bg-slate-50 border-slate-200"
                        : "bg-gray-100/60 border-gray-200 opacity-60"
                    }`}
                  >
                    {/* Index & Title */}
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-xs font-bold font-mono text-slate-700 flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div>
                        <span className={`text-xs sm:text-sm font-bold block ${sec.enabled ? "text-slate-900" : "text-gray-500 line-through"}`}>
                          {sec.name_ar}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          ID: {sec.id}
                        </span>
                      </div>
                    </div>

                    {/* Controls (Move Up/Down & Toggle) */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Move Up */}
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleMoveSection(index, "up")}
                        className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="تحريك لأعلى"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMoveSection(index, "down")}
                        className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="تحريك لأسفل"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Toggle Visibility */}
                      <button
                        type="button"
                        onClick={() => handleToggleSection(sec.id)}
                        className={`py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                          sec.enabled
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300 border border-gray-300"
                        }`}
                      >
                        {sec.enabled ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-700" />
                            <span>ظاهر</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                            <span>مخفي</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleResetSections}
                className="py-2 px-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                <span>الترتيب الافتراضي</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCustomizingLp(null)}
                  className="py-2.5 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={isSavingSections}
                  onClick={handleSaveSections}
                  className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {sectionSaveSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>تم الحفظ والتطبيق!</span>
                    </>
                  ) : isSavingSections ? (
                    <span>جاري الحفظ...</span>
                  ) : (
                    <span>حفظ وتطبيق التغييرات</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Mode Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-gray-900 font-heading">
                  إنشاء صفحة هبوط جديدة
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">اختر الطريقة الأسهل والأنسب لك</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setCreateMode("quick")}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  createMode === "quick" ? "bg-white text-emerald-700 shadow-xs" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>الوضع السريع التلقائي (1-Click)</span>
              </button>

              <button
                type="button"
                onClick={() => setCreateMode("ai_prompt")}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  createMode === "ai_prompt" ? "bg-white text-indigo-700 shadow-xs" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Wand2 className="w-4 h-4 text-indigo-600" />
                <span>برومبت الـ AI المجاني</span>
              </button>
            </div>

            <form onSubmit={handleCreateLandingPage} className="space-y-4">
              {/* Product Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  اختر المنتج المراد إنشاء صفحة هبوط له
                </label>
                <select
                  value={newProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title_ar} — ({p.base_price} ج.م)
                    </option>
                  ))}
                </select>
              </div>

              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    عنوان الصفحة
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    رابط الصفحة (Slug)
                  </label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono text-right"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">/p/{newSlug || "slug"}</span>
                </div>
              </div>

              {/* Mode Specific Helpers */}
              {createMode === "quick" ? (
                <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 text-xs text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>توليد تلقائي فوري 100%</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-emerald-700">
                    السيستم هيسحب صور المنتج وأسعاره ومواصفاته أوتوماتيك ويولّد صفحة هبوط رشيقة متطابقة مع معايير الـ COD (سلايدر صور + باقات عروض + فورم طلب مباشر + إشعار تليجرام).
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Wand2 className="w-4 h-4 text-indigo-600" />
                      <span>برومبت الذكاء الاصطناعي المجاني:</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className="py-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-xs transition"
                    >
                      {copiedPrompt ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPrompt ? "تم النسخ!" : "نسخ البرومبت لـ ChatGPT"}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-indigo-800 leading-relaxed">
                    انسخ البرومبت وافتحه في حسابك المجاني في ChatGPT، وانسخ النتيجة هنا لو عايز تعدل وصف المنتج.
                  </p>
                </div>
              )}

              {/* Meta Pixel Override (Optional) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  معرف بيكسل فيسبوك مخصص للحملة (اختياري)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={newPixelId}
                  onChange={(e) => setNewPixelId(e.target.value)}
                  placeholder="اتركه فارغاً لاستخدام البيكسل الافتراضي للمتجر"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono text-right"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? "جاري النشر..." : "🚀 إنشاء ونشر صفحة الهبوط فوراً"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
