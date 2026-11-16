"use client";

import React, { useEffect, useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, AlertTriangle, Megaphone, X, Plus, Trash2 } from "lucide-react";
import {
  META_PIXEL_RE,
  TIKTOK_PIXEL_RE,
  SNAP_PIXEL_RE,
  GA4_RE,
  GTM_RE,
  META_TEST_CODE_RE,
  MAX_PIXELS_PER_PLATFORM,
} from "@/lib/tracking/tag-ids";

interface CapiEntry {
  pixel_id: string;
  token: string; // masked ("EAAB...xyz") when already saved, or newly typed
  test_code: string;
}

const input =
  "w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-3.5 text-sm outline-none focus:ring-2 focus:ring-orange-500 font-mono";

/** Type an id and press Enter (or the add button) to add it as a chip. */
function ChipInput({
  label,
  hint,
  values,
  onChange,
  pattern,
  badFormat,
  placeholder,
}: {
  label: string;
  hint: string;
  values: string[];
  onChange: (v: string[]) => void;
  pattern: RegExp;
  badFormat: string;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState("");

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (!pattern.test(v)) return setErr(badFormat);
    if (values.includes(v)) return setErr("المعرّف ده مضاف بالفعل");
    if (values.length >= MAX_PIXELS_PER_PLATFORM) return setErr(`الحد الأقصى ${MAX_PIXELS_PER_PLATFORM} بيكسلات`);
    onChange([...values, v]);
    setDraft("");
    setErr("");
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-black text-slate-900">{label}</label>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-300 bg-white p-2 min-h-[52px] focus-within:ring-2 focus-within:ring-orange-500">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 border border-slate-200 pl-1 pr-2.5 py-1 text-xs font-mono text-slate-800" dir="ltr">
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              aria-label={`حذف ${v}`}
              className="w-6 h-6 rounded-md hover:bg-rose-100 hover:text-rose-700 flex items-center justify-center cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
        <input
          dir="ltr"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setErr("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
          placeholder={values.length ? "" : placeholder}
          className="flex-1 min-w-[160px] min-h-[36px] bg-transparent outline-none text-sm font-mono px-1"
        />
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{err ? <span className="text-rose-700 font-bold">{err}</span> : hint}</p>
    </div>
  );
}

export default function TrackingSettingsPage() {
  const [meta, setMeta] = useState<string[]>([]);
  const [tiktok, setTiktok] = useState<string[]>([]);
  const [snap, setSnap] = useState<string[]>([]);
  const [ga4, setGa4] = useState("");
  const [gtm, setGtm] = useState("");
  const [capi, setCapi] = useState<CapiEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const j = await fetch("/api/settings").then((r) => r.json());
        if (j.success) {
          const s = j.settings || {};
          setMeta(Array.isArray(s.meta_pixel_ids) && s.meta_pixel_ids.length ? s.meta_pixel_ids : s.default_meta_pixel_id ? [s.default_meta_pixel_id] : []);
          setTiktok(Array.isArray(s.tiktok_pixel_ids) && s.tiktok_pixel_ids.length ? s.tiktok_pixel_ids : s.tiktok_pixel_id ? [s.tiktok_pixel_id] : []);
          setSnap(Array.isArray(s.snap_pixel_ids) ? s.snap_pixel_ids : []);
          setGa4(s.ga4_measurement_id || "");
          setGtm(s.gtm_container_id || "");
          if (Array.isArray(s.meta_capi_entries) && s.meta_capi_entries.length) {
            setCapi(s.meta_capi_entries.map((e: any) => ({ pixel_id: e.pixel_id, token: e.token || "", test_code: e.test_code || "" })));
          } else if (s.default_meta_pixel_id && s.default_meta_capi_token) {
            // legacy single pixel + token (token arrives masked and is kept server-side)
            setCapi([{ pixel_id: s.default_meta_pixel_id, token: s.default_meta_capi_token, test_code: s.meta_test_event_code || "" }]);
          }
        }
      } catch {
        setMsg({ ok: false, text: "تعذر تحميل الإعدادات" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // A Conversions API entry only makes sense for a Meta pixel that is actually added
  const capiRows = capi.filter((c) => meta.includes(c.pixel_id));
  const pixelsWithoutCapi = meta.filter((id) => !capi.some((c) => c.pixel_id === id));

  const updateCapi = (pixel_id: string, patch: Partial<CapiEntry>) =>
    setCapi((list) => list.map((c) => (c.pixel_id === pixel_id ? { ...c, ...patch } : c)));

  const problems: string[] = [];
  if (ga4 && !GA4_RE.test(ga4)) problems.push("Google Analytics (الشكل G-XXXXXXX)");
  if (gtm && !GTM_RE.test(gtm)) problems.push("Tag Manager (الشكل GTM-XXXXXXX)");
  for (const c of capiRows) if (c.test_code && !META_TEST_CODE_RE.test(c.test_code)) problems.push(`كود اختبار ${c.pixel_id}`);

  const save = async () => {
    if (problems.length) return setMsg({ ok: false, text: "راجع: " + problems.join("، ") });
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meta_pixel_ids: meta,
          tiktok_pixel_ids: tiktok,
          snap_pixel_ids: snap,
          ga4_measurement_id: ga4,
          gtm_container_id: gtm,
          // masked tokens ("...") tell the server to keep the stored token for that pixel
          meta_capi_entries: capiRows.map((c) => ({ pixel_id: c.pixel_id, token: c.token, test_code: c.test_code })),
        }),
      });
      const j = await res.json();
      if (j.success) {
        const saved = j.settings?.meta_capi_entries;
        if (Array.isArray(saved)) setCapi(saved.map((e: any) => ({ pixel_id: e.pixel_id, token: e.token || "", test_code: e.test_code || "" })));
        setMsg({ ok: true, text: "تم الحفظ. الأكواد بتشتغل على صفحات المتجر فورًا." });
      } else {
        setMsg({ ok: false, text: j.error || "تعذر الحفظ" });
      }
    } catch {
      setMsg({ ok: false, text: "تعذر الاتصال بالسيرفر" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center text-slate-500" dir="rtl">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
        جاري التحميل...
      </div>
    );
  }

  const card = "bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-5";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-28 space-y-5" dir="rtl">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
          <Megaphone className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black font-heading text-slate-950">البيكسل والتتبع والتسويق</h1>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">اربط أكواد الإعلانات وتعرف الزيارات والطلبات من كل حملة.</p>
        </div>
      </div>

      <div role="note" className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-sm leading-relaxed text-amber-950">
          <p className="font-black">أضف معرّف (ID) البيكسل فقط</p>
          <p className="text-xs mt-1">
            الأحداث بتتبعت تلقائيًا (مشاهدة، بدء الطلب، إتمام الطلب). لا تستخدم Event Builder ولا تربط البيكسل بصفحة الشكر أو أي زر، عشان البيانات ما تتكررش.
          </p>
        </div>
      </div>

      <section className={card} aria-label="البيكسلات">
        <ChipInput
          label="Facebook (Meta) Pixel ID"
          hint="أرقام فقط، من Events Manager. تقدر تضيف أكتر من بيكسل (اكتب الـ ID واضغط Enter)."
          values={meta}
          onChange={setMeta}
          pattern={META_PIXEL_RE}
          badFormat="الـ Pixel ID أرقام فقط (6 إلى 20 رقم)"
          placeholder="الصق معرّف البيكسل واضغط Enter"
        />
        <hr className="border-slate-100" />
        <ChipInput
          label="TikTok Pixel ID"
          hint="من TikTok Ads Manager ← Events ← Web Events."
          values={tiktok}
          onChange={setTiktok}
          pattern={TIKTOK_PIXEL_RE}
          badFormat="معرّف TikTok حروف وأرقام (8 إلى 32)"
          placeholder="الصق معرّف البيكسل واضغط Enter"
        />
        <hr className="border-slate-100" />
        <ChipInput
          label="Snapchat Pixel ID"
          hint="من Snapchat Ads Manager ← Events Manager."
          values={snap}
          onChange={setSnap}
          pattern={SNAP_PIXEL_RE}
          badFormat="معرّف Snapchat بالشكل xxxxxxxx-xxxx-xxxx-..."
          placeholder="الصق معرّف البيكسل واضغط Enter"
        />
      </section>

      <section className={card} aria-label="Conversion API">
        <div>
          <h2 className="text-lg font-black text-slate-950">Conversion API (فيسبوك)</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            بيبعت الطلبات من السيرفر لفيسبوك، وده أدق من المتصفح لوحده. بيشتغل مع نفس البيكسل من غير تكرار (الأحداث بتتطابق بـ event_id). لو مش متأكد، سيبه فاضي.
          </p>
        </div>

        {meta.length === 0 && <p className="text-sm text-slate-500">أضف بيكسل Facebook فوق الأول.</p>}

        {capiRows.map((c) => (
          <div key={c.pixel_id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-black text-slate-900" dir="ltr">{c.pixel_id}</span>
              <button
                type="button"
                onClick={() => setCapi((list) => list.filter((x) => x.pixel_id !== c.pixel_id))}
                aria-label={`حذف Conversion API للبيكسل ${c.pixel_id}`}
                className="min-h-[36px] min-w-[36px] rounded-lg text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Access Token</label>
              <input
                dir="ltr"
                type="text"
                autoComplete="off"
                className={input}
                value={c.token}
                onFocus={(e) => {
                  if (c.token.includes("...")) updateCapi(c.pixel_id, { token: "" });
                  else e.currentTarget.select();
                }}
                onChange={(e) => updateCapi(c.pixel_id, { token: e.target.value })}
                placeholder="EAAB..."
              />
              {c.token.includes("...") && <p className="text-[11px] text-emerald-700 font-bold mt-1">محفوظ (اضغط واكتب رمز جديد لتغييره)</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">كود اختبار الأحداث (اختياري)</label>
              <input dir="ltr" className={input} value={c.test_code} onChange={(e) => updateCapi(c.pixel_id, { test_code: e.target.value.trim() })} placeholder="TEST12345" />
              <p className="text-[11px] text-slate-500 mt-1">للتجربة بس. امسحه بعد ما تتأكد عشان ما يفضلش الإرسال تجريبي.</p>
            </div>
          </div>
        ))}

        {pixelsWithoutCapi.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pixelsWithoutCapi.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setCapi((list) => [...list, { pixel_id: id, token: "", test_code: "" }])}
                className="min-h-[44px] px-4 rounded-xl border border-dashed border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة Conversion API للبيكسل</span>
                <span dir="ltr" className="font-mono text-xs">{id}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className={card} aria-label="Google">
        <h2 className="text-lg font-black text-slate-950">Google</h2>
        <div>
          <label className="block text-sm font-black text-slate-900 mb-1.5" htmlFor="ga4">Google Analytics 4</label>
          <input id="ga4" dir="ltr" className={input} value={ga4} onChange={(e) => setGa4(e.target.value.trim())} placeholder="G-XXXXXXXXXX" />
          <p className="text-xs text-slate-500 mt-1.5">من Analytics ← Admin ← Data streams.</p>
        </div>
        <div>
          <label className="block text-sm font-black text-slate-900 mb-1.5" htmlFor="gtm">Google Tag Manager (اختياري)</label>
          <input id="gtm" dir="ltr" className={input} value={gtm} onChange={(e) => setGtm(e.target.value.trim())} placeholder="GTM-XXXXXXX" />
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            الأحداث بتتبعت لـ dataLayer باسم <span dir="ltr">store_Purchase</span> و<span dir="ltr">store_InitiateCheckout</span>. ما تستخدمش GA4 وGTM لنفس الإحصائية عشان ما تتكررش.
          </p>
        </div>
      </section>

      <p className="text-xs text-slate-500 leading-relaxed px-1">
        للتأكد إنها شغالة: افتح صفحة منتجك وجرّب إضافة Meta Pixel Helper أو TikTok Pixel Helper في المتصفح.
      </p>

      <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 p-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex-1 sm:flex-none min-h-[48px] px-8 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            حفظ
          </button>
          {msg && (
            <p role="status" className={`text-xs font-bold flex items-center gap-1.5 ${msg.ok ? "text-emerald-700" : "text-rose-700"}`}>
              {msg.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {msg.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
