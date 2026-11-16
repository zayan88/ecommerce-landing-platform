"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Coupon } from "@/lib/commerce";
import { SettingsShell, Field, inputCls, cardCls } from "../../_components/settings-ui";

interface Prod {
  id: string;
  title_ar: string;
}

const num = (v: string) => (v === "" ? 0 : Math.max(0, Math.round(Number(v)) || 0));

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [products, setProducts] = useState<Prod[]>([]);
  const setCoupon = (i: number, patch: Partial<Coupon>) => setCoupons((l) => l.map((c, k) => (k === i ? { ...c, ...patch } : c)));

  return (
    <SettingsShell
      title="الكوبونات والخصومات"
      description="كوبون بكود بيكتبه العميل، أو خصم تلقائي بيتطبق لوحده لما الشروط تتحقق."
      withProducts
      load={(s, p) => {
        setCoupons(Array.isArray(s.coupons) ? s.coupons : []);
        setUsage(s.coupon_usage || {});
        setProducts(p);
      }}
      payload={() => ({ coupons })}
      onSaved={(s) => setCoupons(s.coupons || [])}
    >
      {/* Coupons */}
      <section className={cardCls}>
        <div>
          <h2 className="text-lg font-black text-slate-900">الكوبونات والخصومات</h2>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">
            كوبون بكود بيكتبه العميل، أو خصم تلقائي بيتطبق لوحده لما الشروط تتحقق. الخصم بيتحسب على سعر الطلب قبل الشحن، وبيتطبق خصم واحد بس في الطلب.
          </p>
        </div>
        {coupons.map((c, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <input className={inputCls + " font-mono"} dir="ltr" placeholder={c.auto ? "اسم الخصم (مثال: AUTO10)" : "الكود (مثال: SAVE50)"} maxLength={20} value={c.code} onChange={(e) => setCoupon(i, { code: e.target.value.toUpperCase() })} />
              <select className={inputCls} value={c.kind} onChange={(e) => setCoupon(i, { kind: e.target.value === "free_shipping" ? "free_shipping" : "discount" })}>
                <option value="discount">خصم على الطلب</option>
                <option value="free_shipping">شحن مجاني</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer min-h-[44px]">
              <input type="checkbox" className="w-5 h-5 accent-emerald-600" checked={c.auto} onChange={(e) => setCoupon(i, { auto: e.target.checked })} />
              خصم تلقائي (من غير ما العميل يكتب كود)
            </label>
            {c.kind === "discount" && (
              <div className="grid grid-cols-2 gap-2.5">
                <select className={inputCls} value={c.type} onChange={(e) => setCoupon(i, { type: e.target.value === "percent" ? "percent" : "fixed" })}>
                  <option value="fixed">مبلغ ثابت (ج.م)</option>
                  <option value="percent">نسبة (%)</option>
                </select>
                <input className={inputCls} inputMode="numeric" placeholder={c.type === "percent" ? "النسبة %" : "قيمة الخصم"} value={c.value || ""} onChange={(e) => setCoupon(i, { value: num(e.target.value) })} />
              </div>
            )}
            <div className="space-y-2">
              <p className="text-xs font-black text-slate-700">بيتطبق على</p>
              <select
                className={inputCls}
                value={c.product_ids.length > 0 ? "some" : "all"}
                onChange={(e) => setCoupon(i, { product_ids: e.target.value === "all" ? [] : products.slice(0, 1).map((p) => p.id) })}
              >
                <option value="all">كل المنتجات</option>
                <option value="some">منتجات محددة</option>
              </select>
              {c.product_ids.length > 0 && (
                <div className="space-y-1">
                  {products.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm text-slate-800 min-h-[40px] cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-emerald-600"
                        checked={c.product_ids.includes(p.id)}
                        onChange={(e) => {
                          const next = e.target.checked ? [...c.product_ids, p.id] : c.product_ids.filter((x) => x !== p.id);
                          setCoupon(i, { product_ids: next.length > 0 ? next : c.product_ids });
                        }}
                      />
                      <span className="truncate">{p.title_ar}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="حد أدنى لقيمة الطلب">
                <input className={inputCls} inputMode="numeric" placeholder="0 = بدون" value={c.min_order || ""} onChange={(e) => setCoupon(i, { min_order: num(e.target.value) })} />
              </Field>
              <Field label="حد أدنى لعدد القطع">
                <input className={inputCls} inputMode="numeric" placeholder="0 = بدون" value={c.min_qty || ""} onChange={(e) => setCoupon(i, { min_qty: num(e.target.value) })} />
              </Field>
              <Field label="أقصى عدد مرات استخدام" hint={`اتستخدم ${usage[c.code] || 0} مرة`}>
                <input className={inputCls} inputMode="numeric" placeholder="0 = بدون حد" value={c.max_uses || ""} onChange={(e) => setCoupon(i, { max_uses: num(e.target.value) })} />
              </Field>
              <div />
              <Field label="يبدأ من">
                <input type="date" className={inputCls} value={c.starts_at} onChange={(e) => setCoupon(i, { starts_at: e.target.value })} />
              </Field>
              <Field label="ينتهي في">
                <input type="date" className={inputCls} value={c.ends_at} min={c.starts_at || undefined} onChange={(e) => setCoupon(i, { ends_at: e.target.value })} />
              </Field>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer min-h-[44px]">
                <input type="checkbox" className="w-5 h-5 accent-emerald-600" checked={c.enabled} onChange={(e) => setCoupon(i, { enabled: e.target.checked })} /> شغّال
              </label>
              <button type="button" onClick={() => setCoupons((l) => l.filter((_, k) => k !== i))} className="min-h-[44px] px-3 rounded-xl text-rose-600 hover:bg-rose-50 text-sm font-bold flex items-center gap-1.5 cursor-pointer">
                <Trash2 className="w-4 h-4" /> حذف
              </button>
            </div>
          </div>
        ))}
        {coupons.length < 30 && (
          <button
            type="button"
            onClick={() =>
              setCoupons((l) => [
                ...l,
                { code: "", kind: "discount", type: "fixed", value: 0, auto: false, min_order: 0, min_qty: 0, product_ids: [], max_uses: 0, starts_at: "", ends_at: "", enabled: true },
              ])
            }
            className="min-h-[48px] w-full rounded-xl border-2 border-dashed border-slate-300 hover:border-orange-400 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> إضافة كوبون أو خصم
          </button>
        )}
      </section>


    </SettingsShell>
  );
}
