"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, ShoppingBag, X } from "lucide-react";
import { useBrand } from "@/components/brand/BrandProvider";
import { DEFAULT_CHAT, matchFaq, type ChatFaq } from "@/lib/chat";
import { useLang } from "@/components/i18n/LangProvider";

/**
 * Floating chat bubble on the whole store (landing pages and the home). The merchant's Q&A is answered right
 * here with no request. Only a question with no ready answer goes to the server: an optional LLM first, then
 * the hand-off to the merchant's Telegram support bot (the merchant replies on WhatsApp).
 */
interface Msg {
  from: "bot" | "me";
  text: string;
  /** Offer the "order now" button under this message. */
  order?: boolean;
}

/** The product page tells the chat which product it is on, so the chat can answer that product's own Q&A. */
interface ProductCtx {
  name: string;
  faq: ChatFaq[];
}
let productCtx: ProductCtx | null = null;
const listeners = new Set<() => void>();
const setProductCtx = (c: ProductCtx | null) => {
  productCtx = c;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/** Rendered by the product page (renders nothing). */
export function ChatProduct({ name, faq }: ProductCtx) {
  useEffect(() => {
    setProductCtx({ name, faq });
    return () => setProductCtx(null);
  }, [name, JSON.stringify(faq)]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

const MAX_NUDGES = 4;
const CID_KEY = "store_chat_cid";

function getCid(): string {
  try {
    let v = localStorage.getItem(CID_KEY);
    if (!v || !/^[a-f0-9]{24,40}$/.test(v)) {
      v = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
      localStorage.setItem(CID_KEY, v);
    }
    return v;
  } catch {
    return "";
  }
}

export function StoreChat() {
  const brand = useBrand();
  const { t, lang, dir } = useLang();
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
  const product = useSyncExternalStore(subscribe, () => productCtx, () => null);
  const [nudge, setNudge] = useState<string | null>(null);
  const [live, setLive] = useState(false); // a conversation with the merchant is open: his replies come back here
  const lastId = useRef(0);
  const [unread, setUnread] = useState(false);
  // a live question the merchant has not answered yet: after the wait time the chat asks for a phone number
  const [waiting, setWaiting] = useState<{ text: string; since: number } | null>(null);
  const nudgesOff = useRef(false);
  const nudgeCount = useRef(0);
  const onProductPage = pathname.startsWith("/p/");
  const faqAll = [...(product?.faq || []), ...(chat?.faq || [])];

  // Proactive balloons while the chat is closed: now and then, a few times, until the visitor dismisses them.
  useEffect(() => {
    if (!chat || open || nudgesOff.current) return;
    const texts = chat.nudges.length
      ? chat.nudges
      : onProductPage
        ? [t("chat.nudge_p1"), t("chat.nudge_p2"), t("chat.nudge_p3")]
        : [t("chat.nudge_h1"), t("chat.nudge_h2")];
    const ms = Math.max(10, chat.nudge_seconds) * 1000;
    const timerId = setInterval(() => {
      if (nudgesOff.current) return;
      if (nudgeCount.current >= MAX_NUDGES) return clearInterval(timerId);
      setNudge(texts[nudgeCount.current % texts.length]);
      nudgeCount.current += 1;
    }, ms);
    return () => clearInterval(timerId);
  }, [chat, open, onProductPage]);

  useEffect(() => {
    if (open && msgs.length === 0 && chat) setMsgs([{ from: "bot", text: lang === "en" && chat.welcome === DEFAULT_CHAT.welcome ? "Hi! Pick a question or type your message and we will reply." : chat.welcome }]);
  }, [open, chat, msgs.length]);
  // Restore an earlier conversation, then poll for the merchant's replies (only while a conversation is open)
  useEffect(() => {
    if (!chat) return;
    let stop = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const cid = getCid();
    if (!cid) return;
    const tick = async (first: boolean) => {
      try {
        const r = await fetch(`/api/chat?cid=${cid}&after=${lastId.current}`, { cache: "no-store" });
        const j = await r.json();
        const lines: { id: number; who: "me" | "shop"; text: string }[] = j.lines || [];
        if (lines.length) {
          lastId.current = lines[lines.length - 1].id;
          setLive(true);
          if (first) setMsgs((m) => (m.length > 1 ? m : [{ from: "bot", text: chat.welcome }]));
          setMsgs((m) => {
            const mine = lines.filter((l) => !(l.who === "me" && m.some((x) => x.from === "me" && x.text === l.text)));
            return [...m, ...mine.map((l) => ({ from: (l.who === "me" ? "me" : "bot") as "me" | "bot", text: l.text }))];
          });
          if (lines.some((l) => l.who === "shop")) {
            setUnread(true);
            setWaiting(null);
          }
        } else if (first) {
          return; // no conversation: do not keep polling
        }
      } catch {
        /* try again next time */
      }
      if (!stop && (live || !first)) timer = setTimeout(() => tick(false), open ? 8000 : 45000);
    };
    if (live || open) tick(!live && lastId.current === 0);
    return () => {
      stop = true;
      if (timer) clearTimeout(timer);
    };
  }, [chat, open, live]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!waiting || !chat) return;
    const timerId = setTimeout(() => {
      setPending(waiting.text);
      setWaiting(null);
      setMsgs((m) => [...m, { from: "bot", text: t("chat.no_reply") }]);
    }, Math.max(60, chat.reply_wait_seconds) * 1000);
    return () => clearTimeout(timerId);
  }, [waiting, chat]);
  useEffect(() => {
    if (open) setUnread(false);
  }, [open]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs, pending, open]);

  if (!chat || pathname.includes("/thank-you")) return null;

  const bot = (text: string, order = false) => setMsgs((m) => [...m, { from: "bot", text, order }]);

  const orderNow = () => {
    setOpen(false);
    setNudge(null);
    document.getElementById("order-form-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;
    setInput("");
    setMsgs((m) => [...m, { from: "me", text }]);
    const hit = matchFaq(faqAll, text);
    if (hit) return bot(hit.answer, onProductPage);
    if (live) {
      try {
        const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, cid: getCid() }) });
        const j = await res.json();
        if (res.status === 429) return bot(j.error || t("chat.try_later"));
        if (!j.sent) bot(t("chat.send_fail"));
      } catch {
        bot(t("chat.send_fail"));
      }
      return;
    }
    // no ready answer: the server (LLM if connected), else straight to the hand-off form
    if (chat.ask_server) {
      setBusy(true);
      try {
        const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }) });
        const j = await res.json();
        if (j.reply && !j.need_contact) return bot(j.reply);
        if (res.status === 429) return bot(j.error || t("chat.try_later"));
      } catch {
        // fall through to the hand-off
      } finally {
        setBusy(false);
      }
    }
    // nothing answered it: ping the merchant live first; ask for a number only if nobody replies in time
    setBusy(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, cid: getCid(), live_start: true, page: window.location.pathname }) });
      const j = await res.json();
      if (res.status === 429) return bot(j.error || t("chat.try_later"));
      if (j.waiting) {
        setLive(true);
        setWaiting({ text, since: Date.now() });
        return bot(t("chat.sent_wait"));
      }
    } catch {
      // fall through to the phone form
    } finally {
      setBusy(false);
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
        body: JSON.stringify({ message: pending, name, phone, page: window.location.pathname, cid: getCid() }),
      });
      const j = await res.json();
      if (!res.ok) {
        setFormError(j.error || t("chat.fail_short"));
        return;
      }
      setPending(null);
      setShowWhatsapp(Boolean(j.whatsapp));
      if (j.live) setLive(true);
      bot(j.reply);
    } catch {
      setFormError(t("chat.fail_retry"));
    } finally {
      setBusy(false);
    }
  };

  const wa = (brand.support_whatsapp || "").replace(/[^\d]/g, "");
  // above the mobile sticky buy bar on landing pages
  const bottom = pathname.startsWith("/p/") ? "bottom-24 sm:bottom-6" : "bottom-5";

  return (
    <div className={`fixed ${bottom} left-4 z-50`} dir={dir}>
      {open && (
        <div role="dialog" aria-label={chat.title} className="mb-3 w-[min(92vw,22rem)] h-[min(70vh,30rem)] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-right">
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-slate-900 text-white">
            <span className="font-black text-sm">{chat.title}</span>
            <button type="button" onClick={() => setOpen(false)} aria-label={t("close")} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.from === "me" ? "justify-start" : "justify-end"} ${m.order ? "flex-col items-end" : ""}`}>
                <span className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-line ${m.from === "me" ? "bg-orange-600 text-white" : "bg-white border border-slate-200 text-slate-800"}`}>
                  {m.text}
                </span>
                {m.order && (
                  <button type="button" onClick={orderNow} className="mt-1 ms-2 min-h-[36px] px-3 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-black flex items-center gap-1 cursor-pointer self-end">
                    <ShoppingBag className="w-3.5 h-3.5" /> {t("chat.order_now")}
                  </button>
                )}
              </div>
            ))}
            {msgs.length <= 1 && (faqAll.length > 0 || onProductPage) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {onProductPage && (
                  <button type="button" onClick={orderNow} className="min-h-[40px] px-3 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-black cursor-pointer flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5" /> {t("chat.order_now")}
                  </button>
                )}
                {faqAll.slice(0, 6).map((f, i) => (
                  <button key={i} type="button" onClick={() => send(f.q)} className="min-h-[40px] px-3 rounded-full border border-orange-300 bg-white text-xs font-bold text-orange-700 hover:bg-orange-50 cursor-pointer">
                    {f.q}
                  </button>
                ))}
              </div>
            )}
            {pending && (
              <form onSubmit={submitContact} className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2">
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder={t("chat.name_ph")} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-orange-500" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" dir="ltr" placeholder={t("chat.phone_ph")} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-orange-500" />
                {formError && <p className="text-xs font-bold text-red-700">{formError}</p>}
                <button type="submit" disabled={busy} className="w-full min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-black cursor-pointer disabled:opacity-60">
                  {busy ? t("chat.sending") : t("chat.send_msg")}
                </button>
              </form>
            )}
            {showWhatsapp && wa && (
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="block text-center min-h-[44px] leading-[44px] rounded-xl bg-emerald-600 text-white text-sm font-black">
                {t("chat.whatsapp_us")}
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
            <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={300} placeholder={t("chat.input_ph")} disabled={busy} className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-orange-500" />
            <button type="submit" disabled={busy || !input.trim()} aria-label={t("chat.send")} className="w-11 h-11 rounded-xl bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center cursor-pointer disabled:opacity-50">
              <Send className="w-4 h-4 -scale-x-100" />
            </button>
          </form>
        </div>
      )}
      {!open && nudge && (
        <div className="absolute bottom-16 left-0 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 text-right" role="status">
          <button type="button" onClick={() => { nudgesOff.current = true; setNudge(null); }} aria-label={t("chat.hide")} className="absolute top-1 left-1 w-7 h-7 rounded-full text-slate-400 hover:bg-slate-100 flex items-center justify-center cursor-pointer">
            <X className="w-4 h-4" />
          </button>
          <p className="text-sm font-bold text-slate-800 leading-relaxed ps-0 pe-1 pl-6">{nudge}</p>
          <div className="flex gap-2 mt-2">
            {onProductPage && (
              <button type="button" onClick={orderNow} className="min-h-[36px] px-3 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-black cursor-pointer">{t("chat.order_now_short")}</button>
            )}
            <button type="button" onClick={() => { setNudge(null); setOpen(true); }} className="min-h-[36px] px-3 rounded-full border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer">{t("chat.ask")}</button>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => { setNudge(null); setOpen((v) => !v); }}
        aria-label={chat.title}
        aria-expanded={open}
        className="relative w-14 h-14 rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-600/30 flex items-center justify-center cursor-pointer"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && unread && <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 border-2 border-white" aria-label={t("chat.new_reply")} />}
      </button>
    </div>
  );
}
