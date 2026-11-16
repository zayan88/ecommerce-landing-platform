"use client";

import React from "react";
import { useBrand } from "@/components/brand/BrandProvider";
import { shippingHint } from "@/lib/commerce";
import { Star, MapPin, BadgeCheck } from "lucide-react";
import { EText } from "@/components/editor/Editable";

/**
 * Trust strip. Deliberately contains NO invented buyer names, NO fake "bought X minutes ago"
 * messages and NO fake countdowns (misleading advertising under Egypt's consumer protection law
 * and against Meta ad policy). Rating/count render only when real values are supplied.
 */
export const DEFAULT_PROOF_STATEMENTS = [
  "الدفع عند الاستلام بعد المعاينة",
  "شحن مجاني لكل المحافظات",
  "استبدال مجاني خلال 14 يوم",
  "فريق التأكيد بيتصل بيك قبل الشحن",
];

export const DEFAULT_COVERAGE = ["مصر كلها"];

interface SocialProofWallProps {
  /** Only pass real values from real customer feedback. */
  rating?: number;
  reviewsCount?: number;
  statements?: string[];
  governorates?: string[];
  /** Bind texts to content_config paths for the live editor (no effect on the public render). */
  editable?: boolean;
}

export function SocialProofWall({ rating, reviewsCount, statements, governorates, editable }: SocialProofWallProps) {
  const showRating = typeof rating === "number" && rating > 0 && typeof reviewsCount === "number" && reviewsCount > 0;
  const safeRating = showRating ? Math.min(5, Math.max(0, rating as number)) : 0;
  const filledStars = Math.round(safeRating);
  const hint = shippingHint(useBrand().commerce.shipping);
  const stmts = statements && statements.length > 0 ? statements : DEFAULT_PROOF_STATEMENTS.map((t, i) => (i === 1 && !hint.free ? hint.text : t));
  const places = governorates && governorates.length > 0 ? governorates : DEFAULT_COVERAGE;

  return (
    <section dir="rtl" aria-label="ليه تثق فينا" className="bg-white rounded-3xl border border-slate-200/90 shadow-sm sm:shadow-md p-4 sm:p-5 space-y-3">
      {showRating && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="flex items-center gap-0.5 text-amber-500" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className={`w-5 h-5 ${i < filledStars ? "fill-current" : "text-slate-300"}`} />
            ))}
          </span>
          <span className="font-black text-slate-900 text-base">{safeRating.toFixed(1)} / 5</span>
          <span className="text-xs sm:text-sm text-slate-600">من {reviewsCount} تقييم</span>
        </div>
      )}

      <ul className="grid grid-cols-2 gap-2">
        {stmts.slice(0, 4).map((s, i) => (
          <li
            key={i}
            className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-2 text-[11px] sm:text-sm font-bold text-emerald-900 leading-snug"
          >
            <BadgeCheck className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <EText field={editable ? `proof_statements.${i}` : undefined} base={stmts} as="span" value={s} />
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-center gap-1.5 flex-wrap text-[11px] sm:text-xs text-slate-600 leading-relaxed">
        <MapPin className="w-4 h-4 text-orange-600" aria-hidden="true" />
        <span className="font-bold text-slate-800">بنوصّل:</span>
        {places.map((p, i) => (
          <EText key={i} field={editable ? `proof_governorates.${i}` : undefined} base={places} as="span" className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 font-semibold" value={p} />
        ))}
      </div>
    </section>
  );
}
