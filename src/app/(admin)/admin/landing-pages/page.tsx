"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LandingPage, Product } from "@/types";
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
} from "lucide-react";

export default function AdminLandingPagesPage() {
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
  const [customFeatures, setCustomFeatures] = useState("");
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

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-950 font-heading">
            إدارة صفحات الهبوط المستقلة (COD Funnels)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            أنشئ صفحات هبوط احترافية ومستقلة لإعلانات فيسبوك وتيك توك بدون كتابة كود وبشحن ودفع عند الاستلام فوري
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
                      قالب COD رشيق وسريع
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

              <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleCopyUrl(lp.slug)}
                  className="py-2 px-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center gap-1.5 shadow-2xs transition"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-gray-500" />
                      <span>نسخ الرابط للإعلان</span>
                    </>
                  )}
                </button>

                <a
                  href={fullUrl}
                  target="_blank"
                  className="py-2 px-3.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold flex items-center gap-1 shadow-xs transition"
                >
                  <span>معاينة فورية</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

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
