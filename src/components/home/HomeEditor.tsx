"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ExternalLink,
  Layers,
  Loader2,
  Monitor,
  PanelRightClose,
  PanelRightOpen,
  Redo2,
  RotateCcw,
  Save,
  Smartphone,
  Type,
  Undo2,
} from "lucide-react";
import { PreviewFrame } from "@/components/editor/PreviewFrame";
import { EditProvider, applyFieldEdit, getByPath, type EditSelection } from "@/components/editor/EditContext";
import { HomeView, type HomeProduct, type HomeReview } from "./HomeView";
import { HOME_SECTIONS, type HomeContent, type HomeSection } from "@/lib/home-content";
import { useConfirm } from "@/app/(admin)/admin/_components/confirm";

const SECTION_LABELS: Record<HomeSection, string> = {
  trust: "شريط الثقة (تحت العنوان)",
  features: "لماذا تثق بنا (الضمانات)",
  compare: "المقارنة",
  steps: "خطوات الشراء",
  warranty: "شهادة الضمان",
  reviews: "آراء العملاء",
  faq: "الأسئلة الشائعة",
};

const HISTORY_CAP = 80;
const COALESCE_MS = 900;

interface Hist {
  past: HomeContent[];
  present: HomeContent;
  future: HomeContent[];
}

export interface HomeEditorProps {
  initial: HomeContent;
  /** Fresh default texts of each language (for the "restore default texts" buttons). */
  defaults: { ar: HomeContent; en: HomeContent };
  products: HomeProduct[];
  reviews: HomeReview[];
  onSave: (hc: HomeContent) => Promise<string | null>;
}

/** Live editor of the store's home page: the real page, editable in place (click a text to type, red × to delete). */
export default function HomeEditor({ initial, defaults, products, reviews, onSave }: HomeEditorProps) {
  const confirmAsk = useConfirm();
  const [hist, setHist] = useState<Hist>({ past: [], present: initial, future: [] });
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initial));
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState("");
  const [device, setDevice] = useState<"mobile" | "desktop">("desktop");
  const [panelOpen, setPanelOpen] = useState(() => typeof window !== "undefined" && window.innerWidth >= 1024);
  const [tab, setTab] = useState<"content" | "sections">("content");
  const [selected, setSelected] = useState<EditSelection | null>(null);
  const lastEdit = useRef<{ key: string; t: number } | null>(null);

  const hc = hist.present;
  const dirty = useMemo(() => JSON.stringify(hc) !== savedJson, [hc, savedJson]);

  const apply = useCallback((fn: (d: HomeContent) => HomeContent, key?: string) => {
    const now = Date.now();
    const coalesce = !!key && !!lastEdit.current && lastEdit.current.key === key && now - lastEdit.current.t < COALESCE_MS;
    lastEdit.current = key ? { key, t: now } : null;
    setHist((h) => {
      const next = fn(h.present);
      if (next === h.present) return h;
      return { past: coalesce ? h.past : [...h.past, h.present].slice(-HISTORY_CAP), present: next, future: [] };
    });
  }, []);

  const setField = useCallback(
    (path: string, value: unknown, base?: unknown) => apply((d) => applyFieldEdit(d as any, path, value, base) as unknown as HomeContent, path),
    [apply]
  );

  const undo = useCallback(() => {
    lastEdit.current = null;
    setSelected(null);
    setHist((h) => (h.past.length === 0 ? h : { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] }));
  }, []);
  const redo = useCallback(() => {
    lastEdit.current = null;
    setSelected(null);
    setHist((h) => (h.future.length === 0 ? h : { past: [...h.past, h.present].slice(-HISTORY_CAP), present: h.future[0], future: h.future.slice(1) }));
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setError("");
    try {
      const err = await onSave(hc);
      if (err) {
        setError(err);
        return;
      }
      setSavedJson(JSON.stringify(hc));
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }, [hc, onSave]);

  // Ctrl+S / Ctrl+Z / Ctrl+Shift+Z (not while typing in a field)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName));
      if (k === "s") {
        e.preventDefault();
        if (dirty && !saving) save();
      } else if (!typing && k === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dirty, saving, save, undo, redo]);

  // warn before leaving with unsaved edits
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const select = useCallback((sel: EditSelection | null) => {
    setSelected(sel);
    if (sel) setTab("content");
  }, []);

  const btn = "min-h-[44px] min-w-[44px] px-2.5 sm:px-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";
  const ghost = `${btn} bg-white border border-slate-200 text-slate-700 hover:bg-slate-50`;

  const selectedValue = selected && getByPath(hc, selected.field) !== undefined ? String(getByPath(hc, selected.field)) : selected?.value || "";

  const panel = (
    <div className="flex flex-col h-full min-h-0" dir="rtl">
      <div className="flex gap-1.5 p-2 border-b border-slate-200 bg-white shrink-0" role="tablist">
        {(
          [
            ["content", "المحتوى", Type],
            ["sections", "الأقسام", Layers],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex-1 min-h-[44px] rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${tab === key ? "bg-orange-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {tab === "sections" ? (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-1">
              <p className="text-sm font-black text-slate-900 mb-1">الأقسام الظاهرة</p>
              <p className="text-xs text-slate-500 leading-relaxed mb-2">اقفل أي قسم عشان يختفي من الصفحة. تقدر تفتحه تاني من هنا.</p>
              {HOME_SECTIONS.map((s) => (
                <label key={s} className="flex items-center justify-between gap-3 min-h-[44px] cursor-pointer">
                  <span className="text-sm font-bold text-slate-800">{SECTION_LABELS[s]}</span>
                  <input type="checkbox" className="w-5 h-5 accent-emerald-600" checked={!hc.hide?.[s]} onChange={(e) => setField(`hide.${s}`, e.target.checked ? undefined : true)} />
                </label>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2">
              <p className="text-sm font-black text-slate-900">استرجاع النصوص الجاهزة</p>
              <p className="text-xs text-slate-500 leading-relaxed">بيستبدل كل نصوص الصفحة (تقدر تتراجع بـ Ctrl+Z قبل الحفظ).</p>
              <div className="flex gap-2">
                {(["ar", "en"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={async () => {
                      if (await confirmAsk({ title: "استرجاع النصوص", tone: "neutral", confirmText: "استبدال", message: `هتستبدل كل نصوص الصفحة بالنصوص الجاهزة (${l === "ar" ? "عربي" : "English"}). تكمّل؟` })) apply(() => JSON.parse(JSON.stringify(defaults[l])));
                    }}
                    className="flex-1 min-h-[44px] rounded-xl border border-slate-300 hover:bg-slate-50 text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" /> {l === "ar" ? "عربي" : "English"}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs font-bold leading-relaxed space-y-1">
              <p>• اضغط على أي نص في الصفحة واكتب مكانه.</p>
              <p>• العلامة الحمرا × بتحذف العنصر (زرار، شارة، سؤال، نقطة…) أو القسم كله.</p>
              <p>• زرار «+ إضافة» بيرجّع أو يضيف عنصر جديد.</p>
              <p>• Ctrl+Z للتراجع، Ctrl+S للحفظ.</p>
            </div>
            {selected && selected.kind === "text" ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2">
                <p className="text-sm font-black text-slate-900">النص المحدد</p>
                <textarea
                  value={selectedValue}
                  onChange={(e) => setField(selected.field, e.target.value, selected.base)}
                  rows={selected.multiline ? 5 : 2}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">اضغط على أي نص في الصفحة لتعديله من هنا كمان.</p>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col font-sans" dir="rtl">
      <header className="shrink-0 bg-white border-b border-slate-200 px-2 sm:px-3 py-1.5 flex items-center gap-1.5 sm:gap-2">
        <Link
          href="/admin/settings/home"
          onClick={(e) => {
            if (dirty && !window.confirm("لديك تعديلات غير محفوظة. هل تريد المغادرة بدون حفظ؟")) e.preventDefault();
          }}
          className={`${ghost} shrink-0`}
          aria-label="رجوع"
        >
          <ArrowRight className="w-4 h-4" />
          <span className="hidden md:inline">رجوع</span>
        </Link>

        <div className="min-w-0 flex-1 flex items-center gap-2 px-1">
          <h1 className="text-sm sm:text-base font-black text-slate-900 truncate">تحرير الصفحة الرئيسية</h1>
          {dirty && <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-orange-500" title="تعديلات غير محفوظة" aria-label="تعديلات غير محفوظة" />}
        </div>

        <div className="hidden sm:flex items-center bg-slate-100 rounded-xl p-1 gap-1 shrink-0" role="group" aria-label="حجم المعاينة">
          {(
            [
              ["mobile", "موبايل 390px", Smartphone],
              ["desktop", "ديسكتوب", Monitor],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setDevice(key)}
              aria-pressed={device === key}
              className={`min-h-[40px] px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${device === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden xl:inline">{label}</span>
            </button>
          ))}
        </div>

        <button type="button" onClick={undo} disabled={hist.past.length === 0} className={`${ghost} shrink-0`} aria-label="تراجع" title="تراجع (Ctrl+Z)">
          <Undo2 className="w-4 h-4" />
        </button>
        <button type="button" onClick={redo} disabled={hist.future.length === 0} className={`${ghost} shrink-0`} aria-label="إعادة" title="إعادة (Ctrl+Shift+Z)">
          <Redo2 className="w-4 h-4" />
        </button>

        <a href="/" target="_blank" rel="noopener noreferrer" className={`${ghost} shrink-0 hidden sm:flex`} aria-label="مشاهدة الصفحة">
          <ExternalLink className="w-4 h-4" />
          <span className="hidden lg:inline">مشاهدة الصفحة</span>
        </a>

        <button type="button" onClick={save} disabled={!dirty || saving} className={`${btn} shrink-0 bg-orange-600 hover:bg-orange-700 text-white shadow-sm relative`}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : justSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span className="hidden sm:inline">{justSaved ? "تم الحفظ" : "حفظ"}</span>
          {dirty && !saving && <span className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white" />}
        </button>

        <button type="button" onClick={() => setPanelOpen((o) => !o)} className={`${ghost} shrink-0`} aria-label={panelOpen ? "إخفاء اللوحة" : "إظهار اللوحة"} aria-expanded={panelOpen}>
          {panelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          <span className="hidden lg:inline">{panelOpen ? "إخفاء اللوحة" : "اللوحة"}</span>
        </button>
      </header>

      {error && <div className="shrink-0 bg-red-50 border-b border-red-200 text-red-800 text-xs font-bold px-3 py-2">{error}</div>}

      <div className="flex-1 min-h-0 flex relative">
        <main className="flex-1 min-w-0 min-h-0 overflow-hidden flex justify-center bg-slate-200 p-0 sm:p-3">
          <div className={`h-full bg-white sm:rounded-2xl sm:shadow-xl overflow-hidden ${device === "desktop" ? "w-full" : ""}`} style={device === "mobile" ? { width: 390, maxWidth: "100%" } : undefined}>
            <PreviewFrame width="100%">
              <EditProvider content={hc as any} setField={setField} selected={selected} select={select}>
                <HomeView hc={hc} products={products} reviews={reviews} adminLink={false} />
              </EditProvider>
            </PreviewFrame>
          </div>
        </main>

        {panelOpen && (
          <aside className="hidden lg:flex w-80 xl:w-96 shrink-0 border-r border-slate-200 bg-slate-50 min-h-0">
            <div className="w-full">{panel}</div>
          </aside>
        )}

        {panelOpen && (
          <div className="lg:hidden absolute inset-x-0 bottom-0 z-30 max-h-[58%] h-[58%] bg-slate-50 border-t border-slate-300 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.15)] flex flex-col min-h-0">
            <button type="button" onClick={() => setPanelOpen(false)} className="shrink-0 h-8 flex items-center justify-center cursor-pointer" aria-label="إغلاق اللوحة">
              <span className="w-10 h-1.5 rounded-full bg-slate-300" />
            </button>
            <div className="flex-1 min-h-0">{panel}</div>
          </div>
        )}
      </div>
    </div>
  );
}
