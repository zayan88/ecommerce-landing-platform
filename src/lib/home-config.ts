import { cache } from "react";
import { dbStore } from "@/lib/db/store";
import { getBrand } from "@/lib/brand";

export interface HomeConfig {
  announcements: string[];
  hero_image: string;
  hero_title: string;
  hero_subtitle: string;
  hero_cta: string;
}

export const DEFAULT_ANNOUNCEMENTS = [
  "شحن مجاني لكل المحافظات",
  "الدفع عند الاستلام بعد المعاينة",
  "استبدال خلال 14 يوم",
];

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Catalog home content: merchant overrides (settings.home_config) with Arabic defaults built from the brand. */
export const getHomeConfig = cache(async (): Promise<HomeConfig> => {
  const brand = await getBrand();
  let raw: any = {};
  try {
    raw = (await dbStore.getSettings())?.home_config || {};
  } catch {
    raw = {};
  }
  const ann = Array.isArray(raw.announcements)
    ? raw.announcements.map((a: unknown) => str(a, 120)).filter(Boolean).slice(0, 8)
    : [];
  const img = str(raw.hero_image, 500);
  const okImg = /^https?:\/\/[^\s]+$/i.test(img) || /^\/[^\s]*$/.test(img);
  return {
    announcements: ann.length ? ann : DEFAULT_ANNOUNCEMENTS,
    hero_image: okImg ? img : "",
    hero_title: str(raw.hero_title, 120) || (brand.tagline ? `${brand.store_name} - ${brand.tagline}` : brand.store_name),
    hero_subtitle: str(raw.hero_subtitle, 240) || "منتجات مختارة بعناية، شحن مجاني لكل المحافظات، والدفع عند الاستلام بعد المعاينة.",
    hero_cta: str(raw.hero_cta, 30) || "تسوق الآن",
  };
});
