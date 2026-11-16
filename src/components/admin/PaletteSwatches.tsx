"use client";

import React from "react";
import { Check } from "lucide-react";
import { PALETTE_KEYS, PALETTES, PALETTE_LABELS_AR, isHexColor, themeSwatchRgb } from "@/lib/palettes";

const toHex = (rgbTriplet: string) =>
  "#" + rgbTriplet.split(" ").map((n) => Number(n).toString(16).padStart(2, "0")).join("");

/** Color picker: quick palette swatches plus a free color picker (any color, saved as #rrggbb). */
export function PaletteSwatches({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (k: string) => void;
  label?: string;
}) {
  const custom = isHexColor(value);
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {PALETTE_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={value === k}
            aria-label={PALETTE_LABELS_AR[k]}
            title={PALETTE_LABELS_AR[k]}
            onClick={() => onChange(k)}
            className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition cursor-pointer ${
              value === k ? "border-slate-900 scale-110" : "border-white shadow-sm"
            }`}
            style={{ backgroundColor: `rgb(${PALETTES[k]["500"]})` }}
          >
            {value === k && <Check className="w-5 h-5 text-white" />}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-3 min-h-[48px] px-3 rounded-xl border border-slate-300 bg-white cursor-pointer">
        <input
          type="color"
          aria-label={`لون مخصص ${label || ""}`}
          value={custom ? value : toHex(themeSwatchRgb(value))}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          className="w-9 h-9 rounded-lg border-0 bg-transparent p-0 cursor-pointer"
        />
        <span className="text-sm font-bold text-slate-800">اختار أي لون تحبه</span>
        {custom && (
          <span dir="ltr" className="ms-auto text-xs font-mono text-slate-500">
            {value}
          </span>
        )}
      </label>
    </div>
  );
}
