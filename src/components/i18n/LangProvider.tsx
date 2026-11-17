"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { useBrand } from "@/components/brand/BrandProvider";
import { LANG_COOKIE, currencyEn, dirOf, normalizeLang, tr, type Lang } from "@/lib/i18n";

interface LangCtx {
  lang: Lang;
  dir: "rtl" | "ltr";
  /** The page's template only supports Arabic: the switcher is hidden. */
  locked: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
  setLang: (l: Lang) => void;
}

const Ctx = createContext<LangCtx>({ lang: "ar", dir: "rtl", locked: true, t: (k, v) => tr("ar", k, v), setLang: () => {} });

/** The storefront language: the visitor's cookie decides (server reads it too). `locked` forces Arabic (templates without English). */
export function LangProvider({ initial, locked = false, children }: { initial: Lang; locked?: boolean; children: React.ReactNode }) {
  const router = useRouter();
  const brand = useBrand();
  const [lang, setLangState] = useState<Lang>(locked ? "ar" : normalizeLang(initial));
  const setLang = useCallback(
    (l: Lang) => {
      if (locked) return;
      try {
        document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
      } catch {
        /* cookies blocked: the choice lasts for this page view only */
      }
      setLangState(l);
      router.refresh(); // server-rendered parts (page text, metadata) read the cookie too
    },
    [locked, router]
  );
  const eff: Lang = locked ? "ar" : lang;
  const symbol = brand.currency || "ج.م";
  const t = (k: string, v?: Record<string, string | number>) => (k === "currency" ? (eff === "en" ? currencyEn(symbol) : symbol) : tr(eff, k, v));
  const value: LangCtx = { lang: eff, dir: dirOf(eff), locked, t, setLang };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  return useContext(Ctx);
}
