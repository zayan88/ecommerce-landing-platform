"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Product, ProductOption } from "@/types";
import { MAX_COMBOS_LISTED, MAX_OPTIONS, allCombos, comboKey, sanitizeProductOptions, sanitizeVariantsOff } from "@/lib/product-options";

export interface OptionRow {
  name: string;
  /** typed by the merchant, separated by commas */
  values: string;
  /** value -> #rrggbb */
  colors: Record<string, string>;
  showColors: boolean;
}

export interface OptionsState {
  enabled: boolean;
  rows: OptionRow[];
  /** sold-out combinations */
  off: string[];
}

export const EMPTY_OPTIONS: OptionsState = { enabled: true, rows: [], off: [] };

export function optionsStateFromProduct(prod: Partial<Product> | null): OptionsState {
  if (!prod) return EMPTY_OPTIONS;
  const rows = sanitizeProductOptions((prod as any).options).map((o) => ({
    name: o.name,
    values: o.values.join("، "),
    colors: { ...(o.swatches || {}) },
    showColors: Boolean(o.swatches && Object.keys(o.swatches).length),
  }));
  return { enabled: (prod as any).options_enabled !== false, rows, off: sanitizeVariantsOff((prod as any).variants_off) };
}

/** What to save on the product. */
export function optionsPayload(state: OptionsState) {
  const options = sanitizeProductOptions(state.rows.map((r) => ({ name: r.name, values: r.values, swatches: r.showColors ? r.colors : undefined })));
  const keys = new Set(allCombos(options).map((c) => comboKey(options, c)));
  return { options, options_enabled: state.enabled, variants_off: sanitizeVariantsOff(state.off).filter((k) => keys.has(k)) };
}

const input = "w-full min-h-[44px] px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500";

/** Collapsible product options card (color / size ...) with an on/off switch, color swatches and a sold-out list of the combinations. */
export default function ProductOptionsEditor({ value, onChange }: { value: OptionsState; onChange: (v: OptionsState) => void }) {
  const [open, setOpen] = useState(value.rows.length > 0);
  const options: ProductOption[] = useMemo(
    () => sanitizeProductOptions(value.rows.map((r) => ({ name: r.name, values: r.values, swatches: r.showColors ? r.colors : undefined }))),
    [value.rows]
  );
  const combos = useMemo(() => (options.length ? allCombos(options, MAX_COMBOS_LISTED + 1) : []), [options]);
  const setRow = (i: number, patch: Partial<OptionRow>) => onChange({ ...value, rows: value.rows.map((r, k) => (k === i ? { ...r, ...patch } : r)) });
  const summary = value.rows.length === 0 ? "مفيش خيارات" : options.map((o) => `${o.name} (${o.values.length})`).join(" · ");

  return (
    <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex-1 min-w-0 flex items-center gap-2 text-right cursor-pointer min-h-[44px]">
          <ChevronDown className={`w-5 h-5 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
          <span className="min-w-0">
            <span className="block text-base font-black text-slate-950 font-heading">الخيارات (اللون / المقاس)</span>
            <span className="block text-xs text-slate-500 truncate">{value.enabled ? summary : `مقفولة (${summary})`}</span>
          </span>
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={value.enabled}
          aria-label="تفعيل الخيارات"
          onClick={() => onChange({ ...value, enabled: !value.enabled })}
          className={`relative shrink-0 w-12 h-7 rounded-full transition cursor-pointer ${value.enabled ? "bg-emerald-600" : "bg-slate-300"}`}
        >
          <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${value.enabled ? "right-0.5" : "right-[1.375rem]"}`} />
        </button>
      </div>

      {open && (
        <div className={`space-y-4 ${value.enabled ? "" : "opacity-60"}`}>
          <p className="text-xs text-slate-500 leading-relaxed">
            {value.enabled
              ? "العميل لازم يختار كل خيار قبل ما يطلب، والاختيار بيتكتب في ملاحظات الأوردر وفي إشعار تيليجرام."
              : "الخيارات مقفولة: العميل مش هيشوفها وهيطلب عادي. اللي كتبته محفوظ ولما تفعّلها هترجع."}
          </p>

          {value.rows.map((row, i) => {
            const vals = options.find((o) => o.name.trim() === row.name.trim())?.values || [];
            return (
              <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr_auto] gap-2 items-center">
                  <input type="text" value={row.name} maxLength={30} onChange={(e) => setRow(i, { name: e.target.value })} placeholder="الاسم (اللون)" className={input} />
                  <input type="text" value={row.values} onChange={(e) => setRow(i, { values: e.target.value })} placeholder="القيم مفصولة بفاصلة: أحمر، أزرق، أسود" className={input} />
                  <button type="button" onClick={() => onChange({ ...value, rows: value.rows.filter((_, k) => k !== i) })} className="min-h-[44px] px-3 rounded-xl border border-red-200 text-red-700 text-sm font-bold hover:bg-red-50 cursor-pointer">
                    حذف
                  </button>
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer min-h-[32px]">
                  <input type="checkbox" checked={row.showColors} onChange={(e) => setRow(i, { showColors: e.target.checked })} className="w-4 h-4" />
                  إظهار نقطة لون جنب كل قيمة
                </label>
                {row.showColors && vals.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {vals.map((v) => (
                      <label key={v} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 min-h-[40px] text-xs font-bold text-slate-800 cursor-pointer">
                        <input
                          type="color"
                          aria-label={`لون ${v}`}
                          value={row.colors[v] || "#cccccc"}
                          onChange={(e) => setRow(i, { colors: { ...row.colors, [v]: e.target.value } })}
                          className="w-7 h-7 p-0 border-0 bg-transparent cursor-pointer"
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {value.rows.length < MAX_OPTIONS && (
            <div className="flex flex-wrap gap-2">
              {[
                ["اللون", "أحمر، أزرق، أسود", true],
                ["المقاس", "S، M، L، XL", false],
                ["", "", false],
              ].map(([n, v, colors], k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => onChange({ ...value, rows: [...value.rows, { name: n as string, values: v as string, colors: {}, showColors: Boolean(colors) }] })}
                  className="min-h-[40px] px-3 rounded-xl border-2 border-dashed border-sky-400 text-sky-700 hover:bg-sky-50 text-xs font-bold cursor-pointer"
                >
                  {n ? `+ ${n}` : "+ خيار آخر"}
                </button>
              ))}
            </div>
          )}

          {combos.length > 1 && combos.length <= MAX_COMBOS_LISTED && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-black text-slate-900">كل التركيبات ({combos.length})</p>
                {value.off.length > 0 && (
                  <button type="button" onClick={() => onChange({ ...value, off: [] })} className="text-xs font-bold text-sky-700 hover:underline cursor-pointer">
                    خلّي الكل متاح
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500">شيل العلامة من أي تركيبة خلصت: العميل مش هيقدر يختارها.</p>
              <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {combos.map((c) => {
                  const key = comboKey(options, c);
                  const available = !value.off.includes(key);
                  return (
                    <label key={key} className="flex items-center gap-3 px-3 min-h-[44px] cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={available}
                        onChange={() => onChange({ ...value, off: available ? [...value.off, key] : value.off.filter((k) => k !== key) })}
                        className="w-4 h-4"
                      />
                      <span className={`flex-1 text-sm font-bold ${available ? "text-slate-800" : "text-slate-400 line-through"}`}>{key}</span>
                      <span className={`text-xs font-bold ${available ? "text-emerald-700" : "text-rose-700"}`}>{available ? "متاح" : "خلص"}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          {combos.length > MAX_COMBOS_LISTED && <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5">التركيبات كتير ({`أكتر من ${MAX_COMBOS_LISTED}`})، فقايمة المتاح/الخالص مش بتظهر. قلّل القيم عشان تتحكم فيها.</p>}
        </div>
      )}
    </section>
  );
}
