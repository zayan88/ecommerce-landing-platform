import React from "react";
import Link from "next/link";
import { getBrand } from "@/lib/brand";
import { getHomeConfig } from "@/lib/home-config";
import { whatsappUrl, telUrl } from "@/lib/store-contact";
import { AnnouncementBar } from "./AnnouncementBar";
import { StoreHeaderActions, type NavLink } from "./StoreHeaderClient";

export const STORE_NAV: NavLink[] = [
  { href: "/", label: "الرئيسية" },
  { href: "/#products", label: "المنتجات" },
  { href: "/policy", label: "سياسة الاستبدال والاسترجاع" },
];

export async function StoreHeader() {
  const [brand, home] = await Promise.all([getBrand(), getHomeConfig()]);
  const wa = brand.support_whatsapp ? whatsappUrl(brand.support_whatsapp) : "";
  const tel = brand.support_phone ? telUrl(brand.support_phone) : "";
  return (
    <header className="sticky top-0 z-40 bg-white" data-store-header>
      <AnnouncementBar items={home.announcements} />
      <div className="relative border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center shrink-0" aria-label={brand.store_name}>
            {brand.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logo_url} alt={brand.store_name} className="h-10 w-auto max-w-[160px] object-contain" height={40} />
            ) : (
              <span className="font-heading text-xl sm:text-2xl font-black text-slate-900 leading-relaxed">{brand.store_name}</span>
            )}
          </Link>
          <nav className="hidden md:flex items-center gap-6" aria-label="التنقل الرئيسي">
            {STORE_NAV.map((n) => (
              <Link key={n.href} href={n.href} className="text-sm font-bold text-slate-700 hover:text-emerald-700 leading-relaxed">
                {n.label}
              </Link>
            ))}
          </nav>
          <StoreHeaderActions nav={STORE_NAV} whatsapp={wa || undefined} phone={!wa && tel ? tel : undefined} />
        </div>
      </div>
    </header>
  );
}
