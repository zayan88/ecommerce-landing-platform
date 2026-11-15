import React from "react";
import { ShieldCheck, RefreshCw, Truck } from "lucide-react";

export interface GuaranteeItem {
  icon: "inspect" | "swap" | "shipping";
  title: string;
  desc: string;
}

/** The 3 golden Egyptian COD guarantees. */
export const DEFAULT_GUARANTEES: GuaranteeItem[] = [
  { icon: "inspect", title: "معاينة قبل الدفع", desc: "افتح الشحنة وجرّب قدام المندوب" },
  { icon: "swap", title: "استبدال مجاني 14 يوم", desc: "لو فيه أي عيب صناعة" },
  { icon: "shipping", title: "شحن مجاني", desc: "لكل محافظات مصر" },
];

const ICONS = { inspect: ShieldCheck, swap: RefreshCw, shipping: Truck } as const;

interface GuaranteesStripProps {
  title?: string;
  items?: GuaranteeItem[];
}

export function GuaranteesStrip({ title, items }: GuaranteesStripProps) {
  const valid = (items || []).filter((i) => i?.title);
  // Always exactly 3 cards; missing ones fall back to the defaults
  const list = [0, 1, 2].map((i) => valid[i] || DEFAULT_GUARANTEES[i]);

  return (
    <section dir="rtl" aria-label={title || "ضماناتنا"} className="bg-emerald-50 rounded-3xl border border-emerald-200 p-4 sm:p-6">
      {title && (
        <h2 className="text-lg sm:text-xl font-black text-emerald-900 font-heading text-center mb-3 leading-relaxed">{title}</h2>
      )}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {list.map((g, idx) => {
          const Icon = ICONS[g.icon] || ShieldCheck;
          return (
            <div key={idx} className="flex flex-col items-center text-center gap-1.5 rounded-2xl bg-white border border-emerald-100 p-2.5 sm:p-4 shadow-sm">
              <span className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-100 text-emerald-700">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
              </span>
              <p className="font-black text-emerald-900 text-xs sm:text-sm leading-snug">{g.title}</p>
              <p className="text-[11px] sm:text-xs text-slate-600 leading-snug">{g.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
