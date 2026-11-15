import React from "react";
import { TruckIcon, ShieldCheckIcon, BanknotesIcon } from "@heroicons/react/24/solid";

/**
 * Static trust bar. Intentionally NO countdown timer and NO seasonal claims: a timer that
 * restarts for every visitor is misleading advertising (and risks Meta ad rejection).
 */
export function UrgencyBar() {
  return (
    <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white text-xs md:text-sm py-2 px-4 shadow-sm border-b border-indigo-500/20" dir="rtl">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-x-5 gap-y-1 flex-wrap font-bold">
        <span className="flex items-center gap-1.5">
          <TruckIcon className="w-4 h-4 text-emerald-400" aria-hidden="true" /> شحن مجاني لكل المحافظات
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheckIcon className="w-4 h-4 text-emerald-400" aria-hidden="true" /> معاينة وفحص قبل الدفع
        </span>
        <span className="flex items-center gap-1.5">
          <BanknotesIcon className="w-4 h-4 text-amber-300" aria-hidden="true" /> الدفع عند الاستلام
        </span>
      </div>
    </div>
  );
}
