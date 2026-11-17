"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, MousePointerClick, RotateCcw } from "lucide-react";
import { StoreTabs } from "../../_components/store-tabs";
import { Toast, type ToastMessage } from "../../_components/toast";
import { useConfirm } from "../../_components/confirm";

const card = "bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-4";

/** "Store settings" > "Edit the home page": opens the live editor (the page itself, editable in place). */
export default function HomeSettingsPage() {
  const confirmAsk = useConfirm();
  const [loading, setLoading] = useState(true);
  const [custom, setCustom] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((j) => setCustom(Boolean(j?.settings?.home_content && Object.keys(j.settings.home_content).length > 0)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const reset = async () => {
    if (!(await confirmAsk({ title: "استرجاع الصفحة الرئيسية", tone: "neutral", confirmText: "استرجاع", message: "هتمسح كل تعديلاتك على الصفحة الرئيسية وترجع للنصوص الجاهزة. تكمّل؟" }))) return;
    setBusy(true);
    try {
      const res = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ home_content: {} }) });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error || "تعذر الحفظ");
      setCustom(false);
      setToast({ ok: true, text: "رجعت الصفحة الرئيسية للنصوص الجاهزة" });
    } catch (e: any) {
      setToast({ ok: false, text: e.message || "تعذر الحفظ" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5 text-right" dir="rtl">
      <Toast message={toast} onClose={() => setToast(null)} />
      <h1 className="text-2xl font-black text-slate-900 font-heading">إعدادات المتجر</h1>
      <StoreTabs />

      {loading ? (
        <div className="p-10 flex items-center justify-center text-slate-500 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> جاري التحميل...
        </div>
      ) : (
        <>
          <section className={card}>
            <div className="flex items-start gap-3">
              <span className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <MousePointerClick className="w-6 h-6" />
              </span>
              <div className="space-y-1">
                <h2 className="text-lg font-black text-slate-900">تحرير الصفحة الرئيسية مباشرة</h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  بتفتح الصفحة الرئيسية بنفسها وتعدّلها زي أي صفحة هبوط: اضغط على أي نص واكتب، واضغط × عشان تحذف زرار أو شارة أو قسم، و«+ إضافة» عشان ترجّع حاجة.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/settings/home/edit" className="min-h-[48px] px-6 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm flex items-center gap-2">
                <MousePointerClick className="w-4 h-4" /> فتح المحرر
              </Link>
              <a href="/" target="_blank" rel="noopener noreferrer" className="min-h-[48px] px-5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm flex items-center gap-2">
                <ExternalLink className="w-4 h-4" /> مشاهدة الصفحة
              </a>
            </div>
          </section>

          <section className={card}>
            <h2 className="text-lg font-black text-slate-900">استرجاع النصوص الجاهزة</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {custom ? "الصفحة الرئيسية متعدّلة. زرار الاسترجاع بيمسح كل تعديلاتك." : "الصفحة الرئيسية دلوقتي على النصوص الجاهزة (حسب لغة المتجر)."} تقدر كمان تخلّي أي صفحة هبوط هي الرئيسية من قائمة صفحات الهبوط.
            </p>
            <button type="button" onClick={reset} disabled={busy || !custom} className="min-h-[48px] px-5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} استرجاع النصوص الجاهزة
            </button>
          </section>
        </>
      )}
    </div>
  );
}
