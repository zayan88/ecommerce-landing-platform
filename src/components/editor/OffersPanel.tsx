"use client";

import React from "react";
import { Plus, Trash2, RotateCcw, Tags } from "lucide-react";
import type { ProductOffer } from "@/types";

interface Props {
  offers: ProductOffer[];
  currency: string;
  onChange: (offers: ProductOffer[]) => void;
  onReset: () => void;
}

const MAX_OFFERS = 5;
const input =
  "w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-orange-500";

/** Edit the page's quantity tiers (the upsell ladder: 1 piece / 2 pieces / family pack...). */
export default function OffersPanel({ offers, currency, onChange, onReset }: Props) {
  const update = (i: number, patch: Partial<ProductOffer>) =>
    onChange(offers.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));

  // Only one tier carries the "most requested" badge
  const setPopular = (i: number, on: boolean) =>
    onChange(offers.map((o, idx) => ({ ...o, is_popular: idx === i ? on : on ? false : o.is_popular })));

  const add = () => {
    if (offers.length >= MAX_OFFERS) return;
    const last = offers[offers.length - 1];
    const qty = (last?.quantity || 0) + 1;
    onChange([
      ...offers,
      {
        id: `offer-${Date.now()}`,
        product_id: last?.product_id || "",
        title_ar: `${qty} قطع`,
        quantity: qty,
        price: last ? Math.round((last.price / Math.max(1, last.quantity)) * qty * 0.9) : 0,
        original_price: last?.original_price ? Math.round((last.original_price / Math.max(1, last.quantity)) * qty) : undefined,
        discount_label: "",
        is_popular: false,
        free_shipping: true,
        sort_order: offers.length + 1,
      },
    ]);
  };

  const remove = (i: number) => {
    if (offers.length <= 1) return;
    onChange(offers.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold leading-relaxed">
        <Tags className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
        <span>
          دي عروض الكمية اللي العميل بيختار منها في الصفحة (قطعة / قطعتين / ٣ قطع). اعمل الأغلى كمية أوفر في سعر القطعة عشان العميل يزوّد طلبه.
        </span>
      </div>

      {offers.map((o, i) => {
        const perPiece = o.quantity > 0 ? Math.round(o.price / o.quantity) : 0;
        return (
          <div key={o.id} className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-black text-slate-900">عرض {i + 1}</p>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={offers.length <= 1}
                aria-label={`حذف العرض ${i + 1}`}
                className="min-h-[36px] min-w-[36px] rounded-lg text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-bold text-slate-600">اسم العرض</span>
              <input value={o.title_ar} onChange={(e) => update(i, { title_ar: e.target.value })} maxLength={80} className={input} />
            </label>

            <div className="grid grid-cols-3 gap-2">
              <label className="block space-y-1">
                <span className="text-xs font-bold text-slate-600">الكمية</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={20}
                  value={o.quantity}
                  onChange={(e) => update(i, { quantity: Number(e.target.value) })}
                  className={input}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-slate-600">السعر ({currency})</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={o.price}
                  onChange={(e) => update(i, { price: Number(e.target.value) })}
                  className={input}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-slate-600">قبل الخصم</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={o.original_price ?? ""}
                  onChange={(e) => update(i, { original_price: e.target.value === "" ? undefined : Number(e.target.value) })}
                  className={input}
                />
              </label>
            </div>
            <p className="text-[11px] text-slate-500">سعر القطعة الواحدة في العرض ده: {perPiece} {currency}</p>

            <label className="block space-y-1">
              <span className="text-xs font-bold text-slate-600">شارة العرض (اختياري)</span>
              <input
                value={o.discount_label || ""}
                onChange={(e) => update(i, { discount_label: e.target.value })}
                maxLength={40}
                placeholder="مثال: وفر ٢٠٠ جنيه"
                className={input}
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPopular(i, !o.is_popular)}
                aria-pressed={!!o.is_popular}
                className={`min-h-[40px] px-3 rounded-xl text-xs font-black border cursor-pointer transition ${
                  o.is_popular ? "bg-amber-100 text-amber-900 border-amber-300" : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                }`}
              >
                ⭐ الأكثر طلباً
              </button>
              <button
                type="button"
                onClick={() => update(i, { free_shipping: !o.free_shipping })}
                aria-pressed={!!o.free_shipping}
                className={`min-h-[40px] px-3 rounded-xl text-xs font-black border cursor-pointer transition ${
                  o.free_shipping ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                }`}
              >
                🚚 شحن مجاني
              </button>
            </div>
          </div>
        );
      })}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={add}
          disabled={offers.length >= MAX_OFFERS}
          className="flex-1 min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          إضافة عرض
        </button>
        <button
          type="button"
          onClick={onReset}
          className="min-h-[44px] px-4 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-50"
        >
          <RotateCcw className="w-4 h-4" />
          الافتراضي
        </button>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">بتتحفظ مع زرار "حفظ الصفحة". السعر بيتحسب على السيرفر وقت الطلب من العروض دي.</p>
    </div>
  );
}
