"use client";

import { FloatingSave, Toast } from "../../_components/toast";
import { useConfirm } from "../../_components/confirm";
import React, { useEffect, useState } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import type { ChatConfig } from "@/lib/chat";

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

interface FaqRow {
  q: string;
  keywords: string;
  answer: string;
}

export default function ChatSettingsPage() {
  const confirmAsk = useConfirm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [cfg, setCfg] = useState<Omit<ChatConfig, "faq">>({
    enabled: false, title: "اسألنا", welcome: "", fallback: "", llm_enabled: false, llm_base_url: "https://api.openai.com/v1", llm_model: "", llm_prompt: "", nudges: [], nudge_seconds: 25,
  });
  const [faq, setFaq] = useState<FaqRow[]>([]);
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [llmKey, setLlmKey] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        const s = d.settings || {};
        const c = s.chat || {};
        const { faq: f, ...rest } = c;
        setCfg((cur) => ({ ...cur, ...rest }));
        setFaq((f || []).map((x: any) => ({ q: x.q, keywords: (x.keywords || []).join("، "), answer: x.answer })));
        setBotToken(s.support_bot_token || "");
        setChatId(s.support_chat_id || "");
        setLlmKey(s.llm_api_key || "");
      })
      .catch(() => setMessage({ ok: false, text: "تعذر تحميل الإعدادات" }))
      .finally(() => setLoading(false));
  }, []);

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat: { ...cfg, faq: faq.map((f) => ({ q: f.q, keywords: f.keywords, answer: f.answer })) },
          support_bot_token: botToken,
          support_chat_id: chatId,
          llm_api_key: llmKey,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error || "تعذر الحفظ");
      setMessage({ ok: true, text: "تم الحفظ." });
      return true;
    } catch (err: any) {
      setMessage({ ok: false, text: err.message || "تعذر الحفظ" });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  useEffect(() => {
    fetch("/api/admin/chat-webhook").then((r) => r.json()).then((j) => setConnected(Boolean(j?.connected))).catch(() => {});
  }, []);
  const connect = async () => {
    if (!(await save())) return;
    setConnecting(true);
    try {
      const r = await fetch("/api/admin/chat-webhook", { method: "POST" });
      const j = await r.json();
      if (j.success) {
        setConnected(true);
        setMessage({ ok: true, text: "اتربط. أي Reply على رسالة عميل في تليجرام هيوصله في الشات." });
      } else setMessage({ ok: false, text: j.error || "تعذر الربط" });
    } finally {
      setConnecting(false);
    }
  };

  const test = async () => {
    if (!(await save())) return;
    setTesting(true);
    try {
      const r = await fetch("/api/admin/chat-test", { method: "POST" });
      const j = await r.json();
      setMessage(j.success ? { ok: true, text: "اتبعتت رسالة تجربة على تليجرام ✅" } : { ok: false, text: j.error || "تعذر الإرسال" });
    } finally {
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

  const setRow = (i: number, patch: Partial<FaqRow>) => setFaq((l) => l.map((r, k) => (k === i ? { ...r, ...patch } : r)));

  return (
    <form onSubmit={save} className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5 text-right" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 font-heading">الشات</h1>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">فقاعة شات بتظهر في كل صفحات المتجر. بترد من الأسئلة اللي تكتبها، ولو معرفتش بتحوّل الرسالة ليك على تليجرام وانت ترد على واتساب.</p>
      </div>

      <section className={card}>
        <label className="flex items-center justify-between gap-3 min-h-[44px] cursor-pointer">
          <span className="text-base font-black text-slate-900">تفعيل الشات</span>
          <input type="checkbox" className="w-5 h-5 accent-emerald-600" checked={cfg.enabled} onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })} />
        </label>
        <Field label="عنوان الشات">
          <input className={inputCls} maxLength={40} value={cfg.title} onChange={(e) => setCfg({ ...cfg, title: e.target.value })} />
        </Field>
        <Field label="رسالة الترحيب">
          <input className={inputCls} maxLength={200} value={cfg.welcome} onChange={(e) => setCfg({ ...cfg, welcome: e.target.value })} />
        </Field>
        <Field label="الرسالة لما مفيش إجابة" hint="بتظهر قبل ما يكتب العميل رقمه.">
          <input className={inputCls} maxLength={300} value={cfg.fallback} onChange={(e) => setCfg({ ...cfg, fallback: e.target.value })} />
        </Field>
      </section>

      <section className={card}>
        <div>
          <h2 className="text-lg font-black text-slate-900">الأسئلة والأجوبة</h2>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">السؤال بيظهر كزرار للعميل. الكلمات المفتاحية (مفصولة بفاصلة) بتخلّي الرد يطلع لو العميل كتب أي واحدة منها، مثلاً: شحن، توصيل، كام.</p>
        </div>
        {faq.map((f, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-2.5">
            <input className={inputCls} placeholder="السؤال (مثال: الشحن بكام؟)" maxLength={80} value={f.q} onChange={(e) => setRow(i, { q: e.target.value })} />
            <input className={inputCls} placeholder="كلمات مفتاحية: شحن، توصيل، مصاريف" value={f.keywords} onChange={(e) => setRow(i, { keywords: e.target.value })} />
            <textarea className={inputCls + " py-3 leading-relaxed"} rows={3} maxLength={600} placeholder="الإجابة" value={f.answer} onChange={(e) => setRow(i, { answer: e.target.value })} />
            <button type="button" onClick={async () => { if (await confirmAsk({ title: "حذف السؤال", message: "هتحذف السؤال ده وإجابته." })) setFaq((l) => l.filter((_, k) => k !== i)); }} className="min-h-[44px] px-3 rounded-xl text-red-600 hover:bg-red-50 text-sm font-bold flex items-center gap-1.5 cursor-pointer">
              <Trash2 className="w-4 h-4" /> حذف
            </button>
          </div>
        ))}
        {faq.length < 30 && (
          <button type="button" onClick={() => setFaq((l) => [...l, { q: "", keywords: "", answer: "" }])} className="min-h-[48px] w-full rounded-xl border-2 border-dashed border-slate-300 hover:border-orange-400 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer">
            <Plus className="w-4 h-4" /> إضافة سؤال
          </button>
        )}
      </section>

      <section className={card}>
        <div>
          <h2 className="text-lg font-black text-slate-900">رسائل تفاعلية</h2>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">رسالة صغيرة بتطلع جنب الشات كل شوية (4 مرات بحد أقصى) بتشجّع العميل يسأل أو يطلب. سيبها فاضية لو عايز الرسائل الجاهزة.</p>
        </div>
        {cfg.nudges.map((n, i) => (
          <div key={i} className="flex gap-2">
            <input className={inputCls} maxLength={100} value={n} placeholder="مثال: اطلب دلوقتي والشحن مجاني 🚚" onChange={(e) => setCfg({ ...cfg, nudges: cfg.nudges.map((x, k) => (k === i ? e.target.value : x)) })} />
            <button type="button" aria-label="حذف" onClick={() => setCfg({ ...cfg, nudges: cfg.nudges.filter((_, k) => k !== i) })} className="min-h-[48px] px-3 rounded-xl text-red-600 hover:bg-red-50 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {cfg.nudges.length < 6 && (
          <button type="button" onClick={() => setCfg({ ...cfg, nudges: [...cfg.nudges, ""] })} className="min-h-[48px] w-full rounded-xl border-2 border-dashed border-slate-300 hover:border-orange-400 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer">
            <Plus className="w-4 h-4" /> إضافة رسالة
          </button>
        )}
        <Field label="كل كام ثانية" hint="من 10 لـ 300 ثانية.">
          <input className={inputCls} type="number" min={10} max={300} value={cfg.nudge_seconds} onChange={(e) => setCfg({ ...cfg, nudge_seconds: Number(e.target.value) || 25 })} />
        </Field>
      </section>

      <section className={card}>
        <div>
          <h2 className="text-lg font-black text-slate-900">بوت الدعم على تليجرام</h2>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">
            الرسائل اللي الشات مش بيعرف يرد عليها بتتبعت هنا، ومعاها رقم العميل وزرار «ردّ على واتساب». اعمل بوت جديد من BotFather (غير بوت الطلبات)، وابدأ معاه محادثة، وحط معرّف الشات.
          </p>
        </div>
        <Field label="توكن البوت">
          <input className={inputCls} dir="ltr" autoComplete="off" value={botToken} onChange={(e) => setBotToken(e.target.value.trim())} placeholder="123456789:AA..." />
        </Field>
        <Field label="معرّف الشات (Chat ID)">
          <input className={inputCls} dir="ltr" inputMode="numeric" value={chatId} onChange={(e) => setChatId(e.target.value.trim())} placeholder="123456789 أو -100..." />
        </Field>
        <button type="button" onClick={test} disabled={testing || saving} className="min-h-[48px] px-5 rounded-xl bg-slate-900 text-white font-bold text-sm cursor-pointer disabled:opacity-60">
          {testing ? "جاري الإرسال..." : "حفظ وإرسال رسالة تجربة"}
        </button>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-2.5">
          <p className="text-sm font-black text-slate-900">الرد من تليجرام يوصل للعميل في الشات</p>
          <p className="text-xs text-slate-500 leading-relaxed">اضغط «ربط الرد» مرة واحدة بعد ما تنشر الموقع. بعدها لما تعمل Reply على رسالة عميل في تليجرام، ردّك بيظهر في نافذة الشات عنده. (محتاج الموقع المنشور وقاعدة D1.)</p>
          <button type="button" onClick={connect} disabled={connecting || saving} className="min-h-[48px] px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm cursor-pointer disabled:opacity-60">
            {connecting ? "جاري الربط..." : connected ? "إعادة ربط الرد" : "ربط الرد"}
          </button>
          {connected && <p className="text-xs font-bold text-emerald-700">✓ مربوط</p>}
        </div>
      </section>

      <section className={card}>
        <div>
          <h2 className="text-lg font-black text-slate-900">ذكاء اصطناعي (اختياري)</h2>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">
            لو ربطت مفتاحك، الشات بيجرّب يرد بنفسه على الأسئلة اللي مش في القايمة، من المعلومات اللي تكتبها تحت. لو معرفش بيحوّل ليك. التكلفة على حسابك أنت عند مزوّد الـ LLM.
          </p>
        </div>
        <label className="flex items-center justify-between gap-3 min-h-[44px] cursor-pointer">
          <span className="text-sm font-bold text-slate-900">تفعيل</span>
          <input type="checkbox" className="w-5 h-5 accent-emerald-600" checked={cfg.llm_enabled} onChange={(e) => setCfg({ ...cfg, llm_enabled: e.target.checked })} />
        </label>
        {cfg.llm_enabled && (
          <>
            <Field label="عنوان الخدمة (OpenAI-compatible)" hint="لازم https. مثال: https://api.openai.com/v1">
              <input className={inputCls} dir="ltr" value={cfg.llm_base_url} onChange={(e) => setCfg({ ...cfg, llm_base_url: e.target.value.trim() })} />
            </Field>
            <Field label="اسم الموديل">
              <input className={inputCls} dir="ltr" value={cfg.llm_model} onChange={(e) => setCfg({ ...cfg, llm_model: e.target.value.trim() })} placeholder="مثال: gpt-4o-mini" />
            </Field>
            <Field label="مفتاح الـ API">
              <input className={inputCls} dir="ltr" autoComplete="off" value={llmKey} onChange={(e) => setLlmKey(e.target.value.trim())} />
            </Field>
            <Field label="معلومات المتجر للمساعد" hint="اكتب اللي المساعد يرد منه: الشحن، الاسترجاع، المنتجات، الدفع. هو مش هيرد بحاجة مش مكتوبة هنا.">
              <textarea className={inputCls + " py-3 leading-relaxed"} rows={6} maxLength={4000} value={cfg.llm_prompt} onChange={(e) => setCfg({ ...cfg, llm_prompt: e.target.value })} />
            </Field>
          </>
        )}
      </section>

      <Toast message={message} onClose={() => setMessage(null)} />

      <FloatingSave saving={saving} />
    </form>
  );
}
