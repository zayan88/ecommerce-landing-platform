"use client";

import React from "react";
import { ShoppingBagIcon } from "@heroicons/react/24/solid";
import { Product, ProductOffer } from "@/types";

interface StickyBuyBarProps {
  product?: Product;
  selectedOffer?: ProductOffer;
  onOrderClick?: () => void;
  onBuyClick?: () => void;
  productTitle?: string;
  price?: number;
  compareAtPrice?: number;
  onCtaClick?: () => void;
  ctaText?: string;
}

export function StickyBuyBar({
  product,
  selectedOffer,
  onOrderClick,
  onBuyClick,
  productTitle = product?.title_ar || "",
  price = selectedOffer?.price || product?.base_price || 0,
  compareAtPrice = selectedOffer?.original_price || product?.compare_at_price,
  onCtaClick = onOrderClick ?? onBuyClick,
  ctaText = "أكّد طلبك الآن 🛒",
}: StickyBuyBarProps) {
  const [pastHero, setPastHero] = React.useState(false);
  const [formInView, setFormInView] = React.useState(false);

  // Show only after the visitor scrolls past the hero (~one screen)...
  React.useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > Math.max(480, window.innerHeight * 0.7));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ...and hide while the order form itself is on screen (no duplicate CTA over the form).
  React.useEffect(() => {
    const el = document.getElementById("order-form-section");
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setFormInView(entry.isIntersecting), {
      threshold: 0.15,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const visible = pastHero && !formInView;

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
    <>
      {/* Spacer so the fixed bar never covers the last content on the page */}
      <div aria-hidden="true" className="h-20 md:h-16" />
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] shadow-[0_-4px_25px_rgba(0,0,0,0.12)] transition-transform duration-300 ${
          visible ? "translate-y-0" : "translate-y-full pointer-events-none"
        }`}
        dir="rtl"
        aria-hidden={!visible}
      >
      <div className="flex items-center justify-between gap-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl font-black text-orange-600 font-heading">{price} ج.م</span>
            {compareAtPrice && (
              <span className="text-xs sm:text-sm text-slate-400 line-through">{compareAtPrice} ج.م</span>
            )}
          </div>
          <span className="hidden sm:inline-block text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            ✓ معاينة وفحص قبل الدفع + شحن مجاني
          </span>
          <span className="sm:hidden text-[10px] text-emerald-700 font-bold">✓ معاينة قبل الدفع</span>
        </div>

        <button
          onClick={scrollToForm}
          tabIndex={visible ? 0 : -1}
          className="flex-1 max-w-[210px] sm:max-w-[260px] min-h-[48px] py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 text-white font-black text-xs sm:text-sm shadow-md shadow-orange-500/25 flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 transition cursor-pointer"
        >
          <ShoppingBagIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>{ctaText}</span>
        </button>
      </div>
      </div>
    </>
  );
}
