"use client";

import React from "react";
import { TruckIcon, ShieldCheckIcon, BanknotesIcon } from "@heroicons/react/24/solid";
import { useLang } from "@/components/i18n/LangProvider";

/**
 * Static trust bar. Intentionally NO countdown timer and NO seasonal claims: a timer that
 * restarts for every visitor is misleading advertising (and risks Meta ad rejection).
 */
export function UrgencyBar() {
  const { t, dir } = useLang();
  return (
    <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white text-xs md:text-sm py-2 px-4 shadow-sm border-b border-indigo-500/20" dir={dir}>
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-x-5 gap-y-1 flex-wrap font-bold">
        <span className="flex items-center gap-1.5">
          <TruckIcon className="w-4 h-4 text-emerald-400" aria-hidden="true" /> {t("urgency.free")}
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheckIcon className="w-4 h-4 text-emerald-400" aria-hidden="true" /> {t("urgency.inspect")}
        </span>
        <span className="flex items-center gap-1.5">
          <BanknotesIcon className="w-4 h-4 text-amber-300" aria-hidden="true" /> {t("urgency.cod")}
        </span>
      </div>
    </div>
  );
}
