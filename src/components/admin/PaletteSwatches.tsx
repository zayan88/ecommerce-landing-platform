"use client";

import React from "react";
import { Check } from "lucide-react";
import { PALETTE_KEYS, PALETTES, PALETTE_LABELS_AR, type PaletteKey } from "@/lib/palettes";

/** Color picker over the fixed palette whitelist (radio group of round swatches). */
export function PaletteSwatches({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (k: PaletteKey) => void;
  label?: string;
}) {
  return (
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
  );
}
