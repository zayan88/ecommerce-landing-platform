"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import HomeEditor from "@/components/home/HomeEditor";
import type { HomeProduct, HomeReview } from "@/components/home/HomeView";
import { defaultHomeContent, mergeHomeContent, type HomeContent } from "@/lib/home-content";

interface Loaded {
  initial: HomeContent;
  defaults: { ar: HomeContent; en: HomeContent };
  products: HomeProduct[];
  reviews: HomeReview[];
}

/** Full-screen live editor of the store's home page (the real page, editable in place). */
export default function HomeEditPage() {
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/settings").then((r) => r.json()), fetch("/api/products").then((r) => r.json()), fetch("/api/landing-pages").then((r) => r.json()).catch(() => ({}))])
      .then(([s, p, l]) => {
        const settings = s.settings || {};
        const name = (settings.store_name || "متجري") as string;
        const lang = settings.lang_default === "en" ? "en" : "ar";
        const defaults = { ar: defaultHomeContent("ar", name), en: defaultHomeContent("en", name) };
        const lps: any[] = l.success ? l.landingPages || [] : [];
        const products: HomeProduct[] = (p.products || [])
          .filter((x: any) => x.status === "active")
          .map((x: any) => {
            const lp = lps.find((q) => q.product_id === x.id);
            return {
              id: x.id,
              title: lang === "en" && x.title_en ? x.title_en : x.title_ar,
              description: x.description_ar || "",
              image: x.images?.[0] || "",
              price: x.base_price,
              compare_at_price: x.compare_at_price || 0,
              landingSlug: lp?.slug || x.slug,
              discountPercentage: x.compare_at_price ? Math.round(((x.compare_at_price - x.base_price) / x.compare_at_price) * 100) : 0,
            };
          });
        const reviews: HomeReview[] = Array.isArray(settings.home_reviews) ? settings.home_reviews : [];
        setData({ initial: mergeHomeContent(defaults[lang], settings.home_content), defaults, products, reviews });
      })
      .catch(() => setError("تعذر تحميل بيانات الصفحة"));
  }, []);

  const onSave = useCallback(async (hc: HomeContent): Promise<string | null> => {
    try {
      const res = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ home_content: hc }) });
      const j = await res.json();
      if (!res.ok || !j.success) return j.error || "تعذر الحفظ";
      return null;
    } catch {
      return "تعذر الحفظ، جرّب تاني";
    }
  }, []);

  if (error) return <div className="p-10 text-center text-red-700 font-bold">{error}</div>;
  if (!data) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-100 flex items-center justify-center text-slate-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> جاري تحميل المحرر...
      </div>
    );
  }
  return <HomeEditor initial={data.initial} defaults={data.defaults} products={data.products} reviews={data.reviews} onSave={onSave} />;
}
