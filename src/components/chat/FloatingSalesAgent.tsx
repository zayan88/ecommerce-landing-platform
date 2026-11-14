"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Bot } from "lucide-react";
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
    <div
      className="fixed bottom-24 md:bottom-8 right-5 md:right-8 z-50 font-sans"
      dir="rtl"
    >
      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-8 z-50 flex items-end sm:items-center justify-center p-0 sm:p-0">
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

      {/* Proactive Sales Teaser Bubble (Small, unobtrusive, above circle) */}
      {showTeaser && !isOpen && (
        <div
          onClick={handleToggle}
          className="absolute bottom-16 right-0 mb-2 w-64 sm:w-72 bg-slate-900/95 backdrop-blur-md border border-orange-500/50 text-slate-100 p-3 rounded-2xl shadow-2xl cursor-pointer hover:border-orange-400 transition animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-black text-orange-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> مستشارك البيعي AI
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTeaser(false);
                setHasInteracted(true);
              }}
              className="text-slate-400 hover:text-white text-xs p-0.5"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-slate-200 mt-1 leading-relaxed font-bold">
            {currentProduct
              ? `بتفكر في ${currentProduct.title_ar.slice(0, 24)}...؟ كلمني أعرفك عروض الشحن المجاني والمعاينة!`
              : "👋 محتار بين العروض؟ كلمني لايف أساعدك تختار الأنسب والشحن مجاني! 🚚"}
          </p>
        </div>
      )}

      {/* Pure Circular AI Floating Button (No Text - AI Shape Only) */}
      <button
        onClick={handleToggle}
        aria-label="افتح شات المبيعات الذكي"
        className="group relative w-14 h-14 rounded-full bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 border-2 border-orange-500/80 hover:border-orange-400 text-orange-400 hover:text-white shadow-[0_8px_25px_rgba(249,115,22,0.4)] hover:shadow-[0_8px_35px_rgba(249,115,22,0.6)] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
        title="شات المبيعات الذكي AI"
      >
        {/* Glowing pulse aura */}
        <span className="absolute -inset-1 rounded-full bg-orange-500/20 blur-xs group-hover:bg-orange-500/35 transition" />

        {/* Live Status Indicator Dot */}
        <span className="absolute top-0.5 left-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse z-10" />

        {/* Pure AI Shape Icon */}
        {isOpen ? (
          <X className="w-6 h-6 text-white transition-transform duration-200 rotate-90 group-hover:rotate-0 relative z-10" />
        ) : (
          <div className="relative z-10 flex items-center justify-center">
            <Bot className="w-7 h-7 text-orange-400 group-hover:text-amber-300 transition-colors" />
          </div>
        )}
      </button>
    </div>
  );
}
