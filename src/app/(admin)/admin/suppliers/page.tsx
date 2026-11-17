"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Handshake, Loader2, PackageSearch, Settings2 } from "lucide-react";
import { Toast, type ToastMessage } from "../_components/toast";

interface Supplier {
  id: string;
  name: string;
  desc: string;
  status: "available" | "soon";
  href?: string;
  settingKey?: string;
  note?: string;
}

const SUPPLIERS: Supplier[] = [
  {
    id: "safka",
    name: "صفقة (Safka)",
    desc: "دروبشيبينغ مصري: استيراد منتجات المورد لمتجرك وإرسال طلباتك له تلقائياً مع متابعة حالة الشحن.",
    status: "available",
    href: "/admin/safqa",
    settingKey: "safka_enabled",
    note: "التفعيل بيرسل كل طلب جديد لصفقة. اكتب مفتاحك ومعرّف صفحتك فوق واضغط «حفظ وربط»، ومفيش حاجة تتضبط على Cloudflare.",
  },
  {
    id: "taager",
    name: "تاجر (Taager)",
    desc: "منصة دروبشيبينغ وأفيليت. لسه مفيش API رسمي متاح للربط المباشر.",
    status: "soon",
  },
];

/** One place for supplier / dropshipping integrations: turn each on or off and open its settings. */
export default function SuppliersPage() {
  const [loading, setLoading] = useState(true);
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [apiKey, setApiKey] = useState("");
  const [pageId, setPageId] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((j) => {
        setFlags({ safka_enabled: j?.settings?.safka_enabled === true });
        setApiKey(j?.settings?.safqa_api_secret_token || "");
        setPageId(j?.settings?.safka_page_id || "");
      })
      .catch(() => setToast({ ok: false, text: "تعذر تحميل الإعدادات" }))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (key: string, on: boolean) => {
    setBusy(key);
    try {
      const res = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [key]: on }) });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error || "تعذر الحفظ");
      setFlags((f) => ({ ...f, [key]: on }));
      setToast({ ok: true, text: on ? "اتفعّل الربط مع المورد" : "اتقفل الربط مع المورد" });
    } catch (e: any) {
      setToast({ ok: false, text: e.message || "تعذر الحفظ" });
    } finally {
      setBusy("");
    }
  };

  /** Saves the keys, then checks them against Safka right away. */
  const connect = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ safqa_api_secret_token: apiKey.trim(), safka_page_id: pageId.trim() }) });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error || "تعذر الحفظ");
      setSaving(false);
      setTesting(true);
      const t = await (await fetch("/api/safqa/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "test_connection" }) })).json();
      if (t.success) {
        setToast({ ok: true, text: "اتربطت مع صفقة بنجاح ✅" });
        if (!flags.safka_enabled) await toggle("safka_enabled", true);
      } else {
        setToast({ ok: false, text: t.message || "المفتاح اتحفظ لكن صفقة رفضت الاتصال. راجع المفتاح." });
      }
    } catch (e: any) {
      setToast({ ok: false, text: e.message || "تعذر الاتصال" });
    } finally {
      setSaving(false);
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center text-slate-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> جاري التحميل...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5 text-right" dir="rtl">
      <Toast message={toast} onClose={() => setToast(null)} />
      <div>
        <h1 className="text-2xl font-black text-slate-900 font-heading flex items-center gap-2">
          <Handshake className="w-6 h-6 text-orange-600" /> الربط مع الموردين
        </h1>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">فعّل مورد وطلباتك تروحله لوحدها، أو سيبه مقفول لو بتجهّز الطلبات بنفسك.</p>
      </div>

      {SUPPLIERS.map((s) => {
        const on = s.settingKey ? Boolean(flags[s.settingKey]) : false;
        return (
          <section key={s.id} className={`bg-white rounded-3xl border shadow-sm p-5 sm:p-7 space-y-4 ${s.status === "soon" ? "border-slate-200 opacity-80" : on ? "border-emerald-300" : "border-slate-200/90"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-lg font-black text-slate-900">{s.name}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
              {s.status === "soon" ? (
                <span className="shrink-0 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-black">قريباً</span>
              ) : (
                <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-black ${on ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{on ? "مفعّل" : "مقفول"}</span>
              )}
            </div>

            {s.status === "available" && s.settingKey && (
              <>
                <label className="flex items-center justify-between gap-3 min-h-[44px] cursor-pointer">
                  <span className="text-sm font-bold text-slate-900">تفعيل الربط وإرسال الطلبات للمورد</span>
                  <input type="checkbox" className="w-5 h-5 accent-emerald-600" checked={on} disabled={busy === s.settingKey} onChange={(e) => toggle(s.settingKey!, e.target.checked)} />
                </label>
                {s.id === "safka" && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <p className="text-sm font-black text-slate-900">اربط حسابك دلوقتي</p>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">مفتاح الـAPI (api-safka-key)</label>
                      <input dir="ltr" autoComplete="off" value={apiKey} onChange={(e) => setApiKey(e.target.value.trim())} className="w-full min-h-[48px] px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-mono outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500" placeholder="الصق مفتاحك من لوحة صفقة" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">معرّف صفحتك (Page ID)</label>
                      <input dir="ltr" autoComplete="off" value={pageId} onChange={(e) => setPageId(e.target.value.trim())} className="w-full min-h-[48px] px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-mono outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500" placeholder="اختياري: معرّف صفحة المسوّق عندك" />
                    </div>
                    <button type="button" onClick={connect} disabled={saving || testing || !apiKey} className="min-h-[48px] px-6 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm disabled:opacity-60 cursor-pointer flex items-center gap-2">
                      {(saving || testing) && <Loader2 className="w-4 h-4 animate-spin" />}
                      {saving ? "جاري الحفظ..." : testing ? "بنجرّب الاتصال..." : "حفظ وربط وتجربة الاتصال"}
                    </button>
                  </div>
                )}
                {s.note && <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3">{s.note}</p>}
                {s.href && (
                  <Link href={s.href} className="inline-flex items-center gap-2 min-h-[48px] px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm">
                    <Settings2 className="w-4 h-4" /> إعدادات {s.name} واستيراد المنتجات
                  </Link>
                )}
              </>
            )}
          </section>
        );
      })}

      <section className="bg-white rounded-3xl border border-dashed border-slate-300 p-5 sm:p-7 flex items-start gap-3">
        <PackageSearch className="w-6 h-6 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-600 leading-relaxed">محتاج مورد تاني (شحن، دروبشيبينغ، مخزن)؟ بنضيفه هنا بنفس الطريقة لما يكون عنده API متاح للربط.</p>
      </section>
    </div>
  );
}
