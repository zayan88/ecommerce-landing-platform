import type { Metadata, Viewport } from "next";
import { getSiteUrl } from "@/lib/seo";
import { getBrand } from "@/lib/brand";
import { cssVarsFor } from "@/lib/palettes";
import { BrandProvider } from "@/components/brand/BrandProvider";
import { Suspense } from "react";
// Fonts are bundled from npm packages (no download from Google at build or run time):
// a build can no longer fail because fonts.googleapis.com was unreachable.
import "@fontsource-variable/cairo/index.css";
import "@fontsource/tajawal/400.css";
import "@fontsource/tajawal/500.css";
import "@fontsource/tajawal/700.css";
import "@fontsource/tajawal/800.css";
import "@fontsource/tajawal/900.css";
import "./globals.css";
import { Providers } from "./providers";
import { VisitorTracker } from "@/components/tracking/VisitorTracker";
import { LangProvider } from "@/components/i18n/LangProvider";
import { getLang } from "@/lib/i18n-server";

export const runtime = "edge";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  const base = brand.site_domain || getSiteUrl();
  const title = brand.tagline ? `${brand.store_name} - ${brand.tagline}` : brand.store_name;
  return {
    metadataBase: new URL(base),
    title,
    description: "منتجات بشحن مجاني لكل المحافظات، والدفع عند الاستلام بعد المعاينة.",
    openGraph: { type: "website", locale: "ar_EG", siteName: brand.store_name },
    ...(brand.favicon_url || brand.logo_url ? { icons: { icon: brand.favicon_url || brand.logo_url } } : {}),
  };
}

export async function generateViewport(): Promise<Viewport> {
  const brand = await getBrand();
  // Browser theme color follows the merchant's accent (CTA) color
  const accent = cssVarsFor("accent", brand.accent)["--c-accent-600"].split(" ").map(Number);
  const hex = "#" + accent.map((n) => n.toString(16).padStart(2, "0")).join("");
  return { width: "device-width", initialScale: 1, themeColor: hex };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brand = await getBrand();
  const lang = await getLang();
  // Merchant theme: CSS variables consumed by tailwind.config.ts (emerald-* = primary, orange-* = accent)
  const themeVars = { ...cssVarsFor("primary", brand.primary), ...cssVarsFor("accent", brand.accent) } as React.CSSProperties;

  return (
    <html lang={lang} dir="rtl" style={themeVars}>
      <body className="antialiased bg-slate-50 text-gray-900 font-sans">
        <BrandProvider brand={brand}>
          <Suspense fallback={null}>
            <VisitorTracker />
          </Suspense>
          <LangProvider initial={lang}>
            <Providers>{children}</Providers>
          </LangProvider>
        </BrandProvider>
      </body>
    </html>
  );
}
