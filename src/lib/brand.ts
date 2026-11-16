import { cache } from "react";
import { dbStore } from "@/lib/db/store";
import { isThemeColor } from "@/lib/palettes";

/**
 * White-label brand. Everything a merchant can customize from /admin/brand.
 * Defaults are neutral so a fresh deployment never shows another store's name.
 * The owner's own store (RexRack) simply configures brand_name = "RexRack" (admin or BRAND_NAME env).
 */
export interface Brand {
  store_name: string;
  tagline: string;
  logo_url: string;
  favicon_url: string;
  primary: string;
  accent: string;
  support_phone: string;
  support_whatsapp: string;
  /** Professional support email shown in the footer (e.g. support@yourstore.store). */
  support_email: string;
  site_domain: string;
  currency: string;
  /** landing = each product has its own landing page; catalog = regular store home listing all products. */
}

export const BRAND_DEFAULTS: Brand = {
  store_name: "متجري",
  tagline: "",
  logo_url: "",
  favicon_url: "",
  primary: "emerald",
  accent: "orange",
  support_phone: "",
  support_whatsapp: "",
  support_email: "",
  site_domain: "",
  currency: "ج.م",
};

/** Subset that is safe to send to the browser (no secrets live in Brand, but keep the intent explicit). */
export type PublicBrand = Brand;

function cleanUrl(v: unknown): string {
  const s = typeof v === "string" ? v.trim() : "";
  return /^https?:\/\/[^\s]+$/i.test(s) ? s.replace(/\/+$/, "") : "";
}

/** Reads settings once per request (React cache) and fills defaults. Edge-safe. */
export const getBrand = cache(async (): Promise<Brand> => {
  let s: any = {};
  try {
    s = await dbStore.getSettings();
  } catch {
    s = {};
  }
  // Resolution order per field: admin setting (KV) -> env seed (lets the owner's instance be "RexRack"
  // with zero KV setup) -> neutral default.
  // Static process.env.X references only (required on Cloudflare / next-on-pages)
  const env = {
    name: (process.env.BRAND_NAME || "").trim(),
    tagline: (process.env.BRAND_TAGLINE || "").trim(),
    logo: (process.env.BRAND_LOGO_URL || "").trim(),
    primary: (process.env.BRAND_PRIMARY || "").trim(),
    accent: (process.env.BRAND_ACCENT || "").trim(),
    phone: (process.env.SUPPORT_PHONE || "").trim(),
    whatsapp: (process.env.SUPPORT_WHATSAPP || "").trim(),
    email: (process.env.SUPPORT_EMAIL || "").trim(),
    siteUrl: (process.env.SITE_URL || "").trim(),
    appUrl: (process.env.NEXT_PUBLIC_APP_URL || "").trim(),
  };
  const logo = (s.logo_url || env.logo) as string;
  const primary = s.brand_primary || env.primary;
  const accent = s.brand_accent || env.accent;
  return {
    store_name: (s.store_name || env.name || BRAND_DEFAULTS.store_name).trim(),
    tagline: (s.store_tagline || env.tagline).trim(),
    favicon_url: cleanUrl(s.favicon_url) || (typeof s.favicon_url === "string" && s.favicon_url.startsWith("/") ? s.favicon_url : ""),
    logo_url: cleanUrl(logo) || (typeof logo === "string" && logo.startsWith("/") ? logo : ""),
    primary: isThemeColor(primary) ? primary : BRAND_DEFAULTS.primary,
    accent: isThemeColor(accent) ? accent : BRAND_DEFAULTS.accent,
    support_phone: (s.support_phone || env.phone).trim(),
    support_whatsapp: (s.support_whatsapp || env.whatsapp).trim(),
    support_email: (s.support_email || env.email).trim().slice(0, 120),
    site_domain: cleanUrl(s.site_domain) || cleanUrl(env.siteUrl) || cleanUrl(env.appUrl),
    currency: (s.currency_symbol || BRAND_DEFAULTS.currency).trim(),
  };
});
