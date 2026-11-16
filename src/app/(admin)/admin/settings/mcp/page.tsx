"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2, ShieldAlert } from "lucide-react";

interface McpStatus {
  enabled: boolean;
  has_token: boolean;
  created_at: string | null;
  tools: { name: string; description: string }[];
}

const card = "bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-4";

export default function McpSettingsPage() {
  const [status, setStatus] = useState<McpStatus | null>(null);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");
  const endpoint = typeof window !== "undefined" ? `${window.location.origin}/api/mcp` : "/api/mcp";

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/mcp", { cache: "no-store" });
    const j = await r.json();
    if (j.success) setStatus(j);
  }, []);
  useEffect(() => {
    load().catch(() => setError("تعذر تحميل الإعدادات"));
  }, [load]);

  const call = async (method: "POST" | "PATCH" | "DELETE", body?: unknown) => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin/mcp", { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const j = await r.json();
      if (!j.success) throw new Error(j.error || "تعذر التنفيذ");
      setStatus(j);
      return j;
    } catch (e: any) {
      setError(e.message || "تعذر التنفيذ");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      /* ignore */
    }
  };

  if (!status) {
    return (
      <div className="p-10 flex items-center justify-center text-slate-500 gap-2">
        {error || (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> جاري التحميل...
          </>
        )}
      </div>
    );
  }

  const command = `claude mcp add --transport http store ${endpoint} --header "Authorization: Bearer ${token || "<التوكن>"}"`;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5 text-right" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 font-heading">ربط مساعد ذكاء اصطناعي (MCP)</h1>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
          بتربط Claude أو أي مساعد بيدعم MCP بمتجرك، فيقدر يقرا الطلبات والمنتجات ويغيّر حالة طلب أو سعر منتج بأمرك.
        </p>
      </div>

      <section className={card}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">الحالة</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {status.has_token ? (status.enabled ? "شغّال: أي مساعد معاه التوكن يقدر يتصل." : "موقوف مؤقتاً.") : "لسه ماتعملش توكن."}
            </p>
          </div>
          {status.has_token && (
            <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
              <span className="text-sm font-bold text-slate-800">{status.enabled ? "شغّال" : "موقوف"}</span>
              <input type="checkbox" className="w-5 h-5 accent-emerald-600" checked={status.enabled} disabled={busy} onChange={(e) => call("PATCH", { enabled: e.target.checked })} />
            </label>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-black text-slate-900">عنوان الخادم</p>
          <div className="flex gap-2">
            <code dir="ltr" className="flex-1 min-w-0 truncate rounded-xl bg-slate-50 border border-slate-200 px-3 py-3 text-xs font-mono">{endpoint}</code>
            <button type="button" onClick={() => copy("url", endpoint)} className="min-h-[48px] px-4 rounded-xl bg-slate-900 text-white text-sm font-bold cursor-pointer flex items-center gap-1.5">
              {copied === "url" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} نسخ
            </button>
          </div>
        </div>

        {token && (
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 space-y-2">
            <p className="text-sm font-black text-amber-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> انسخ التوكن دلوقتي، مش هيظهر تاني
            </p>
            <div className="flex gap-2">
              <code dir="ltr" className="flex-1 min-w-0 break-all rounded-xl bg-white border border-amber-200 px-3 py-3 text-xs font-mono">{token}</code>
              <button type="button" onClick={() => copy("token", token)} className="min-h-[48px] px-4 rounded-xl bg-amber-600 text-white text-sm font-bold cursor-pointer flex items-center gap-1.5">
                {copied === "token" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} نسخ
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (status.has_token && !window.confirm("التوكن القديم هيبطل يشتغل فوراً. تكمّل؟")) return;
              const j = await call("POST");
              if (j?.token) setToken(j.token);
            }}
            className="min-h-[48px] px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm cursor-pointer disabled:opacity-60"
          >
            {status.has_token ? "توليد توكن جديد" : "تفعيل وتوليد توكن"}
          </button>
          {status.has_token && (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                if (!window.confirm("إلغاء التوكن؟ كل المساعدين المتصلين هيتفصلوا.")) return;
                setToken("");
                await call("DELETE");
              }}
              className="min-h-[48px] px-5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-sm cursor-pointer disabled:opacity-60"
            >
              إلغاء التوكن
            </button>
          )}
        </div>
        {error && <p className="text-sm font-bold text-rose-700">{error}</p>}
      </section>

      <section className={card}>
        <h2 className="text-lg font-black text-slate-900">إزاي توصّله بـ Claude</h2>
        <p className="text-xs text-slate-500 leading-relaxed">شغّل الأمر ده في الطرفية (Claude Code)، بعد ما تولّد التوكن:</p>
        <div className="flex gap-2">
          <code dir="ltr" className="flex-1 min-w-0 break-all rounded-xl bg-slate-50 border border-slate-200 px-3 py-3 text-xs font-mono leading-relaxed">{command}</code>
          <button type="button" onClick={() => copy("cmd", command)} className="min-h-[48px] px-4 rounded-xl bg-slate-900 text-white text-sm font-bold cursor-pointer flex items-center gap-1.5 self-start">
            {copied === "cmd" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} نسخ
          </button>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">أي مساعد تاني بيدعم MCP عبر HTTP: حط العنوان فوق، وهيدر <span className="font-mono" dir="ltr">Authorization: Bearer &lt;التوكن&gt;</span>.</p>
      </section>

      <section className={card}>
        <h2 className="text-lg font-black text-slate-900">اللي المساعد يقدر يعمله</h2>
        <ul className="space-y-2">
          {status.tools.map((t) => (
            <li key={t.name} className="rounded-xl bg-slate-50 border border-slate-200 p-3">
              <span className="font-mono text-xs font-black text-slate-900" dir="ltr">{t.name}</span>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed" dir="ltr">{t.description}</p>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3">
          مفيش أداة حذف، ومفيش قراءة لمفاتيح أو أسرار. التوكن بيتخزّن مشفّر (hash) فمش بيتقري تاني. وأي حد معاه التوكن يقدر يغيّر الطلبات والأسعار، فاعامله زي كلمة السر.
        </p>
      </section>
    </div>
  );
}
