"use client";

import React, { useState } from "react";
import { Check, Link2, MessageCircle, Facebook } from "lucide-react";

export function ProductShareRow({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const wa = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {}
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const btn =
    "inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50";

  return (
    <div className="flex flex-wrap items-center gap-2" dir="rtl">
      <span className="text-xs font-bold text-slate-500">مشاركة:</span>
      <a href={wa} target="_blank" rel="noopener noreferrer" className={btn}>
        <MessageCircle className="w-4 h-4 text-emerald-600" aria-hidden="true" /> واتساب
      </a>
      <a href={fb} target="_blank" rel="noopener noreferrer" className={btn}>
        <Facebook className="w-4 h-4 text-blue-600" aria-hidden="true" /> فيسبوك
      </a>
      <button type="button" onClick={copy} className={btn}>
        {copied ? <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" /> : <Link2 className="w-4 h-4" aria-hidden="true" />}
        {copied ? "تم النسخ" : "نسخ الرابط"}
      </button>
    </div>
  );
}
