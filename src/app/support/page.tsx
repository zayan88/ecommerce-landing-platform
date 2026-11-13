"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bot,
  User,
  Send,
  Sparkles,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Phone,
  HelpCircle,
  Package,
  RefreshCw,
} from "lucide-react";

interface ProductCardData {
  id: string;
  title_ar: string;
  slug: string;
  base_price: number;
  compare_at_price?: number;
  image: string;
  discount_label?: string;
  offer_text?: string;
}

interface OrderInfoData {
  order_number: string;
  customer_name: string;
  status: string;
  final_amount: number;
  created_at: string;
  governorate: string;
}

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
  product?: ProductCardData;
  orderInfo?: OrderInfoData;
  quickReplies?: string[];
}

export default function CustomerSupportPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text: "أهلاً بك في متجر RexRack! 🇪🇬\n\nأنا مساعدك الذكي لخدمة العملاء. أنا هنا لمساعدتك على مدار الساعة في أي استفسار بخصوص منتجاتنا الذكية، الأسعار، العروض الحالية، تفاصيل الشحن لجميع المحافظات، أو تتبع طلبك برقم الهاتف.",
      time: "الآن",
      quickReplies: [
        "💨 تفاصيل وسعر جهاز استنشاق البخار النيبولايزر",
        "💆‍♂️ مواصفات جهاز مساج وتدليك الجسم 5×1",
        "🚚 مدة الشحن وهل يوجد فحص قبل الدفع؟",
        "📦 تتبع حالة طلبي برقم الهاتف",
        "🔄 سياسة الضمان والاسترجاع 14 يوم",
      ],
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const userMsgId = "user-" + Date.now();
    const currentTime = new Date().toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newMsg: Message = {
      id: userMsgId,
      sender: "user",
      text: trimmed,
      time: currentTime,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: messages.map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const botMsg: Message = {
          id: "bot-" + Date.now(),
          sender: "bot",
          text: data.reply || "تحت أمرك يا فندم، هل لديك أي استفسار آخر؟",
          time: new Date().toLocaleTimeString("ar-EG", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          product: data.product,
          orderInfo: data.orderInfo,
          quickReplies: data.quickReplies,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: "bot-err-" + Date.now(),
            sender: "bot",
            text: data.error || "عذراً، حدث خطأ مؤقت. برجاء إعادة المحاولة.",
            time: currentTime,
            quickReplies: ["تصفح المنتجات والعروض", "تواصل مع موظف واتساب"],
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: "bot-err-" + Date.now(),
          sender: "bot",
          text: "تعذر الاتصال بالسيرفر، برجاء التحقق من اتصال الإنترنت أو التواصل معنا عبر واتساب مباشرة.",
          time: currentTime,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col" dir="rtl">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Logo & Assistant Identity */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-950 to-indigo-900 text-white font-black text-xl flex items-center justify-center shadow-md">
                R
              </div>
            </Link>
            <div className="border-r border-gray-300 pr-3">
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-slate-900">
                  خدمة عملاء RexRack الذكية
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  متصل 24/7
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">
                رد فوري بالذكاء الاصطناعي على كافة استفسارات المتجر والشحن
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3.5 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition"
            >
              <ShoppingBag className="w-4 h-4 text-orange-600" />
              <span>العودة للمتجر</span>
            </Link>
            <a
              href="https://wa.me/201000000000?text=مرحباً،%20أحتاج%20مساعدة%20من%20خدمة%20العملاء"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden md:inline">خدمة واتساب</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Body Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full flex flex-col lg:flex-row gap-6">
        {/* Left / Desktop Information Sidebar */}
        <aside className="w-full lg:w-80 shrink-0 space-y-4 order-2 lg:order-1">
          {/* Trust Box */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs space-y-4">
            <h3 className="font-black text-gray-950 text-sm font-heading flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>سياسات وضمانات التسوق</span>
            </h3>

            <ul className="space-y-3 text-xs text-gray-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>معاينة وفحص الطرد:</strong> يحق لك فتح الشحنة والتأكد منها بحضور المندوب قبل دفع أي جنيه.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>دفع عند الاستلام (COD):</strong> الدفع كاش عند باب بيتك فقط بعد استلام شحنتك.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>ضمان 14 يوماً:</strong> استبدال مجاني فوري أو استرجاع كامل المبلغ عند وجود أي عيب صناعة.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  <strong>توصيل سريع:</strong> من 5 إلى 7 أيام لجميع محافظات مصر الـ 27.
                </span>
              </li>
            </ul>
          </div>

          {/* Quick FAQ Pills Box */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-5 shadow-lg space-y-3">
            <div className="flex items-center gap-2 text-orange-400 font-bold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>مساعد ذكي مدرب</span>
            </div>
            <h4 className="font-extrabold text-sm">
              اسأل المساعد عن أي تفاصيل:
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              المساعد يعرف بدقة مواصفات جميع الأجهزة، الخصومات المتاحة، عروض التوفير، ويستطيع البحث عن حالة طلبك بمجرد كتابة رقم هاتفك!
            </p>
          </div>

          {/* Emergency Human Contact */}
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/80 text-xs text-amber-900 space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-amber-700" />
              <span>تفضل التحدث مع موظف بشري؟</span>
            </div>
            <p className="text-amber-800 leading-normal">
              إذا لم يلبِ المساعد رغبتك بالكامل، يمكنك مراسلتنا مباشرة على واتساب لنقوم بتحويلك لموظف خدمة العملاء.
            </p>
            <a
              href="https://wa.me/201000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-black text-amber-950 underline hover:text-orange-700 pt-1"
            >
              فتح محادثة واتساب الآن ←
            </a>
          </div>
        </aside>

        {/* Center / Chat Window */}
        <div className="flex-1 bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col h-[75vh] md:h-[82vh] overflow-hidden order-1 lg:order-2">
          {/* Chat Sub-header */}
          <div className="px-5 py-3.5 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900">
                  محادثة تفاعلية مع المساعد الذكي
                </h2>
                <span className="text-[11px] text-gray-500">
                  يعمل بنماذج الذكاء الاصطناعي الفائقة ومربوط بنظام المتجر
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setMessages([
                  {
                    id: "reset-" + Date.now(),
                    sender: "bot",
                    text: "تم بدء محادثة جديدة! كيف يمكنني مساعدتك الآن في متجر RexRack؟",
                    time: "الآن",
                    quickReplies: [
                      "💨 جهاز استنشاق البخار",
                      "💆‍♂️ جهاز تدليك الجسم",
                      "🚚 مدة الشحن والمعاينة",
                      "📦 تتبع طلبي",
                    ],
                  },
                ]);
              }}
              title="إعادة بدء المحادثة"
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-200/70 transition text-xs flex items-center gap-1 font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">محادثة جديدة</span>
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.map((m) => {
              const isUser = m.sender === "user";

              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-3 ${
                    isUser ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-xs ${
                      isUser
                        ? "bg-slate-900"
                        : "bg-gradient-to-tr from-orange-500 to-amber-500"
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble + Extras */}
                  <div
                    className={`max-w-[85%] md:max-w-[75%] space-y-2.5 ${
                      isUser ? "items-end" : "items-start"
                    }`}
                  >
                    {/* Text Bubble */}
                    <div
                      className={`p-4 rounded-3xl text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                        isUser
                          ? "bg-slate-900 text-white rounded-tr-xs"
                          : "bg-slate-100 text-slate-800 rounded-tl-xs border border-slate-200/80"
                      }`}
                    >
                      {m.text}
                    </div>

                    {/* Rich Product Preview Card (if attached) */}
                    {m.product && (
                      <div className="bg-white border-2 border-orange-200 rounded-2xl p-3.5 shadow-sm max-w-sm space-y-3">
                        <div className="flex items-center gap-3">
                          {m.product.image && (
                            <img
                              src={m.product.image}
                              alt={m.product.title_ar}
                              className="w-16 h-16 object-cover rounded-xl border border-gray-100 bg-gray-50 shrink-0"
                            />
                          )}
                          <div className="space-y-1">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 text-[10px] font-black">
                              {m.product.offer_text || "عرض خاص"}
                            </span>
                            <h4 className="font-extrabold text-xs text-gray-900 line-clamp-2">
                              {m.product.title_ar}
                            </h4>
                            <div className="flex items-baseline gap-2">
                              <span className="font-black text-sm text-orange-600">
                                {m.product.base_price} ج.م
                              </span>
                              {m.product.compare_at_price && (
                                <span className="text-[11px] text-gray-400 line-through">
                                  {m.product.compare_at_price} ج.م
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Link
                          href={`/p/${m.product.slug}`}
                          className="w-full py-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>اطلب المنتج الآن واغتنم العرض</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}

                    {/* Order Information Card (if tracking found) */}
                    {m.orderInfo && (
                      <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-xs space-y-2 max-w-sm">
                        <div className="flex items-center justify-between font-black text-emerald-950 pb-2 border-b border-emerald-200">
                          <span className="flex items-center gap-1">
                            <Package className="w-4 h-4 text-emerald-700" />
                            <span>طلب رقم: {m.orderInfo.order_number}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px]">
                            {m.orderInfo.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-emerald-900">
                          <div>
                            <span className="text-gray-500 block">اسم العميل:</span>
                            <span className="font-bold">{m.orderInfo.customer_name}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">المحافظة:</span>
                            <span className="font-bold">{m.orderInfo.governorate}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500 block">المبلغ المطلوب عند الاستلام:</span>
                            <span className="font-black text-sm text-emerald-800">
                              {m.orderInfo.final_amount} ج.م
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick Reply Pills */}
                    {m.quickReplies && m.quickReplies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {m.quickReplies.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => sendMessage(q)}
                            className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-white hover:bg-orange-50 text-gray-700 hover:text-orange-700 border border-gray-200 hover:border-orange-300 transition shadow-2xs"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div
                      className={`text-[10px] text-gray-400 px-1 ${
                        isUser ? "text-left" : "text-right"
                      }`}
                    >
                      {m.time}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing / Loading Indicator */}
            {loading && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center text-xs shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-100 border border-slate-200 p-3.5 rounded-2xl rounded-tl-xs flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="mr-2">جاري الرد...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 md:p-4 bg-slate-50 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب استفسارك هنا (مثال: مواصفات النيبولايزر، تتبع طلبي 010...)"
                disabled={loading}
                className="flex-1 bg-white border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-2xl px-4 py-3 text-sm outline-none transition disabled:bg-gray-100"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="p-3 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold transition shadow-md shadow-orange-500/20 shrink-0 flex items-center justify-center active:scale-95"
                title="إرسال"
              >
                <Send className="w-5 h-5 rtl:rotate-180" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2 px-1">
              <span>💡 يمكنك كتابة رقم هاتفك لتتبع طلبك مباشرة</span>
              <span>🔒 محادثة آمنة ومباشرة</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
