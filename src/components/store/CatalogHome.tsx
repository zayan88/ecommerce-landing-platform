import React from "react";
import Link from "next/link";
import { dbStore } from "@/lib/db/store";
import { getBrand } from "@/lib/brand";
import { getHomeConfig } from "@/lib/home-config";
import { GuaranteesStrip } from "@/components/shared/GuaranteesStrip";
import { StoreHeader } from "./StoreHeader";
import { StoreFooter } from "./StoreFooter";

/** Arabic-friendly normalisation for search: lowercase, strip tashkeel/tatweel, unify alef/yaa/taa-marbuta forms. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .trim();
}

export async function CatalogHome({ q }: { q?: string }) {
  const [brand, home, products, landingPages] = await Promise.all([
    getBrand(),
    getHomeConfig(),
    dbStore.getProducts(),
    dbStore.getLandingPages(),
  ]);

  const active = products.filter((p) => p.status === "active");
  const query = (q || "").trim();
  const nq = norm(query);
  const shown = nq ? active.filter((p) => norm(`${p.title_ar} ${p.title_en || ""}`).includes(nq)) : active;

  const cards = shown.map((p) => {
    const lp = landingPages.find((l) => l.product_id === p.id);
    const discount =
      p.compare_at_price && p.compare_at_price > p.base_price
        ? Math.round(((p.compare_at_price - p.base_price) / p.compare_at_price) * 100)
        : 0;
    return { ...p, href: `/p/${lp?.slug || p.slug}`, discount, soldOut: p.stock_quantity <= 0 };
  });

  return (
    <div dir="rtl" className="min-h-screen bg-white text-slate-900 font-sans">
      <StoreHeader />

      <main>
        {/* Hero banner */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6" aria-label="الرئيسية">
          <div className="relative w-full h-56 sm:h-80 rounded-3xl overflow-hidden bg-gradient-to-l from-emerald-700 via-emerald-600 to-orange-500">
            {home.hero_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={home.hero_image} alt={home.hero_title} className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-l from-slate-900/70 via-slate-900/40 to-transparent" />
            <div className="relative h-full flex flex-col justify-center gap-3 px-6 sm:px-12 max-w-2xl">
              <h1 className="font-heading text-2xl sm:text-4xl font-black text-white leading-relaxed">{home.hero_title}</h1>
              <p className="text-sm sm:text-base text-white/90 leading-relaxed line-clamp-3">{home.hero_subtitle}</p>
              <div>
                <a
                  href="#products"
                  className="inline-flex items-center justify-center min-h-[48px] px-8 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-black shadow-lg shadow-orange-500/25"
                >
                  {home.hero_cta}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Products */}
        <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 py-10 scroll-mt-28">
          <div className="flex items-end justify-between gap-3 mb-5">
            <h2 className="font-heading text-xl sm:text-3xl font-black text-slate-950 leading-relaxed">
              {query ? `نتائج البحث عن "${query}"` : "منتجاتنا"}
            </h2>
            {query && (
              <Link href="/#products" className="text-sm font-bold text-emerald-700 min-h-[44px] flex items-center">
                عرض كل المنتجات
              </Link>
            )}
          </div>

          {active.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center space-y-3">
              <p className="text-lg font-black text-slate-900 leading-relaxed">المتجر قيد التجهيز</p>
              <p className="text-sm text-slate-600 leading-relaxed">سنضيف منتجات جديدة قريباً، تابعنا.</p>
              <Link href="/admin/products" className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-full bg-emerald-600 text-white text-sm font-bold">
                إضافة منتج (لصاحب المتجر)
              </Link>
            </div>
          ) : cards.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center space-y-3">
              <p className="text-lg font-black text-slate-900 leading-relaxed">لا توجد منتجات مطابقة لبحثك</p>
              <Link href="/#products" className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-full bg-emerald-600 text-white text-sm font-bold">
                عرض كل المنتجات
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {cards.map((p) => (
                <Link
                  key={p.id}
                  href={p.href}
                  data-product-card
                  className="group flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition"
                >
                  <div className="relative w-full h-44 sm:h-64 bg-slate-100">
                    {p.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt={p.title_ar} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    ) : null}
                    {p.discount > 0 && !p.soldOut && (
                      <span className="absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">خصم {p.discount}%</span>
                    )}
                    {p.soldOut && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <span className="px-4 py-1.5 rounded-full bg-slate-900 text-white text-sm font-bold">نفد المخزون</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 sm:p-4 flex flex-col gap-2 flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed line-clamp-2 min-h-[3rem]">{p.title_ar}</h3>
                    <div className="mt-auto flex items-baseline gap-2 flex-wrap">
                      <span className="font-heading text-lg sm:text-xl font-black text-orange-600">
                        {p.base_price} {brand.currency}
                      </span>
                      {p.compare_at_price && p.compare_at_price > p.base_price ? (
                        <span className="text-xs text-slate-400 line-through">
                          {p.compare_at_price} {brand.currency}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Trust strip */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <GuaranteesStrip />
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}
