"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** The two tabs of "Store settings": the store's data, and the editor of the store's home page. */
export function StoreTabs() {
  const pathname = usePathname() || "";
  const tabs = [
    { href: "/admin/settings", label: "بيانات المتجر" },
    { href: "/admin/settings/home", label: "تحرير الصفحة الرئيسية" },
  ];
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            role="tab"
            aria-selected={active}
            className={`relative whitespace-nowrap px-4 py-3 text-sm font-bold transition ${active ? "text-emerald-700" : "text-slate-500 hover:text-slate-800"}`}
          >
            {t.label}
            {active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-emerald-600" />}
          </Link>
        );
      })}
    </div>
  );
}
