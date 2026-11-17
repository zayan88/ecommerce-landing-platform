"use client";

import React from "react";
import { Languages } from "lucide-react";
import { useBrand } from "@/components/brand/BrandProvider";
import { useLang } from "./LangProvider";

/** Small AR / EN pill on the storefront. Hidden on templates that only exist in Arabic or when the merchant turned it off. */
export function LanguageSwitcher({ className = "", strip = false }: { className?: string; strip?: boolean }) {
  const brand = useBrand();
  const { lang, locked, setLang, t } = useLang();
  if (locked || brand.lang_switch === false) return null;
  const button = (
    <button
      type="button"
      onClick={() => setLang(lang === "ar" ? "en" : "ar")}
      aria-label={t("lang_switch_aria")}
      className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-full bg-white/95 border border-slate-300 text-slate-800 text-xs font-black shadow-sm hover:bg-white cursor-pointer ${className}`}
    >
      <Languages className="w-3.5 h-3.5" aria-hidden="true" />
      {t("lang_switch_label")}
    </button>
  );
  // strip: its own slim row in the page flow (nothing floats over the content)
  return strip ? <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-3 flex justify-end">{button}</div> : button;
}
