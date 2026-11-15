"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, LayoutTemplate, Store } from "lucide-react";
import { PALETTE_KEYS, type PaletteKey } from "@/lib/palettes";
import { PaletteSwatches } from "@/components/admin/PaletteSwatches";
import { ImageUploader } from "@/components/admin/ImageUploader";

type Mode = "landing" | "catalog";

interface BrandForm {
  store_name: string;
  store_tagline: string;
  logo_url: string;
  favicon_url: string;
  store_mode: Mode;
  brand_primary: PaletteKey;
  brand_accent: PaletteKey;
  support_phone: string;
  support_whatsapp: string;
  site_domain: string;
  currency_symbol: string;
}

const EMPTY: BrandForm = {
  store_name: "",
  store_tagline: "",
  logo_url: "",
  favicon_url: "",
  store_mode: "landing",
  brand_primary: "emerald",
  brand_accent: "orange",
  support_phone: "",
  support_whatsapp: "",
  site_domain: "",
  currency_symbol: "ج.م",
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
          store_mode: s.store_mode === "catalog" ? "catalog" : "landing",
          brand_primary: PALETTE_KEYS.includes(s.brand_primary) ? s.brand_primary : "emerald",
          brand_accent: PALETTE_KEYS.includes(s.brand_accent) ? s.brand_accent : "orange",
          support_phone: s.support_phone || "",
          support_whatsapp: s.support_whatsapp || "",
          site_domain: s.site_domain || "",
          currency_symbol: s.currency_symbol || "ج.م",
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
        body: JSON.stringify({ ...form, onboarding_done: true }),
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
      <div>
        <h1 className="text-2xl font-black text-slate-900 font-heading">الإعدادات</h1>
        <p className="text-sm text-slate-600 mt-1">تحكم في متجرك: الاسم، الشكل، الألوان، اللوجو وبيانات التواصل.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-6">
        <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">إعدادات المتجر</h2>

        <Field label="شكل المتجر" hint="تقدر تغيّره في أي وقت. المنتجات والطلبات بتفضل زي ما هي.">
          <div className="grid sm:grid-cols-2 gap-3" role="radiogroup">
            {(
              [
                { id: "landing", title: "صفحات هبوط", desc: "كل منتج له صفحة هبوط كاملة تساعد على البيع.", Icon: LayoutTemplate },
                { id: "catalog", title: "متجر عادي", desc: "صفحة رئيسية بكل المنتجات وصفحة منتج بسيطة.", Icon: Store },
              ] as const
            ).map(({ id, title, desc, Icon }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={form.store_mode === id}
                onClick={() => set("store_mode", id)}
                className={`text-right rounded-2xl border-2 p-4 min-h-[88px] transition flex gap-3 items-start cursor-pointer ${
                  form.store_mode === id ? "border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/30" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Icon className="w-6 h-6 shrink-0 text-orange-600 mt-0.5" />
                <span>
                  <span className="block font-black text-slate-900">{title}</span>
                  <span className="block text-xs text-slate-600 leading-relaxed mt-1">{desc}</span>
                </span>
              </button>
            ))}
          </div>
        </Field>

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

        <Field label="رقم خدمة العملاء">
          <input className={inputCls} dir="ltr" inputMode="tel" value={form.support_phone} onChange={(e) => set("support_phone", e.target.value)} placeholder="01012345678" />
        </Field>

        <Field label="واتساب (بكود الدولة)" hint="مثال لمصر: 201012345678">
          <input className={inputCls} dir="ltr" inputMode="tel" value={form.support_whatsapp} onChange={(e) => set("support_whatsapp", e.target.value)} placeholder="201012345678" />
        </Field>

        <Field label="رابط المتجر" hint="دومين متجرك بعد الربط، مثال: https://yourstore.com">
          <input className={inputCls} dir="ltr" value={form.site_domain} onChange={(e) => set("site_domain", e.target.value)} placeholder="https://yourstore.com" />
        </Field>
      </div>

      {message && (
        <div
          role="status"
          className={`p-3.5 rounded-xl text-sm font-bold border ${
            message.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="sticky bottom-3 z-10">
        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto min-h-[48px] px-8 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-base shadow-lg shadow-orange-500/25 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          حفظ
        </button>
      </div>
    </form>
  );
}
