"use client";

import React from "react";
import Link from "next/link";
import { MessageCircle, Phone, Mail, ShieldCheck } from "lucide-react";
import { useBrand } from "@/components/brand/BrandProvider";
import { useShippingHint } from "@/components/shared/ShippingScope";
import { whatsappUrl, telUrl } from "@/lib/store-contact";
import { useLang } from "@/components/i18n/LangProvider";

/** Store footer for landing-page mode: brand, contact, policy link and the trust line. */
export function LandingFooter({ extraBottomSpace = false }: { extraBottomSpace?: boolean }) {
  const brand = useBrand();
  const shipHint = useShippingHint();
  const { t, dir } = useLang();
  const wa = brand.support_whatsapp ? whatsappUrl(brand.support_whatsapp) : "";
  const tel = brand.support_phone ? telUrl(brand.support_phone) : "";

  return (
    <footer
      dir={dir}
      data-landing-footer
      className={`bg-slate-900 text-slate-300 ${extraBottomSpace ? "pb-24 sm:pb-6" : ""}`}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 grid gap-6 sm:grid-cols-3 text-sm">
        <div className="space-y-1.5">
          <div className="font-heading text-lg font-black text-white leading-relaxed">{brand.store_name}</div>
          {brand.tagline && <p className="leading-relaxed text-slate-400">{brand.tagline}</p>}
        </div>

        <div className="space-y-1">
          <div className="font-black text-white">{t("footer.contact")}</div>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] items-center gap-2 hover:text-white">
              <MessageCircle className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {t("footer.whatsapp")} <span dir="ltr">{brand.support_whatsapp}</span>
            </a>
          )}
          {tel && (
            <a href={tel} className="flex min-h-[44px] items-center gap-2 hover:text-white">
              <Phone className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              {t("footer.call")} <span dir="ltr">{brand.support_phone}</span>
            </a>
          )}
          {brand.support_email && (
            <a href={`mailto:${brand.support_email}`} className="flex min-h-[44px] items-center gap-2 hover:text-white">
              <Mail className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span dir="ltr">{brand.support_email}</span>
            </a>
          )}
          {!wa && !tel && !brand.support_email && <p className="leading-relaxed text-slate-400">{t("footer.order_form")}</p>}
        </div>

        <div className="space-y-1">
          <div className="font-black text-white">{t("footer.info")}</div>
          <Link prefetch={false} href="/policy" className="flex min-h-[44px] items-center gap-2 hover:text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            {t("footer.policy")}
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-700 py-4 px-4 text-center text-xs leading-relaxed space-y-1">
        <div className="font-bold text-emerald-300">{t("footer.cod_line", { ship: shipHint.text })}</div>
        <div>
          © {new Date().getFullYear()} {brand.store_name}. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
