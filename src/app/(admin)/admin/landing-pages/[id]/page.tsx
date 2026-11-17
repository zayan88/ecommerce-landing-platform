"use client";

import { Toast } from "../../_components/toast";
import { useConfirm } from "../../_components/confirm";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { LandingPage } from "@/types";
import {
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Power,
  Pencil,
  RefreshCw,
  FileQuestion,
  Loader2,
} from "lucide-react";

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 text-slate-900 placeholder-slate-400 text-sm outline-none transition bg-white";

/** Same rules the server applies, so the merchant sees the final link while typing. */
function previewSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9؀-ۿ\-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default function LandingPageDetailsPage() {
  const confirmAsk = useConfirm();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = decodeURIComponent(String(params?.id || ""));

  const [lp, setLp] = useState<LandingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      // Single-page endpoint = latest saved copy (same source as the public page)
      const json = await fetch(`/api/landing-pages?id=${encodeURIComponent(id)}`).then((r) => r.json());
      const found: LandingPage | null = json?.success ? (json.landingPage as LandingPage) : null;
      setLp(found);
      if (found) {
        setTitle(found.title || "");
        setSlug(found.slug || "");
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
          <p className="text-sm font-bold text-slate-600">جاري تحميل الصفحة...</p>
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
        </div>
      </div>
    );
  }

  const finalSlug = previewSlug(slug);
  const dirty = title.trim() !== lp.title || finalSlug !== lp.slug;
  const isActive = lp.status === "active";

  const saveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/landing-pages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lp.id, title: title.trim(), slug: finalSlug }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "تعذر الحفظ");
      setLp({ ...lp, ...data.landingPage });
      setTitle(data.landingPage.title);
      setSlug(data.landingPage.slug);
      setMessage({ ok: true, text: "تم الحفظ. اسم الصفحة ورابطها اتحدّثوا." });
    } catch (err: any) {
      setMessage({ ok: false, text: err.message || "تعذر الحفظ" });
    } finally {
      setSaving(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(`${window.location.origin}/p/${lp.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const toggleStatus = async () => {
    const next = isActive ? "paused" : "active";
    setBusy(true);
    try {
      const res = await fetch("/api/landing-pages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lp.id, status: next }),
      });
      const data = await res.json();
      if (data.success) setLp({ ...lp, status: next });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!await confirmAsk({ title: "حذف صفحة الهبوط", message: `هتحذف الصفحة "${lp.title}" نهائياً. مش هتقدر ترجّعها.` })) return;
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

  return (
    <div className="space-y-5 text-right font-sans max-w-2xl mx-auto pb-16" dir="rtl">
      {backLink}

      {/* Primary action */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 font-heading leading-snug">{lp.title}</h1>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              isActive ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            {isActive ? "نشطة" : "متوقفة"}
          </span>
        </div>
        <Link
          href={`/admin/landing-pages/${lp.id}/edit`}
          className="w-full min-h-[56px] rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-base shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition"
        >
          <Pencil className="w-5 h-5" /> تعديل وتحرير الصفحة
        </Link>
        <p className="text-xs text-slate-500 text-center leading-relaxed">
          بتفتح الصفحة نفسها وتضغط على أي نص أو صورة أو لون وتعدّله مباشرة.
        </p>
      </div>

      {/* Name and link */}
      <form onSubmit={saveMeta} className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-5">
        <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">بيانات الصفحة</h2>

        <div className="space-y-1.5">
          <label htmlFor="lp-title" className="block text-sm font-black text-slate-900">
            اسم الصفحة
          </label>
          <input
            id="lp-title"
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="مثال: جهاز التدليك الشامل"
          />
          <p className="text-xs text-slate-500">بيظهر في عنوان الصفحة ونتائج البحث.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="lp-slug" className="block text-sm font-black text-slate-900">
            رابط الصفحة
          </label>
          <div className="flex items-stretch gap-0" dir="ltr">
            <span className="px-3 flex items-center rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm font-mono">
              /p/
            </span>
            <input
              id="lp-slug"
              className={`${inputCls} rounded-l-none font-mono`}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              maxLength={80}
              placeholder="my-product"
            />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed" dir="rtl">
            الرابط النهائي:{" "}
            <span className="font-mono" dir="ltr">
              /p/{finalSlug || "..."}
            </span>
            . لو غيّرته، الرابط القديم هيتوقف، فعدّل أي إعلانات بتستخدمه.
          </p>
        </div>

        <Toast message={message} onClose={() => setMessage(null)} />

        <button
          type="submit"
          disabled={!dirty || saving || !title.trim() || !finalSlug}
          className="min-h-[48px] px-7 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm disabled:opacity-40 flex items-center gap-2 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          حفظ الاسم والرابط
        </button>
      </form>

      {/* Other actions */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-3">
        <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">إجراءات</h2>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/p/${lp.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-sm font-bold text-slate-700 flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" /> فتح الصفحة
          </a>
          <button
            type="button"
            onClick={copyUrl}
            className="min-h-[44px] px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-sm font-bold text-slate-700 flex items-center gap-2 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? "تم النسخ" : "نسخ الرابط"}
          </button>
          <button
            type="button"
            onClick={toggleStatus}
            disabled={busy}
            className="min-h-[44px] px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-sm font-bold text-slate-700 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Power className={`w-4 h-4 ${isActive ? "text-amber-600" : "text-emerald-600"}`} />
            {isActive ? "إيقاف الصفحة" : "تفعيل الصفحة"}
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="min-h-[44px] px-4 rounded-xl bg-white border border-red-200 hover:bg-red-50 text-sm font-bold text-red-700 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> حذف
          </button>
        </div>
      </div>
    </div>
  );
}
