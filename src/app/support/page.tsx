"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Bot, ShieldCheck, Truck, RotateCcw, Headphones, Sparkles, MessageCircle } from "lucide-react";
import { SalesChatBox } from "@/components/chat/SalesChatBox";

export default function CustomerSupportPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir="rtl">
      {/* Top Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-400 hover:text-white transition"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للمتجر الرئيسي</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black">
              <Bot className="w-4 h-4" />
            </div>
            <span className="font-heading font-black text-sm text-white">
              RexRack AI Sales Closer
            </span>
          </div>

          <a
            href="https://wa.me/201000000000?text=مرحباً،%20أود%20الاستفسار%20عن%20العروض"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl hover:bg-emerald-900/40 transition"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>واتساب المبيعات</span>
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-center">
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            <Sparkles className="w-3.5 h-3.5" /> شات المبيعات التفاعلي المباشر
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-white">
            تحدث مباشرة مع مستشارك البيعي في RexRack
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            احصل على إجابات فورية عن المنتجات، كود الشحن المجاني، تفاصيل المعاينة قبل الدفع، وأكمل طلبك نقدياً عند الاستلام من داخل الشات مباشرة!
          </p>
        </div>

        {/* The Upgraded Conversational Chatbox */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-[32px] blur-xl opacity-70 -z-10" />
          <SalesChatBox className="w-full shadow-2xl" />
        </div>

        {/* 4 Trust Highlights Below Chat */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-center">
            <ShieldCheck className="w-5 h-5 text-orange-400 mx-auto mb-1" />
            <h4 className="text-xs font-bold text-white">معاينة قبل الدفع</h4>
            <p className="text-[10px] text-slate-500">افحص طلبك مع المندوب</p>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-center">
            <Truck className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <h4 className="text-xs font-bold text-white">شحن مجاني</h4>
            <p className="text-[10px] text-slate-500">لجميع محافظات مصر الـ 27</p>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-center">
            <RotateCcw className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <h4 className="text-xs font-bold text-white">استبدال 14 يوم</h4>
            <p className="text-[10px] text-slate-500">ضمان ذهبي معتمد</p>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-center">
            <Headphones className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <h4 className="text-xs font-bold text-white">خدمة عملاء 24/7</h4>
            <p className="text-[10px] text-slate-500">متابعة لحظية ومباشرة</p>
          </div>
        </div>
      </main>
    </div>
  );
}
