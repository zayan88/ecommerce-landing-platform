"use client";

import React from "react";
import { ProductOffer } from "@/types";
import { Check, Sparkles, Tag } from "lucide-react";

interface HeroOfferSelectorProps {
  offers: ProductOffer[];
  selectedOffer: ProductOffer;
  onSelectOffer: (offer: ProductOffer) => void;
  accentColor?: "orange" | "cyan" | "emerald" | "blue" | "purple";
  isDarkTheme?: boolean;
}

export function HeroOfferSelector({
  offers,
  selectedOffer,
  onSelectOffer,
  accentColor = "orange",
  isDarkTheme = false,
}: HeroOfferSelectorProps) {
  if (!offers || offers.length === 0) return null;

  // Color mapping
  const colors = {
    orange: {
      selectedBorder: "border-orange-500",
      selectedBg: isDarkTheme ? "bg-orange-950/40" : "bg-orange-50/70",
      ring: "ring-2 ring-orange-500/30",
      dot: "bg-orange-600 border-orange-600",
      priceText: "text-orange-600",
      badgePopular: "bg-gradient-to-r from-orange-600 to-amber-600 text-white",
      badgeDefault: isDarkTheme ? "bg-slate-800 text-slate-300" : "bg-slate-900 text-white",
      badgeSavings: "bg-emerald-600 text-white",
    },
    cyan: {
      selectedBorder: "border-cyan-500",
      selectedBg: isDarkTheme ? "bg-cyan-950/40" : "bg-cyan-50/70",
      ring: "ring-2 ring-cyan-500/30",
      dot: "bg-cyan-600 border-cyan-600",
      priceText: "text-cyan-700",
      badgePopular: "bg-gradient-to-r from-cyan-600 to-sky-600 text-white",
      badgeDefault: isDarkTheme ? "bg-slate-800 text-slate-300" : "bg-slate-900 text-white",
      badgeSavings: "bg-emerald-600 text-white",
    },
    emerald: {
      selectedBorder: "border-emerald-500",
      selectedBg: isDarkTheme ? "bg-emerald-950/40" : "bg-emerald-50/70",
      ring: "ring-2 ring-emerald-500/30",
      dot: "bg-emerald-600 border-emerald-600",
      priceText: "text-emerald-700",
      badgePopular: "bg-gradient-to-r from-emerald-600 to-teal-600 text-white",
      badgeDefault: isDarkTheme ? "bg-slate-800 text-slate-300" : "bg-slate-900 text-white",
      badgeSavings: "bg-emerald-600 text-white",
    },
    blue: {
      selectedBorder: "border-blue-500",
      selectedBg: isDarkTheme ? "bg-blue-950/40" : "bg-blue-50/70",
      ring: "ring-2 ring-blue-500/30",
      dot: "bg-blue-600 border-blue-600",
      priceText: "text-blue-700",
      badgePopular: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white",
      badgeDefault: isDarkTheme ? "bg-slate-800 text-slate-300" : "bg-slate-900 text-white",
      badgeSavings: "bg-emerald-600 text-white",
    },
    purple: {
      selectedBorder: "border-purple-500",
      selectedBg: isDarkTheme ? "bg-purple-950/50" : "bg-purple-50/70",
      ring: "ring-2 ring-purple-500/30",
      dot: "bg-purple-600 border-purple-600",
      priceText: "text-amber-400",
      badgePopular: "bg-gradient-to-r from-purple-600 to-pink-600 text-white",
      badgeDefault: isDarkTheme ? "bg-purple-900/80 text-purple-200" : "bg-slate-900 text-white",
      badgeSavings: "bg-emerald-600 text-white",
    },
  }[accentColor];

  const handleSelect = (offer: ProductOffer) => {
    onSelectOffer(offer);
    if (typeof window !== "undefined" && window.rexrackTrack) {
      window.rexrackTrack("SelectOffer", {
        offer_id: offer.id,
        quantity: offer.quantity,
        price: offer.price,
        source: "hero_selector",
      });
    }
  };

  return (
    <div className="space-y-2.5 pt-2 text-right" dir="rtl">
      <div className="flex items-center justify-between text-xs">
        <span
          className={`font-bold flex items-center gap-1.5 ${
            isDarkTheme ? "text-slate-200" : "text-slate-900"
          }`}
        >
          <Tag className="w-3.5 h-3.5 text-emerald-500" />
          <span>اختر الباقة المناسبة لك (المعاينة قبل الدفع):</span>
        </span>
        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          ✓ شحن مجاني
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {offers.map((offer) => {
          const isSelected = selectedOffer?.id === offer.id || selectedOffer?.quantity === offer.quantity;
          const isSingle = offer.quantity === 1;
          const isDouble = offer.quantity === 2;
          const isTriple = offer.quantity >= 3;

          const badgeText = isSingle
            ? "قطعة واحدة"
            : isDouble
            ? "الأكثر طلباً ⭐"
            : "أعلى توفير 🔥";

          const badgeClass = isDouble
            ? colors.badgePopular
            : isTriple
            ? colors.badgeSavings
            : colors.badgeDefault;

          return (
            <div
              key={offer.id}
              onClick={() => handleSelect(offer)}
              className={`relative p-2.5 sm:p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between select-none ${
                isSelected
                  ? `${colors.selectedBorder} ${colors.selectedBg} ${colors.ring} shadow-md`
                  : isDarkTheme
                  ? "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs"
              }`}
            >
              {/* Badge */}
              <span
                className={`absolute -top-2.5 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-2 text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs whitespace-nowrap ${badgeClass}`}
              >
                {badgeText}
              </span>

              {/* Title & Radio Dot */}
              <div className="flex items-center gap-1.5 pt-1.5 mb-1.5">
                <div
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected
                      ? colors.dot
                      : isDarkTheme
                      ? "border-slate-600 bg-slate-800"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                </div>

                <div
                  className={`font-black text-xs leading-tight truncate ${
                    isDarkTheme ? "text-white" : "text-slate-900"
                  }`}
                >
                  {isSingle ? "قطعة واحدة" : isDouble ? "قطعتان" : `${offer.quantity} قطع`}
                </div>
              </div>

              {/* Price & Original Price */}
              <div className="mt-auto">
                <div className="flex flex-wrap items-baseline gap-1">
                  <span className={`text-sm sm:text-base font-black font-mono leading-none ${colors.priceText}`}>
                    {offer.price}
                    <span className="text-[10px] font-sans mr-0.5 font-normal">ج.م</span>
                  </span>
                  {offer.original_price && (
                    <span className="text-[10px] text-slate-400 line-through font-mono">
                      {offer.original_price}
                    </span>
                  )}
                </div>

                {offer.discount_label && (
                  <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 block mt-1 truncate">
                    {offer.discount_label}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
