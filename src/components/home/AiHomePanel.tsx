"use client";

import React, { useMemo, useState } from "react";
import { Check, Copy, Sparkles, Wand2 } from "lucide-react";
import { buildHomePrompt, parseHomeAi, type HomeAiLang } from "@/lib/ai-home";
import type { HomeContent } from "@/lib/home-content";

interface Props {
  brandName: string;
  productNames: string[];
  defaultLang: HomeAiLang;
  onApply: (content: Partial<HomeContent>) => void;
}

/** Step 1: copy a ready prompt. Step 2: paste the AI's JSON answer: it replaces the home page texts (undoable until saved). */
export default function AiHomePanel({ brandName, productNames, defaultLang, onApply }: Props) {
  const [about, setAbout] = useState("");
  const [lang, setLang] = useState<HomeAiLang>(defaultLang);
  const [pasted, setPasted] = useState("");
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const prompt = useMemo(() => buildHomePrompt({ brandName, about, productNames, lang }), [brandName, about, productNames, lang]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMsg({ ok: false, text: "تعذر النسخ تلقائياً، حدد النص وانسخه يدوياً." });
    }
  };

  const apply = () => {
    const r = parseHomeAi(pasted);
    if (r.error) {
      setMsg({ ok: false, text: r.error });
      return;
    }
    onApply(r.content);
    setMsg({ ok: true, text: `تم تطبيق ${r.applied.length} حقل على الصفحة. راجعها ثم اضغط حفظ (أو تراجع بـ Ctrl+Z).` });
    setPasted("");
  };

  const box = "w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-orange-500";

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-2xl bg-violet-50 border border-violet-200 text-violet-900 text-xs font-bold leading-relaxed">
        <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-violet-600" />
        <span>اكتب نصوص الصفحة الرئيسية بأي ذكاء اصطناعي: انسخ البرومبت، الصقه في ChatGPT أو Claude، ثم الصق الرد هنا.</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2.5">
        <p className="text-sm font-black text-slate-900">١) عن متجرك (اختياري لكن مهم)</p>
        <textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={4} maxLength={1500} placeholder="بتبيع إيه، لمين، إيه اللي مميزك. معلومات حقيقية بس." className={box} />
        <div className="flex gap-2" role="group" aria-label="لغة النصوص">
          {(["ar", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={lang === l}
              onClick={() => setLang(l)}
              className={`flex-1 min-h-[44px] rounded-xl text-sm font-bold cursor-pointer border ${lang === l ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"}`}
            >
              {l === "ar" ? "عربي" : "English"}
            </button>
          ))}
        </div>
        <button type="button" onClick={copy} className="w-full min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-black flex items-center justify-center gap-2 cursor-pointer">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "تم النسخ" : "نسخ البرومبت"}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2.5">
        <p className="text-sm font-black text-slate-900">٢) الصق رد الذكاء الاصطناعي</p>
        <textarea
          value={pasted}
          onChange={(e) => {
            setPasted(e.target.value);
            setMsg(null);
          }}
          rows={6}
          dir="ltr"
          placeholder='{ "hero_title": "..." }'
          className={`${box} font-mono text-xs`}
        />
        <button
          type="button"
          onClick={apply}
          disabled={!pasted.trim()}
          className="w-full min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Wand2 className="w-4 h-4" />
          تطبيق على الصفحة
        </button>
        {msg && (
          <p role="status" className={`text-xs font-bold leading-relaxed p-2.5 rounded-xl border ${msg.ok ? "bg-emerald-50 text-emerald-900 border-emerald-200" : "bg-rose-50 text-rose-900 border-rose-200"}`}>
            {msg.text}
          </p>
        )}
        <p className="text-[11px] text-slate-500 leading-relaxed">بنقبل نصوص فقط (بدون HTML أو صور). النصوص اللي الذكاء الاصطناعي كتبها بتستبدل النصوص الحالية للأقسام اللي كتبها، والباقي بيفضل زي ما هو. راجعها قبل الحفظ.</p>
      </div>
    </div>
  );
}
