import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { ShieldCheck, Truck, RotateCcw } from "lucide-react";
import type { Product } from "@/types";
import { dbStore } from "@/lib/db/store";
import { getBrand } from "@/lib/brand";
import { EgyptianCheckoutForm } from "@/components/shared/EgyptianCheckoutForm";
import { StickyBuyBar } from "@/components/shared/StickyBuyBar";
import { ProductGallery } from "./ProductGallery";
import { ProductOrderButton } from "./ProductOrderButton";
import { ProductShareRow } from "./ProductShareRow";

interface Props {
  product: Product; // already stripped of secrets
  landingPage: { slug?: string; [key: string]: any };
}

async function resolveOrigin(): Promise<string> {
  const brand = await getBrand();
  if (brand.site_domain) return brand.site_domain.replace(/\/+$/, "");
  try {
    const h = headers();
    const host = h.get("x-forwarded-host") || h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {}
  return "";
}

export async function SimpleProductPage({ product, landingPage }: Props) {
  const slug = landingPage.slug || product.slug;
  const origin = await resolveOrigin();
  const shareUrl = `${origin}/p/${slug}`;

  const hasDiscount = !!product.compare_at_price && product.compare_at_price > product.base_price;
  const discountPct = hasDiscount
    ? Math.round(((product.compare_at_price! - product.base_price) / product.compare_at_price!) * 100)
    : 0;
  const inStock = (product.stock_quantity ?? 0) > 0;

  // Related: up to 4 other active products
  let related: { id: string; title: string; price: number; image?: string; href: string }[] = [];
  try {
    const [products, pages] = await Promise.all([dbStore.getProducts(), dbStore.getLandingPages()]);
    related = products
      .filter((p) => p.id !== product.id && p.status === "active")
      .slice(0, 4)
      .map((p) => {
        const lp = pages.find((l) => l.product_id === p.id);
        return {
          id: p.id,
          title: p.title_ar,
          price: p.base_price,
          image: p.images?.[0],
          href: `/p/${lp?.slug || p.slug}`,
        };
      });
  } catch {}

  const trust = [
    { Icon: ShieldCheck, label: "معاينة قبل الدفع" },
    { Icon: Truck, label: "شحن مجاني" },
    { Icon: RotateCcw, label: "استبدال 14 يوم" },
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 py-4 sm:py-8 space-y-6">
        <nav aria-label="breadcrumb" className="text-xs sm:text-sm text-slate-500 flex flex-wrap items-center gap-1.5">
          <Link href="/" className="hover:text-slate-900">الرئيسية</Link>
          <span aria-hidden="true">›</span>
          <Link href="/#products" className="hover:text-slate-900">المنتجات</Link>
          <span aria-hidden="true">›</span>
          <span className="text-slate-800 font-bold line-clamp-1">{product.title_ar}</span>
        </nav>

        <div className="bg-white rounded-3xl p-4 sm:p-7 border border-slate-200/90 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
          <ProductGallery images={product.images || []} title={product.title_ar} />

          <div className="space-y-4">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug font-heading">{product.title_ar}</h1>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-3xl font-black text-orange-600 font-heading">{product.base_price} ج.م</span>
              {hasDiscount && (
                <>
                  <span className="text-base text-slate-400 line-through">{product.compare_at_price} ج.م</span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">خصم {discountPct}%</span>
                </>
              )}
            </div>

            <div>
              <span
                className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
                  inStock ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-900 border-rose-200"
                }`}
              >
                {inStock ? "متوفر" : "نفد المخزون"}
              </span>
            </div>

            {product.description_ar && (
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">{product.description_ar}</p>
            )}

            <ul className="grid grid-cols-3 gap-2">
              {trust.map(({ Icon, label }) => (
                <li
                  key={label}
                  className="flex flex-col items-center gap-1 text-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 px-1.5 py-2.5 text-[11px] sm:text-xs font-bold"
                >
                  <Icon className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>

            <ProductOrderButton disabled={!inStock} />

            <ProductShareRow url={shareUrl} title={product.title_ar} />
          </div>
        </div>

        <EgyptianCheckoutForm product={product} landingPageSlug={slug} accentColor="emerald" />

        {related.length > 0 && (
          <section className="space-y-3" aria-label="منتجات أخرى">
            <h2 className="text-lg font-black text-slate-900 font-heading">منتجات أخرى قد تعجبك</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={r.href}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative w-full h-36 sm:h-44 bg-slate-50">
                    {r.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.image} alt={r.title} loading="lazy" className="absolute inset-0 w-full h-full object-contain p-2" />
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{r.title}</h3>
                    <p className="text-base font-black text-orange-600">{r.price} ج.م</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <StickyBuyBar product={product} ctaText="اطلب الآن" />
    </div>
  );
}
