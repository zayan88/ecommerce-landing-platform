"use client";

import React from "react";
import { ShoppingBag } from "lucide-react";

export function ProductOrderButton({ disabled = false }: { disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => document.getElementById("order-form-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
      className="w-full min-h-[52px] rounded-2xl bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 disabled:shadow-none text-white font-black text-lg shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-colors"
    >
      <ShoppingBag className="w-5 h-5" aria-hidden="true" />
      اطلب الآن
    </button>
  );
}
