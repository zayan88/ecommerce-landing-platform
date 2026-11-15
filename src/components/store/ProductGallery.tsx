"use client";

import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const list = (images || []).filter(Boolean);
  const [idx, setIdx] = useState(0);
  const touchX = useRef<number | null>(null);
  const count = list.length;
  const go = (n: number) => setIdx(((n % count) + count) % count);

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null || count < 2) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
  };

  return (
    <div className="space-y-3" dir="ltr">
      <div
        className="relative w-full h-72 sm:h-96 lg:h-[30rem] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={onTouchEnd}
      >
        {count === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
            <ImageOff className="w-14 h-14" aria-hidden="true" />
          </div>
        ) : (
          list.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src + i}
              src={src}
              alt={i === idx ? title : ""}
              loading={i === 0 ? "eager" : "lazy"}
              draggable={false}
              className={`absolute inset-0 w-full h-full object-contain p-2 transition-opacity duration-200 ${
                i === idx ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            />
          ))
        )}
        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="الصورة السابقة"
              onClick={() => go(idx - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 hover:bg-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="الصورة التالية"
              onClick={() => go(idx + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 hover:bg-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {list.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`عرض الصورة ${i + 1}`}
              className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 bg-slate-50 ${
                i === idx ? "border-orange-500 ring-2 ring-orange-500/20" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" draggable={false} className="absolute inset-0 w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
