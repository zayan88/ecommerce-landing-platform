import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "./providers";
import { VisitorTracker } from "@/components/tracking/VisitorTracker";

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
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-slate-50 text-gray-900 font-sans">
        <Suspense fallback={null}>
          <VisitorTracker />
        </Suspense>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
