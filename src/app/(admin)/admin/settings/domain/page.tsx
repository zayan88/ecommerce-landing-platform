"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Globe, Copy, Check, RefreshCw, Trash2, CheckCircle2, AlertCircle, Clock, Star } from "lucide-react";

interface Dns {
  type: "CNAME";
  name: string;
  target: string;
  isApex: boolean;
}
interface DomainRow {
  name: string;
  state: "pending" | "active" | "failed";
  error: string;
  dns: Dns;
}

const input =
  "w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-3.5 text-sm outline-none focus:ring-2 focus:ring-orange-500 font-mono";
const AUTO_REFRESH_MS = 30000;
const AUTO_REFRESH_MAX_MS = 10 * 60 * 1000;

function StatePill({ state }: { state: DomainRow["state"] }) {
  if (state === "active")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" /> شغال
      </span>
    );
  if (state === "pending")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <Clock className="w-3 h-3" /> في انتظار سجل الـ DNS
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
      <AlertCircle className="w-3 h-3" /> محتاج مراجعة
    </span>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {}
  };
  return (
    <div>
      <p className="text-[11px] font-bold text-slate-500 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <code dir="ltr" className="flex-1 min-h-[40px] flex items-center rounded-lg bg-white border border-slate-200 px-3 text-sm font-mono text-slate-900 break-all">
          {value}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={`نسخ ${label}`}
          className="min-h-[40px] min-w-[40px] rounded-lg border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center cursor-pointer"
        >
          {done ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
        </button>
      </div>
    </div>
  );
}

export default function DomainSettingsPage() {
  const [configured, setConfigured] = useState(true);
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [siteDomain, setSiteDomain] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const startedAt = useRef(Date.now());

  const apply = (j: any) => {
    setConfigured(j.configured !== false);
    setDomains(Array.isArray(j.domains) ? j.domains : []);
  };

  const load = useCallback(async () => {
    try {
      const [d, s] = await Promise.all([fetch("/api/admin/domain").then((r) => r.json()), fetch("/api/settings").then((r) => r.json())]);
      if (d.success) apply(d);
      else setMsg({ ok: false, text: d.error || "تعذر تحميل الدومينات" });
      if (s.success) setSiteDomain(String(s.settings?.site_domain || ""));
    } catch {
      setMsg({ ok: false, text: "تعذر الاتصال بالسيرفر" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // While a domain waits for its DNS record, re-check every 30 s (visible tab only, for at most 10 minutes).
  const anyPending = domains.some((d) => d.state === "pending");
  useEffect(() => {
    if (!anyPending) return;
    startedAt.current = Date.now();
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible" || Date.now() - startedAt.current > AUTO_REFRESH_MAX_MS) return;
      fetch("/api/admin/domain")
        .then((r) => r.json())
        .then((j) => j.success && apply(j))
        .catch(() => {});
    }, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [anyPending]);

  const call = async (key: string, req: () => Promise<Response>, okText?: string) => {
    setBusy(key);
    setMsg(null);
    try {
      const j = await (await req()).json();
      if (j.success) {
        apply(j);
        if (okText) setMsg({ ok: true, text: okText });
      } else {
        setMsg({ ok: false, text: j.error || "تعذر تنفيذ الطلب" });
      }
    } catch {
      setMsg({ ok: false, text: "تعذر الاتصال بالسيرفر" });
    } finally {
      setBusy("");
    }
  };

  const post = (body: object) => () =>
    fetch("/api/admin/domain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    await call("add", post({ domain: draft }), "اتضاف الدومين. دلوقتي ضيف السجل ده عند الشركة اللي اشتريت منها الدومين.");
    setDraft("");
  };

  const makeMain = async (name: string) => {
    setBusy("main:" + name);
    setMsg(null);
    try {
      const j = await (
        await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ site_domain: `https://${name}` }) })
      ).json();
      if (j.success) {
        setSiteDomain(`https://${name}`);
        setMsg({ ok: true, text: "الدومين ده بقى رابط المتجر الرئيسي (بيظهر في الفيد ومشاركات السوشيال)." });
      } else setMsg({ ok: false, text: j.error || "تعذر الحفظ" });
    } catch {
      setMsg({ ok: false, text: "تعذر الاتصال بالسيرفر" });
    } finally {
      setBusy("");
    }
  };

  const remove = (name: string) => {
    if (!window.confirm(`إزالة الدومين ${name} من المتجر؟ الموقع هيفضل شغال على الرابط الأساسي.`)) return;
    call("rm:" + name, () => fetch(`/api/admin/domain?domain=${encodeURIComponent(name)}`, { method: "DELETE" }), "اتشال الدومين.");
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center text-slate-500" dir="rtl">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
        جاري التحميل...
      </div>
    );
  }

  const card = "bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 space-y-5" dir="rtl">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black font-heading text-slate-950">الدومين</h1>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">اربط دومينك بالمتجر. بتكتب اسمه هنا، وبتضيف سجل واحد عند الشركة اللي اشتريت منها الدومين.</p>
        </div>
      </div>

      {!configured ? (
        <div role="note" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
          <p className="font-black">ربط الدومين من اللوحة غير مفعّل على المتجر ده.</p>
          <p className="text-xs mt-1">تواصل مع الدعم عشان يفعّله، أو اطلب منهم يربطوا الدومين لك مباشرة.</p>
        </div>
      ) : (
        <>
          <section className={card}>
            <form onSubmit={add} className="space-y-3">
              <label htmlFor="domain-input" className="block text-sm font-black text-slate-900">اسم الدومين</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="domain-input"
                  dir="ltr"
                  className={input}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="shop.mystore.com"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={busy === "add" || !draft.trim()}
                  className="min-h-[48px] px-6 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {busy === "add" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  ربط الدومين
                </button>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                الأفضل تستخدم <strong dir="ltr">www.اسمك.com</strong> أو دومين فرعي زي <strong dir="ltr">shop.اسمك.com</strong>. الدومين بدون www (<span dir="ltr">اسمك.com</span>) بيشتغل بس لو الشركة بتدعم CNAME على الدومين الرئيسي.
              </p>
            </form>
            {msg && (
              <p role="status" className={`text-xs font-bold flex items-start gap-1.5 ${msg.ok ? "text-emerald-700" : "text-rose-700"}`}>
                {msg.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                {msg.text}
              </p>
            )}
          </section>

          {domains.map((d) => (
            <section key={d.name} className={card} aria-label={d.name}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-black text-slate-950 font-mono" dir="ltr">{d.name}</h2>
                <StatePill state={d.state} />
              </div>

              {d.state !== "active" && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 space-y-3">
                  <p className="text-sm font-black text-slate-900">ضيف السجل ده عند الشركة اللي اشتريت منها الدومين (إعدادات DNS):</p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <CopyField label="النوع (Type)" value={d.dns.type} />
                    <CopyField label="الاسم (Name / Host)" value={d.dns.name} />
                    <CopyField label="القيمة (Target / Value)" value={d.dns.target} />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    الشركة ممكن تسميهم «Host» و«Points to». بعد الإضافة، التحقق بيخد من دقايق لحد ساعات. الصفحة بتتحقق لوحدها كل نص دقيقة.
                    {d.dns.isApex && " ده دومين رئيسي (بدون www): لو الشركة مش بتقبل CNAME عليه، استخدم www بدله."}
                  </p>
                  {d.state === "failed" && d.error && <p className="text-xs font-bold text-rose-700 leading-relaxed">ملاحظة من النظام: {d.error}</p>}
                </div>
              )}

              {d.state === "active" && (
                <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 leading-relaxed">
                  الدومين شغال والشهادة (https) جاهزة. افتحه: <a href={`https://${d.name}`} target="_blank" rel="noopener noreferrer" dir="ltr" className="font-mono font-bold underline">https://{d.name}</a>
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {d.state !== "active" && (
                  <button
                    type="button"
                    onClick={() => call("chk:" + d.name, post({ action: "check", domain: d.name }), "اتبعت طلب تحقق جديد.")}
                    disabled={busy === "chk:" + d.name}
                    className="min-h-[44px] px-4 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${busy === "chk:" + d.name ? "animate-spin" : ""}`} />
                    تحقق الآن
                  </button>
                )}
                {d.state === "active" && siteDomain !== `https://${d.name}` && (
                  <button
                    type="button"
                    onClick={() => makeMain(d.name)}
                    disabled={busy === "main:" + d.name}
                    className="min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Star className="w-4 h-4" />
                    اجعله رابط المتجر الرئيسي
                  </button>
                )}
                {siteDomain === `https://${d.name}` && (
                  <span className="min-h-[44px] px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <Star className="w-4 h-4" /> ده الرابط الرئيسي
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(d.name)}
                  disabled={busy === "rm:" + d.name}
                  className="min-h-[44px] px-4 rounded-xl border border-rose-200 text-rose-700 text-sm font-bold hover:bg-rose-50 flex items-center gap-2 cursor-pointer disabled:opacity-50 mr-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  إزالة
                </button>
              </div>
            </section>
          ))}

          {domains.length === 0 && <p className="text-sm text-slate-500 text-center py-4">لسه مفيش دومين مربوط. اكتب اسم الدومين فوق وابدأ.</p>}
        </>
      )}
    </div>
  );
}
