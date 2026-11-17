"use client";

import { EGYPTIAN_GOVERNORATES } from "@/lib/constants/governorates";
import React, { useState } from "react";
import type { ShippingConfig } from "@/lib/commerce";
import { SettingsShell, Field, PageTabs, inputCls, cardCls } from "../../_components/settings-ui";

interface Prod {
  id: string;
  title_ar: string;
  offers?: { free_shipping?: boolean }[];
}

type Tab = "own" | "company" | "options";
const EMPTY: ShippingConfig = { default_fee: 0, free_over: 0, min_order: 0, product_fees: {}, governorate_fees: {} };
const num = (v: string) => (v === "" ? 0 : Math.max(0, Math.round(Number(v)) || 0));

export default function ShippingSettingsPage() {
  const [tab, setTab] = useState<Tab>("own");
  const [cfg, setCfg] = useState<ShippingConfig>(EMPTY);
  const [products, setProducts] = useState<Prod[]>([]);
  const [provider, setProvider] = useState<"none" | "bosta">("none");
  const [bostaKey, setBostaKey] = useState("");
  const [bostaLocation, setBostaLocation] = useState("");
  const [bostaHook, setBostaHook] = useState("");

  const freeOffers = products.reduce((n, p) => n + (p.offers || []).filter((o) => o.free_shipping).length, 0);

  return (
    <SettingsShell
      title="الشحن"
      description="تكلفة الشحن، الربط مع شركة الشحن، والحد الأدنى للطلب."
      withProducts
      load={(s, p) => {
        setCfg({ ...EMPTY, ...(s.shipping_config || {}), product_fees: { ...(s.shipping_config?.product_fees || {}) }, governorate_fees: { ...(s.shipping_config?.governorate_fees || {}) } });
        setProducts(p);
        setProvider(s.shipping_provider === "bosta" ? "bosta" : "none");
        setBostaKey(s.bosta_api_key || "");
        setBostaLocation(s.bosta_location_id || "");
        setBostaHook(s.bosta_webhook_key || "");
      }}
      payload={() => ({
        shipping_config: cfg,
        shipping_provider: provider,
        bosta_api_key: bostaKey,
        bosta_location_id: bostaLocation,
        bosta_webhook_key: bostaHook,
      })}
    >
      <PageTabs
        tabs={[
          { id: "own", label: "الشحن المستقل" },
          { id: "company", label: "الربط مع شركات الشحن" },
          { id: "options", label: "خيارات الشحن" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "own" && (
        <>
          <section className={cardCls}>
            <h2 className="text-lg font-black text-slate-900">تكلفة الشحن</h2>
            <Field label="تكلفة الشحن (ج.م)" hint="اكتب 0 لو الشحن مجاني. دي تكلفة كل طلب لكل منتجات المتجر، إلا المنتجات اللي ليها تكلفة خاصة تحت.">
              <input className={inputCls} inputMode="numeric" value={cfg.default_fee} onChange={(e) => setCfg({ ...cfg, default_fee: num(e.target.value) })} />
            </Field>
            {cfg.default_fee > 0 && freeOffers > 0 && (
              <p className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 leading-relaxed">
                تنبيه: في {freeOffers} عرض عليه «شحن مجاني»، فهيتشحنوا مجاناً رغم تكلفة الشحن اللي كتبتها. شيل العلامة من العروض اللي عاوز يتحاسب عليها شحن (من تعديل المنتج ← عروض الكمية).
              </p>
            )}
            <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3">
              العروض اللي عليها علامة «شحن مجاني» بتتشحن مجاناً مهما كانت تكلفة الشحن هنا.
            </p>
          </section>

          <section className={cardCls}>
            <div>
              <h2 className="text-lg font-black text-slate-900">تكلفة الشحن لكل محافظة</h2>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                سيب الخانة فاضية عشان المحافظة تاخد تكلفة الشحن العامة ({cfg.default_fee} ج.م). اكتب 0 لشحن مجاني لمحافظة. لو منتج ليه تكلفة شحن خاصة من إعدادات المنتج، هي اللي بتنفع عليه مهما كانت المحافظة.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
              {EGYPTIAN_GOVERNORATES.map((g) => (
                <div key={g.id} className="flex items-center gap-3">
                  <span className="flex-1 min-w-0 text-sm font-bold text-slate-800 truncate">{g.nameAr}</span>
                  <input
                    className={inputCls + " w-28 text-center"}
                    inputMode="numeric"
                    placeholder={String(cfg.default_fee)}
                    value={g.nameAr in cfg.governorate_fees ? cfg.governorate_fees[g.nameAr] : ""}
                    onChange={(e) => {
                      const fees = { ...cfg.governorate_fees };
                      if (e.target.value === "") delete fees[g.nameAr];
                      else fees[g.nameAr] = num(e.target.value);
                      setCfg({ ...cfg, governorate_fees: fees });
                    }}
                  />
                </div>
              ))}
            </div>
            {Object.keys(cfg.governorate_fees).length > 0 && (
              <button type="button" onClick={() => setCfg({ ...cfg, governorate_fees: {} })} className="min-h-[44px] px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-sm font-bold cursor-pointer">
                مسح كل أسعار المحافظات (الكل بالتكلفة العامة)
              </button>
            )}
          </section>
        </>
      )}

      {tab === "company" && (
        <section className={cardCls}>
          <div>
            <h2 className="text-lg font-black text-slate-900">الربط مع شركة الشحن</h2>
            <p className="text-xs text-slate-500 leading-relaxed mt-1">اربط شركة الشحن عشان تبعت الطلبات لها بضغطة وتتابع حالتها تلقائي. من غير ربط، تقدر تنزّل ملف الطلبات (ملف شحن) وتبعته للشركة.</p>
          </div>
          <Field label="شركة الشحن">
            <select className={inputCls} value={provider} onChange={(e) => setProvider(e.target.value as "none" | "bosta")}>
              <option value="none">من غير ربط (ملف تصدير)</option>
              <option value="bosta">بوسطة (Bosta)</option>
            </select>
          </Field>
          {provider === "bosta" && (
            <div className="space-y-4">
              <Field label="مفتاح بوسطة (API Key)" hint="من حسابك في بوسطة: الإعدادات ← تكامل API ← مفتاح بصلاحية Read/Write.">
                <input className={inputCls} dir="ltr" autoComplete="off" value={bostaKey} onChange={(e) => setBostaKey(e.target.value.trim())} placeholder="مفتاح بوسطة" />
              </Field>
              <Field label="معرّف فرع الاستلام (اختياري)" hint="لو سبته فاضي بوسطة بتستخدم فرعك الافتراضي.">
                <input className={inputCls} dir="ltr" value={bostaLocation} onChange={(e) => setBostaLocation(e.target.value.trim())} placeholder="Business Location ID" />
              </Field>
              <Field label="مفتاح تأكيد التحديثات" hint="كلمة سر بنبعتها لبوسطة وترجعها مع كل تحديث حالة، عشان نتأكد إنه منها. اضغط توليد.">
                <div className="flex gap-2">
                  <input className={inputCls} dir="ltr" autoComplete="off" value={bostaHook} onChange={(e) => setBostaHook(e.target.value.trim())} placeholder="اضغط توليد" />
                  <button
                    type="button"
                    onClick={() => {
                      const b = new Uint8Array(18);
                      crypto.getRandomValues(b);
                      setBostaHook(Array.from(b, (x) => x.toString(16).padStart(2, "0")).join(""));
                    }}
                    className="min-h-[48px] px-4 rounded-xl bg-slate-900 text-white text-sm font-bold cursor-pointer whitespace-nowrap"
                  >
                    توليد
                  </button>
                </div>
              </Field>
              <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3">
                بعد الحفظ، زرار «إرسال للشحن» بيظهر في تفاصيل كل طلب. حالات الشحنة بترجع لوحدها لو الموقع على رابط https.
              </p>
            </div>
          )}
        </section>
      )}

      {tab === "options" && (
        <section className={cardCls}>
          <h2 className="text-lg font-black text-slate-900">خيارات الشحن</h2>
          <Field label="شحن مجاني للطلبات من (ج.م)" hint="الطلب اللي إجماليه بعد الخصم يوصل للرقم ده يتشحن مجاناً. 0 يعني مفيش حد.">
            <input className={inputCls} inputMode="numeric" value={cfg.free_over} onChange={(e) => setCfg({ ...cfg, free_over: num(e.target.value) })} />
          </Field>
          <Field label="الحد الأدنى للطلب (ج.م)" hint="أقل قيمة طلب بتتقبل. 0 يعني مفيش حد أدنى.">
            <input className={inputCls} inputMode="numeric" value={cfg.min_order} onChange={(e) => setCfg({ ...cfg, min_order: num(e.target.value) })} />
          </Field>
        </section>
      )}
    </SettingsShell>
  );
}
