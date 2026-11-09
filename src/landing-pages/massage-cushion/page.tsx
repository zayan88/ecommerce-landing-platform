"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Product, LandingPage, ProductOffer } from "@/types";
import { EgyptianCheckoutForm } from "@/components/shared/EgyptianCheckoutForm";
import { StickyBuyBar } from "@/components/shared/StickyBuyBar";
import { massageCushionConfig } from "./config";
import {
  Star,
  ShieldCheck,
  Truck,
  CheckCircle2,
  ChevronDown,
  Flame,
  Zap,
  Car,
  Laptop,
  Home,
  Clock,
  Heart,
  Check,
  ArrowDown,
  Package,
  Layers,
  Activity,
} from "lucide-react";

interface MassageCushionPageProps {
  product: Product;
  landingPage: LandingPage;
}

export default function MassageCushionLandingPage({
  product,
  landingPage,
}: MassageCushionPageProps) {
  const defaultOffer: ProductOffer = {
    id: `offer-default-${product.id}`,
    product_id: product.id,
    title_ar: "قطعة واحدة (تجربة)",
    quantity: 1,
    price: product.base_price || 890,
    original_price: product.compare_at_price || 1450,
    discount_label: "خصم 39%",
    is_popular: false,
    free_shipping: true,
    sort_order: 1,
  };

  const initialOffer =
    product.offers && product.offers.length > 0
      ? product.offers.find((o) => o.is_popular) || product.offers[0]
      : defaultOffer;

  const [selectedOffer, setSelectedOffer] = useState<ProductOffer>(initialOffer);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<"car" | "office" | "home">("car");

  // Live Countdown Timer
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 12, seconds: 30 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 4, minutes: 15, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const scrollToCheckout = () => {
    const el = document.getElementById("order-form-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const discountPercent = Math.round(
    (((selectedOffer.original_price || product.compare_at_price || 1450) - selectedOffer.price) /
      (selectedOffer.original_price || product.compare_at_price || 1450)) *
      100
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-orange-500 selection:text-white" dir="rtl">
      {/* 1. Top Winter Urgency Announcement Bar */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white py-2 px-4 text-center text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2">
        <Flame className="w-4 h-4 animate-bounce text-amber-200" />
        <span>عرض شتاء 2026 الحصري: خصم فوري يصل إلى 45% + شحن مجاني 100% لكافة محافظات مصر</span>
        <span className="hidden sm:inline bg-white/20 px-2 py-0.5 rounded-full text-xs font-mono font-black">
          ينتهي خلال {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
        </span>
      </div>

      {/* 2. Hero Section */}
      <section className="relative pt-6 pb-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Product Visuals */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative rounded-3xl overflow-hidden border-2 border-orange-500/30 shadow-2xl bg-slate-900 aspect-square group">
              <Image
                src={massageCushionConfig.images[0].src}
                alt={massageCushionConfig.images[0].alt}
                fill
                priority
                className="object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute top-4 right-4 bg-orange-600/90 backdrop-blur-md text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg border border-orange-400/40 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-300" />
                <span>تدفئة مدمجة + 5 محركات</span>
              </div>
              <div className="absolute bottom-4 left-4 bg-slate-950/85 backdrop-blur-md text-slate-200 text-[11px] font-bold px-3 py-1 rounded-xl border border-slate-700/80">
                محول سيارة + محول منزل مرفقين مجاناً
              </div>
            </div>

            {/* Thumbnail Badges */}
            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
              <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300">
                <Car className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                <span className="font-bold block text-[11px]">في السيارة 12V</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300">
                <Laptop className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <span className="font-bold block text-[11px]">في المكتب والشغل</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300">
                <Home className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <span className="font-bold block text-[11px]">في المنزل 220V</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Pitch & Value Proposition */}
          <div className="lg:col-span-6 space-y-5 text-right">
            {/* Social Proof Rating */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="font-bold text-slate-300">
                {massageCushionConfig.rating} ({massageCushionConfig.reviewsCount} تقييم حقيقي في مصر)
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading text-white leading-tight">
              كرسي ومفرش المساج والتدفئة الحرارية الذكي 5×1
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {massageCushionConfig.subtitle}
            </p>

            {/* Badges List */}
            <ul className="space-y-2 text-xs sm:text-sm text-slate-200">
              {massageCushionConfig.heroBadges.map((badge, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>{badge}</span>
                </li>
              ))}
            </ul>

            {/* Pricing Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950/40 border border-orange-500/30 space-y-3">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-orange-400 font-mono">
                    {selectedOffer.price} ج.م
                  </span>
                  {selectedOffer.original_price && (
                    <span className="text-sm text-slate-500 line-through">
                      {selectedOffer.original_price} ج.م
                    </span>
                  )}
                </div>
                <span className="px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-black">
                  وفرت {discountPercent}% اليوم
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>شحن مجاني 100% لكافة محافظات مصر + إمكانية المعاينة قبل الدفع</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={scrollToCheckout}
                className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-lg shadow-xl shadow-orange-500/25 active:scale-[0.99] transition transform cursor-pointer flex items-center justify-center gap-2"
              >
                <span>اطلب الآن واستلم عند باب بيتك</span>
                <ArrowDown className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Pain Points vs Solution Section */}
      <section className="py-14 bg-slate-900/60 border-y border-slate-800 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
              ليه جسمك محتاج الكرسي ده خصوصاً في الشتاء؟
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
              معاناة برد الشتاء وآلام الظهر المتكررة
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              البرد والجلوس الطويل هما العدو الأول للفقرات القطنية وعضلات أسفل الظهر
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {massageCushionConfig.painPoints.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900/90 border border-red-500/20 hover:border-red-500/40 transition space-y-2"
              >
                <div className="flex items-center gap-2 text-red-400 font-bold text-base">
                  <div className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                    ✕
                  </div>
                  <h3>{item.title}</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pr-9">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Three Usages Tabs (Car, Office, Home) */}
      <section className="py-14 px-4 sm:px-6 max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            جهاز واحد لكل أوقاتك
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
            أينما كنت.. جلسة استرخاء كاملة في متناول يدك
          </h2>
        </div>

        {/* Tab Buttons */}
        <div className="flex justify-center gap-2 sm:gap-4 max-w-md mx-auto p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab("car")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === "car"
                ? "bg-orange-500 text-slate-950 shadow-md font-black"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Car className="w-4 h-4" />
            <span>في السيارة</span>
          </button>
          <button
            onClick={() => setActiveTab("office")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === "office"
                ? "bg-orange-500 text-slate-950 shadow-md font-black"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>في المكتب</span>
          </button>
          <button
            onClick={() => setActiveTab("home")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === "home"
                ? "bg-orange-500 text-slate-950 shadow-md font-black"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Home className="w-4 h-4" />
            <span>في المنزل</span>
          </button>
        </div>

        {/* Tab Content Cards */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 text-right space-y-4">
          {activeTab === "car" && (
            <div className="space-y-3 animate-fade-in">
              <div className="inline-flex items-center gap-2 text-orange-400 font-black text-lg">
                <Car className="w-6 h-6" />
                <span>رفيق المشاوير والسفر في السيارة (Car Mode)</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                ركّب محول ولاعة العربية 12V وشغّل الكرسي وأنت سايق على طريق السفر أو في زحمة الدائري. التدفئة اللطيفة هتفك تشنج أسفل الظهر في سقعة الصبح، والاهتزاز هينشط الدورة الدموية ويمنع الخمول وتيبس الركبتين والفخذين.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">✓ وصلة ولاعة أصلية مرفقة</span>
                <span className="flex items-center gap-1.5">✓ أحزمة مطاطية تثبت على المقعد</span>
                <span className="flex items-center gap-1.5">✓ استهلاك طاقة 12 واط فقط آمن</span>
              </div>
            </div>
          )}

          {activeTab === "office" && (
            <div className="space-y-3 animate-fade-in">
              <div className="inline-flex items-center gap-2 text-amber-400 font-black text-lg">
                <Laptop className="w-6 h-6" />
                <span>إنقاذ موظفي المكاتب والفريلانسرز (Office Mode)</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                حطه على كرسي مكتبك واشبكه في فيشة الحيطة. وأنت مركز في كود أو تصميم أو ميتنج طويل، الكرسي بيشتغل بهدوء ويدلك الظهر العلوي والفقرات القطنية عشان تنهي يومك بنشاط ومن غير ما تروح البيت متكسر.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">✓ مساج هادئ لا يشتت التركيز</span>
                <span className="flex items-center gap-1.5">✓ 8 برامج مساج قابلة للتعديل</span>
                <span className="flex items-center gap-1.5">✓ مؤقت أوتوماتيكي 15-30 دقيقة</span>
              </div>
            </div>
          )}

          {activeTab === "home" && (
            <div className="space-y-3 animate-fade-in">
              <div className="inline-flex items-center gap-2 text-emerald-400 font-black text-lg">
                <Home className="w-6 h-6" />
                <span>جلسة استرخاء على كنب المنزل (Home Living Mode)</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                بعد يوم شاق من التعب والوقفة، ثبّته على كرسي الليفينج أو الفوتيه واشرب كوبايتك المفضلة في الدفا. جلسة مساج اهتزازي كامل ترجع الحيوية لجسمك وتساعدك على النوم العميق والمريح.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">✓ مثالي لكبار السن وآلام المفاصل</span>
                <span className="flex items-center gap-1.5">✓ فيشة منزلية 220V مرفقة</span>
                <span className="flex items-center gap-1.5">✓ خامة مريحة وسهلة التنظيف</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. Feature Highlights Grid */}
      <section className="py-14 bg-slate-900/60 border-y border-slate-800 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
              المواصفات والتقنيات
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
              لماذا RexRack ComfortPro هو الاختيار الأفضل؟
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {massageCushionConfig.features.map((feat, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-orange-500/40 transition space-y-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-xl">
                  {idx + 1}
                </div>
                <h3 className="text-base font-bold text-white font-heading">{feat.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Technical Specifications Table */}
      <section className="py-14 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-white font-heading">المواصفات الفنية المعتمدة</h2>
          <p className="text-xs text-slate-400">كافة التفاصيل والمكونات مطابقة لمعايير الجودة ومخازن صفقة</p>
        </div>

        <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900">
          <table className="w-full text-right text-xs sm:text-sm">
            <tbody>
              {massageCushionConfig.specs.map((item, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-slate-800/80 ${idx % 2 === 0 ? "bg-slate-900" : "bg-slate-900/40"}`}
                >
                  <td className="py-3.5 px-4 font-bold text-orange-400 w-1/3">{item.label}</td>
                  <td className="py-3.5 px-4 text-slate-300">{item.val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. Package Contents Showcase */}
      <section className="py-12 bg-slate-900/60 border-y border-slate-800 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl font-black text-white font-heading">محتويات العلبة الأصلية</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <Package className="w-6 h-6 text-orange-400 mx-auto" />
              <span className="font-bold block text-white">كرسي المساج 5×1</span>
              <span className="text-slate-400 text-[10px]">المفرش المريح مع الريموت</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <Car className="w-6 h-6 text-amber-400 mx-auto" />
              <span className="font-bold block text-white">محول سيارة 12V</span>
              <span className="text-slate-400 text-[10px]">فيشة ولاعة أصلية</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <Zap className="w-6 h-6 text-emerald-400 mx-auto" />
              <span className="font-bold block text-white">أدابتور منزلي 220V</span>
              <span className="text-slate-400 text-[10px]">للكهرباء العادية</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <ShieldCheck className="w-6 h-6 text-blue-400 mx-auto" />
              <span className="font-bold block text-white">دليل الاستخدام</span>
              <span className="text-slate-400 text-[10px]">كتالوج التعليمات والضمان</span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Customer Reviews */}
      <section className="py-14 px-4 sm:px-6 max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
            <Heart className="w-3.5 h-3.5 fill-emerald-400" /> تجارب حقيقية من عملائنا
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
            ماذا يقول عملاؤنا بعد التجربة؟
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {massageCushionConfig.reviews.map((rev, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-right">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-[11px] text-slate-500">{rev.date}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">&ldquo;{rev.comment}&rdquo;</p>
              <div className="text-xs font-bold text-orange-400 pt-2 border-t border-slate-800">
                {rev.name}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. FAQs Accordion */}
      <section className="py-14 bg-slate-900/60 border-t border-slate-800 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-white font-heading">الأسئلة الأكثر شيوعاً</h2>
            <p className="text-xs text-slate-400">كل ما تريد معرفته قبل إتمام طلبك</p>
          </div>

          <div className="space-y-3">
            {massageCushionConfig.faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden text-right"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 font-bold text-sm text-white flex items-center justify-between gap-4 text-right cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-orange-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. Direct Checkout Order Section */}
      <section id="order-form-section" className="py-14 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>معاينة واختبار مع المندوب قبل دفع أي مليم</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
              اطلب الآن واستلم خلال 5 إلى 7 أيام
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              أدخل بياناتك أدناه وسيتواصل معك فريق التأكيد لشحن طلبك فوراً
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-8">
            <EgyptianCheckoutForm
              product={product}
              landingPageSlug={landingPage.slug}
              selectedOffer={selectedOffer}
              onOfferSelect={(offer) => setSelectedOffer(offer)}
            />
          </div>
        </div>
      </section>

      {/* 11. Sticky Mobile Buy Bar */}
      <StickyBuyBar
        productTitle={product.title_ar}
        price={selectedOffer.price}
        compareAtPrice={selectedOffer.original_price}
        onCtaClick={scrollToCheckout}
      />
    </main>
  );
}
