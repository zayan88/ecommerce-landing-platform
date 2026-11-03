"use client";

import React from "react";
import { ShoppingCart } from "lucide-react";

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
  ctaText = "اطلب الآن - الدفع عند الاستلام",
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
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:hidden transition-all"
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 line-clamp-1">{productTitle}</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-emerald-600">{price} ج.م</span>
            {compareAtPrice && (
              <span className="text-xs text-gray-400 line-through">{compareAtPrice} ج.م</span>
            )}
          </div>
        </div>

        <button
          onClick={scrollToForm}
          className="flex-1 max-w-[210px] py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5 active:scale-95 transition"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{ctaText}</span>
        </button>
      </div>
    </div>
  );
}
