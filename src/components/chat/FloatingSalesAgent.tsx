"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Bot, MessageCircle } from "lucide-react";
import { SalesChatBox } from "./SalesChatBox";
import { Product } from "@/types";

interface FloatingSalesAgentProps {
  currentProduct?: Product;
}

export function FloatingSalesAgent({ currentProduct }: FloatingSalesAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTeaser, setShowTeaser] = useState(true);

  return (
    <div
      className="fixed bottom-24 md:bottom-20 right-4 sm:right-6 md:right-8 z-[9999] font-sans pointer-events-auto"
      dir="rtl"
    >
      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-8 z-[9999] flex items-end sm:items-center justify-center p-0">
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs sm:hidden z-[9998]"
            onClick={() => setIsOpen(false)}
          />

          {/* Chat Container */}
          <div className="relative w-full sm:w-[420px] md:w-[460px] h-[92vh] sm:h-[650px] max-h-[92vh] shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-slate-800 z-[9999] animate-in slide-in-from-bottom-5 duration-300">
            <SalesChatBox
              isFloating={true}
              onClose={() => setIsOpen(false)}
              currentProductSlug={currentProduct?.slug}
              className="h-full rounded-none sm:rounded-3xl"
            />
          </div>
        </div>
      )}

      {/* Proactive Sales Teaser Bubble (Visible on Desktop & Mobile above circle) */}
      {showTeaser && !isOpen && (
        <div
          onClick={() => setIsOpen(true)}
          className="absolute bottom-16 sm:bottom-20 right-0 mb-1 w-64 sm:w-72 bg-slate-900/95 backdrop-blur-md border border-orange-500/60 text-slate-100 p-3 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] cursor-pointer hover:border-orange-400 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 z-[9999]"
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
          <span className="inline-block mt-1.5 text-[10px] text-orange-300 font-bold underline">
            اضغط هنا للتحدث الآن 💬
          </span>
        </div>
      )}

      {/* Pure Circular AI Floating Button (No Text - AI Shape Only) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="افتح شات المبيعات الذكي"
        className="group relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 border-2 border-orange-500 hover:border-amber-400 text-orange-400 hover:text-white shadow-[0_8px_30px_rgba(249,115,22,0.45)] hover:shadow-[0_12px_40px_rgba(249,115,22,0.7)] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer z-[9999]"
        title="شات المبيعات الذكي AI"
      >
        {/* Glowing pulse ring */}
        <span className="absolute -inset-1 rounded-full bg-orange-500/25 blur-xs group-hover:bg-orange-500/40 animate-pulse transition" />

        {/* Live Status Indicator Dot */}
        <span className="absolute top-1 left-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse z-10" />

        {/* Pure AI Shape Icon */}
        {isOpen ? (
          <X className="w-6 h-6 md:w-7 md:h-7 text-white transition-transform duration-200 rotate-90 group-hover:rotate-0 relative z-10" />
        ) : (
          <div className="relative z-10 flex items-center justify-center">
            <Bot className="w-7 h-7 md:w-8 md:h-8 text-orange-400 group-hover:text-amber-300 transition-colors" />
          </div>
        )}
      </button>
    </div>
  );
}
