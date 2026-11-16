"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { X, Ticket } from "lucide-react";
import { useBrand } from "@/components/brand/BrandProvider";

/**
 * The merchant's promotional popup and the downsell coupon popup (shown when the visitor is about to leave,
 * or after a delay). Rendered on public pages only (never in the admin or the editor preview, and not on the
 * thank-you page). Each popup shows at most once per browser session unless the merchant chose "always".
 */
const seen = (key: string): boolean => {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};
const markSeen = (key: string) => {
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    // private mode: the popup may repeat, harmless
  }
};

export function StorePopups() {
  const brand = useBrand();
  const pathname = usePathname() || "";
  const popup = brand.commerce?.popup;
  const downsell = brand.commerce?.downsell;
  const [open, setOpen] = useState<"popup" | "downsell" | null>(null);
  const openRef = useRef<typeof open>(null);
  openRef.current = open;
  const blocked = pathname.includes("/thank-you");

  // promotional popup after its delay
  useEffect(() => {
    if (!popup || blocked) return;
    if (popup.frequency === "session" && seen("sp_popup")) return;
    const t = setTimeout(() => {
      if (openRef.current) return;
      markSeen("sp_popup");
      setOpen("popup");
    }, popup.delay_seconds * 1000);
    return () => clearTimeout(t);
  }, [popup, blocked]);

  // downsell: automatically after N seconds and/or when the mouse leaves through the top of the window
  useEffect(() => {
    if (!downsell || blocked || seen("sp_downsell")) return;
    const show = () => {
      if (openRef.current || seen("sp_downsell")) return;
      markSeen("sp_downsell");
      setOpen("downsell");
    };
    const timer = downsell.auto ? setTimeout(show, downsell.delay_seconds * 1000) : undefined;
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) show();
    };
    if (downsell.on_exit) document.addEventListener("mouseout", onLeave);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("mouseout", onLeave);
    };
  }, [downsell, blocked]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open || blocked) return null;

  const goCheckout = () => {
    setOpen(null);
    document.getElementById("order-form-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-900/60 flex items-center justify-center p-4"
      onMouseDown={(e) => e.target === e.currentTarget && setOpen(null)}
    >
      <div role="dialog" aria-modal="true" dir="rtl" className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden text-right">
        <button
          type="button"
          onClick={() => setOpen(null)}
          aria-label="إغلاق"
          className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/90 hover:bg-slate-100 flex items-center justify-center cursor-pointer z-10"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>

        {open === "popup" && popup && (
          <>
            {popup.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={popup.image_url} alt="" className="w-full h-44 object-cover bg-slate-100" />
            )}
            <div className="p-6 space-y-3">
              {popup.title && <h3 className="text-xl font-black text-slate-950 leading-snug">{popup.title}</h3>}
              {popup.body && <p className="text-sm text-slate-600 leading-relaxed">{popup.body}</p>}
              <button
                type="button"
                onClick={popup.button_target === "close" ? () => setOpen(null) : goCheckout}
                className="w-full min-h-[52px] rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-base cursor-pointer"
              >
                {popup.button_text}
              </button>
            </div>
          </>
        )}

        {open === "downsell" && downsell && (
          <div className="p-6 space-y-4 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Ticket className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-slate-950">استنى! عندنا لك كوبون</h3>
            {downsell.message && <p className="text-sm text-slate-600 leading-relaxed">{downsell.message}</p>}
            <div className="rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 py-3 font-mono text-lg font-black text-orange-700" dir="ltr">
              {downsell.code}
            </div>
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("apply-coupon", { detail: downsell.code }));
                goCheckout();
              }}
              className="w-full min-h-[52px] rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-base cursor-pointer"
            >
              استخدم الكوبون واطلب
            </button>
            <button type="button" onClick={() => setOpen(null)} className="text-sm font-bold text-slate-500 hover:text-slate-700 cursor-pointer min-h-[44px]">
              لا شكراً
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
