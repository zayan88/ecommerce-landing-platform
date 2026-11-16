"use client";

import React, { useEffect, useState } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import type { Coupon, DownsellConfig, PopupConfig, ShippingConfig } from "@/lib/commerce";

interface Prod {
  id: string;
  title_ar: string;
  status: string;
  offers?: { free_shipping?: boolean }[];
}

const inputCls =
  "w-full min-h-[48px] px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500";
const card = "bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-4";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-black text-slate-900">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-500 leading-relaxed">{hint}</p>}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 min-h-[44px] cursor-pointer">
      <span className="text-sm font-bold text-slate-900">{label}</span>
      <input type="checkbox" className="w-5 h-5 accent-emerald-600" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

const EMPTY_SHIPPING: ShippingConfig = { default_fee: 0, free_over: 0, min_order: 0, product_fees: {} };
const EMPTY_POPUP: PopupConfig = { enabled: false, title: "", body: "", button_text: "اطلب دلوقتي", button_target: "checkout", delay_seconds: 5, image_url: "", frequency: "session" };
const EMPTY_DOWNSELL: DownsellConfig = { on_exit: false, auto: false, delay_seconds: 30, coupon_code: "", message: "" };

export default function CommerceSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [shipping, setShipping] = useState<ShippingConfig>(EMPTY_SHIPPING);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [downsell, setDownsell] = useState<DownsellConfig>(EMPTY_DOWNSELL);
  const [popup, setPopup] = useState<PopupConfig>(EMPTY_POPUP);
  const [products, setProducts] = useState<Prod[]>([]);

  useEffect(() => {
    Promise.all([fetch("/api/settings").then((r) => r.json()), fetch("/api/products").then((r) => r.json())])
      .then(([s, p]) => {
        const st = s.settings || {};
        setShipping({ ...EMPTY_SHIPPING, ...(st.shipping_config || {}), product_fees: { ...(st.shipping_config?.product_fees || {}) } });
        setCoupons(Array.isArray(st.coupons) ? st.coupons : []);
        setDownsell({ ...EMPTY_DOWNSELL, ...(st.downsell || {}) });
        setPopup({ ...EMPTY_POPUP, ...(st.popup || {}) });
        setProducts((p.products || []).filter((x: Prod) => x.status === "active"));
      })
      .catch(() => setMessage({ ok: false, text: "تعذر تحميل الإعدادات" }))
      .finally(() => setLoading(false));
  }, []);

  const num = (v: string) => (v === "" ? 0 : Math.max(0, Math.round(Number(v)) || 0));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipping_config: shipping, coupons, downsell, popup }),
      });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error || "تعذر الحفظ");
      // show what the server kept (invalid coupons / codes are dropped)
      setCoupons(j.settings.coupons || []);
      setDownsell({ ...EMPTY_DOWNSELL, ...(j.settings.downsell || {}) });
      setMessage({ ok: true, text: "تم الحفظ." });
    } catch (err: any) {
      setMessage({ ok: false, text: err.message || "تعذر الحفظ" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center text-slate-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> جاري التحميل...
      </div>
    );
  }

  const freeOffers = products.reduce((n, p) => n + (p.offers || []).filter((o) => o.free_shipping).length, 0);
  const setCoupon = (i: number, patch: Partial<Coupon>) => setCoupons((l) => l.map((c, k) => (k === i ? { ...c, ...patch } : c)));

  return (
    <form onSubmit={save} className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5 text-right" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 font-heading">الشحن والعروض</h1>
        <p className="text-sm text-slate-600 mt-1">تكلفة الشحن، الحد الأدنى للطلب، الكوبونات، والنوافذ المنبثقة.</p>
      </div>

      {/* Shipping */}
      <section className={card}>
        <h2 className="text-lg font-black text-slate-900">تكلفة الشحن</h2>
        <Field label="تكلفة الشحن (ج.م)" hint="اكتب 0 لو الشحن مجاني. دي تكلفة كل طلب لكل منتجات المتجر، إلا المنتجات اللي ليها تكلفة خاصة تحت.">
          <input className={inputCls} inputMode="numeric" value={shipping.default_fee} onChange={(e) => setShipping({ ...shipping, default_fee: num(e.target.value) })} />
        </Field>
        <Field label="شحن مجاني للطلبات من (ج.م)" hint="الطلب اللي إجماليه بعد الخصم يوصل للرقم ده يتشحن مجاناً. 0 يعني مفيش حد.">
          <input className={inputCls} inputMode="numeric" value={shipping.free_over} onChange={(e) => setShipping({ ...shipping, free_over: num(e.target.value) })} />
        </Field>
        <Field label="الحد الأدنى للطلب (ج.م)" hint="أقل قيمة طلب بتتقبل. 0 يعني مفيش حد أدنى.">
          <input className={inputCls} inputMode="numeric" value={shipping.min_order} onChange={(e) => setShipping({ ...shipping, min_order: num(e.target.value) })} />
        </Field>
        {shipping.default_fee > 0 && freeOffers > 0 && (
          <p className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 leading-relaxed">
            تنبيه: في {freeOffers} عرض عليه «شحن مجاني»، فهيتشحنوا مجاناً رغم تكلفة الشحن اللي كتبتها. شيل العلامة من العروض اللي عاوز يتحاسب عليها شحن (من تعديل المنتج ← عروض الكمية).
          </p>
        )}
        <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3">
          العروض اللي عليها علامة «شحن مجاني» (في محرر العروض) بتتشحن مجاناً مهما كانت تكلفة الشحن هنا. لو عاوز عرض يتحاسب عليه شحن، شيل العلامة منه.
        </p>
      </section>

      {/* Per product shipping */}
      <section className={card}>
        <div>
          <h2 className="text-lg font-black text-slate-900">تكلفة شحن لكل منتج</h2>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">سيب الخانة فاضية عشان المنتج ياخد تكلفة المتجر. اكتب 0 لشحن مجاني للمنتج ده، أو أي رقم لتكلفة خاصة.</p>
        </div>
        {products.length === 0 ? (
          <p className="text-sm text-slate-500">مفيش منتجات نشطة.</p>
        ) : (
          products.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="flex-1 min-w-0 text-sm font-bold text-slate-800 truncate">{p.title_ar}</span>
              <input
                className={inputCls + " w-32 text-center"}
                inputMode="numeric"
                placeholder="تكلفة المتجر"
                value={p.id in shipping.product_fees ? shipping.product_fees[p.id] : ""}
                onChange={(e) => {
                  const fees = { ...shipping.product_fees };
                  if (e.target.value === "") delete fees[p.id];
                  else fees[p.id] = num(e.target.value);
                  setShipping({ ...shipping, product_fees: fees });
                }}
              />
            </div>
          ))
        )}
      </section>

      {/* Coupons */}
      <section className={card}>
        <div>
          <h2 className="text-lg font-black text-slate-900">الكوبونات</h2>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">العميل بيكتب الكود في فورم الطلب. الخصم بيتحسب على سعر الطلب قبل الشحن.</p>
        </div>
        {coupons.map((c, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <input className={inputCls + " font-mono"} dir="ltr" placeholder="الكود (مثال: SAVE50)" maxLength={20} value={c.code} onChange={(e) => setCoupon(i, { code: e.target.value.toUpperCase() })} />
              <select className={inputCls} value={c.type} onChange={(e) => setCoupon(i, { type: e.target.value === "percent" ? "percent" : "fixed" })}>
                <option value="fixed">خصم مبلغ ثابت (ج.م)</option>
                <option value="percent">خصم نسبة (%)</option>
              </select>
              <input className={inputCls} inputMode="numeric" placeholder={c.type === "percent" ? "النسبة %" : "قيمة الخصم"} value={c.value || ""} onChange={(e) => setCoupon(i, { value: num(e.target.value) })} />
              <input className={inputCls} inputMode="numeric" placeholder="الحد الأدنى للطلب (اختياري)" value={c.min_order || ""} onChange={(e) => setCoupon(i, { min_order: num(e.target.value) })} />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer min-h-[44px]">
                <input type="checkbox" className="w-5 h-5 accent-emerald-600" checked={c.enabled} onChange={(e) => setCoupon(i, { enabled: e.target.checked })} /> شغّال
              </label>
              <button type="button" onClick={() => setCoupons((l) => l.filter((_, k) => k !== i))} className="min-h-[44px] px-3 rounded-xl text-rose-600 hover:bg-rose-50 text-sm font-bold flex items-center gap-1.5 cursor-pointer">
                <Trash2 className="w-4 h-4" /> حذف
              </button>
            </div>
          </div>
        ))}
        {coupons.length < 30 && (
          <button
            type="button"
            onClick={() => setCoupons((l) => [...l, { code: "", type: "fixed", value: 0, min_order: 0, enabled: true }])}
            className="min-h-[48px] w-full rounded-xl border-2 border-dashed border-slate-300 hover:border-orange-400 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> إضافة كوبون
          </button>
        )}
      </section>

      {/* Downsell */}
      <section className={card}>
        <div>
          <h2 className="text-lg font-black text-slate-900">كوبون قبل المغادرة (Downsell)</h2>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">نافذة بتعرض كوبون خصم للزائر قبل ما يمشي. بتظهر مرة واحدة بس في كل جلسة، وزرار «استخدم الكوبون» بيطبّقه في الفورم.</p>
        </div>
        <Toggle label="اظهار الكوبون لما الزائر يحاول يغادر (على الكمبيوتر)" checked={downsell.on_exit} onChange={(v) => setDownsell({ ...downsell, on_exit: v })} />
        <Toggle label="اظهار الكوبون تلقائياً بعد وقت" checked={downsell.auto} onChange={(v) => setDownsell({ ...downsell, auto: v })} />
        {downsell.auto && (
          <Field label="الوقت بالثواني" hint="الموصى به 30 ثانية.">
            <input className={inputCls} inputMode="numeric" value={downsell.delay_seconds} onChange={(e) => setDownsell({ ...downsell, delay_seconds: num(e.target.value) })} />
          </Field>
        )}
        <Field label="الكوبون المعروض" hint={coupons.length === 0 ? "ضيف كوبون فوق الأول." : undefined}>
          <select className={inputCls} value={downsell.coupon_code} onChange={(e) => setDownsell({ ...downsell, coupon_code: e.target.value })}>
            <option value="">اختار كوبون</option>
            {coupons.filter((c) => c.code).map((c) => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
        </Field>
        <Field label="رسالة الكوبون" hint="مثال: خد خصم 50 جنيه لو طلبك أكتر من 1500 جنيه.">
          <textarea className={inputCls + " py-3 leading-relaxed"} rows={3} maxLength={200} value={downsell.message} onChange={(e) => setDownsell({ ...downsell, message: e.target.value })} />
        </Field>
        {(downsell.on_exit || downsell.auto) && !downsell.coupon_code && (
          <p className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5">اختار الكوبون عشان النافذة تظهر.</p>
        )}
      </section>

      {/* Popup */}
      <section className={card}>
        <div>
          <h2 className="text-lg font-black text-slate-900">نافذة منبثقة (Popup)</h2>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">رسالة بتظهر للزائر في صفحاتك، مثلاً عرض أو إعلان. بتتقفل بسهولة.</p>
        </div>
        <Toggle label="تفعيل النافذة" checked={popup.enabled} onChange={(v) => setPopup({ ...popup, enabled: v })} />
        {popup.enabled && (
          <>
            <Field label="العنوان">
              <input className={inputCls} maxLength={80} value={popup.title} onChange={(e) => setPopup({ ...popup, title: e.target.value })} />
            </Field>
            <Field label="النص">
              <textarea className={inputCls + " py-3 leading-relaxed"} rows={3} maxLength={300} value={popup.body} onChange={(e) => setPopup({ ...popup, body: e.target.value })} />
            </Field>
            <Field label="رابط صورة (اختياري)" hint="الصورة دي بتتحسب ضمن الصور اللي الصفحة بتحمّلها.">
              <input className={inputCls} dir="ltr" placeholder="https://..." value={popup.image_url} onChange={(e) => setPopup({ ...popup, image_url: e.target.value.trim() })} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="نص الزرار">
                <input className={inputCls} maxLength={30} value={popup.button_text} onChange={(e) => setPopup({ ...popup, button_text: e.target.value })} />
              </Field>
              <Field label="الزرار يعمل إيه">
                <select className={inputCls} value={popup.button_target} onChange={(e) => setPopup({ ...popup, button_target: e.target.value === "close" ? "close" : "checkout" })}>
                  <option value="checkout">ينزّل لفورم الطلب</option>
                  <option value="close">يقفل النافذة</option>
                </select>
              </Field>
              <Field label="تظهر بعد (ثواني)">
                <input className={inputCls} inputMode="numeric" value={popup.delay_seconds} onChange={(e) => setPopup({ ...popup, delay_seconds: num(e.target.value) })} />
              </Field>
              <Field label="كام مرة">
                <select className={inputCls} value={popup.frequency} onChange={(e) => setPopup({ ...popup, frequency: e.target.value === "always" ? "always" : "session" })}>
                  <option value="session">مرة في كل جلسة</option>
                  <option value="always">كل ما الصفحة تتفتح</option>
                </select>
              </Field>
            </div>
          </>
        )}
      </section>

      {message && (
        <div role="status" className={`p-3.5 rounded-xl text-sm font-bold border ${message.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <div className="sticky bottom-3 z-10">
        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto min-h-[48px] px-8 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-base shadow-lg shadow-orange-500/25 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          حفظ
        </button>
      </div>
    </form>
  );
}
