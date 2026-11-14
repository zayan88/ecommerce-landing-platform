"use client";

import React, { useState, useEffect } from "react";
import { MessageCircle, X, Sparkles, Bot, ShoppingBag } from "lucide-react";
import { SalesChatBox } from "./SalesChatBox";
import { Product } from "@/types";

interface FloatingSalesAgentProps {
  currentProduct?: Product;
}

export function FloatingSalesAgent({ currentProduct }: FloatingSalesAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Proactive Teaser Bubble after 4 seconds of page load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasInteracted && !isOpen) {
        setShowTeaser(true);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [hasInteracted, isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setShowTeaser(false);
    setHasInteracted(true);
  };

  return (
    <div className="fixed bottom-5 left-5 z-50 font-sans" dir="rtl">
      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-20 sm:left-5 z-50 flex items-end sm:items-center justify-center p-0 sm:p-0">
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Chat Container */}
          <div className="relative w-full sm:w-[420px] md:w-[460px] h-[92vh] sm:h-[650px] max-h-[92vh] shadow-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden border border-slate-800 animate-in slide-in-from-bottom-5 duration-300">
            <SalesChatBox
              isFloating={true}
              onClose={() => setIsOpen(false)}
              currentProductSlug={currentProduct?.slug}
              className="h-full rounded-none sm:rounded-3xl"
            />
          </div>
        </div>
      )}

      {/* Proactive Sales Teaser Bubble */}
      {showTeaser && !isOpen && (
        <div
          onClick={handleToggle}
          className="absolute bottom-16 left-0 mb-2 w-72 bg-slate-900 border border-orange-500/40 text-slate-100 p-3.5 rounded-2xl shadow-xl cursor-pointer hover:border-orange-500 transition animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-black text-orange-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> مستشارك البيعي في RexRack
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTeaser(false);
                setHasInteracted(true);
              }}
              className="text-slate-500 hover:text-slate-300 text-xs"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-slate-200 mt-1.5 leading-relaxed font-bold">
            {currentProduct
              ? `بتفكر في ${currentProduct.title_ar}؟ كلمني أعرفك عرض القطعتين والشحن المجاني والمعاينة قبل الدفع! 🎁`
              : "👋 محتار بين العروض؟ كلمني لايف أساعدك تختار الأنسب وتستفيد من عروض الشحن المجاني! 🚚"}
          </p>
          <span className="inline-block mt-2 text-[10px] bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-md font-bold">
            اضغط لبدء الشات الفوري 💬
          </span>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={handleToggle}
        aria-label="افتح شات المبيعات الذكي"
        className="group relative flex items-center gap-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-slate-950 font-black px-4 py-3 rounded-full shadow-2xl shadow-orange-500/40 hover:shadow-orange-500/60 transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/20"
      >
        <div className="relative">
          <Bot className="w-5 h-5 text-slate-950" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border border-slate-950 rounded-full animate-pulse" />
        </div>

        <span className="text-xs md:text-sm font-black tracking-wide">
          {isOpen ? "إغلاق الشات" : "شات المبيعات الذكي"}
        </span>

        {!isOpen && (
          <span className="bg-slate-950 text-orange-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            لايف
          </span>
        )}
      </button>
    </div>
  );
}
