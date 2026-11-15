import type { Metadata, Viewport } from "next";
import { getSiteUrl } from "@/lib/seo";
import { getBrand } from "@/lib/brand";
import { PALETTES, cssVarsFor } from "@/lib/palettes";
import { BrandProvider } from "@/components/brand/BrandProvider";
import { Cairo, Tajawal } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "./providers";
import { VisitorTracker } from "@/components/tracking/VisitorTracker";

export const runtime = "edge";

// Self-hosted at build time (no render-blocking request to fonts.googleapis.com)
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-cairo",
});
const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800", "900"],
  display: "swap",
  variable: "--font-tajawal",
});

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  const base = brand.site_domain || getSiteUrl();
  const title = brand.tagline ? `${brand.store_name} - ${brand.tagline}` : brand.store_name;
  return {
    metadataBase: new URL(base),
    title,
    description: "منتجات بشحن مجاني لكل المحافظات، والدفع عند الاستلام بعد المعاينة.",
    openGraph: { type: "website", locale: "ar_EG", siteName: brand.store_name },
    ...(brand.logo_url ? { icons: { icon: brand.logo_url } } : {}),
  };
}

export async function generateViewport(): Promise<Viewport> {
  const brand = await getBrand();
  // Browser theme color follows the merchant's accent (CTA) color
  const accent = PALETTES[brand.accent]["600"].split(" ").map(Number);
  const hex = "#" + accent.map((n) => n.toString(16).padStart(2, "0")).join("");
  return { width: "device-width", initialScale: 1, themeColor: hex };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brand = await getBrand();
  // Merchant theme: CSS variables consumed by tailwind.config.ts (emerald-* = primary, orange-* = accent)
  const themeVars = { ...cssVarsFor("primary", brand.primary), ...cssVarsFor("accent", brand.accent) } as React.CSSProperties;

  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable}`} style={themeVars}>
      <body className="antialiased bg-slate-50 text-gray-900 font-sans">
        <BrandProvider brand={brand}>
          <Suspense fallback={null}>
            <VisitorTracker />
          </Suspense>
          <Providers>{children}</Providers>
        </BrandProvider>
      </body>
    </html>
  );
}
