"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * One consistent warning for every delete / destructive action in the admin:
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: "حذف المنتج", message: "..." }))) return;
 * Red button for deletes (the default); pass `tone: "neutral"` for a non-destructive question.
 */
export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: "danger" | "neutral";
}

type Ask = (opts: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = createContext<Ask>(() => Promise.resolve(false));
export const useConfirm = (): Ask => useContext(ConfirmContext);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const ask: Ask = useCallback((o) => {
    return new Promise<boolean>((resolve) => {
      resolver.current?.(false); // a dialog already open is cancelled
      resolver.current = resolve;
      setOpts(o);
    });
  }, []);

  const close = (result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setOpts(null);
  };

  useEffect(() => {
    if (!opts) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts]);

  const danger = (opts?.tone ?? "danger") === "danger";

  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      {opts && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && close(false)}>
          <div role="alertdialog" aria-modal="true" aria-label={opts.title || "تأكيد"} dir="rtl" className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-right space-y-4">
            <div className="flex items-start gap-3">
              <span className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${danger ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-950">{opts.title || (danger ? "تأكيد الحذف" : "تأكيد")}</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{opts.message}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => close(true)} className={`flex-1 min-h-[48px] rounded-xl text-white font-black text-sm cursor-pointer ${danger ? "bg-red-600 hover:bg-red-700" : "bg-slate-900 hover:bg-slate-800"}`}>
                {opts.confirmText || (danger ? "حذف" : "تأكيد")}
              </button>
              <button ref={cancelRef} type="button" onClick={() => close(false)} className="flex-1 min-h-[48px] rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm cursor-pointer">
                {opts.cancelText || "إلغاء"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
