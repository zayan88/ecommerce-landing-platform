"use client";

import React, { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { FloatingSave, Toast } from "./toast";

/** Shared look of the admin settings pages (one page per topic, each saves only its own fields). */
export const inputCls =
  "w-full min-h-[48px] px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500";
export const cardCls = "bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-4";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-black text-slate-900">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-500 leading-relaxed">{hint}</p>}
    </div>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 min-h-[44px] cursor-pointer">
      <span className="text-sm font-bold text-slate-900">{label}</span>
      <input type="checkbox" className="w-5 h-5 accent-emerald-600" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

/** Underline tabs inside one settings page (like the reference admin). */
export function PageTabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (id: T) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`relative whitespace-nowrap px-4 py-3 text-sm font-bold cursor-pointer transition ${value === t.id ? "text-emerald-700" : "text-slate-500 hover:text-slate-800"}`}
        >
          {t.label}
          {value === t.id && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-emerald-600" />}
        </button>
      ))}
    </div>
  );
}

/**
 * Page frame: loads the settings (and optionally the products) once, shows a save bar, and posts ONLY the
 * fields the page owns. A successful save is green.
 */
export function SettingsShell({
  title,
  description,
  withProducts,
  load,
  payload,
  onSaved,
  children,
}: {
  title: string;
  description?: string;
  withProducts?: boolean;
  load: (settings: any, products: any[]) => void;
  payload: () => Record<string, unknown>;
  onSaved?: (settings: any) => void;
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    Promise.all([fetch("/api/settings").then((r) => r.json()), withProducts ? fetch("/api/products").then((r) => r.json()) : Promise.resolve({ products: [] })])
      .then(([s, p]) => load(s.settings || {}, (p.products || []).filter((x: any) => x.status === "active")))
      .catch(() => setMessage({ ok: false, text: "تعذر تحميل الإعدادات" }))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload()) });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error || "تعذر الحفظ");
      onSaved?.(j.settings || {});
      setMessage({ ok: true, text: "تم الحفظ بنجاح." });
    } catch (err: any) {
      setMessage({ ok: false, text: err.message || "تعذر الحفظ" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center text-slate-500 gap-2">
        {message ? message.text : (<><Loader2 className="w-5 h-5 animate-spin" /> جاري التحميل...</>)}
      </div>
    );
  }

  return (
    <form onSubmit={save} className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5 text-right" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 font-heading">{title}</h1>
        {description && <p className="text-sm text-slate-600 mt-1 leading-relaxed">{description}</p>}
      </div>
      {children}
      <Toast message={message} onClose={() => setMessage(null)} />
      <FloatingSave saving={saving} />
    </form>
  );
}
