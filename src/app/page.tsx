import React from "react";
import { Metadata } from "next";
import { dbStore } from "@/lib/db/store";
import { getBrand } from "@/lib/brand";
import { MetaPixel } from "@/lib/tracking/meta-pixel";
import { MarketingPixels } from "@/lib/tracking/marketing-pixels";
import { effectiveMetaPixelIds, effectiveTiktokPixelIds, effectiveSnapPixelIds } from "@/lib/tracking/pixel-config";
import { UrgencyBar } from "@/components/shared/UrgencyBar";
import { LazyStorePopups, LazyStoreChat } from "@/components/shared/LazyExtras";
import { HomeView, type HomeProduct } from "@/components/home/HomeView";
import DynamicLandingPage, { generateMetadata as landingMetadata } from "@/app/(landing)/p/[slug]/page";
import { getLang } from "@/lib/i18n-server";
import { dirOf } from "@/lib/i18n";
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
    description: (hc.hero_text || hc.tagline).slice(0, 160),
    openGraph: { title: name, description: (hc.hero_text || hc.tagline).slice(0, 160), type: "website" },
  };
}

export default async function HomePage() {
  const homeSlug = await chosenHomeSlug();
  if (homeSlug) return DynamicLandingPage({ params: { slug: homeSlug } });

  const { lang, settings, hc } = await loadHomeContent();
  const en = lang === "en";
  const products = await dbStore.getProducts();
  const landingPages = await dbStore.getLandingPages();
  const reviews = Array.isArray(settings.home_reviews) ? settings.home_reviews : [];

  // Each active product → its landing page
  const cards: HomeProduct[] = products
    .filter((p) => p.status === "active")
    .map((product) => {
      const lp = landingPages.find((l) => l.product_id === product.id);
      const discount = product.compare_at_price
        ? Math.round(((product.compare_at_price - product.base_price) / product.compare_at_price) * 100)
        : 0;
      return {
        id: product.id,
        title: en && product.title_en ? product.title_en : product.title_ar,
        description: product.description_ar || "",
        image: product.images?.[0] || "",
        price: product.base_price,
        compare_at_price: product.compare_at_price || 0,
        landingSlug: lp?.slug || product.slug,
        discountPercentage: discount,
      };
    });

  return (
    <div dir={dirOf(lang)}>
      <MetaPixel pixelIds={effectiveMetaPixelIds(settings)} />
      <MarketingPixels tiktokPixelIds={effectiveTiktokPixelIds(settings)} snapPixelIds={effectiveSnapPixelIds(settings)} ga4Id={settings.ga4_measurement_id} gtmId={settings.gtm_container_id} />
      <LazyStorePopups />
      <UrgencyBar />
      <HomeView hc={hc} products={cards} reviews={reviews} />
      <LazyStoreChat />
    </div>
  );
}
