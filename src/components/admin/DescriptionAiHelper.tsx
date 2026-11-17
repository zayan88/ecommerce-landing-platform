"use client";

import React, { useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Sparkles, Wand2 } from "lucide-react";
import { buildDescriptionPrompt, parseAiProduct, type AiProductContent } from "@/lib/ai-description";

interface Props {
  title: string;
  price?: number;
  brandName?: string;
  /** What is in the description box right now (used as the product notes inside the prompt). */
  notes: string;
  /** Called with everything the AI wrote: title (may be ""), description (may be ""), and the chat Q&A. */
  onApply: (content: AiProductContent) => void;
}

/** Copy / paste flow (same as the page editor's AI tab): copy the prompt, paste the answer. One answer fills the title, the description and the chat questions. */
export default function DescriptionAiHelper({ title, price, brandName, notes, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [pasted, setPasted] = useState("");
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const prompt = useMemo(() => buildDescriptionPrompt({ title, notes, price, brandName }), [title, notes, price, brandName]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setMsg(null);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setMsg({ ok: false, text: "تعذر النسخ تلقائياً. حدد البرومبت تحت وانسخه يدوياً." });
    }
  };

  const apply = () => {
    const parsed = parseAiProduct(pasted);
    if (parsed.description.length < 20 && !parsed.title && parsed.faq.length === 0) {
      setMsg({ ok: false, text: "الصق رد الذكاء الاصطناعي الأول (النص كامل)." });
      return;
    }
    onApply(parsed);
    setPasted("");
    const parts = [parsed.title ? "العنوان" : "", parsed.description ? "الوصف" : "", parsed.faq.length ? `${parsed.faq.length} سؤال وجواب للشات` : ""].filter(Boolean);
    setMsg({ ok: true, text: `اتملّى: ${parts.join(" + ")}. راجعهم وعدّل عليهم، وبعدين احفظ المنتج.` });
  };

  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-3 space-y-3">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="w-full flex items-center gap-2 text-right cursor-pointer">
        <Sparkles className="w-4 h-4 text-violet-600 shrink-0" />
        <span className="flex-1 text-sm font-black text-violet-900">اكتب العنوان والوصف وأسئلة الشات بالذكاء الاصطناعي</span>
        <span className="text-xs font-bold text-violet-700">{open ? "إخفاء" : "فتح"}</span>
      </button>

      {open && (
        <div className="space-y-3">
          <p className="text-xs text-violet-900 leading-relaxed">
            اكتب في خانة الوصف اللي فوق أي معلومات حقيقية عن المنتج (مواصفات، استخدام، مميزات) حتى لو مبعثرة، وبعدين:
          </p>

          <div className="space-y-2">
            <p className="text-sm font-black text-slate-900">١) انسخ البرومبت وافتح ChatGPT</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button type="button" onClick={copy} className="flex-1 min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-black flex items-center justify-center gap-2 cursor-pointer">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "تم النسخ" : "نسخ البرومبت"}
              </button>
              <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer" className="flex-1 min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-black flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" /> فتح ChatGPT
              </a>
            </div>
            <textarea readOnly value={prompt} rows={4} onFocus={(e) => e.currentTarget.select()} className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs leading-relaxed text-slate-600" dir="rtl" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-black text-slate-900">٢) الصق رد ChatGPT هنا</p>
            <textarea
              value={pasted}
              onChange={(e) => {
                setPasted(e.target.value);
                setMsg(null);
              }}
              rows={5}
              placeholder="الصق رد الذكاء الاصطناعي (العنوان والوصف والأسئلة)..."
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button type="button" onClick={apply} className="w-full min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-black flex items-center justify-center gap-2 cursor-pointer">
              <Wand2 className="w-4 h-4" /> املأ العنوان والوصف وأسئلة الشات
            </button>
          </div>

          {msg && <p className={`text-xs font-bold ${msg.ok ? "text-emerald-700" : "text-red-700"}`}>{msg.text}</p>}
        </div>
      )}
    </div>
  );
}
