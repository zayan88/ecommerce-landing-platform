"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

/** Simple GET search: navigates to /?q=<text> (the home page filters server-side). */
export function StoreSearch({ autoFocus, onDone, className = "" }: { autoFocus?: boolean; onDone?: () => void; className?: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp?.get("q") || "");
  return (
    <form
      role="search"
      className={`flex items-center gap-2 ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        const t = q.trim();
        router.push(t ? `/?q=${encodeURIComponent(t)}#products` : "/#products");
        onDone?.();
      }}
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus={autoFocus}
        placeholder="ابحث عن منتج..."
        aria-label="بحث"
        className="flex-1 min-w-0 h-11 rounded-full border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
      />
      <button type="submit" aria-label="بحث" className="h-11 w-11 shrink-0 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700">
        <Search className="w-5 h-5" />
      </button>
    </form>
  );
}
