"use client";

import { PageHeader, Toast } from "../_components/toast";
import { useConfirm } from "../_components/confirm";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { PALETTE_KEYS } from "@/lib/palettes";
import { PaletteSwatches } from "@/components/admin/PaletteSwatches";
import { ImageUploader } from "@/components/admin/ImageUploader";

interface BrandForm {
  store_name: string;
  store_tagline: string;
  logo_url: string;
  favicon_url: string;
  brand_primary: string;
  brand_accent: string;
  support_phone: string;
  support_whatsapp: string;
  support_email: string;
  site_domain: string;
  currency_symbol: string;
  lang_mode: "ar" | "en" | "both";
  lang_default: "ar" | "en";
  home_reviews: { name: string; place: string; comment: string; rating: number }[];
}

const EMPTY: BrandForm = {
  store_name: "",
  store_tagline: "",
  logo_url: "",
  favicon_url: "",
  brand_primary: "emerald",
  brand_accent: "orange",
  support_phone: "",
  support_whatsapp: "",
  support_email: "",
  site_domain: "",
  currency_symbol: "ج.م",
  lang_mode: "ar",
  lang_default: "ar",
  home_reviews: [],
};

const CURRENCIES = ["ج.م", "ر.س", "د.إ", "د.ك", "د.ب", "ر.ع", "ر.ق", "د.أ", "$"];

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 text-slate-900 placeholder-slate-400 text-sm outline-none transition bg-white";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-black text-slate-900">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-500 leading-relaxed">{hint}</p>}
    </div>
  );
}

export default function BrandPage() {
  const confirmAsk = useConfirm();
  const router = useRouter();
  const [form, setForm] = useState<BrandForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        const s = d.settings || {};
        setForm({
          store_name: s.store_name || "",
          store_tagline: s.store_tagline || "",
          logo_url: s.logo_url || "",
          favicon_url: s.favicon_url || "",
          brand_primary: PALETTE_KEYS.includes(s.brand_primary) ? s.brand_primary : "emerald",
          brand_accent: PALETTE_KEYS.includes(s.brand_accent) ? s.brand_accent : "orange",
          support_phone: s.support_phone || "",
          support_whatsapp: s.support_whatsapp || "",
          support_email: s.support_email || "",
          site_domain: s.site_domain || "",
          currency_symbol: s.currency_symbol || "ج.م",
          lang_mode: s.lang_switch === false ? (s.lang_default === "en" ? "en" : "ar") : "both",
          lang_default: s.lang_default === "en" ? "en" : "ar",
          home_reviews: Array.isArray(s.home_reviews)
            ? s.home_reviews.map((r: any) => ({ name: r.name || "", place: r.place || "", comment: r.comment || "", rating: Number(r.rating) || 5 }))
            : [],
        });
      })
      .catch(() => setMessage({ ok: false, text: "تعذر تحميل الإعدادات" }))
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof BrandForm>(k: K, v: BrandForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          // language: one of Arabic only / English only / both (the visitor chooses)
          lang_switch: form.lang_mode === "both",
          lang_default: form.lang_mode === "en" ? "en" : form.lang_mode === "ar" ? "ar" : form.lang_default,
          onboarding_done: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "تعذر الحفظ");
      setMessage({ ok: true, text: "تم الحفظ. إعدادات المتجر اتحدّثت." });
      router.refresh();
    } catch (err: any) {
      setMessage({ ok: false, text: err.message || "تعذر الحفظ" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center text-slate-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> جاري التحميل...
      </div>
    );
  }

  return (
    <form onSubmit={save} className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5 text-right" dir="rtl">
      <PageHeader title="الإعدادات" saving={saving} />
      <div>
        <p className="text-sm text-slate-600 mt-1">تحكم في متجرك: الاسم، الشكل، الألوان، اللوجو وبيانات التواصل.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-6">
        <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">إعدادات المتجر</h2>

        <Field label="اسم المتجر">
          <input className={inputCls} value={form.store_name} onChange={(e) => set("store_name", e.target.value)} placeholder="مثال: متجر النور" maxLength={80} />
        </Field>

        <Field label="وصف قصير (اختياري)" hint="بيظهر بجانب الاسم في عنوان الصفحة ونتائج البحث.">
          <input className={inputCls} value={form.store_tagline} onChange={(e) => set("store_tagline", e.target.value)} placeholder="مثال: منتجات مختارة بشحن مجاني" maxLength={80} />
        </Field>

        <Field label="لون الموقع">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-600 mb-2">لون الثقة (الضمانات والشحن المجاني)</p>
              <PaletteSwatches value={form.brand_primary} onChange={(k) => set("brand_primary", k)} label="لون الثقة" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-600 mb-2">لون زرار الطلب</p>
              <PaletteSwatches value={form.brand_accent} onChange={(k) => set("brand_accent", k)} label="لون زرار الطلب" />
            </div>
          </div>
        </Field>

        <Field label="لوجو الموقع" hint="ارفع صورة اللوجو من جهازك. الأفضل صورة بخلفية شفافة (PNG).">
          <ImageUploader value={form.logo_url} onChange={(u) => set("logo_url", u)} heightClass="h-32" />
        </Field>

        <Field label="الأيقونة الصغيرة (أيقونة المتصفح) 16×16" hint="صورة مربعة بتظهر في تبويب المتصفح. لو سيبتها فاضية بنستخدم اللوجو.">
          <ImageUploader value={form.favicon_url} onChange={(u) => set("favicon_url", u)} heightClass="h-32" />
        </Field>

        <Field label="العملة">
          <select className={inputCls} value={form.currency_symbol} onChange={(e) => set("currency_symbol", e.target.value)}>
            {CURRENCIES.includes(form.currency_symbol) ? null : <option value={form.currency_symbol}>{form.currency_symbol}</option>}
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="لغة المتجر" hint="اللغة اللي بتظهر بيها صفحات المتجر للزبون (الفورم، الشات، الأزرار والنصوص الثابتة). النصوص اللي إنت كاتبها (المنتج والوصف) بتظهر زي ما كتبتها.">
          <select className={inputCls} value={form.lang_mode} onChange={(e) => set("lang_mode", e.target.value as BrandForm["lang_mode"])}>
            <option value="ar">عربي فقط</option>
            <option value="en">English فقط</option>
            <option value="both">عربي و English (الزبون يختار)</option>
          </select>
        </Field>
        {form.lang_mode === "both" && (
          <Field label="اللغة الأولى للزبون الجديد">
            <select className={inputCls} value={form.lang_default} onChange={(e) => set("lang_default", e.target.value as BrandForm["lang_default"])}>
              <option value="ar">عربي</option>
              <option value="en">English</option>
            </select>
          </Field>
        )}

        <Field label="رقم خدمة العملاء">
          <input className={inputCls} dir="ltr" inputMode="tel" value={form.support_phone} onChange={(e) => set("support_phone", e.target.value)} placeholder="01012345678" />
        </Field>

        <Field label="واتساب (بكود الدولة)" hint="مثال لمصر: 201012345678">
          <input className={inputCls} dir="ltr" inputMode="tel" value={form.support_whatsapp} onChange={(e) => set("support_whatsapp", e.target.value)} placeholder="201012345678" />
        </Field>

        <Field label="بريد الدعم" hint="مثال: support@yourstore.store. بيظهر في آخر الصفحات، ويوصّل رسايل العملاء لإيميلك لو ربطت التحويل.">
          <input className={inputCls} dir="ltr" type="email" inputMode="email" value={form.support_email} onChange={(e) => set("support_email", e.target.value.trim())} placeholder="support@yourstore.store" />
        </Field>

        <Field label="رابط المتجر" hint="دومين متجرك بعد الربط، مثال: https://yourstore.com">
          <input className={inputCls} dir="ltr" value={form.site_domain} onChange={(e) => set("site_domain", e.target.value)} placeholder="https://yourstore.com" />
        </Field>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">آراء العملاء في الصفحة الرئيسية</h2>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">
            اكتب آراء عملائك الحقيقية بس. القسم بيظهر في الصفحة الرئيسية لو فيه رأي واحد على الأقل، ولو مفيش بيختفي.
          </p>
        </div>
        {form.home_reviews.map((r, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-2.5">
            <div className="grid sm:grid-cols-2 gap-2.5">
              <input
                className={inputCls}
                placeholder="اسم العميل"
                maxLength={60}
                value={r.name}
                onChange={(e) => set("home_reviews", form.home_reviews.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))}
              />
              <input
                className={inputCls}
                placeholder="المحافظة أو المنطقة (اختياري)"
                maxLength={60}
                value={r.place}
                onChange={(e) => set("home_reviews", form.home_reviews.map((x, k) => (k === i ? { ...x, place: e.target.value } : x)))}
              />
            </div>
            <textarea
              className={inputCls + " leading-relaxed"}
              rows={3}
              maxLength={400}
              placeholder="رأي العميل"
              value={r.comment}
              onChange={(e) => set("home_reviews", form.home_reviews.map((x, k) => (k === i ? { ...x, comment: e.target.value } : x)))}
            />
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                التقييم
                <select
                  className="h-11 px-2 rounded-xl border border-slate-300 bg-white text-sm"
                  value={r.rating}
                  onChange={(e) => set("home_reviews", form.home_reviews.map((x, k) => (k === i ? { ...x, rating: Number(e.target.value) } : x)))}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>{n} من 5</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={async () => { if (await confirmAsk({ title: "حذف الرأي", message: "هتحذف الرأي ده." })) set("home_reviews", form.home_reviews.filter((_, k) => k !== i)); }}
                className="min-h-[44px] px-3 rounded-xl text-red-600 hover:bg-red-50 text-sm font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> حذف
              </button>
            </div>
          </div>
        ))}
        {form.home_reviews.length < 6 && (
          <button
            type="button"
            onClick={() => set("home_reviews", [...form.home_reviews, { name: "", place: "", comment: "", rating: 5 }])}
            className="min-h-[48px] w-full rounded-xl border-2 border-dashed border-slate-300 hover:border-orange-400 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> إضافة رأي
          </button>
        )}
      </div>

      <Toast message={message} onClose={() => setMessage(null)} />

    </form>
  );
}
