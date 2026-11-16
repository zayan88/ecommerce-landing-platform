"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, Bell, Megaphone } from "lucide-react";

/** Settings area: one entry in the sidebar, sections as tabs at the top (like the reference admin). */
const SETTINGS_TABS = [
  { href: "/admin/settings", label: "إعدادات المتجر", icon: Store },
  { href: "/admin/settings/tracking", label: "التتبع والتسويق", icon: Megaphone },
  { href: "/admin/settings/notifications", label: "إشعارات المبيعات", icon: Bell },
] as const;

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";

  return (
    <div className="space-y-4" dir="rtl">
      <nav aria-label="أقسام الإعدادات" className="max-w-3xl mx-auto px-4 sm:px-6 pt-2">
        <div className="flex gap-1.5 overflow-x-auto rounded-2xl bg-white border border-slate-200/90 shadow-sm p-1.5" role="tablist">
          {SETTINGS_TABS.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin/settings" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                role="tab"
                aria-selected={active}
                className={`flex-1 min-w-[140px] min-h-[44px] px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap transition ${
                  active ? "bg-orange-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
      {children}
    </div>
  );
}
