"use client";

import React from "react";
import Link from "next/link";
import { Bot } from "lucide-react";

export function HeroSupportButton() {
  const handleClick = (e: React.MouseEvent) => {
    // Open the floating AI Sales & Support Agent drawer right on the page without reload
    if (typeof window !== "undefined") {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("open-sales-agent"));
    }
  };

  return (
    <Link
      href="/support"
      onClick={handleClick}
      className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-white hover:bg-gray-100 text-slate-800 font-bold text-base border border-gray-300 shadow-sm transition flex items-center justify-center gap-2 group cursor-pointer"
    >
      <Bot className="w-5 h-5 text-orange-600 group-hover:scale-110 transition-transform" />
      <span>تحدث مع خدمة العملاء الذكية (رد فوري 24/7)</span>
    </Link>
  );
}
