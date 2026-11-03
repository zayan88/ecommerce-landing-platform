"use client";

import React, { useState, useEffect } from "react";
import { Flame, Clock } from "lucide-react";

export function UrgencyBar() {
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 27, seconds: 43 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 4, minutes: 30, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white text-xs md:text-sm py-2 px-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full text-xs font-black animate-pulse flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-current" /> عروض الصيف الحصرية
          </span>
          <span className="hidden sm:inline text-slate-200">
            شحن سريع لجميع محافظات مصر | معاينة وفحص مجاناً قبل الدفع | دفع عند الاستلام
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs font-black bg-white/10 px-3 py-1 rounded-xl backdrop-blur-xs border border-white/10">
          <Clock className="w-3.5 h-3.5 text-amber-300" />
          <span>ينتهي خلال:</span>
          <span className="bg-black/40 px-1.5 py-0.5 rounded text-amber-300">
            {String(timeLeft.hours).padStart(2, "0")}
          </span>
          :
          <span className="bg-black/40 px-1.5 py-0.5 rounded text-amber-300">
            {String(timeLeft.minutes).padStart(2, "0")}
          </span>
          :
          <span className="bg-black/40 px-1.5 py-0.5 rounded text-amber-300">
            {String(timeLeft.seconds).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}
