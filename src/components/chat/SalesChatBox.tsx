"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  Send,
  Sparkles,
  Bot,
  User,
  ShoppingBag,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Volume2,
  VolumeX,
  PhoneCall,
  Check,
  ChevronLeft,
  X,
  Flame,
  Star,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { EGYPTIAN_GOVERNORATES } from "@/lib/constants/governorates";
import { Product } from "@/types";

interface ChatMessage {
  id: string;
  role: "assistant" | "user" | "system";
  content: string;
  timestamp: string;
  product?: {
    id: string;
    title_ar: string;
    slug: string;
    base_price: number;
    compare_at_price?: number;
    image: string;
    offer_text?: string;
  };
  orderInfo?: {
    order_number: string;
    customer_name: string;
    status: string;
    final_amount: number;
    created_at: string;
    governorate: string;
  };
  showOrderFormForProduct?: any;
  quickReplies?: string[];
}

interface SalesChatBoxProps {
  initialProducts?: Product[];
  currentProductSlug?: string;
  onOrderSuccess?: (order: any) => void;
  isFloating?: boolean;
  onClose?: () => void;
  className?: string;
}

const SOCIAL_PROOF_NUDGES = [
  "🛒 طلب أحمد من المنصورة (عرض قطعتين + شحن مجاني) منذ 3 دقائق",
  "🚚 عميل من الإسكندرية استلم طلبه وقام بالمعاينة مع المندوب بنجاح",
  "⭐ تقييم 5 نجوم جديد: 'الجهاز ممتاز والمعاينة قبل الدفع أمان كبير'",
  "🔥 باقي 3 قطع فقط بسعر العرض المخفض والشحن المجاني لليوم",
  "📦 تم شحن 14 طلب جديد إلى الجيزة والقاهرة منذ قليل",
];

export function SalesChatBox({
  initialProducts = [],
  currentProductSlug,
  onOrderSuccess,
  isFloating = false,
  onClose,
  className = "",
}: SalesChatBoxProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [socialNudge, setSocialNudge] = useState<string | null>(null);

  // In-Chat Checkout State
  const [orderModalProduct, setOrderModalProduct] = useState<Product | null>(null);
  const [selectedOfferIndex, setSelectedOfferIndex] = useState(1); // Default to 2-pieces offer
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [governorate, setGovernorate] = useState("القاهرة");
  const [address, setAddress] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Web Audio sound synthesizer for delicate pleasant notification sound
  const playChime = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio not permitted without user interaction
    }
  };

  // Fetch products if not passed
  useEffect(() => {
    if (products.length === 0) {
      fetch("/api/products")
        .then((r) => r.json())
        .then((data) => {
          const prods = Array.isArray(data) ? data : data.products;
          if (Array.isArray(prods)) {
            setProducts(prods.filter((p: any) => p.status === "active"));
          }
        })
        .catch(() => {});
    }
  }, []);

  // Proactive Initial Welcoming Sequence
  useEffect(() => {
    const timeNow = new Date().toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const initialWelcomeList: ChatMessage[] = [
      {
        id: "msg-1",
        role: "assistant",
        content: "أهلاً بحضرتك يا فندم في **RexRack**! 🌸 أنا مستشارك البيعي الذكي، وسعيد جداً بوجودك معانا.",
        timestamp: timeNow,
      },
      {
        id: "msg-2",
        role: "assistant",
        content:
          "عروض اليوم التوفيرية:\n✅ **معاينة وفحص الشحنة بالكامل مع المندوب قبل ما تدفع مليم واحد!**\n✅ **الدفع عند الاستلام 100% (COD)**\n✅ **شحن مجاني** لجميع محافظات مصر على العروض المزدوجة 🚚",
        timestamp: timeNow,
      },
      {
        id: "msg-3",
        role: "assistant",
        content:
          "تحب أرشحلك أفضل المنتجات الأكثر طلباً في مصر، ولا بتدور على منتج محدد لعائلتك؟ اختار من الأزرار السريعة تحت أو اسألني في أي حاجة براحتك! 👇",
        timestamp: timeNow,
        quickReplies: [
          "💨 عرض جهاز استنشاق البخار (خصم 45%)",
          "💆‍♂️ جهاز تدليك الجسم وتسكين الآلام",
          "🚗 منظم مقعد السيارة الفاخر",
          "🚚 إزاي أعاين الأوردر قبل الدفع؟",
          "📦 تتبع طلبي برقم التليفون",
        ],
      },
    ];

    setMessages(initialWelcomeList);
  }, []);

  // Social Proof Nudge rotation every 14 seconds
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setSocialNudge(SOCIAL_PROOF_NUDGES[index % SOCIAL_PROOF_NUDGES.length]);
      index++;
    }, 14000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom smoothly on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, orderModalProduct]);

  // Send Message Handler
  const handleSendMessage = async (textToSend?: string) => {
    const userText = (textToSend || input).trim();
    if (!userText || isTyping) return;

    setInput("");
    const timeNow = new Date().toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: userText,
      timestamp: timeNow,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: historyPayload,
        }),
      });

      if (!res.ok) throw new Error("تعذر الرد حالياً");

      const data = await res.json();
      playChime();

      // Check if response matches one of our active products to enrich the card
      let matchedFullProduct: Product | undefined;
      if (data.product) {
        matchedFullProduct = products.find(
          (p) => p.id === data.product.id || p.slug === data.product.slug
        );
      } else {
        matchedFullProduct = products.find(
          (p) =>
            userText.toLowerCase().includes(p.slug) ||
            userText.includes(p.title_ar.slice(0, 8))
        );
      }

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.reply || "أهلاً بك! أنا تحت أمرك في أي استفسار.",
        timestamp: new Date().toLocaleTimeString("ar-EG", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        product: matchedFullProduct
          ? {
              id: matchedFullProduct.id,
              title_ar: matchedFullProduct.title_ar,
              slug: matchedFullProduct.slug,
              base_price: matchedFullProduct.base_price,
              compare_at_price: matchedFullProduct.compare_at_price,
              image: matchedFullProduct.images[0] || "",
              offer_text: "شحن مجاني عند طلب قطعتين",
            }
          : data.product,
        orderInfo: data.orderInfo,
        quickReplies: data.quickReplies || [
          "💨 تفاصيل جهاز استنشاق البخار",
          "💆‍♂️ عروض جهاز تدليك الجسم",
          "🚚 مدة الشحن والتوصيل",
        ],
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: "assistant",
          content:
            "أهلاً بحضرتك يا فندم! أنا معاك وسامعك كويس. نقدر نساعدك في أي تفاصيل عن أسعار منتجات RexRack وعروض الشحن المجاني والمعاينة قبل الدفع. اسألني في أي وقت وهجاوبك فوراً!",
          timestamp: new Date().toLocaleTimeString("ar-EG", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          quickReplies: [
            "💨 عروض جهاز استنشاق البخار",
            "💆‍♂️ عروض جهاز المساج",
            "التحدث مع المبيعات على واتساب",
          ],
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Open In-Chat Order Form
  const handleOpenOrderForm = (productSlugOrId: string) => {
    const found = products.find(
      (p) => p.id === productSlugOrId || p.slug === productSlugOrId
    );
    if (found) {
      setOrderModalProduct(found);
      setSelectedOfferIndex(found.offers && found.offers.length > 1 ? 1 : 0);
      setOrderError("");
    }
  };

  // Submit In-Chat Order
  const handleSubmitInChatOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderModalProduct) return;

    if (!customerName.trim()) {
      setOrderError("من فضلك اكتب الاسم بالكامل");
      return;
    }

    const cleanedPhone = customerPhone.trim().replace(/\s+/g, "");
    if (!/^01[0125][0-9]{8}$/.test(cleanedPhone)) {
      setOrderError("يرجى كتابة رقم هاتف مصري صحيح (11 رقم يبدأ بـ 010 أو 011 أو 012 أو 015)");
      return;
    }

    if (!address.trim() || address.trim().length < 3) {
      setOrderError("من فضلك اكتب العنوان بالتفصيل (الشارع / المنطقة / رقم المنزل)");
      return;
    }

    setIsSubmittingOrder(true);
    setOrderError("");

    try {
      const selectedOffer =
        orderModalProduct.offers && orderModalProduct.offers[selectedOfferIndex]
          ? orderModalProduct.offers[selectedOfferIndex]
          : null;

      const orderPayload = {
        product_id: orderModalProduct.id,
        landing_page_slug: orderModalProduct.slug,
        customer_name: customerName.trim(),
        customer_phone: cleanedPhone,
        governorate,
        address: address.trim(),
        quantity: selectedOffer ? selectedOffer.quantity : 1,
        offer_id: selectedOffer ? selectedOffer.id : undefined,
        notes: "تم الطلب عبر شات المبيعات التفاعلي RexRack AI Closer",
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "تعذر إتمام الطلب، حاول مرة أخرى");
      }

      // Fire celebratory confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#f97316", "#10b981", "#3b82f6", "#f59e0b"],
        });
      } catch {}

      // Add success message directly into chat stream
      const orderNumber = result.order?.order_number || result.order?.id || "ORD-" + Math.floor(100000 + Math.random() * 900000);
      const totalAmount = result.order?.final_amount || (selectedOffer ? selectedOffer.price : orderModalProduct.base_price);

      const successChatMessage: ChatMessage = {
        id: `order-succ-${Date.now()}`,
        role: "assistant",
        content: `🎉 **ألف مبروك يا فندم! تم تأكيد طلبك بنجاح!**\n\n📌 **رقم الطلب:** \`${orderNumber}\`\n📌 **المنتج:** ${orderModalProduct.title_ar}\n📌 **المبلغ الإجمالي عند الاستلام:** **${totalAmount} ج.م** (شحن مجاني)\n📌 **العنوان المسجل:** ${address} - ${governorate}\n\n🚚 **تذكير بالأمان والراحة:** مندوب الشحن هيتواصل مع حضرتك قبل الوصول خلال 5 إلى 7 أيام عمل، وتقدر تفتح الكرتونة وتفحص المنتج بنفسك قبل دفع مليم واحد. شكراً لثقتك في RexRack! ❤️`,
        timestamp: new Date().toLocaleTimeString("ar-EG", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        orderInfo: {
          order_number: orderNumber,
          customer_name: customerName,
          status: "تم تأكيد طلبك وجاري التجهيز",
          final_amount: totalAmount,
          created_at: new Date().toISOString(),
          governorate,
        },
        quickReplies: [
          "📦 تتبع هذا الطلب",
          "التواصل مع خدمة العملاء على واتساب",
          "تصفح عروض أخرى",
        ],
      };

      setMessages((prev) => [...prev, successChatMessage]);
      setOrderModalProduct(null);
      setCustomerName("");
      setCustomerPhone("");
      setAddress("");

      if (onOrderSuccess) onOrderSuccess(result.order);
    } catch (err: any) {
      setOrderError(err.message || "حدث خطأ أثناء حفظ الطلب، يرجى المحاولة ثانية");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div
      className={`flex flex-col bg-slate-950 text-slate-100 rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden font-sans ${className}`}
      dir="rtl"
    >
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/80 p-4 border-b border-slate-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-orange-500/20">
              <Bot className="w-6 h-6 text-slate-950" />
            </div>
            <span className="absolute -bottom-1 -left-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-black text-sm md:text-base text-white tracking-wide">
                المستشار البيعي الذكي | RexRack
              </h3>
              <span className="bg-orange-500/20 text-orange-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-orange-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Sales Closer
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> نشط للرد الفوري
              </span>
              <span>•</span>
              <span>معاينة وفحص قبل الدفع 🇪🇬</span>
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "كتم الصوت" : "تشغيل الصوت"}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition text-xs"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {isFloating && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Trust Highlights Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800/60 px-4 py-2 flex items-center justify-between text-[11px] font-bold text-slate-300 overflow-x-auto gap-4 no-scrollbar">
        <span className="flex items-center gap-1.5 text-amber-300 flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          افحص المنتج بنفسك قبل ما تدفع
        </span>
        <span className="flex items-center gap-1.5 text-emerald-300 flex-shrink-0">
          <Truck className="w-4 h-4 text-emerald-400" />
          الدفع عند الاستلام + شحن مجاني للقطعتين
        </span>
        <span className="flex items-center gap-1.5 text-blue-300 flex-shrink-0">
          <Clock className="w-4 h-4 text-blue-400" />
          استبدال واسترجاع مجاني 14 يوم
        </span>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 min-h-[380px] max-h-[580px] bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/60">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === "user" ? "items-start" : "items-end"
            } animate-in fade-in-50 duration-200`}
          >
            <div
              className={`flex items-start gap-2.5 max-w-[90%] md:max-w-[80%] ${
                msg.role === "user" ? "flex-row" : "flex-row-reverse"
              }`}
            >
              {/* Message Bubble */}
              <div
                className={`p-4 rounded-3xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold rounded-tl-sm shadow-lg shadow-orange-500/20"
                    : "bg-slate-900 text-slate-100 rounded-tr-sm border border-slate-800 shadow-md"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Rich Product Card inside Chat Stream */}
                {msg.product && (
                  <div className="mt-4 bg-slate-950/90 rounded-2xl border border-slate-800 p-3 flex flex-col gap-3 overflow-hidden text-right">
                    <div className="flex gap-3 items-center">
                      <div className="w-16 h-16 rounded-xl bg-slate-900 overflow-hidden flex-shrink-0 border border-slate-800">
                        <img
                          src={msg.product.image}
                          alt={msg.product.title_ar}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-extrabold mb-1">
                          وفر {msg.product.compare_at_price ? msg.product.compare_at_price - msg.product.base_price : 250} ج.م
                        </span>
                        <h4 className="font-heading font-black text-xs text-white truncate">
                          {msg.product.title_ar}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-black text-orange-400">
                            {msg.product.base_price} ج.م
                          </span>
                          {msg.product.compare_at_price && (
                            <span className="text-xs text-slate-500 line-through">
                              {msg.product.compare_at_price} ج.م
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons inside card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => handleOpenOrderForm(msg.product?.id || msg.product?.slug || "")}
                        className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/25 transition active:scale-95"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>اطلب الآن بالدفع عند الاستلام</span>
                      </button>

                      <Link
                        href={`/p/${msg.product.slug}`}
                        className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        <span>صفحة المنتج والتفاصيل</span>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Order Information Status Card */}
                {msg.orderInfo && (
                  <div className="mt-3 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-3.5 text-xs text-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between text-emerald-400 font-black">
                      <span>طلب مسجل</span>
                      <span>#{msg.orderInfo.order_number}</span>
                    </div>
                    <p className="text-slate-300">
                      العميل: <strong className="text-white">{msg.orderInfo.customer_name}</strong> ({msg.orderInfo.governorate})
                    </p>
                    <p className="text-slate-300">
                      الحالة: <span className="text-emerald-300 font-bold">{msg.orderInfo.status}</span>
                    </p>
                    <p className="text-slate-300">
                      المبلغ عند الاستلام: <strong className="text-orange-400">{msg.orderInfo.final_amount} ج.م</strong>
                    </p>
                  </div>
                )}

                <span className="block text-[10px] text-slate-400 mt-2 text-left opacity-70">
                  {msg.timestamp}
                </span>
              </div>
            </div>

            {/* Quick Replies Buttons below assistant messages */}
            {msg.role === "assistant" && msg.quickReplies && msg.quickReplies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[90%] justify-end">
                {msg.quickReplies.map((qr, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(qr)}
                    className="text-[11px] font-bold py-1.5 px-3 rounded-xl bg-slate-900/90 hover:bg-orange-500/20 text-slate-300 hover:text-orange-300 border border-slate-800 hover:border-orange-500/40 transition active:scale-95 text-right flex items-center gap-1"
                  >
                    <span>{qr}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* In-Chat COD Order Form Modal Drawer */}
        {orderModalProduct && (
          <div className="bg-slate-900 border-2 border-orange-500/60 rounded-3xl p-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-heading font-black text-sm text-white">
                    طلب سريع بالدفع عند الاستلام
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                    {orderModalProduct.title_ar}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOrderModalProduct(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Offer Selector Inside Chat */}
            {orderModalProduct.offers && orderModalProduct.offers.length > 0 && (
              <div className="space-y-2 mb-4">
                <label className="text-xs font-bold text-slate-300 block">
                  اختر العرض المناسب لك:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {orderModalProduct.offers.map((offer, idx) => {
                    const isSelected = selectedOfferIndex === idx;
                    return (
                      <div
                        key={offer.id || idx}
                        onClick={() => setSelectedOfferIndex(idx)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? "bg-orange-500/15 border-orange-500 text-white font-bold"
                            : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? "border-orange-500 bg-orange-500 text-slate-950" : "border-slate-600"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                          <div>
                            <span>{offer.title_ar}</span>
                            {offer.discount_label && (
                              <span className="mr-2 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-black">
                                {offer.discount_label}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-left font-black text-orange-400">
                          <span>{offer.price} ج.م</span>
                          {offer.quantity > 1 && (
                            <span className="block text-[10px] text-emerald-400">شحن مجاني 🚚</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Form Inputs */}
            <form onSubmit={handleSubmitInChatOrder} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  الاسم ثلاثي:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد محمد علي"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  رقم الهاتف (للتأكيد والتوصيل):
                </label>
                <input
                  type="tel"
                  required
                  placeholder="01012345678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none text-left"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    المحافظة:
                  </label>
                  <select
                    value={governorate}
                    onChange={(e) => setGovernorate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {EGYPTIAN_GOVERNORATES.map((gov) => (
                      <option key={gov.id} value={gov.nameAr}>
                        {gov.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    العنوان بالتفصيل:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="المدينة والشارع ورقم البيت"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              {orderError && (
                <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs">
                  {orderError}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
                >
                  <Truck className="w-4 h-4" />
                  <span>
                    {isSubmittingOrder
                      ? "جاري تأكيد الطلب..."
                      : "تأكيد الطلب والدفع نقدياً عند الاستلام 🚚"}
                  </span>
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  معاينة وفحص المنتج أمام المندوب قبل دفع أي مليم
                </p>
              </div>
            </form>
          </div>
        )}

        {/* Typing Animation */}
        {isTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-2 px-3 bg-slate-900/60 rounded-2xl w-fit border border-slate-800 animate-pulse">
            <Bot className="w-4 h-4 text-orange-400 animate-spin" />
            <span>المستشار البيعي يكتب رداً لحظياً...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Social Proof Nudge */}
      {socialNudge && (
        <div className="bg-slate-900/90 border-t border-slate-800/80 px-4 py-2 flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-2 text-[11px] font-bold text-amber-300 truncate">
            <Flame className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 animate-bounce" />
            <span className="truncate">{socialNudge}</span>
          </span>
          <button
            onClick={() => setSocialNudge(null)}
            className="text-slate-500 hover:text-slate-300 text-xs flex-shrink-0 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Box Footer */}
      <div className="p-3 md:p-4 bg-slate-900 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اسألني عن أي منتج، العروض، الشحن، أو تتبع طلبك..."
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-2xl px-4 py-3 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
          />

          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 disabled:opacity-40 text-slate-950 font-black shadow-md shadow-orange-500/25 transition active:scale-95 flex-shrink-0"
            title="إرسال"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </form>

        {/* WhatsApp & Human Closer fallback */}
        <div className="flex items-center justify-between pt-2 px-1 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-orange-400" />
            شات بيعي ذكي متصل بقاعدة بيانات RexRack
          </span>

          <a
            href="https://wa.me/201000000000?text=مرحباً،%20أود%20الاستفسار%20عن%20عروض%20RexRack"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-400 text-slate-400 flex items-center gap-1 font-bold transition"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>تحدث على واتساب</span>
          </a>
        </div>
      </div>
    </div>
  );
}
