"use client";

import React from "react";
import type { ProductOption } from "@/types";
import { valueHasStock } from "@/lib/product-options";

/** The customer's color / size choice as chips (a color dot when the merchant set one; sold-out values are disabled). */
export function OptionsPicker({ options, off, picked, onPick, compact = false }: { options: ProductOption[]; off: string[]; picked: Record<string, string>; onPick: (name: string, value: string) => void; compact?: boolean }) {
  if (options.length === 0) return null;
  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {options.map((o) => (
        <div key={o.name} role="group" aria-label={o.name}>
          <p className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
            {o.name} <span className="text-red-500">*</span>
            {picked[o.name] ? <span className="text-emerald-700 font-black"> : {picked[o.name]}</span> : null}
          </p>
          <div className="flex flex-wrap gap-2">
            {o.values.map((v) => {
              const on = picked[o.name] === v;
              const inStock = valueHasStock(options, off, picked, o.name, v);
              const dot = o.swatches?.[v];
              return (
                <button
                  key={v}
                  type="button"
                  aria-pressed={on}
                  disabled={!inStock}
                  onClick={() => onPick(o.name, v)}
                  className={`min-h-[44px] min-w-[56px] px-4 rounded-xl text-sm font-bold border-2 transition inline-flex items-center justify-center gap-2 ${inStock ? "cursor-pointer" : "cursor-not-allowed opacity-45 line-through"} ${on ? "border-orange-500 bg-orange-50 text-orange-900 ring-2 ring-orange-500/30" : "border-slate-300 bg-white text-slate-800 hover:border-slate-400"}`}
                >
                  {dot && <span aria-hidden="true" className="w-4 h-4 rounded-full border border-slate-300 shrink-0" style={{ backgroundColor: dot }} />}
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
