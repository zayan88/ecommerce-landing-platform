"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Copy, Check, Rss, ExternalLink } from "lucide-react";

interface FeedStatus {
  urls: { xml: string; csv: string };
  included: number;
  skipped: { id: string; title: string; reason: string }[];
  inactive: number;
}

const input =
  "w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-3.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-mono";

const REASONS: Record<string, string> = { no_image: "بدون صورة", no_price: "بدون سعر" };

export default function CatalogPage() {
  const [feed, setFeed] = useState<FeedStatus | null>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    fetch("/api/admin/feed-status")
      .then((r) => r.json())
      .then((j) => (j?.success ? setFeed(j) : setFailed(true)))
      .catch(() => setFailed(true));
  }, []);

  const copy = async (key: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    } catch {}
  };

  const card = "bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 space-y-5" dir="rtl">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <Rss className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black font-heading text-slate-950">كتالوج المنتجات (Product Feed)</h1>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            رابط بيعرض منتجاتك لفيسبوك وإنستجرام وتيك توك وجوجل (إعلانات الكتالوج والمتجر). بيتحدّث تلقائيًا مع منتجاتك، ومفيهوش سعر التكلفة ولا بيانات الموردين.
          </p>
        </div>
      </div>

      {!feed && !failed && (
        <div className="py-12 text-center text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
          جاري التحميل...
        </div>
      )}
      {failed && <p className="text-sm font-bold text-rose-700">تعذر تحميل بيانات الفيد.</p>}

      {feed && (
        <>
          <section className={card}>
            {([
              ["xml", "رابط الفيد (XML) — الأنسب لفيسبوك وتيك توك وجوجل", feed.urls.xml],
              ["csv", "نفس البيانات CSV", feed.urls.csv],
            ] as const).map(([key, label, url]) => (
              <div key={key}>
                <label className="block text-sm font-black text-slate-900 mb-1.5">{label}</label>
                <div className="flex items-center gap-2">
                  <input readOnly dir="ltr" className={input} value={url} onFocus={(e) => e.currentTarget.select()} />
                  <button
                    type="button"
                    onClick={() => copy(key, url)}
                    aria-label="نسخ الرابط"
                    className="min-h-[48px] px-4 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    {copied === key ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    {copied === key ? "تم" : "نسخ"}
                  </button>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="فتح الفيد"
                    className="min-h-[48px] min-w-[48px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center shrink-0"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-600" />
                  </a>
                </div>
              </div>
            ))}

            <p className="text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              {feed.included} منتج داخل الفيد{feed.inactive > 0 ? ` (${feed.inactive} منتج متوقف مش بيظهر)` : ""}
            </p>

            {feed.skipped.length > 0 && (
              <div role="note" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 leading-relaxed">
                <p className="font-black mb-1">منتجات ناقصة وخارج الفيد:</p>
                <ul className="space-y-0.5">
                  {feed.skipped.map((sk) => (
                    <li key={sk.id}>
                      • {sk.title || sk.id} — {REASONS[sk.reason] || sk.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className={card} aria-label="خطوات الربط">
            <h2 className="text-lg font-black text-slate-950">إزاي أربطه؟</h2>
            <ul className="space-y-3 text-sm text-slate-700 leading-relaxed list-disc pr-5">
              <li><strong>فيسبوك وإنستجرام:</strong> Commerce Manager ← Catalog ← Data sources ← Add items ← Data feed ← Scheduled feed، الصق رابط الـ XML واختار تحديث يومي.</li>
              <li><strong>تيك توك:</strong> TikTok Ads Manager ← Assets ← Catalog ← إضافة منتجات عبر رابط (Scheduled).</li>
              <li><strong>جوجل (Google Merchant Center):</strong> Products ← Feeds ← New feed ← Scheduled fetch، الصق الرابط.</li>
              <li>الأسعار بالجنيه المصري (EGP). لو منتج مش ظاهر، راجع القايمة الصفرا فوق (صورة أو سعر ناقص).</li>
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
