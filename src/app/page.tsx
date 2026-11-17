import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  CheckCircle2,
  Star,
  ShoppingBag,
  ArrowLeft,
  Lock,
  Sparkles,
  BadgePercent,
  Check,
  X,
  HelpCircle,
  HeartHandshake,
} from "lucide-react";
import { dbStore } from "@/lib/db/store";
import { getBrand } from "@/lib/brand";
import { MetaPixel } from "@/lib/tracking/meta-pixel";
import { MarketingPixels } from "@/lib/tracking/marketing-pixels";
import { effectiveMetaPixelIds, effectiveTiktokPixelIds, effectiveSnapPixelIds } from "@/lib/tracking/pixel-config";
import { UrgencyBar } from "@/components/shared/UrgencyBar";
import { StorePopups } from "@/components/shared/StorePopups";
import { StoreChat } from "@/components/shared/StoreChat";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import DynamicLandingPage, { generateMetadata as landingMetadata } from "@/app/(landing)/p/[slug]/page";
import { getLang } from "@/lib/i18n-server";
import { dirOf, currencyEn } from "@/lib/i18n";
import { defaultHomeContent, mergeHomeContent } from "@/lib/home-content";

export const runtime = "edge";

/** The landing page the merchant made the home page (live and not paused), or null for the built-in home. */
async function chosenHomeSlug(): Promise<string | null> {
  const settings: any = await dbStore.getSettings();
  const slug = typeof settings.home_page_slug === "string" ? settings.home_page_slug : "";
  if (!slug) return null;
  const lp = await dbStore.getLandingPage(slug);
  return lp && lp.product && lp.status !== "paused" ? slug : null;
}

async function loadHomeContent() {
  const brand = await getBrand();
  const lang = await getLang();
  const settings: any = await dbStore.getSettings();
  return { brand, lang, settings, hc: mergeHomeContent(defaultHomeContent(lang, brand.store_name), settings.home_content) };
}

export async function generateMetadata(): Promise<Metadata> {
  const slug = await chosenHomeSlug();
  if (slug) return landingMetadata({ params: { slug } });
  const { brand, hc } = await loadHomeContent();
  const name = brand.store_name;
  return {
    title: brand.tagline ? `${name} - ${brand.tagline}` : `${name} - ${hc.tagline}`,
    description: hc.hero_text.slice(0, 160),
    openGraph: { title: name, description: hc.hero_text.slice(0, 160), type: "website" },
  };
}

const TRUST_ICONS = [ShieldCheck, Truck, RotateCcw, Headphones];
const TRUST_TINTS = ["bg-orange-50 text-orange-600", "bg-blue-50 text-blue-600", "bg-amber-50 text-amber-600", "bg-purple-50 text-purple-600"];
const FEATURE_TINTS = ["bg-emerald-100 text-orange-700", "bg-blue-100 text-blue-700", "bg-amber-100 text-amber-700"];
const FEATURE_ICONS = [ShieldCheck, Truck, RotateCcw];

export default async function HomePage() {
  const homeSlug = await chosenHomeSlug();
  if (homeSlug) return DynamicLandingPage({ params: { slug: homeSlug } });

  const { brand, lang, settings, hc } = await loadHomeContent();
  const brandName = brand.store_name;
  const en = lang === "en";
  const dir = dirOf(lang);
  const cur = en ? currencyEn(brand.currency) : brand.currency;
  const products = await dbStore.getProducts();
  const landingPages = await dbStore.getLandingPages();
  const reviews = Array.isArray(settings.home_reviews) ? settings.home_reviews : [];

  // Each active product → its landing page
  const productCards = products
    .filter((p) => p.status === "active")
    .map((product) => {
      const lp = landingPages.find((l) => l.product_id === product.id);
      const discount = product.compare_at_price
        ? Math.round(((product.compare_at_price - product.base_price) / product.compare_at_price) * 100)
        : 0;
      return { ...product, landingSlug: lp?.slug || product.slug, discountPercentage: discount };
    });

  const hide = hc.hide || {};
  const L = (ar: string, e: string) => (en ? e : ar);
  const sectionTitle = "text-2xl sm:text-4xl font-black font-heading text-slate-900";
  const badgeCls = "inline-flex items-center gap-1.5 text-xs font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-orange-500 selection:text-white font-sans" dir={dir}>
      <MetaPixel pixelIds={effectiveMetaPixelIds(settings)} />
      <MarketingPixels tiktokPixelIds={effectiveTiktokPixelIds(settings)} snapPixelIds={effectiveSnapPixelIds(settings)} ga4Id={settings.ga4_measurement_id} gtmId={settings.gtm_container_id} />
      <StorePopups />
      <UrgencyBar />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 group min-w-0">
            <div className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-tr from-slate-950 to-indigo-900 text-white font-black text-2xl flex items-center justify-center shadow-lg overflow-hidden">
              {brand.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logo_url} alt={brandName} className="w-full h-full p-1 object-contain rounded-xl bg-white" />
              ) : (
                (brandName || "M").trim().charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <span className="text-xl sm:text-2xl font-black font-heading text-slate-900 tracking-tight block truncate">{brandName}</span>
              <span className="text-[11px] font-bold text-gray-500 block -mt-0.5 truncate">{hc.tagline}</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-600">
            <a href="#products" className="hover:text-orange-600 transition">{L("المنتجات والعروض", "Products & offers")}</a>
            {!hide.features && <a href="#features" className="hover:text-orange-600 transition">{L("لماذا نحن", "Why us")}</a>}
            {!hide.faq && <a href="#faq" className="hover:text-orange-600 transition">{L("الأسئلة الشائعة", "FAQ")}</a>}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <LanguageSwitcher />
            <a href="#products" className="py-2.5 px-4 sm:px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm shadow-md shadow-orange-500/25 flex items-center gap-2 transition">
              <ShoppingBag className="w-4 h-4" />
              <span>{L("تصفح المنتجات", "Browse products")}</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-orange-50/20 py-16 md:py-24 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {hc.hero_badge && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs md:text-sm font-extrabold border border-emerald-200">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <span>{hc.hero_badge}</span>
              </div>
            )}
            {hc.hero_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hc.hero_image} alt={brandName} className="mx-auto w-full max-w-xl max-h-80 object-contain rounded-3xl" />
            )}
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black font-heading text-slate-900 leading-tight tracking-tight">
              {hc.hero_title}
              {hc.hero_highlight && (
                <>
                  {" "}
                  <span className="bg-gradient-to-r from-slate-950 via-indigo-950 to-orange-600 bg-clip-text text-transparent">{hc.hero_highlight}</span>
                </>
              )}
            </h1>
            {hc.hero_text && <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">{hc.hero_text}</p>}
            {hc.hero_cta && (
              <div className="flex justify-center pt-2">
                <a href="#products" className="w-full sm:w-auto py-4 px-8 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-base shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition">
                  <ShoppingBag className="w-5 h-5" />
                  <span>{hc.hero_cta}</span>
                </a>
              </div>
            )}

            {!hide.trust && hc.trust.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 text-start">
                {hc.trust.map((t, i) => {
                  const Icon = TRUST_ICONS[i % 4];
                  return (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${TRUST_TINTS[i % 4]}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">{t.title}</h4>
                        <p className="text-[11px] text-gray-500">{t.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          {hc.products_badge && (
            <div className={badgeCls}>
              <BadgePercent className="w-4 h-4" /> {hc.products_badge}
            </div>
          )}
          <h2 className={sectionTitle}>{hc.products_title}</h2>
          {hc.products_sub && <p className="text-sm text-gray-600">{hc.products_sub}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {productCards.map((product) => (
            <div key={product.id} className="bg-white rounded-3xl border border-gray-200/90 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group">
              <div className="relative w-full h-64 sm:h-72 bg-slate-100 overflow-hidden">
                {product.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.images[0]} alt={product.title_ar} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                )}
                {product.discountPercentage > 0 && (
                  <span className="absolute top-3 end-3 px-3 py-1 rounded-full bg-red-600 text-white font-black text-xs shadow-md">
                    {L("خصم", "Save")} {product.discountPercentage}%
                  </span>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-heading font-black text-lg text-slate-900 leading-snug group-hover:text-orange-600 transition">
                    {en && product.title_en ? product.title_en : product.title_ar}
                  </h3>
                  {product.description_ar && <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{product.description_ar}</p>}
                </div>
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div>
                    {product.compare_at_price ? <span className="text-xs text-gray-400 block line-through">{product.compare_at_price} {cur}</span> : null}
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black font-heading text-orange-600">{product.base_price}</span>
                      <span className="text-xs font-bold text-gray-600">{cur}</span>
                    </div>
                  </div>
                  <Link href={`/p/${product.landingSlug}`} className="py-3 px-5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-extrabold text-sm shadow-md transition flex items-center gap-2">
                    <span>{L("اطلب الآن", "Order now")}</span>
                    <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why us */}
      {!hide.features && hc.features.length > 0 && (
        <section id="features" className="py-20 bg-white border-y border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              {hc.features_badge && <span className={badgeCls}>{hc.features_badge}</span>}
              <h2 className={sectionTitle}>{hc.features_title}</h2>
              {hc.features_sub && <p className="text-sm text-gray-600">{hc.features_sub}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {hc.features.map((f, i) => {
                const Icon = FEATURE_ICONS[i % 3];
                return (
                  <div key={i} className="bg-slate-50 p-8 rounded-3xl border border-gray-200 space-y-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${FEATURE_TINTS[i % 3]}`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-black font-heading text-slate-900">{f.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Comparison */}
      {!hide.compare && (hc.compare_old.length > 0 || hc.compare_new.length > 0) && (
        <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            {hc.compare_badge && <span className={badgeCls}>{hc.compare_badge}</span>}
            <h2 className={sectionTitle}>{hc.compare_title}</h2>
            {hc.compare_sub && <p className="text-sm text-gray-600">{hc.compare_sub}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-red-200 shadow-sm space-y-4">
              <h3 className="font-black font-heading text-red-700 flex items-center gap-2">
                <X className="w-5 h-5" /> {hc.compare_old_title}
              </h3>
              <ul className="space-y-3 text-sm text-gray-700 leading-relaxed">
                {hc.compare_old.map((p, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <X className="w-4 h-4 text-red-500 mt-1 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-6 rounded-3xl border-2 border-emerald-300 shadow-md space-y-4">
              <h3 className="font-black font-heading text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> {hc.compare_new_title}
              </h3>
              <ul className="space-y-3 text-sm text-gray-700 leading-relaxed">
                {hc.compare_new.map((p, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Steps */}
      {!hide.steps && hc.steps.length > 0 && (
        <section className="py-20 bg-white border-y border-gray-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              {hc.steps_badge && <span className={badgeCls}>{hc.steps_badge}</span>}
              <h2 className={sectionTitle}>{hc.steps_title}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {hc.steps.map((s, i) => (
                <div key={i} className="bg-slate-50 p-6 rounded-3xl border border-gray-200 shadow-sm text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 text-white font-black text-lg flex items-center justify-center">{i + 1}</div>
                  <h3 className="font-heading font-black text-base text-slate-900">{s.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Warranty */}
      {!hide.warranty && hc.warranty_title && (
        <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-50 via-white to-amber-50/40 border-2 border-amber-300 shadow-lg text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <HeartHandshake className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-slate-900">{hc.warranty_title}</h2>
            {hc.warranty_text && <p className="text-sm sm:text-base text-gray-700 leading-relaxed max-w-2xl mx-auto">{hc.warranty_text}</p>}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-emerald-800">
              {hc.warranty_chips.map((c, i) => (
                <span key={i} className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">{c}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Customer reviews: written by the merchant in Settings; hidden when there are none */}
      {!hide.reviews && reviews.length > 0 && (
        <section id="reviews" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <h2 className={sectionTitle}>{hc.reviews_title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((r: any, i: number) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center gap-1 text-amber-400" aria-label={`${r.rating || 5} / 5`}>
                  {[...Array(5)].map((_, k) => (
                    <Star key={k} className={`w-4 h-4 ${k < (r.rating || 5) ? "fill-amber-400" : "text-slate-300"}`} />
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">"{r.comment}"</p>
                <div className="pt-4 border-t border-gray-100">
                  <span className="font-bold text-sm text-slate-900 block">{r.name}</span>
                  {r.place && <span className="text-xs text-gray-500">{r.place}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      {!hide.faq && hc.faq.length > 0 && (
        <section id="faq" className="py-20 bg-white border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center space-y-3">
              {hc.faq_badge && (
                <span className={badgeCls}>
                  <HelpCircle className="w-4 h-4" /> {hc.faq_badge}
                </span>
              )}
              <h2 className={sectionTitle}>{hc.faq_title}</h2>
            </div>
            <div className="space-y-4">
              {hc.faq.map((f, i) => (
                <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-gray-200 space-y-2">
                  <h3 className="font-heading font-black text-slate-900">{f.q}</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-14 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-xl flex items-center justify-center overflow-hidden">
                {brand.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={brand.logo_url} alt={brandName} className="w-full h-full p-1 object-contain rounded-xl bg-white" />
                ) : (
                  (brandName || "M").trim().charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <span className="font-black font-heading text-xl text-white">{brandName}</span>
                {hc.footer_text && <p className="text-xs text-slate-400">{hc.footer_text}</p>}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-400 font-bold">
              {hc.footer_chips.map((c, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span>•</span>}
                  <span>{c}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>
              © {new Date().getFullYear()} {brandName}. {L("جميع الحقوق محفوظة.", "All rights reserved.")}
            </p>
            <div className="flex items-center gap-4">
              <Link href="/policy" className="text-slate-400 hover:text-white transition text-xs font-bold">
                {L("سياسة الاستبدال والاسترجاع", "Exchange & return policy")}
              </Link>
              <span className="text-slate-700">•</span>
              <Link href="/admin" className="text-slate-600 hover:text-slate-400 flex items-center gap-1 transition text-[11px]" title={L("دخول المسؤول", "Admin login")}>
                <Lock className="w-3 h-3" />
                <span>{L("لوحة التحكم", "Dashboard")}</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <StoreChat />
    </div>
  );
}
