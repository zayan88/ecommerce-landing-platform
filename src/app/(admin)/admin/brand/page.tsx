"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, LayoutTemplate, Store } from "lucide-react";
import { PALETTE_KEYS, PALETTES, PALETTE_LABELS_AR, type PaletteKey } from "@/lib/palettes";

type Mode = "landing" | "catalog";

interface BrandForm {
  store_name: string;
  store_tagline: string;
  logo_url: string;
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
  store_mode: "landing",
  brand_primary: "emerald",
  brand_accent: "orange",
  support_phone: "",
  support_whatsapp: "",
  site_domain: "",
  currency_symbol: "ج.م",
};

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 text-slate-900 placeholder-slate-400 text-sm outline-none transition bg-white";

function Swatches({ value, onChange }: { value: PaletteKey; onChange: (k: PaletteKey) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {PALETTE_KEYS.map((k) => (
        <button
          key={k}
          type="button"
          role="radio"
          aria-checked={value === k}
          title={PALETTE_LABELS_AR[k]}
          onClick={() => onChange(k)}
          className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition ${
            value === k ? "border-slate-900 scale-110" : "border-white shadow-sm"
          }`}
          style={{ backgroundColor: `rgb(${PALETTES[k]["500"]})` }}
        >
          {value === k && <Check className="w-5 h-5 text-white" />}
        </button>
      ))}
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
      setMessage({ ok: true, text: "تم الحفظ. هوية المتجر اتحدّثت." });
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
    <form onSubmit={save} className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 text-right" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 font-heading">هوية المتجر وشكله</h1>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
          الاسم والألوان وشكل المتجر. كل التغييرات بتظهر في المتجر كله بعد الحفظ.
        </p>
      </div>

      {/* Store mode */}
      <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-3">
        <h2 className="font-black text-slate-900">شكل المتجر</h2>
        <div className="grid sm:grid-cols-2 gap-3" role="radiogroup">
          {(
            [
              { id: "landing", title: "صفحات هبوط", desc: "كل منتج له صفحة هبوط مستقلة. الأنسب للإعلانات المباشرة.", Icon: LayoutTemplate },
              { id: "catalog", title: "متجر عادي", desc: "صفحة رئيسية فيها كل المنتجات والعروض، والعميل يختار ويطلب.", Icon: Store },
            ] as const
          ).map(({ id, title, desc, Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={form.store_mode === id}
              onClick={() => set("store_mode", id)}
              className={`text-right rounded-2xl border-2 p-4 min-h-[96px] transition flex gap-3 items-start ${
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
      </section>

      {/* Identity */}
      <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-4">
        <h2 className="font-black text-slate-900">الاسم واللوجو</h2>
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1">اسم المتجر</label>
          <input className={inputCls} value={form.store_name} onChange={(e) => set("store_name", e.target.value)} placeholder="مثال: متجر النور" maxLength={80} />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1">وصف قصير (اختياري)</label>
          <input className={inputCls} value={form.store_tagline} onChange={(e) => set("store_tagline", e.target.value)} placeholder="مثال: منتجات مختارة بشحن مجاني" maxLength={80} />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1">رابط اللوجو (اختياري)</label>
          <input className={inputCls} dir="ltr" value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://..." />
          {form.logo_url && /^(https?:\/\/|\/)/.test(form.logo_url) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.logo_url} alt="معاينة اللوجو" className="mt-3 h-14 w-auto rounded-lg border border-slate-200 bg-white p-1" />
          )}
        </div>
      </section>

      {/* Colors */}
      <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-4">
        <h2 className="font-black text-slate-900">الألوان</h2>
        <div>
          <p className="text-sm font-bold text-slate-800 mb-2">لون الثقة (الضمانات والشحن المجاني)</p>
          <Swatches value={form.brand_primary} onChange={(k) => set("brand_primary", k)} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 mb-2">لون زرار الطلب</p>
          <Swatches value={form.brand_accent} onChange={(k) => set("brand_accent", k)} />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <span className="text-xs text-slate-500">معاينة:</span>
          <span className="px-4 py-2 rounded-xl text-sm font-black text-white" style={{ backgroundColor: `rgb(${PALETTES[form.brand_accent]["600"]})` }}>
            اطلب الآن
          </span>
          <span
            className="px-3 py-1 rounded-full text-xs font-bold border"
            style={{
              backgroundColor: `rgb(${PALETTES[form.brand_primary]["50"]})`,
              color: `rgb(${PALETTES[form.brand_primary]["800"]})`,
              borderColor: `rgb(${PALETTES[form.brand_primary]["200"]})`,
            }}
          >
            شحن مجاني
          </span>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-4">
        <h2 className="font-black text-slate-900">التواصل والنطاق</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">رقم خدمة العملاء</label>
            <input className={inputCls} dir="ltr" inputMode="tel" value={form.support_phone} onChange={(e) => set("support_phone", e.target.value)} placeholder="01012345678" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">واتساب (بكود الدولة)</label>
            <input className={inputCls} dir="ltr" inputMode="tel" value={form.support_whatsapp} onChange={(e) => set("support_whatsapp", e.target.value)} placeholder="201012345678" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">رابط المتجر</label>
            <input className={inputCls} dir="ltr" value={form.site_domain} onChange={(e) => set("site_domain", e.target.value)} placeholder="https://yourstore.com" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">رمز العملة</label>
            <input className={inputCls} value={form.currency_symbol} onChange={(e) => set("currency_symbol", e.target.value)} maxLength={10} />
          </div>
        </div>
      </section>

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

      <button
        type="submit"
        disabled={saving}
        className="w-full sm:w-auto min-h-[48px] px-8 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-base shadow-lg shadow-orange-500/25 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
        حفظ هوية المتجر
      </button>
    </form>
  );
}
