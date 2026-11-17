import React from "react";
import Link from "next/link";

// The root layout reads the visitor's language cookie, so even the 404 page renders on demand:
// Cloudflare Pages (next-on-pages) needs it to run on the Edge runtime.
export const runtime = "edge";

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center p-6 text-center" dir="rtl">
      <div className="space-y-3 max-w-sm">
        <h1 className="text-5xl font-black text-slate-900">404</h1>
        <p className="text-slate-600 leading-relaxed">الصفحة دي مش موجودة. / This page does not exist.</p>
        <Link href="/" className="inline-block min-h-[44px] leading-[44px] px-6 rounded-xl bg-slate-900 text-white font-bold text-sm">
          الرئيسية / Home
        </Link>
      </div>
    </main>
  );
}
