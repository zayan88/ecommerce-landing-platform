"use client";

import React, { useMemo, useState } from "react";
import { Copy, Check, Sparkles, Wand2 } from "lucide-react";
import type { LandingPageContentConfig } from "@/types";
import { buildAiPrompt, parseAiContent } from "@/lib/ai-landing";

interface Props {
  title: string;
  brandName: string;
  onApply: (content: LandingPageContentConfig) => void;
}

/** Step 1: copy a ready prompt. Step 2: paste the AI's JSON answer → applied to the live draft (undoable). */
export default function AiPanel({ title, brandName, onApply }: Props) {
  const [description, setDescription] = useState("");
  const [pasted, setPasted] = useState("");
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const prompt = useMemo(() => buildAiPrompt({ title, description, brandName }), [title, description, brandName]);

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
    const r = parseAiContent(pasted);
    if (r.error) {
      setMsg({ ok: false, text: r.error });
      return;
    }
    onApply(r.content);
    setMsg({ ok: true, text: `تم تطبيق ${r.applied.length} حقل على الصفحة. راجعها ثم اضغط حفظ (أو تراجع).` });
    setPasted("");
  };

  const box = "w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-orange-500";

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-2xl bg-violet-50 border border-violet-200 text-violet-900 text-xs font-bold leading-relaxed">
        <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-violet-600" />
        <span>اكتب محتوى الصفحة بأي ذكاء اصطناعي: انسخ البرومبت، الصقه في ChatGPT أو Claude، ثم الصق الرد هنا.</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2.5">
        <p className="text-sm font-black text-slate-900">١) وصف المنتج (اختياري لكن مهم)</p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={1500}
          placeholder="المواصفات الحقيقية، الاستخدام، السعر، أي معلومة تريد الاعتماد عليها"
          className={box}
        />
        <button
          type="button"
          onClick={copy}
          className="w-full min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-black flex items-center justify-center gap-2 cursor-pointer"
        >
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
          placeholder='{ "hero_headline": "..." }'
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
          <p
            role="status"
            className={`text-xs font-bold leading-relaxed p-2.5 rounded-xl border ${
              msg.ok ? "bg-emerald-50 text-emerald-900 border-emerald-200" : "bg-rose-50 text-rose-900 border-rose-200"
            }`}
          >
            {msg.text}
          </p>
        )}
        <p className="text-[11px] text-slate-500 leading-relaxed">
          بنقبل حقول النص فقط (بدون HTML أو صور). التقييمات وأسماء العملاء مش بتتولد عشان متكونش مخترعة.
        </p>
      </div>
    </div>
  );
}
