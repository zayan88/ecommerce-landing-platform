import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "RexRack - متجرك الأول للمنتجات الذكية والعصرية في مصر",
  description: "المنصة المركزية لإدارة وتتبع صفحات الهبوط ومبيعات الدفع عند الاستلام وبوابة صفقة في مصر",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable}`}>
      <body className="antialiased bg-slate-50 text-gray-900 font-sans">
        <Suspense fallback={null}>
          <VisitorTracker />
        </Suspense>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
