"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, X } from "lucide-react";
import { useBrand } from "@/components/brand/BrandProvider";
import { matchFaq } from "@/lib/chat";

/**
 * Floating chat bubble on the whole store (landing pages and the home). The merchant's Q&A is answered right
 * here with no request. Only a question with no ready answer goes to the server: an optional LLM first, then
 * the hand-off to the merchant's Telegram support bot (the merchant replies on WhatsApp).
 */
interface Msg {
  from: "bot" | "me";
  text: string;
}

export function StoreChat() {
  const brand = useBrand();
  const chat = brand.chat;
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<string | null>(null); // the question waiting for a phone number
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [showWhatsapp, setShowWhatsapp] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && msgs.length === 0 && chat) setMsgs([{ from: "bot", text: chat.welcome }]);
  }, [open, chat, msgs.length]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs, pending, open]);

  if (!chat || pathname.includes("/thank-you")) return null;

  const bot = (text: string) => setMsgs((m) => [...m, { from: "bot", text }]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;
    setInput("");
    setMsgs((m) => [...m, { from: "me", text }]);
    const hit = matchFaq(chat.faq, text);
    if (hit) return bot(hit.answer);
    // no ready answer: the server (LLM if connected), else straight to the hand-off form
    if (chat.ask_server) {
      setBusy(true);
      try {
        const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }) });
        const j = await res.json();
        if (j.reply && !j.need_contact) return bot(j.reply);
        if (res.status === 429) return bot(j.error || "جرّب بعد شوية");
      } catch {
        // fall through to the hand-off
      } finally {
        setBusy(false);
      }
    }
    setPending(text);
    bot(chat.fallback);
  };

  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pending || busy) return;
    setFormError("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: pending, name, phone, page: window.location.pathname }),
      });
      const j = await res.json();
      if (!res.ok) {
        setFormError(j.error || "تعذر الإرسال");
        return;
      }
      setPending(null);
      setShowWhatsapp(Boolean(j.whatsapp));
      bot(j.reply);
    } catch {
      setFormError("تعذر الإرسال، جرّب تاني");
    } finally {
      setBusy(false);
    }
  };

  const wa = (brand.support_whatsapp || "").replace(/[^\d]/g, "");
  // above the mobile sticky buy bar on landing pages
  const bottom = pathname.startsWith("/p/") ? "bottom-24 sm:bottom-6" : "bottom-5";

  return (
    <div className={`fixed ${bottom} left-4 z-50`} dir="rtl">
      {open && (
        <div role="dialog" aria-label={chat.title} className="mb-3 w-[min(92vw,22rem)] h-[min(70vh,30rem)] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-right">
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-slate-900 text-white">
            <span className="font-black text-sm">{chat.title}</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="إغلاق" className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.from === "me" ? "justify-start" : "justify-end"}`}>
                <span className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-line ${m.from === "me" ? "bg-orange-600 text-white" : "bg-white border border-slate-200 text-slate-800"}`}>
                  {m.text}
                </span>
              </div>
            ))}
            {msgs.length <= 1 && chat.faq.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {chat.faq.slice(0, 5).map((f, i) => (
                  <button key={i} type="button" onClick={() => send(f.q)} className="min-h-[40px] px-3 rounded-full border border-orange-300 bg-white text-xs font-bold text-orange-700 hover:bg-orange-50 cursor-pointer">
                    {f.q}
                  </button>
                ))}
              </div>
            )}
            {pending && (
              <form onSubmit={submitContact} className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2">
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="اسمك" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-orange-500" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" dir="ltr" placeholder="رقم الواتساب 01xxxxxxxxx" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-orange-500" />
                {formError && <p className="text-xs font-bold text-rose-700">{formError}</p>}
                <button type="submit" disabled={busy} className="w-full min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-black cursor-pointer disabled:opacity-60">
                  {busy ? "جاري الإرسال..." : "ابعت رسالتي"}
                </button>
              </form>
            )}
            {showWhatsapp && wa && (
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="block text-center min-h-[44px] leading-[44px] rounded-xl bg-emerald-600 text-white text-sm font-black">
                كلمنا على واتساب
              </a>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2 p-2.5 border-t border-slate-200 bg-white"
          >
            <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={300} placeholder="اكتب رسالتك..." disabled={busy} className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-orange-500" />
            <button type="submit" disabled={busy || !input.trim()} aria-label="إرسال" className="w-11 h-11 rounded-xl bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center cursor-pointer disabled:opacity-50">
              <Send className="w-4 h-4 -scale-x-100" />
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={chat.title}
        aria-expanded={open}
        className="w-14 h-14 rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-600/30 flex items-center justify-center cursor-pointer"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
