"use client";

import React from "react";
import { useBrand } from "@/components/brand/BrandProvider";
import { shippingHint } from "@/lib/commerce";
import { ShieldCheck, RefreshCw, Truck } from "lucide-react";
import { EText } from "@/components/editor/Editable";
import { useLang } from "@/components/i18n/LangProvider";

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
  /** Bind texts to content_config paths for the live editor (no effect on the public render). */
  editable?: boolean;
}

export function GuaranteesStrip({ title, items, editable }: GuaranteesStripProps) {
  const hint = shippingHint(useBrand().commerce.shipping);
  const { t, dir } = useLang();
  const base: GuaranteeItem[] = [
    { icon: "inspect", title: t("guar.inspect_t"), desc: t("guar.inspect_d") },
    { icon: "swap", title: t("guar.swap_t"), desc: t("guar.swap_d") },
    { icon: "shipping", title: t("guar.ship_t"), desc: t("guar.ship_d") },
  ];
  const defaults = base.map((g) => (g.icon === "shipping" && !hint.free ? { ...g, title: hint.text } : g));
  const valid = (items || []).filter((i) => i?.title);
  // Always exactly 3 cards; missing ones fall back to the defaults
  const list = [0, 1, 2].map((i) => valid[i] || defaults[i]);

  return (
    <section dir={dir} aria-label={title || t("guar.aria")} className="bg-emerald-50 rounded-3xl border border-emerald-200 p-4 sm:p-6">
      {title && (
        <EText field={editable ? "guarantees_title" : undefined} as="h2" className="text-lg sm:text-xl font-black text-emerald-900 font-heading text-center mb-3 leading-relaxed" value={title} />
      )}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {list.map((g, idx) => {
          const Icon = ICONS[g.icon] || ShieldCheck;
          return (
            <div key={idx} className="flex flex-col items-center text-center gap-1.5 rounded-2xl bg-white border border-emerald-100 p-2.5 sm:p-4 shadow-sm">
              <span className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-100 text-emerald-700">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
              </span>
              <EText field={editable ? `guarantees.${idx}.title` : undefined} base={list} as="p" className="font-black text-emerald-900 text-xs sm:text-sm leading-snug" value={g.title} />
              <EText field={editable ? `guarantees.${idx}.desc` : undefined} base={list} as="p" className="text-[11px] sm:text-xs text-slate-600 leading-snug" value={g.desc} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
