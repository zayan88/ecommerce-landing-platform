"use client";

import React, { useEffect } from "react";
import { AlertCircle, Check, Loader2, X } from "lucide-react";

export interface ToastMessage {
  ok: boolean;
  text: string;
}

/**
 * One notification for every save / failure in the admin: a floating card at the top of the screen, so it is
 * visible wherever the page is scrolled. Green = success (closes by itself), red = failure (stays longer).
 */
export function Toast({ message, onClose }: { message: ToastMessage | null; onClose: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, message.ok ? 4000 : 8000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  if (!message) return null;
  return (
    <div className="fixed top-4 inset-x-0 z-[90] flex justify-center px-4 pointer-events-none" dir="rtl">
      <div
        role={message.ok ? "status" : "alert"}
        className={`pointer-events-auto w-full max-w-md flex items-start gap-3 p-4 rounded-2xl border-2 shadow-2xl text-sm font-bold leading-relaxed ${
          message.ok ? "bg-emerald-50 border-emerald-400 text-emerald-900" : "bg-red-50 border-red-400 text-red-900"
        }`}
      >
        {message.ok ? <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
        <span className="flex-1">{message.text}</span>
        <button type="button" onClick={onClose} aria-label="إغلاق" className="shrink-0 w-7 h-7 -m-1 rounded-full hover:bg-black/5 flex items-center justify-center cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/** The save button: fixed in the top corner so it is always in reach, however far the page is scrolled. */
export function FloatingSave({ saving, label = "حفظ" }: { saving: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="fixed top-[76px] left-4 z-30 min-h-[48px] px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-base shadow-xl shadow-orange-500/30 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
    >
      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
      {label}
    </button>
  );
}
