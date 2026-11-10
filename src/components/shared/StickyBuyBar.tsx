"use client";

import React from "react";
import { ShoppingBagIcon } from "@heroicons/react/24/solid";

interface StickyBuyBarProps {
  productTitle: string;
  price: number;
  compareAtPrice?: number;
  onCtaClick?: () => void;
  ctaText?: string;
}

export function StickyBuyBar({
  productTitle,
  price,
  compareAtPrice,
  onCtaClick,
  ctaText = "أكّد طلبك الآن 🛒",
}: StickyBuyBarProps) {
  const scrollToForm = () => {
    if (onCtaClick) {
      onCtaClick();
    } else {
      const el = document.getElementById("order-form-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 shadow-[0_-4px_25px_rgba(0,0,0,0.12)] md:hidden transition-all"
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-orange-600 font-heading">{price} ج.م</span>
            {compareAtPrice && (
              <span className="text-xs text-slate-400 line-through">{compareAtPrice} ج.م</span>
            )}
          </div>
          <span className="text-[10px] text-emerald-700 font-bold">✓ معاينة قبل الدفع</span>
        </div>

        <button
          onClick={scrollToForm}
          className="flex-1 max-w-[210px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 text-white font-black text-xs sm:text-sm shadow-md shadow-orange-500/25 flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
        >
          <ShoppingBagIcon className="w-4 h-4" />
          <span>{ctaText}</span>
        </button>
      </div>
    </div>
  );
}
