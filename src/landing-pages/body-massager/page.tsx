"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Product, LandingPage, ProductOffer } from "@/types";
import { EgyptianCheckoutForm } from "@/components/shared/EgyptianCheckoutForm";
import { StickyBuyBar } from "@/components/shared/StickyBuyBar";
import { bodyMassagerConfig } from "./config";
import {
  Star,
  ShieldCheck,
  Truck,
  CheckCircle2,
  ChevronDown,
  Flame,
  Zap,
  Sparkles,
  Clock,
  Heart,
  Check,
  ArrowDown,
  Package,
  Activity,
  Layers,
  BatteryCharging,
} from "lucide-react";

interface BodyMassagerPageProps {
  product: Product;
  landingPage: LandingPage;
}

export default function BodyMassagerLandingPage({
  product,
  landingPage,
}: BodyMassagerPageProps) {
  const defaultOffer: ProductOffer = {
    id: `offer-default-${product.id}`,
    product_id: product.id,
    title_ar: "قطعة واحدة (تجربة)",
    quantity: 1,
    price: product.base_price || 799,
    original_price: product.compare_at_price || 1200,
    discount_label: "خصم 33%",
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
  const [selectedImage, setSelectedImage] = useState("/landing-pages/body-massager/images/hero.webp");
  const [activeUseTab, setActiveUseTab] = useState<"shoulder" | "back" | "abdomen" | "knee">("shoulder");

  const galleryImages = [
    { src: "/landing-pages/body-massager/images/hero.webp", label: "الجهاز والشاشة الديجيتال" },
    { src: "/landing-pages/body-massager/images/use_case_shoulder.webp", label: "الكتف والرقبة" },
    { src: "/landing-pages/body-massager/images/use_case_back.webp", label: "الظهر والفقرات" },
    { src: "/landing-pages/body-massager/images/use_case_abdomen.webp", label: "البطن والوسط" },
    { src: "/landing-pages/body-massager/images/use_case_knee.webp", label: "الركبة والمفاصل" },
  ];

  // Live Urgency Timer
  const [timeLeft, setTimeLeft] = useState({ hours: 3, minutes: 35, seconds: 20 });

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

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-500 selection:text-white" dir="rtl">
      {/* 1. Top Urgency Announcement Bar */}
      <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white py-2.5 px-4 text-center text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
        <span>عرض خاص اليوم: شحن مجاني 100% لجميع المحافظات + حق المعاينة والتجربة قبل الدفع</span>
        <span className="hidden sm:inline bg-white/20 px-2 py-0.5 rounded-full text-xs font-mono font-black">
          ينتهي خلال {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
        </span>
      </div>

      {/* 2. Hero Section (Above the Fold on Mobile) */}
      <section className="pt-6 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Product Image & Interactive Gallery */}
          <div className="lg:col-span-6 space-y-3">
            <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-white aspect-square">
              <Image
                src={selectedImage}
                alt={bodyMassagerConfig.productTitle}
                fill
                priority
                className="object-contain p-4 transition-all duration-300"
              />
              <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                <span>كمادات حرارية + مساج اهتزازي</span>
              </div>
              <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-xl">
                لاسلكي بشاشة ديجيتال + شحن USB
              </div>
            </div>

            {/* Clickable Gallery Thumbnails */}
            <div className="grid grid-cols-5 gap-2">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(img.src)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition cursor-pointer p-1 bg-white ${
                    selectedImage === img.src ? "border-orange-600 shadow-md ring-2 ring-orange-200" : "border-slate-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={img.src} alt={img.label} fill className="object-cover rounded-lg" />
                </button>
              ))}
            </div>

            {/* Quick Micro Badges */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <Zap className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <span className="font-bold text-[11px] text-slate-800">5 استخدامات بجهاز 1</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <Flame className="w-4 h-4 text-red-500 mx-auto mb-1" />
                <span className="font-bold text-[11px] text-slate-800">3 درجات حرارة</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <BatteryCharging className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <span className="font-bold text-[11px] text-slate-800">لاسلكي تماماً</span>
              </div>
            </div>
          </div>

          {/* Headline & Immediate Value Hook */}
          <div className="lg:col-span-6 space-y-4 text-right">
            {/* Rating */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-xs">
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <span className="font-bold text-orange-950">4.95 (أكثر من 380 عميل راضٍ في مصر)</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black font-heading text-slate-950 leading-tight">
              جهاز التدليك والمساج الشامل 5×1 بالحرارة والاهتزاز للكتف والظهر والبطن والرجل
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              ودّع تشنج الكتفين وآلام أسفل الظهر وخشونة الركبتين! جهاز ذكي شامل يجمع بين المساج الاهتزازي العميق والتدفئة الحرارية لتسكين فوري للألم وتنشيط الدورة الدموية وأنت بتتحرك بحرية.
            </p>

            {/* Checklist of Core Benefits */}
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">يغطي 5 مناطق رئيسية: الكتف، الظهر، البطن، الركبة، والرجل</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">كمادات تدفئة حرارية بالأشعة تحت الحمراء لتسكين الألم والالتهابات</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">شاشة ديجيتال ذكية باللمس لاختيار أوضاع المساج ومستويات الحرارة</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">لاسلكي بالكامل ويعمل ببطارية ليثيوم قوية قابلة لإعادة الشحن USB</span>
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-xs text-slate-500 block">سعر العرض الخاص اليوم:</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-orange-600 font-mono">{selectedOffer.price} ج.م</span>
                  {selectedOffer.original_price && (
                    <span className="text-sm text-slate-400 line-through">{selectedOffer.original_price} ج.م</span>
                  )}
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                ✓ شحن مجاني 100%
              </span>
            </div>

            {/* Primary Action Button (Above Fold) */}
            <button
              onClick={scrollToCheckout}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-700 hover:to-amber-700 text-white font-black text-base sm:text-lg shadow-xl shadow-orange-600/25 active:scale-98 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>اطلب الآن - الدفع بعد المعاينة والفحص</span>
              <ArrowDown className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. The Problem Section */}
      <section className="py-12 bg-white border-y border-slate-200 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-6 text-center">
          <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
            المعاناة اليومية مع آلام المفاصل والشد العضلي
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading">
            آلام الرقبة، الظهر، والمفاصل اللي بتعطلك عن يومك وشغلك
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-red-600 font-bold text-sm">❌ قعدة الشاشات والمكاتب الطويلة</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                الجلوس لساعات أمام الكمبيوتر يسبب تيبس مؤلم في لوح الكتف والفقرات، ويجعلك تنهي يومك بصداع وإرهاق شديد.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-red-600 font-bold text-sm">❌ خشونة الركبتين وآلام المفاصل</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                صعوبة الحركة وصعود السلالم، وتكاليف جلسات العلاج الطبيعي والمراكز المتخصصة الباهظة أسبوعياً.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works in 3 Steps */}
      <section className="py-12 px-4 sm:px-6 max-w-4xl mx-auto space-y-6 text-center">
        <span className="text-xs font-bold text-orange-700 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
          سهولة في 3 خطوات فقط
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading">
          إزاي بيشتغل في 3 خطوات بسيطة؟
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-right pt-2">
          {bodyMassagerConfig.steps.map((st) => (
            <div key={st.num} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-full bg-orange-600 text-white font-black text-sm flex items-center justify-center">
                {st.num}
              </div>
              <h3 className="font-bold text-sm text-slate-900">{st.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{st.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4.5. Interactive Use Cases Section (حالات الاستخدام الشاملة - تصميم صورة العميل) */}
      <section className="py-14 bg-[#0a0f1d] text-white px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3.5 py-1 rounded-full border border-amber-500/20">
              جهاز واحد لكل احتياجاتك
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-white">
              جلسة علاج طبيعي واسترخاء لأي منطقة في جسمك
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              اختر المنطقة وشوف إزاي الجهاز بيعالج الألم ويفك الشد العضلي فوراً
            </p>
          </div>

          {/* Interactive Rounded Pill Tab Switcher */}
          <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto p-1.5 rounded-full bg-[#11192e] border border-slate-800">
            <button
              onClick={() => setActiveUseTab("shoulder")}
              className={`flex-1 py-2.5 px-3 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer min-w-[110px] ${
                activeUseTab === "shoulder"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 font-black"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>الكتف والرقبة</span>
            </button>
            <button
              onClick={() => setActiveUseTab("back")}
              className={`flex-1 py-2.5 px-3 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer min-w-[110px] ${
                activeUseTab === "back"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 font-black"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>الظهر والفقرات</span>
            </button>
            <button
              onClick={() => setActiveUseTab("abdomen")}
              className={`flex-1 py-2.5 px-3 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer min-w-[110px] ${
                activeUseTab === "abdomen"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 font-black"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>البطن والوسط</span>
            </button>
            <button
              onClick={() => setActiveUseTab("knee")}
              className={`flex-1 py-2.5 px-3 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer min-w-[110px] ${
                activeUseTab === "knee"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 font-black"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>الركبة والمفاصل والرجل</span>
            </button>
          </div>

          {/* Active Tab Showcase Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0f172a] border border-slate-800 text-right">
            {activeUseTab === "shoulder" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-5 relative aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                  <Image
                    src="/landing-pages/body-massager/images/use_case_shoulder.webp"
                    alt="تدليك وفك تشنج الكتف والرقبة"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-orange-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full">
                    فك فوري لتشنج الأكتاف
                  </div>
                </div>
                <div className="md:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 text-emerald-400 font-black text-lg sm:text-xl">
                    <Activity className="w-6 h-6 shrink-0" />
                    <span>تسكين وتفكيك فوري لتشنج الكتف والرقبة (Shoulder & Neck Relief)</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    ثبّته بسهولة على مفصل الكتف ولوح الظهر واضبط درجة التدفئة والاهتزاز. ينشط الدورة الدموية في ثوانٍ ويفك التصلب الناتج عن قعدة الشاشات والموبايل والإجهاد اليومي.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm text-slate-300">
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>فك فوري لشد الكتف وتيبس الرقبة</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>حرارة دافئة بالأشعة تحت الحمراء</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>حزام مرن يمسك بإحكام بدون مساعدة</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>خفيف وتتحرك بيه بحرية في البيت أو المكتب</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeUseTab === "back" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-5 relative aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                  <Image
                    src="/landing-pages/body-massager/images/use_case_back.webp"
                    alt="دعم وتسكين فقرات الظهر"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-amber-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full">
                    مريح للظهر والفقرات
                  </div>
                </div>
                <div className="md:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 text-amber-400 font-black text-lg sm:text-xl">
                    <Layers className="w-6 h-6 shrink-0" />
                    <span>راحة تامة وتسكين لآلام فقرات وأسفل الظهر (Spine & Back Therapy)</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    يعمل ككمادة حرارية ومساج عميق لفقرات العمود الفقري والقطنية. يزيل الضغط الواقع على الغضاريف بعد ساعات الوقوف الطويلة أو القيادة المرهقة ويساعد على الاسترخاء والنوم العميق.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm text-slate-300">
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>تخفيف آلام الانزلاق والفقرات القطنية</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>مساج اهتزازي عميق يريح العضلات المتصلبة</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>يحسن استقامة الظهر وتدفق الدم</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>3 مستويات حرارة أمان تناسب حساسيتك</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeUseTab === "abdomen" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-5 relative aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                  <Image
                    src="/landing-pages/body-massager/images/use_case_abdomen.webp"
                    alt="تدفئة مهدئة وراحة للبطن والوسط"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full">
                    تدفئة كمادات مهدئة
                  </div>
                </div>
                <div className="md:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 text-rose-400 font-black text-lg sm:text-xl">
                    <Heart className="w-6 h-6 shrink-0" />
                    <span>تدفئة مهدئة وراحة سريعة لتقلصات البطن والوسط (Abdomen & Core Warmth)</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    لف الحزام حول البطن أو الخصر واستمتع بكمادات حرارية مهدئة تريح المغص والتقلصات المعوية وآلام البرد في الشتاء، مع اهتزاز خفيف يساعد على تحسين راحة الجهاز الهضمي.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm text-slate-300">
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>تسكين سريع للتقلصات والمغص والبرد</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>حرارة مهدئة ومريحة جداً لمنطقة الخصر</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>حزام لاصق فيلكرو يناسب أي مقاس بطن</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>إيقاف تلقائي ذكي لضمان الأمان التام</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeUseTab === "knee" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-5 relative aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                  <Image
                    src="/landing-pages/body-massager/images/use_case_knee.webp"
                    alt="علاج خشونة وتسكين آلام الركبة والمفاصل والرجل"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full">
                    تسكين خشونة المفاصل
                  </div>
                </div>
                <div className="md:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 text-emerald-400 font-black text-lg sm:text-xl">
                    <Zap className="w-6 h-6 shrink-0" />
                    <span>علاج خشونة المفاصل وتسكين آلام الركبة والرجل (Knee & Joint Recovery)</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    الحل الأمثل لكبار السن والرياضيين! يلتف حول الركبة أو السمانة مباشرة ليمد المفصل بدفء عميق واهتزاز يقلل احتكاك الغضاريف والالتهابات ويعيد لك حرية المشي وصعود السلم بدون ألم.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm text-slate-300">
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>تخفيف فوري لخشونة الركبة والتهاب المفاصل</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>ممتاز لكبار السن وصعود السلالم</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>ينشط الدورة الدموية في الساقين والقدمين</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>بطارية لاسلكية قوية للاستخدام في أي مكان</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. Before vs After Comparison */}
      <section className="py-12 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-orange-700 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
            الفرق واضح تماماً
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading">
            حياتك ويومك قبل وبعد جهاز المساج الشامل
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right pt-2">
          <div className="p-6 rounded-3xl bg-red-50/50 border border-red-200 space-y-3">
            <div className="font-bold text-red-700 text-sm flex items-center gap-2">
              <span>❌ من غير الجهاز (المعاناة المستمرة):</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
              {bodyMassagerConfig.beforeAfter.without.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-red-500 font-bold shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 rounded-3xl bg-emerald-50/60 border border-emerald-300 space-y-3 shadow-xs">
            <div className="font-bold text-emerald-800 text-sm flex items-center gap-2">
              <span>✅ مع جهاز التدليك الشامل (الراحة والنشاط):</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-800">
              {bodyMassagerConfig.beforeAfter.with.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Value Hook */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center text-xs sm:text-sm font-bold text-amber-950">
          💡 {bodyMassagerConfig.beforeAfter.valueHook}
        </div>
      </section>

      {/* 6. Real Customer Reviews */}
      <section className="py-12 bg-white border-y border-slate-200 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-6 text-center">
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            تجارب حقيقية
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading">
            آراء عملائنا الذين تخلصوا من آلام المفاصل والشد العضلي
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right pt-2">
            {bodyMassagerConfig.reviews.map((rev, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{rev.name}</h3>
                    <span className="text-[11px] text-slate-500">{rev.city}</span>
                  </div>
                  <div className="flex text-amber-500">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                <div className="text-[10px] text-slate-400">{rev.date}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. The Order Form Section */}
      <section id="order-form-section" className="py-12 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-orange-500 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <span className="inline-block text-xs font-bold text-orange-600 bg-orange-50 px-3.5 py-1 rounded-full border border-orange-200">
              خطوة واحدة فقط
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading">
              اطلب الآن واستلم شحنتك مع حق المعاينة
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              املأ البيانات التالية وسيصلك اتصال لتأكيد الطلب ثم الشحن فوراً
            </p>
          </div>

          <EgyptianCheckoutForm
            product={product}
            landingPage={landingPage}
            selectedOffer={selectedOffer}
            onOfferChange={setSelectedOffer}
          />
        </div>
      </section>

      {/* 8. FAQs Accordion */}
      <section className="py-12 px-4 sm:px-6 max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            الأسئلة الشائعة
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-heading">
            كل ما تود معرفته عن جهاز التدليك الشامل 5×1
          </h2>
        </div>

        <div className="space-y-3">
          {bodyMassagerConfig.faqs.map((faq, idx) => (
            <div key={idx} className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full p-4 text-right flex items-center justify-between gap-4 font-bold text-sm text-slate-900 cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${openFaqIndex === idx ? "rotate-180 text-orange-600" : ""}`} />
              </button>
              {openFaqIndex === idx && (
                <div className="px-4 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 9. Sticky Buy Bar on Mobile */}
      <StickyBuyBar
        product={product}
        selectedOffer={selectedOffer}
        onOrderClick={scrollToCheckout}
      />
    </main>
  );
}
