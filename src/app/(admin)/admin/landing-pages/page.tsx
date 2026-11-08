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
} from "lucide-react";

export default function AdminLandingPagesPage() {
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Landing Page Form
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newComponentKey, setNewComponentKey] = useState("");
  const [newProductId, setNewProductId] = useState("");
  const [newPixelId, setNewPixelId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        if (prodJson.products.length > 0) {
          setNewProductId(prodJson.products[0].id);
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

  const handleToggleStatus = async (lp: LandingPage) => {
    const newStatus = lp.status === "active" ? "paused" : "active";
    try {
      const res = await fetch("/api/landing-pages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lp.id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
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
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف صفحة الهبوط "${title}" نهائياً؟`)) {
      return;
    }
    try {
      const res = await fetch(`/api/landing-pages?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || "تعذر حذف الصفحة");
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء محاولة الحذف");
    }
  };

  const handleCreateLandingPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlug || !newTitle || !newProductId) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: newTitle.trim(),
        slug: newSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-"),
        component_key: (newComponentKey.trim() || newSlug.trim()).toLowerCase(),
        product_id: newProductId,
        meta_pixel_id: newPixelId.trim() || undefined,
        status: "active",
        deployment_url: `/p/${newSlug.trim()}`,
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
        setNewTitle("");
        setNewSlug("");
        setNewComponentKey("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-950 font-heading">
            إدارة صفحات الهبوط المستقلة
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            سجل وتوجيه صفحات الهبوط المتصلة بالنظام المركزي وتتبع روابط النشر
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 shadow-md shadow-emerald-600/25 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل صفحة هبوط جديدة</span>
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
                lp.status === "active" ? "border-gray-200/90" : "border-amber-200 bg-amber-50/20"
              }`}
            >
              <div className="p-6 space-y-4">
                {/* Status Badges */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      lp.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-100 text-amber-800 border border-amber-300"
                    }`}
                  >
                    {lp.status === "active" ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>نشط (يستقبل طلبات)</span>
                      </>
                    ) : (
                      <>
                        <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>متوقف مؤقتاً</span>
                      </>
                    )}
                  </span>

                  <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {lp.last_published_at
                        ? new Date(lp.last_published_at).toLocaleDateString("ar-EG")
                        : "منشور"}
                    </span>
                  </span>
                </div>

                {/* Title & Product */}
                <div>
                  <h3 className="text-lg font-black text-gray-900 font-heading leading-tight mb-1">
                    {lp.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>المنتج:</span>
                    <span className="font-bold text-gray-800">
                      {lp.product?.title_ar || "منتج غير محدد"}
                    </span>
                  </div>
                </div>

                {/* URL and Deployment Info */}
                <div className="bg-slate-50 rounded-xl p-3 border border-gray-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-semibold">مسار الصفحة:</span>
                    <span className="font-mono font-bold text-emerald-700" dir="ltr">
                      {fullUrl}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">المكون البرمجي:</span>
                    <span className="font-mono text-gray-700 bg-gray-200/60 px-1.5 py-0.5 rounded">
                      {lp.component_key}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">بيكسل ميتا (Pixel):</span>
                    <span className="font-mono text-gray-700">
                      {lp.meta_pixel_id ? `ID: ${lp.meta_pixel_id}` : "الافتراضي"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">حالة النشر:</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      منشور على Vercel
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleStatus(lp)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                      lp.status === "active"
                        ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    }`}
                  >
                    {lp.status === "active" ? (
                      <>
                        <PauseCircle className="w-3.5 h-3.5" />
                        <span>إيقاف مؤقت</span>
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>تفعيل الصفحة</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteLandingPage(lp.id, lp.title)}
                    className="py-2 px-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    title="حذف صفحة الهبوط"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">حذف</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopyUrl(lp.slug)}
                    className="py-2 px-3 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
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

                  <a
                    href={fullUrl}
                    target="_blank"
                    className="py-2 px-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold flex items-center gap-1 shadow-xs transition"
                  >
                    <span>معاينة</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Register New Landing Page Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900 font-heading">
                تسجيل صفحة هبوط جديدة
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLandingPage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  عنوان صفحة الهبوط
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: صفحة وعاء التبول المحمول - حملة رمضان"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  المسار الفرعي (Slug)
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="portable-urinal-v2"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden text-right font-mono"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  الرابط سيكون: /p/{newSlug || "your-slug"}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  المنتج المرتبط بالصفحة
                </label>
                <select
                  value={newProductId}
                  onChange={(e) => setNewProductId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title_ar} ({p.base_price} ج.م)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  مفتاح المكون البرمجي (Component Key)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={newComponentKey}
                  onChange={(e) => setNewComponentKey(e.target.value)}
                  placeholder="portable-urinal"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden text-right font-mono"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  اسم المجلد في `src/landing-pages/[key]`
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  معرف بيكسل فيسبوك مخصص (اختياري)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={newPixelId}
                  onChange={(e) => setNewPixelId(e.target.value)}
                  placeholder="اتركه فارغاً لاستخدام البيكسل الافتراضي"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden text-right font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? "جاري الحفظ..." : "حفظ ونشر الصفحة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
