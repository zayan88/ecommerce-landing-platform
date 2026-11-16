import React from "react";
import Link from "next/link";
import { getBrand } from "@/lib/brand";
import { whatsappUrl, telUrl } from "@/lib/store-contact";

export async function StoreFooter() {
  const brand = await getBrand();
  const wa = brand.support_whatsapp ? whatsappUrl(brand.support_whatsapp) : "";
  const tel = brand.support_phone ? telUrl(brand.support_phone) : "";
  return (
    <footer className="bg-slate-900 text-slate-300 mt-12" dir="rtl" data-store-footer>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-3">
        <div className="space-y-2">
          <div className="font-heading text-xl font-black text-white leading-relaxed">{brand.store_name}</div>
          {brand.tagline && <p className="text-sm leading-relaxed">{brand.tagline}</p>}
        </div>
        <div className="space-y-2 text-sm">
          <div className="font-black text-white">تواصل معنا</div>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] items-center hover:text-white">
              واتساب: <span dir="ltr" className="mx-1">{brand.support_whatsapp}</span>
            </a>
          )}
          {tel && (
            <a href={tel} className="flex min-h-[44px] items-center hover:text-white">
              اتصال: <span dir="ltr" className="mx-1">{brand.support_phone}</span>
            </a>
          )}
          {brand.support_email && (
            <a href={`mailto:${brand.support_email}`} className="flex min-h-[44px] items-center hover:text-white">
              بريد: <span dir="ltr" className="mx-1">{brand.support_email}</span>
            </a>
          )}
          {!wa && !tel && !brand.support_email && <p className="leading-relaxed">يمكنك الطلب مباشرة من صفحة أي منتج.</p>}
        </div>
        <div className="space-y-2 text-sm">
          <div className="font-black text-white">روابط مهمة</div>
          <Link href="/" className="flex min-h-[44px] items-center hover:text-white">الرئيسية</Link>
          <Link href="/policy" className="flex min-h-[44px] items-center hover:text-white">سياسة الاستبدال والاسترجاع</Link>
        </div>
      </div>
      <div className="border-t border-slate-700 py-4 px-4 text-center text-xs leading-relaxed space-y-1">
        <div className="font-bold text-emerald-300">الدفع عند الاستلام • شحن مجاني • معاينة قبل الدفع</div>
        <div>© {new Date().getFullYear()} {brand.store_name}. جميع الحقوق محفوظة.</div>
      </div>
    </footer>
  );
}
