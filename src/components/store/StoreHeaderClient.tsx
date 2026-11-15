"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { Menu, Search, X, MessageCircle, Phone } from "lucide-react";
import { StoreSearch } from "./StoreSearch";

export interface NavLink {
  href: string;
  label: string;
}

interface Props {
  nav: NavLink[];
  whatsapp?: string; // wa.me URL
  phone?: string; // tel: URL
}

/** Interactive part of the header: search toggle, contact icon, mobile menu sheet. */
export function StoreHeaderActions({ nav, whatsapp, phone }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const iconBtn = "h-11 w-11 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100";
  return (
    <>
      <div className="flex items-center gap-1">
        <button type="button" className={iconBtn} aria-label="بحث" aria-expanded={searchOpen} onClick={() => setSearchOpen((v) => !v)}>
          {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
        </button>
        {whatsapp ? (
          <a href={whatsapp} className={iconBtn} aria-label="تواصل واتساب" target="_blank" rel="noopener noreferrer">
            <MessageCircle className="w-5 h-5" />
          </a>
        ) : phone ? (
          <a href={phone} className={iconBtn} aria-label="اتصل بنا">
            <Phone className="w-5 h-5" />
          </a>
        ) : null}
        <button type="button" className={`${iconBtn} md:hidden`} aria-label="القائمة" onClick={() => setMenuOpen(true)}>
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {searchOpen && (
        <div className="absolute inset-x-0 top-full bg-white border-b border-slate-200 shadow-sm px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <Suspense fallback={null}>
              <StoreSearch autoFocus onDone={() => setSearchOpen(false)} />
            </Suspense>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="القائمة">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-[82%] max-w-sm bg-white shadow-xl p-4 flex flex-col gap-4" dir="rtl">
            <div className="flex justify-between items-center">
              <span className="font-black text-slate-900">القائمة</span>
              <button type="button" className={iconBtn} aria-label="إغلاق" onClick={() => setMenuOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <Suspense fallback={null}>
              <StoreSearch onDone={() => setMenuOpen(false)} />
            </Suspense>
            <nav className="flex flex-col">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} onClick={() => setMenuOpen(false)} className="min-h-[48px] flex items-center border-b border-slate-100 font-bold text-slate-800 leading-relaxed">
                  {n.label}
                </Link>
              ))}
              {whatsapp && (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="min-h-[48px] flex items-center gap-2 font-bold text-emerald-700">
                  <MessageCircle className="w-5 h-5" /> تواصل عبر واتساب
                </a>
              )}
              {phone && (
                <a href={phone} className="min-h-[48px] flex items-center gap-2 font-bold text-emerald-700">
                  <Phone className="w-5 h-5" /> اتصل بنا
                </a>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
