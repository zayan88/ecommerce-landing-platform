import React from "react";

/** Scrolling announcement strip. Pure CSS marquee; static (no motion) when the user prefers reduced motion. */
export function AnnouncementBar({ items }: { items: string[] }) {
  const list = items.filter(Boolean);
  if (!list.length) return null;
  // Repeat enough times so one half of the track is always wider than the screen
  const half = Array.from({ length: Math.max(2, Math.ceil(8 / list.length)) }, () => list).flat();
  return (
    <div className="bg-emerald-700 text-white overflow-hidden" aria-label="إعلانات المتجر" data-store-marquee>
      <div dir="ltr" className="flex w-max store-marquee-track motion-reduce:animate-none py-2">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1 ? true : undefined}>
            {half.map((t, i) => (
              <span key={i} dir="rtl" className="px-6 text-xs sm:text-sm font-bold whitespace-nowrap leading-relaxed">
                {t}
                <span className="mx-6 opacity-60">•</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
