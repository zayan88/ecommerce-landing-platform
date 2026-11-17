"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { SettingsShell, cardCls, inputCls, Field } from "../../_components/settings-ui";
import { useConfirm } from "../../_components/confirm";
import { StoreTabs } from "../../_components/store-tabs";
import { HOME_SECTIONS, defaultHomeContent, mergeHomeContent, type HomeContent, type HomeSection } from "@/lib/home-content";
import { ImageUploader } from "@/components/admin/ImageUploader";

const SECTION_LABELS: Record<HomeSection, string> = {
  trust: "شريط الثقة (4 مربعات تحت العنوان)",
  features: "لماذا تثق بنا (3 ضمانات)",
  compare: "المقارنة (المنتجات العادية vs منتجاتنا)",
  steps: "خطوات الشراء",
  warranty: "شهادة الضمان",
  reviews: "آراء العملاء (من إعدادات المتجر)",
  faq: "الأسئلة الشائعة",
};

export default function HomeSettingsPage() {
  const confirmAsk = useConfirm();
  const [brand, setBrand] = useState("متجري");
  const [hc, setHc] = useState<HomeContent>(defaultHomeContent("ar", "متجري"));
  const set = <K extends keyof HomeContent>(k: K, v: HomeContent[K]) => setHc((c) => ({ ...c, [k]: v }));
  const setAt = <T,>(arr: T[], i: number, v: T) => arr.map((x, k) => (k === i ? v : x));

  const text = (label: string, k: keyof HomeContent, opts: { rows?: number; max?: number; hint?: string } = {}) => (
    <Field label={label} hint={opts.hint}>
      {opts.rows ? (
        <textarea className={inputCls + " py-3 leading-relaxed"} rows={opts.rows} maxLength={opts.max} value={hc[k] as string} onChange={(e) => set(k, e.target.value as never)} />
      ) : (
        <input className={inputCls} maxLength={opts.max} value={hc[k] as string} onChange={(e) => set(k, e.target.value as never)} />
      )}
    </Field>
  );

  const pairs = (k: "trust" | "features" | "steps", title: string) => (
    <div className="space-y-3">
      <p className="text-sm font-black text-slate-900">{title}</p>
      {hc[k].map((p, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2">
          <input className={inputCls} placeholder="العنوان" maxLength={80} value={p.title} onChange={(e) => set(k, setAt(hc[k], i, { ...p, title: e.target.value }))} />
          <textarea className={inputCls + " py-3 leading-relaxed"} rows={2} placeholder="الوصف" maxLength={300} value={p.desc} onChange={(e) => set(k, setAt(hc[k], i, { ...p, desc: e.target.value }))} />
        </div>
      ))}
    </div>
  );

  const list = (title: string, k: "compare_old" | "compare_new" | "warranty_chips" | "footer_chips", max: number) => (
    <div className="space-y-2">
      <p className="text-sm font-black text-slate-900">{title}</p>
      {hc[k].map((v, i) => (
        <div key={i} className="flex gap-2">
          <input className={inputCls} maxLength={max} value={v} onChange={(e) => set(k, setAt(hc[k], i, e.target.value))} />
          <button type="button" aria-label="حذف" onClick={() => set(k, hc[k].filter((_, j) => j !== i))} className="min-h-[48px] px-3 rounded-xl text-red-600 hover:bg-red-50 cursor-pointer">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      {hc[k].length < 6 && (
        <button type="button" onClick={() => set(k, [...hc[k], ""])} className="min-h-[44px] w-full rounded-xl border-2 border-dashed border-slate-300 hover:border-orange-400 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer">
          <Plus className="w-4 h-4" /> إضافة
        </button>
      )}
    </div>
  );

  return (
    <SettingsShell
      title="إعدادات المتجر"
      description="كل نصوص الصفحة الرئيسية للمتجر بتتعدّل من هنا. اللي تسيبه فاضي بيرجع للنص الافتراضي. وتقدر كمان تخلّي أي صفحة هبوط هي الرئيسية من قائمة صفحات الهبوط."
      load={(s) => {
        const name = (s.store_name || "متجري") as string;
        setBrand(name);
        const lang = s.lang_default === "en" ? "en" : "ar";
        setHc(mergeHomeContent(defaultHomeContent(lang, name), s.home_content));
      }}
      payload={() => ({ home_content: hc })}
    >
      <StoreTabs />
      <section className={cardCls}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-black text-slate-900">البداية من نصوص جاهزة</h2>
          <div className="flex gap-2">
            {(["ar", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={async () => {
                  if (await confirmAsk({ title: "استبدال النصوص", tone: "neutral", confirmText: "استبدال", message: `هتستبدل كل النصوص اللي في الصفحة بالنصوص الافتراضية (${l === "ar" ? "عربي" : "English"}). تكمّل؟` })) setHc(defaultHomeContent(l, brand));
                }}
                className="min-h-[44px] px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-sm font-bold cursor-pointer"
              >
                {l === "ar" ? "نصوص عربي" : "English texts"}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">النصوص دي مكتوبة لمتجر مصري افتراضياً. عدّلها على حسب متجرك وبلدك (الشحن، الدفع، الضمان).</p>
      </section>

      <section className={cardCls}>
        <h2 className="text-lg font-black text-slate-900">الأقسام الظاهرة</h2>
        {HOME_SECTIONS.map((s) => (
          <label key={s} className="flex items-center justify-between gap-3 min-h-[44px] cursor-pointer">
            <span className="text-sm font-bold text-slate-900">{SECTION_LABELS[s]}</span>
            <input type="checkbox" className="w-5 h-5 accent-emerald-600" checked={!hc.hide[s]} onChange={(e) => set("hide", { ...hc.hide, [s]: e.target.checked ? undefined : true })} />
          </label>
        ))}
      </section>

      <section className={cardCls}>
        <h2 className="text-lg font-black text-slate-900">أعلى الصفحة</h2>
        {text("الشعار الصغير تحت اسم المتجر", "tagline", { max: 80 })}
        {text("الشارة فوق العنوان", "hero_badge", { max: 100 })}
        {text("العنوان الرئيسي", "hero_title", { max: 120 })}
        {text("الجزء الملوّن من العنوان", "hero_highlight", { max: 120 })}
        {text("الوصف", "hero_text", { rows: 3, max: 500 })}
        {text("نص زرار الدعوة للشراء", "hero_cta", { max: 50 })}
        <Field label="صورة (اختياري)" hint="بتظهر تحت الشارة وفوق العنوان.">
          <ImageUploader value={hc.hero_image} onChange={(u) => set("hero_image", u)} heightClass="h-40" />
        </Field>
        {pairs("trust", "شريط الثقة")}
      </section>

      <section className={cardCls}>
        <h2 className="text-lg font-black text-slate-900">قسم المنتجات</h2>
        {text("الشارة", "products_badge", { max: 80 })}
        {text("العنوان", "products_title", { max: 120 })}
        {text("الوصف", "products_sub", { rows: 2, max: 300 })}
      </section>

      <section className={cardCls}>
        <h2 className="text-lg font-black text-slate-900">لماذا تثق بنا</h2>
        {text("الشارة", "features_badge", { max: 80 })}
        {text("العنوان", "features_title", { max: 120 })}
        {text("الوصف", "features_sub", { rows: 2, max: 300 })}
        {pairs("features", "الضمانات")}
      </section>

      <section className={cardCls}>
        <h2 className="text-lg font-black text-slate-900">المقارنة</h2>
        {text("الشارة", "compare_badge", { max: 80 })}
        {text("العنوان", "compare_title", { max: 160 })}
        {text("الوصف", "compare_sub", { rows: 2, max: 300 })}
        {text("عنوان عمود المنتجات العادية", "compare_old_title", { max: 100 })}
        {list("نقاط المنتجات العادية", "compare_old", 200)}
        {text("عنوان عمود منتجاتنا", "compare_new_title", { max: 100 })}
        {list("نقاط منتجاتنا", "compare_new", 200)}
      </section>

      <section className={cardCls}>
        <h2 className="text-lg font-black text-slate-900">خطوات الشراء</h2>
        {text("الشارة", "steps_badge", { max: 80 })}
        {text("العنوان", "steps_title", { max: 160 })}
        {pairs("steps", "الخطوات")}
      </section>

      <section className={cardCls}>
        <h2 className="text-lg font-black text-slate-900">شهادة الضمان</h2>
        {text("العنوان", "warranty_title", { max: 120 })}
        {text("النص", "warranty_text", { rows: 4, max: 600 })}
        {list("الشارات الصغيرة", "warranty_chips", 60)}
      </section>

      <section className={cardCls}>
        <h2 className="text-lg font-black text-slate-900">آراء العملاء</h2>
        {text("عنوان القسم", "reviews_title", { max: 100, hint: "الآراء نفسها بتتكتب في إعدادات المتجر." })}
      </section>

      <section className={cardCls}>
        <h2 className="text-lg font-black text-slate-900">الأسئلة الشائعة</h2>
        {text("الشارة", "faq_badge", { max: 80 })}
        {text("العنوان", "faq_title", { max: 120 })}
        {hc.faq.map((f, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2">
            <input className={inputCls} placeholder="السؤال" maxLength={160} value={f.q} onChange={(e) => set("faq", setAt(hc.faq, i, { ...f, q: e.target.value }))} />
            <textarea className={inputCls + " py-3 leading-relaxed"} rows={3} placeholder="الإجابة" maxLength={600} value={f.a} onChange={(e) => set("faq", setAt(hc.faq, i, { ...f, a: e.target.value }))} />
            <button
              type="button"
              onClick={async () => {
                if (await confirmAsk({ title: "حذف السؤال", message: "هتحذف السؤال ده وإجابته." })) set("faq", hc.faq.filter((_, j) => j !== i));
              }}
              className="min-h-[44px] px-3 rounded-xl text-red-600 hover:bg-red-50 text-sm font-bold cursor-pointer"
            >
              حذف
            </button>
          </div>
        ))}
        {hc.faq.length < 8 && (
          <button type="button" onClick={() => set("faq", [...hc.faq, { q: "", a: "" }])} className="min-h-[48px] w-full rounded-xl border-2 border-dashed border-slate-300 hover:border-orange-400 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer">
            <Plus className="w-4 h-4" /> إضافة سؤال
          </button>
        )}
      </section>

      <section className={cardCls}>
        <h2 className="text-lg font-black text-slate-900">أسفل الصفحة</h2>
        {text("السطر تحت اسم المتجر", "footer_text", { max: 160 })}
        {list("الشارات الصغيرة", "footer_chips", 60)}
      </section>
    </SettingsShell>
  );
}
