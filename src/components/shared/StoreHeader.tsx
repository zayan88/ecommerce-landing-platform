"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { useBrand } from "@/components/brand/BrandProvider";
import { useLang } from "@/components/i18n/LangProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

/** Slim header of the product pages: the store's name / logo and a clear way back to the home page. */
export function StoreHeader() {
  const brand = useBrand();
  const { t, dir } = useLang();
  const pathname = usePathname() || "";
  if (pathname === "/") return null; // the home page has its own header
  const name = brand.store_name || "";
  return (
    <header dir={dir} className="bg-white border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 min-w-0" aria-label={`${name} - ${t("nav.home")}`}>
          <span className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-tr from-slate-950 to-indigo-900 text-white font-black text-lg flex items-center justify-center overflow-hidden">
            {brand.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logo_url} alt="" className="w-full h-full p-0.5 object-contain rounded-lg bg-white" />
            ) : (
              (name || "M").trim().charAt(0).toUpperCase()
            )}
          </span>
          <span className="text-base font-black font-heading text-slate-900 truncate">{name}</span>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/" className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-full border border-slate-300 bg-white text-slate-800 text-xs font-black hover:bg-slate-50">
            <Home className="w-3.5 h-3.5" aria-hidden="true" />
            {t("nav.home")}
          </Link>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
