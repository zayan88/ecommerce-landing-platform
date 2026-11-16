"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  LandingPage,
  LandingPageContentConfig,
  LandingPageSectionConfig,
  ProductOffer,
  DEFAULT_LANDING_PAGE_SECTIONS,
  mergeSections,
} from "@/types";
import {
  ArrowRight,
  Smartphone,
  Monitor,
  Undo2,
  Redo2,
  ExternalLink,
  Save,
  MoreVertical,
  PanelRightClose,
  PanelRightOpen,
  Layers,
  Type,
  Palette,
  Copy,
  Check,
  Power,
  Trash2,
  Loader2,
  X,
  MousePointerClick,
  Sparkles,
  Tags,
} from "lucide-react";
import AiPanel from "./AiPanel";
import OffersPanel from "./OffersPanel";
import { buildDefaultOffers, sanitizeOffers } from "@/lib/offers";
import StarterLandingPage from "@/landing-pages/starter-template/page";
import SectionsPanel from "@/app/(admin)/admin/landing-pages/_components/SectionsPanel";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { PaletteSwatches } from "@/components/admin/PaletteSwatches";
import { isThemeColor } from "@/lib/palettes";
import { useBrand } from "@/components/brand/BrandProvider";
import { EditProvider, EditSelection, applyFieldEdit, getByPath } from "./EditContext";
import { PreviewFrame } from "./PreviewFrame";

interface Draft {
  content: LandingPageContentConfig;
  sections: LandingPageSectionConfig[];
  /** Quantity tiers of the product (the upsell ladder). Saved on the product, not the page. */
  offers: ProductOffer[];
}

interface History {
  past: Draft[];
  present: Draft;
  future: Draft[];
}

const HISTORY_CAP = 50;
const COALESCE_MS = 1200;

const FIELD_LABELS: Record<string, string> = {
  announcement_bar: "شريط الإعلان العلوي",
  hero_headline: "العنوان الرئيسي",
  hero_subheadline: "العنوان الفرعي",
  hero_badge: "شارة التقييم",
  hero_image: "الصورة الرئيسية",
  hero_bullets: "مميزات المنتج",
  comparison_badge: "شارة المقارنة",
  comparison_title: "عنوان المقارنة",
  comparison_old_title: "عنوان البدائل التقليدية",
  comparison_old_points: "عيوب البدائل التقليدية",
  comparison_new_title: "عنوان منتجنا",
  comparison_new_points: "مميزات منتجنا",
  comparison_image: "صورة المقارنة",
  box_title: "عنوان محتويات الشحنة",
  box_items: "محتويات الشحنة",
  box_image: "صورة المحتويات",
  how_to_use_title: "عنوان طريقة الاستخدام",
  how_to_use_steps: "خطوات الاستخدام",
  reviews_title: "عنوان آراء العملاء",
  reviews: "آراء العملاء",
  guarantees_title: "عنوان الضمانات",
  guarantees: "الضمانات",
  faq_title: "عنوان الأسئلة الشائعة",
  faq_items: "الأسئلة الشائعة",
  proof_statements: "شريط الثقة",
  proof_governorates: "مناطق التوصيل",
};

function fieldLabel(path: string): string {
  const [root, idx, sub] = path.split(".");
  const base = FIELD_LABELS[root] || root;
  if (idx === undefined) return base;
  const n = Number(idx) + 1;
  const subLabel = sub === "q" ? " (السؤال)" : sub === "a" ? " (الإجابة)" : sub === "desc" ? " (الوصف)" : sub === "comment" ? " (التعليق)" : sub === "name" ? " (الاسم)" : sub === "title" ? " (العنوان)" : "";
  return `${base} — رقم ${n}${subLabel}`;
}

export interface StarterEditorProps {
  lp: LandingPage;
  /** Receives the persisted patch so the caller can update its copy of the page. */
  onSaved: (patch: Partial<LandingPage>) => void;
  copied: boolean;
  busy: boolean;
  onCopyUrl: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

export default function StarterEditor({ lp, onSaved, copied, busy, onCopyUrl, onToggleStatus, onDelete }: StarterEditorProps) {
  const brand = useBrand();
  const initial = useMemo<Draft>(
    () => ({
      content: lp.content_config || {},
      sections: JSON.parse(JSON.stringify(mergeSections(lp.sections_config))),
      offers: JSON.parse(
        JSON.stringify(lp.product?.offers && lp.product.offers.length > 0 ? lp.product.offers : buildDefaultOffers(lp.product!))
      ),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lp.id]
  );

  const [hist, setHist] = useState<History>({ past: [], present: initial, future: [] });
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initial));
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [panelOpen, setPanelOpen] = useState(() => typeof window !== "undefined" && window.innerWidth >= 1024);
  const [tab, setTab] = useState<"sections" | "content" | "colors" | "offers" | "ai">("content");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<EditSelection | null>(null);
  const lastEdit = useRef<{ key: string; t: number } | null>(null);

  const draft = hist.present;
  const dirty = useMemo(() => JSON.stringify(draft) !== savedJson, [draft, savedJson]);

  const apply = useCallback((fn: (d: Draft) => Draft, key?: string) => {
    const now = Date.now();
    const coalesce = !!key && !!lastEdit.current && lastEdit.current.key === key && now - lastEdit.current.t < COALESCE_MS;
    lastEdit.current = key ? { key, t: now } : null;
    setHist((h) => {
      const next = fn(h.present);
      if (next === h.present) return h;
      return {
        past: coalesce ? h.past : [...h.past, h.present].slice(-HISTORY_CAP),
        present: next,
        future: [],
      };
    });
  }, []);

  const setField = useCallback(
    (path: string, value: unknown, base?: unknown) =>
      apply((d) => ({ ...d, content: applyFieldEdit(d.content, path, value, base) }), path),
    [apply]
  );

  const undo = useCallback(() => {
    lastEdit.current = null;
    setSelected(null);
    setHist((h) =>
      h.past.length === 0
        ? h
        : { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] }
    );
  }, []);

  const redo = useCallback(() => {
    lastEdit.current = null;
    setSelected(null);
    setHist((h) =>
      h.future.length === 0
        ? h
        : { past: [...h.past, h.present].slice(-HISTORY_CAP), present: h.future[0], future: h.future.slice(1) }
    );
  }, []);

  // Sections (reuse SectionsPanel handlers against the draft)
  const handleToggleSection = (id: string) =>
    apply((d) => ({ ...d, sections: d.sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)) }));
  const handleMoveSection = (index: number, direction: "up" | "down") =>
    apply((d) => {
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= d.sections.length) return d;
      const copy = [...d.sections];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return { ...d, sections: copy };
    });
  const handleResetSections = () =>
    apply((d) => ({ ...d, sections: JSON.parse(JSON.stringify(DEFAULT_LANDING_PAGE_SECTIONS)) }));

  const save = useCallback(async () => {
    setSaving(true);
    setSaveError("");
    try {
      // Offers live on the product: save them first (only when they changed), full product because the API replaces it.
      const offersChanged = JSON.stringify(draft.offers) !== JSON.stringify(JSON.parse(savedJson).offers);
      let savedOffers: ProductOffer[] | null = null;
      if (offersChanged && lp.product) {
        const clean = sanitizeOffers(lp.product.id, draft.offers);
        if (clean.length === 0 || clean.some((o) => !(o.price > 0))) {
          setSaveError("سعر كل عرض لازم يكون أكبر من صفر (تاب العروض)");
          return;
        }
        const pr = await fetch("/api/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...lp.product, offers: clean, skip_lp_sync: true }),
        });
        const pd = await pr.json();
        if (!pd.success) {
          setSaveError(pd.error || "تعذر حفظ العروض");
          return;
        }
        savedOffers = clean;
      }

      const res = await fetch("/api/landing-pages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lp.id, content_config: draft.content, sections_config: draft.sections }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedJson(JSON.stringify(draft));
        onSaved({
          content_config: draft.content,
          sections_config: draft.sections,
          ...(savedOffers && lp.product ? { product: { ...lp.product, offers: savedOffers } } : {}),
        });
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
      } else {
        setSaveError(data.error || "تعذر الحفظ");
      }
    } catch (err) {
      console.error(err);
      setSaveError("تعذر الحفظ، تحقق من الاتصال");
    } finally {
      setSaving(false);
    }
  }, [draft, lp.id, lp.product, savedJson, onSaved]);

  // Warn before leaving with unsaved edits
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Ctrl/Cmd+S, Ctrl+Z, Ctrl+Shift+Z (not while typing in a text field)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.isContentEditable || t.tagName === "INPUT" || t.tagName === "TEXTAREA");
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !saving) save();
      } else if (!typing && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dirty, saving, save, undo, redo]);

  const select = useCallback((sel: EditSelection | null) => {
    setSelected(sel);
    if (sel) setTab("content");
  }, []);

  // The draft the live preview renders (the real public page component)
  const draftPage = useMemo<LandingPage>(
    () => ({ ...lp, content_config: draft.content, sections_config: draft.sections }),
    [lp, draft]
  );

  const confirmLeave = (e: React.MouseEvent) => {
    if (dirty && !window.confirm("لديك تعديلات غير محفوظة. هل تريد المغادرة بدون حفظ؟")) e.preventDefault();
  };

  const isActive = lp.status === "active";
  const btn =
    "min-h-[44px] min-w-[44px] px-2.5 sm:px-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";
  const ghost = `${btn} bg-white border border-slate-200 text-slate-700 hover:bg-slate-50`;

  // ---- selected field (content tab) ----
  const selectedCurrent: string =
    selected && getByPath(draft.content, selected.field) !== undefined
      ? String(getByPath(draft.content, selected.field))
      : selected?.value || "";

  const panel = (
    <div className="flex flex-col h-full min-h-0" dir="rtl">
      <div className="flex gap-1.5 p-2 border-b border-slate-200 bg-white shrink-0" role="tablist">
        {(
          [
            ["content", "المحتوى", Type],
            ["sections", "الأقسام", Layers],
            ["colors", "الألوان", Palette],
            ["offers", "العروض", Tags],
            ["ai", "AI", Sparkles],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex-1 min-h-[44px] rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
              tab === key ? "bg-orange-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {tab === "offers" ? (
          <OffersPanel
            offers={draft.offers}
            currency={brand.currency}
            onChange={(offers) => apply((d) => ({ ...d, offers }), "offers")}
            onReset={() => apply((d) => ({ ...d, offers: buildDefaultOffers(lp.product!) }))}
          />
        ) : tab === "ai" ? (
          <AiPanel
            title={lp.title}
            brandName={brand.store_name}
            onApply={(c) => apply((d) => ({ ...d, content: { ...d.content, ...c } }))}
          />
        ) : tab === "colors" ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs font-bold leading-relaxed">
              <Palette className="w-4 h-4 shrink-0 mt-0.5 text-sky-600" />
              <span>ألوان الصفحة دي بس. لو سيبتها فاضية بتاخد ألوان المتجر من "هوية المتجر".</span>
            </div>
            {(
              [
                ["theme_primary", "لون الثقة (الضمانات والشحن المجاني)", brand.primary],
                ["theme_accent", "لون زرار الطلب والعروض", brand.accent],
              ] as const
            ).map(([field, title, storeDefault]) => {
              const current = getByPath(draft.content, field);
              const active = isThemeColor(current) ? current : "";
              return (
                <div key={field} className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2.5">
                  <p className="text-sm font-black text-slate-900">{title}</p>
                  <PaletteSwatches value={active || storeDefault} onChange={(k) => setField(field, k)} label={title} />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">{active ? "لون مخصص لهذه الصفحة" : "لون المتجر (افتراضي)"}</span>
                    {active && (
                      <button
                        type="button"
                        onClick={() => setField(field, "")}
                        className="min-h-[36px] px-3 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        استخدام لون المتجر
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : tab === "sections" ? (
          <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-3">
            <div>
              <h3 className="text-base font-black text-gray-900 font-heading">عناصر إضافية في الصفحة</h3>
              <p className="text-xs text-gray-500 mt-0.5">اقفل أي عنصر مش عاوزه، عشان الصفحة متتكررش فيها نفس الكلام.</p>
            </div>
            {([
              ["hide_announcement", "شريط الإعلان العلوي"],
              ["hide_hero_trust", "أيقونات الثقة تحت صور المنتج"],
              ["hide_checkout_trust", "أيقونات الضمان تحت فورم الطلب"],
              ["hide_offers", "باقات العروض (٢ و٣ قطع) — لو قفلتها يظهر سعر واحد بس"],
              ["hide_sticky_bar", "زر الشراء الثابت أسفل الشاشة (موبايل)"],
            ] as const).map(([key, label]) => {
              const on = !draft.content[key];
              return (
                <label key={key} className="flex items-center justify-between gap-3 min-h-[44px] p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <span className={`text-sm font-bold ${on ? "text-slate-900" : "text-gray-500 line-through"}`}>{label}</span>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => apply((d) => ({ ...d, content: { ...d.content, [key]: on ? true : undefined } }))}
                    className="w-5 h-5 accent-emerald-600"
                  />
                </label>
              );
            })}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5" htmlFor="cta-text">النص المكتوب على زر الشراء</label>
              <input
                id="cta-text"
                type="text"
                maxLength={40}
                value={draft.content.cta_text || ""}
                onChange={(e) => apply((d) => ({ ...d, content: { ...d.content, cta_text: e.target.value || undefined } }))}
                placeholder="أكّد طلبي.. وهدفع عند الاستلام 🛒"
                className="w-full min-h-[48px] px-3.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <SectionsPanel
            customSections={draft.sections}
            isSavingSections={saving}
            sectionSaveSuccess={justSaved}
            handleToggleSection={handleToggleSection}
            handleMoveSection={handleMoveSection}
            handleResetSections={handleResetSections}
            handleSaveSections={save}
          />
          </div>
        ) : (
          <>
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs font-bold leading-relaxed">
              <MousePointerClick className="w-4 h-4 shrink-0 mt-0.5 text-sky-600" />
              <span>اضغط على أي نص أو صورة في الصفحة لتعديله</span>
            </div>

            {selected ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-black text-slate-900">{fieldLabel(selected.field)}</p>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer"
                    aria-label="إلغاء التحديد"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {selected.kind === "image" ? (
                  <ImageUploader
                    value={selectedCurrent}
                    onChange={(url) => setField(selected.field, url)}
                    heightClass="h-48"
                  />
                ) : (
                  <textarea
                    key={selected.field}
                    dir="rtl"
                    rows={selectedCurrent.length > 90 ? 6 : 3}
                    value={selectedCurrent}
                    onChange={(e) => setField(selected.field, e.target.value, selected.base)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 text-sm leading-relaxed outline-none resize-y"
                  />
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">لم يتم تحديد أي عنصر بعد</p>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col font-sans" dir="rtl">
      {/* Top bar */}
      <header className="shrink-0 bg-white border-b border-slate-200 px-2 sm:px-3 py-1.5 flex items-center gap-1.5 sm:gap-2">
        <Link
          href={`/admin/landing-pages/${lp.id}`}
          onClick={confirmLeave}
          className={`${ghost} shrink-0`}
          aria-label="رجوع لبيانات الصفحة"
        >
          <ArrowRight className="w-4 h-4" />
          <span className="hidden md:inline">رجوع</span>
        </Link>

        <div className="min-w-0 flex-1 flex items-center gap-2 px-1">
          <h1 className="text-sm sm:text-base font-black text-slate-900 truncate">{lp.title}</h1>
          {dirty && (
            <span
              className="shrink-0 w-2.5 h-2.5 rounded-full bg-orange-500"
              title="تعديلات غير محفوظة"
              aria-label="تعديلات غير محفوظة"
            />
          )}
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
              className={`min-h-[40px] px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                device === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
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

        <a
          href={`/p/${lp.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${ghost} shrink-0 hidden sm:flex`}
          aria-label="مشاهدة الصفحة"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="hidden lg:inline">مشاهدة الصفحة</span>
        </a>

        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className={`${btn} shrink-0 bg-orange-600 hover:bg-orange-700 text-white shadow-sm relative`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : justSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span className="hidden sm:inline">{justSaved ? "تم الحفظ" : "حفظ الصفحة"}</span>
          {dirty && !saving && <span className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white" />}
        </button>

        {/* Overflow menu */}
        <div className="relative shrink-0">
          <button type="button" onClick={() => setMenuOpen((o) => !o)} className={ghost} aria-label="المزيد" aria-expanded={menuOpen}>
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute top-full mt-1 left-0 z-50 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 space-y-0.5 text-right">
                <a
                  href={`/p/${lp.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="min-h-[44px] px-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                >
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                  <span>فتح الصفحة</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    onCopyUrl();
                    setMenuOpen(false);
                  }}
                  className="w-full min-h-[44px] px-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  <span>{copied ? "تم النسخ" : "نسخ الرابط"}</span>
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    onToggleStatus();
                    setMenuOpen(false);
                  }}
                  className="w-full min-h-[44px] px-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  <Power className={`w-4 h-4 ${isActive ? "text-amber-600" : "text-emerald-600"}`} />
                  <span>{isActive ? "إيقاف الصفحة" : "تفعيل الصفحة"}</span>
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="w-full min-h-[44px] px-3 rounded-xl text-sm font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف الصفحة</span>
                </button>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          className={`${ghost} shrink-0`}
          aria-label={panelOpen ? "إخفاء اللوحة" : "إظهار اللوحة"}
          aria-expanded={panelOpen}
        >
          {panelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          <span className="hidden lg:inline">{panelOpen ? "إخفاء اللوحة" : "اللوحة"}</span>
        </button>
      </header>

      {saveError && (
        <div className="shrink-0 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs font-bold px-3 py-2">{saveError}</div>
      )}

      {/* Body: canvas + side panel (physical left in RTL = last child) */}
      <div className="flex-1 min-h-0 flex relative">
        <main className="flex-1 min-w-0 min-h-0 overflow-hidden flex justify-center bg-slate-200 p-0 sm:p-3">
          <div
            className={`h-full bg-white sm:rounded-2xl sm:shadow-xl overflow-hidden ${device === "desktop" ? "w-full" : ""}`}
            style={device === "mobile" ? { width: 390, maxWidth: "100%" } : undefined}
          >
            <PreviewFrame width="100%">
              <EditProvider content={draft.content} setField={setField} selected={selected} select={select}>
                <StarterLandingPage product={{ ...lp.product!, offers: draft.offers }} landingPage={draftPage} />
              </EditProvider>
            </PreviewFrame>
          </div>
        </main>

        {/* Desktop side panel */}
        {panelOpen && (
          <aside className="hidden lg:flex w-80 xl:w-96 shrink-0 border-r border-slate-200 bg-slate-50 min-h-0">
            <div className="w-full">{panel}</div>
          </aside>
        )}

        {/* Mobile bottom sheet */}
        {panelOpen && (
          <div className="lg:hidden absolute inset-x-0 bottom-0 z-30 max-h-[58%] h-[58%] bg-slate-50 border-t border-slate-300 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden">
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="shrink-0 h-8 flex items-center justify-center cursor-pointer"
              aria-label="إغلاق اللوحة"
            >
              <span className="w-10 h-1.5 rounded-full bg-slate-300" />
            </button>
            <div className="flex-1 min-h-0">{panel}</div>
          </div>
        )}
      </div>
    </div>
  );
}
