"use client";

import { useConfirm } from "../../_components/confirm";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Link2, Copy, Check, RefreshCw, Trash2, CheckCircle2, AlertCircle, Clock, Star, HelpCircle, ChevronDown } from "lucide-react";
import { dnsInstruction, normalizeHostname } from "@/lib/domains/cf-domains";

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
  "w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-3.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-mono";
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
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-800 border border-red-200">
      <AlertCircle className="w-3 h-3" /> محتاج مراجعة
    </span>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {}
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`نسخ ${label}`}
      className="min-h-[36px] min-w-[36px] rounded-lg border border-slate-300 bg-white hover:bg-slate-50 inline-flex items-center justify-center cursor-pointer shrink-0"
    >
      {done ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
    </button>
  );
}

/** A numbered step with the green circle, like the reference. */
function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="w-9 h-9 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0" aria-hidden="true">
        {n}
      </span>
      <div className="flex-1 pt-1.5 text-sm text-slate-800 leading-relaxed">{children}</div>
    </li>
  );
}

function RecordBox({ dns, title }: { dns: Dns; title?: string }) {
  const rows: [string, string, boolean][] = [
    ["الاسم/المضيف (Name / Host)", dns.name, true],
    ["النوع (Type)", dns.type, false],
    ["القيمة/يشير إلى (Value / Points to)", dns.target, true],
    ["TTL", "القيمة الافتراضية أو 3600 ثانية", false],
  ];
  return (
    <div className="rounded-xl border-r-4 border-emerald-500 bg-slate-50 p-4 space-y-2.5">
      <p className="font-black text-slate-950 text-sm">{title || "معلومات سجل CNAME:"}</p>
      {rows.map(([label, value, copyable]) => (
        <div key={label} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="text-slate-600">{label}:</span>
          <code dir="ltr" className="font-mono font-bold text-slate-950 break-all">{value}</code>
          {copyable && <CopyButton value={value} label={label} />}
        </div>
      ))}
      {dns.isApex && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
          ده دومين رئيسي (بدون www). بعض الشركات مش بتقبل CNAME على الدومين الرئيسي، ولو حصل كده استخدم <span dir="ltr" className="font-bold">www.</span> قبل الدومين.
        </p>
      )}
    </div>
  );
}

export default function DomainSettingsPage() {
  const confirmAsk = useConfirm();
  const [configured, setConfigured] = useState(true);
  const [target, setTarget] = useState("");
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [siteDomain, setSiteDomain] = useState("");
  const [draft, setDraft] = useState("");
  const [help, setHelp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const startedAt = useRef(Date.now());

  const apply = (j: any) => {
    setConfigured(j.configured !== false);
    if (typeof j.target === "string") setTarget(j.target);
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

  const call = async (key: string, req: () => Promise<Response>, okText?: string): Promise<boolean> => {
    setBusy(key);
    setMsg(null);
    try {
      const j = await (await req()).json();
      if (j.success) {
        apply(j);
        if (okText) setMsg({ ok: true, text: okText });
        return true;
      }
      setMsg({ ok: false, text: j.error || "تعذر تنفيذ الطلب" });
    } catch {
      setMsg({ ok: false, text: "تعذر الاتصال بالسيرفر" });
    } finally {
      setBusy("");
    }
    return false;
  };

  const post = (body: object) => () =>
    fetch("/api/admin/domain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    const ok = await call("add", post({ domain: draft }), "اتضاف الدومين. كمّل الخطوات تحت وضيف سجل الـ DNS عند الشركة اللي اشتريت منها الدومين.");
    if (ok) setDraft("");
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

  const remove = async (name: string) => {
    if (!await confirmAsk({ title: "إزالة الدومين", message: `هتشيل الدومين ${name} من المتجر. الموقع هيفضل شغال على الرابط الأساسي.` })) return;
    call("rm:" + name, () => fetch(`/api/admin/domain?domain=${encodeURIComponent(name)}`, { method: "DELETE" }), "اتشال الدومين.");
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center text-slate-500" dir="rtl">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
        جاري التحميل...
      </div>
    );
  }

  // Live preview of the record from what the merchant is typing (the real record comes back after "ربط الدومين")
  const typed = normalizeHostname(draft);
  const previewDns: Dns | null = configured && target ? dnsInstruction(typed.ok ? typed.host : "www.yourdomain.com", target.replace(/\.pages\.dev$/, "")) : null;
  const card = "bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-5";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 space-y-5" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black font-heading text-slate-950 flex items-center gap-2">
          <Link2 className="w-6 h-6 text-emerald-600" aria-hidden="true" />
          ربط نطاقك
        </h1>
        <button
          type="button"
          onClick={() => setHelp((v) => !v)}
          aria-expanded={help}
          className="min-h-[44px] px-4 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          شرح كيفية ربط الدومين
          <ChevronDown className={`w-4 h-4 transition-transform ${help ? "rotate-180" : ""}`} />
        </button>
      </div>

      {help && (
        <section className={card} aria-label="شرح ربط الدومين">
          <p className="text-sm font-black text-slate-950">أسئلة شائعة</p>
          <ul className="space-y-3 text-sm text-slate-700 leading-relaxed list-disc pr-5">
            <li><strong>الدومين اشتريته منين؟</strong> من أي شركة (Spaceship أو Hostinger أو GoDaddy أو Namecheap...). كل شركة فيها قسم اسمه DNS أو "إدارة النطاق"، وفيه زرار «إضافة سجل / Add record».</li>
            <li><strong>اسم السجل (Host):</strong> لو دومينك <span dir="ltr">www.mystore.com</span> اكتب <span dir="ltr">www</span>. لو <span dir="ltr">shop.mystore.com</span> اكتب <span dir="ltr">shop</span>. بعض الشركات بتطلب الاسم كامل.</li>
            <li><strong>مفيش سجل CNAME قديم؟</strong> لو فيه سجل قديم لنفس الاسم (A أو CNAME)، امسحه الأول عشان ما يتعارضش.</li>
            <li><strong>اتأخر؟</strong> النشر عادةً دقايق لساعات وممكن يوصل لـ 48 ساعة. تقدر تقفل الصفحة وترجع بعدين.</li>
            <li><strong>الشهادة (https):</strong> بتتفعّل تلقائيًا بعد ما الدومين يشتغل، من غير ما تعمل حاجة.</li>
          </ul>
        </section>
      )}

      {!configured ? (
        <div role="note" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
          <p className="font-black">ربط الدومين من اللوحة غير مفعّل على المتجر ده.</p>
          <p className="text-xs mt-1">تواصل مع الدعم عشان يفعّله، أو اطلب منهم يربطوا الدومين لك مباشرة.</p>
        </div>
      ) : (
        <>
          <section className={card}>
            <form onSubmit={add} className="space-y-3">
              <label htmlFor="domain-input" className="block text-base font-black text-slate-950">ادخل الدومين الخاص بك</label>
              <p className="text-sm font-bold text-slate-900">الدومين</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="domain-input"
                  dir="ltr"
                  className={input}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="shop.yourdomain.com"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={busy === "add" || !draft.trim()}
                  className="min-h-[48px] px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {busy === "add" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  ربط الدومين
                </button>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                ادخل الدومين الأساسي بدون www، أو ادخل sub domain في حالة إنك عايز تربط sub domain مثل <span dir="ltr">shop.yourdomain.com</span>
              </p>
              {draft.trim() && !typed.ok && <p className="text-xs font-bold text-red-700">{typed.error}</p>}
            </form>
            {msg && (
              <p role="status" className={`text-xs font-bold flex items-start gap-1.5 ${msg.ok ? "text-emerald-700" : "text-red-700"}`}>
                {msg.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                {msg.text}
              </p>
            )}

            <p className="text-sm text-slate-800 leading-relaxed pt-2">اتبع الخطوات أدناه لربط نطاقك المخصص عن طريق إضافة سجل CNAME إلى إعدادات DNS لنطاقك.</p>
            <ol className="space-y-4">
              <Step n={1}>قم بتسجيل الدخول إلى موقع مزوّد النطاق الخاص بك (مثل Spaceship أو Hostinger أو GoDaddy أو Namecheap).</Step>
              <Step n={2}>انتقل إلى إعدادات DNS أو قسم إدارة DNS.</Step>
              <Step n={3}>
                <p className="mb-3">أضف سجل CNAME جديد بالمعلومات التالية:</p>
                {previewDns && <RecordBox dns={previewDns} />}
              </Step>
              <Step n={4}>احفظ التغييرات وانتظر لنشر إعدادات DNS (عادةً يستغرق بضع ساعات إلى 48 ساعة).</Step>
            </ol>
          </section>

          {domains.length > 0 && <h2 className="text-lg font-black text-slate-950 pt-1">دومينات المتجر</h2>}
          {domains.map((d) => (
            <section key={d.name} className={card} aria-label={d.name}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-black text-slate-950 font-mono" dir="ltr">{d.name}</h3>
                <StatePill state={d.state} />
              </div>

              {d.state !== "active" && (
                <div className="space-y-3">
                  <RecordBox dns={d.dns} title="السجل المطلوب إضافته عند مزوّد النطاق:" />
                  <p className="text-xs text-slate-600 leading-relaxed">الصفحة بتتحقق لوحدها كل نص دقيقة وإنت فاتحها، وتقدر تدوس «تحقق الآن» في أي وقت.</p>
                  {d.state === "failed" && d.error && <p className="text-xs font-bold text-red-700 leading-relaxed">ملاحظة من النظام: {d.error}</p>}
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
                  className="min-h-[44px] px-4 rounded-xl border border-red-200 text-red-700 text-sm font-bold hover:bg-red-50 flex items-center gap-2 cursor-pointer disabled:opacity-50 mr-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  إزالة
                </button>
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
