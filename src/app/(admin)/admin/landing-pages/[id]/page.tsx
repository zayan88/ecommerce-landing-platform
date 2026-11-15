"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { LandingPage, Product, mergeSections } from "@/types";
import {
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Sliders,
  Edit3,
  Power,
  RefreshCw,
  FileQuestion,
} from "lucide-react";
import SectionsPanel from "../_components/SectionsPanel";
import ContentPanel from "../_components/ContentPanel";
import { useLandingPageEditor } from "../_lib/useLandingPageEditor";

type DetailTab = "sections" | "content";

export default function LandingPageDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = decodeURIComponent(String(params?.id || ""));

  const [lp, setLp] = useState<LandingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DetailTab>("sections");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [lpRes, prodRes] = await Promise.all([fetch("/api/landing-pages"), fetch("/api/products")]);
      const lpJson = await lpRes.json();
      const prodJson = await prodRes.json();
      const products: Product[] = prodJson.success ? prodJson.products || [] : [];
      const found: LandingPage | undefined = lpJson.success
        ? (lpJson.landingPages as LandingPage[]).find((x) => x.id === id)
        : undefined;
      if (found) {
        const prod = found.product || products.find((p) => p.id === found.product_id);
        setLp({ ...found, product: prod });
      } else {
        setLp(null);
      }
    } catch (err) {
      console.error(err);
      setLp(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const editor = useLandingPageEditor(lp, (patch) =>
    setLp((prev) => (prev ? { ...prev, ...patch } : prev))
  );

  const handleCopyUrl = () => {
    if (!lp) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    navigator.clipboard.writeText(`${origin}/p/${lp.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleToggleStatus = async () => {
    if (!lp) return;
    const next = lp.status === "active" ? "paused" : "active";
    setBusy(true);
    try {
      const res = await fetch("/api/landing-pages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lp.id, status: next }),
      });
      const data = await res.json();
      if (data.success) setLp({ ...lp, status: next });
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!lp) return;
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف صفحة الهبوط "${lp.title}"؟`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/landing-pages?id=${lp.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        router.push("/admin/landing-pages");
        return;
      }
    } catch (err) {
      console.error(err);
    }
    setBusy(false);
  };

  const backLink = (
    <Link
      href="/admin/landing-pages"
      className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-bold text-slate-600 hover:text-slate-900"
    >
      <ArrowRight className="w-4 h-4" />
      <span>صفحات الهبوط</span>
    </Link>
  );

  if (loading) {
    return (
      <div className="space-y-4 text-right font-sans" dir="rtl">
        {backLink}
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-600">جاري تحميل صفحة الهبوط...</p>
        </div>
      </div>
    );
  }

  if (!lp) {
    return (
      <div className="space-y-4 text-right font-sans" dir="rtl">
        {backLink}
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
          <FileQuestion className="w-12 h-12 text-slate-300 mx-auto" />
          <h1 className="text-base font-bold text-slate-700">لم يتم العثور على صفحة الهبوط</h1>
          <p className="text-xs text-slate-400">ربما تم حذفها أو أن الرابط غير صحيح</p>
          <Link
            href="/admin/landing-pages"
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold"
          >
            العودة إلى القائمة
          </Link>
        </div>
      </div>
    );
  }

  const isActive = lp.status === "active";
  const merged = mergeSections(lp.sections_config);
  const activeCount = merged.filter((s) => s.enabled).length;

  const tabBtn = (key: DetailTab, label: string, Icon: typeof Sliders) => {
    const selected = tab === key;
    return (
      <button
        type="button"
        role="tab"
        id={`tab-${key}`}
        aria-selected={selected}
        aria-controls={`panel-${key}`}
        tabIndex={selected ? 0 : -1}
        onClick={() => setTab(key)}
        className={`min-h-[48px] px-4 sm:px-6 rounded-xl text-sm font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
          selected ? "bg-orange-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="space-y-5 text-right font-sans max-w-5xl mx-auto pb-16" dir="rtl">
      {backLink}

      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 font-heading leading-snug">{lp.title}</h1>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              isActive
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-100 text-amber-900 border-amber-200"
            }`}
          >
            {isActive ? "نشطة" : "متوقفة"}
          </span>
        </div>
        <p className="text-xs text-slate-500 font-mono" dir="ltr">
          /p/{lp.slug} · {activeCount}/{merged.length}
        </p>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/p/${lp.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold flex items-center gap-2 shadow-sm transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>فتح الصفحة</span>
          </a>
          <button
            type="button"
            onClick={handleCopyUrl}
            className="min-h-[44px] px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-sm font-bold text-slate-700 flex items-center gap-2 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">تم النسخ</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>نسخ الرابط</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={busy}
            className="min-h-[44px] px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-sm font-bold text-slate-700 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            <Power className={`w-4 h-4 ${isActive ? "text-amber-600" : "text-emerald-600"}`} />
            <span>{isActive ? "إيقاف الصفحة" : "تفعيل الصفحة"}</span>
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="min-h-[44px] px-4 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-sm font-bold text-rose-700 flex items-center gap-2 transition cursor-pointer disabled:opacity-50 sm:mr-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>حذف</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="تعديل صفحة الهبوط"
        className="flex items-center gap-1.5 bg-white rounded-2xl border border-slate-200 shadow-sm p-1.5 overflow-x-auto"
      >
        {tabBtn("sections", "الأقسام", Sliders)}
        {tabBtn("content", "النصوص والصور", Edit3)}
      </div>

      {tab === "sections" ? (
        <div role="tabpanel" id="panel-sections" aria-labelledby="tab-sections">
          <SectionsPanel
            customSections={editor.customSections}
            isSavingSections={editor.isSavingSections}
            sectionSaveSuccess={editor.sectionSaveSuccess}
            handleToggleSection={editor.handleToggleSection}
            handleMoveSection={editor.handleMoveSection}
            handleResetSections={editor.handleResetSections}
            handleSaveSections={editor.handleSaveSections}
          />
        </div>
      ) : (
        <div role="tabpanel" id="panel-content" aria-labelledby="tab-content">
          <ContentPanel
            contentForm={editor.contentForm}
            setContentForm={editor.setContentForm}
            activeContentTab={editor.activeContentTab}
            setActiveContentTab={editor.setActiveContentTab}
            isSavingContent={editor.isSavingContent}
            contentSaveSuccess={editor.contentSaveSuccess}
            handleSaveContent={editor.handleSaveContent}
          />
        </div>
      )}
    </div>
  );
}
