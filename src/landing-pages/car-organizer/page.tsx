"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Product, LandingPage, ProductOffer } from "@/types";
import { EgyptianCheckoutForm } from "@/components/shared/EgyptianCheckoutForm";
import { StickyBuyBar } from "@/components/shared/StickyBuyBar";
import { carOrganizerConfig } from "./config";
import {
  Star,
  ShieldCheck,
  Truck,
  CheckCircle2,
  ChevronDown,
  Car,
  Tablet,
  Sparkles,
  Clock,
  Heart,
  Check,
  ArrowDown,
  Package,
  Layers,
  Baby,
  Tv,
  Coffee,
  Shield,
} from "lucide-react";

interface CarOrganizerPageProps {
  product: Product;
  landingPage: LandingPage;
}

export default function CarOrganizerLandingPage({
  product,
  landingPage,
}: CarOrganizerPageProps) {
  const defaultOffer: ProductOffer = {
    id: `offer-default-${product.id}`,
    product_id: product.id,
    title_ar: "قطعة واحدة (تجربة)",
    quantity: 1,
    price: product.base_price || 499,
    original_price: product.compare_at_price || 750,
    discount_label: "خصم 34%",
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
  const [selectedImage, setSelectedImage] = useState("/landing-pages/car-organizer/images/hero.webp");
  const [activeUseTab, setActiveUseTab] = useState<"cinema" | "storage" | "protection">("cinema");

  const galleryImages = [
    { src: "/landing-pages/car-organizer/images/hero.webp", label: "المنظم والجيوب" },
    { src: "/landing-pages/car-organizer/images/features_1.webp", label: "التنظيم في السيارة" },
    { src: "/landing-pages/car-organizer/images/features_2.webp", label: "حامل التابلت" },
    { src: "/landing-pages/car-organizer/images/features_3.webp", label: "أحزمة التثبيت" },
  ];

  // Live Urgency Timer
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 18, seconds: 40 });

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
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white" dir="rtl">
      {/* 1. Top Urgency Announcement Bar */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 text-white py-2.5 px-4 text-center text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-blue-200 animate-pulse" />
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
                alt="منظم ظهر مقعد السيارة متعدد الجيوب مع حامل تابلت"
                fill
                priority
                className="object-contain p-4 transition-all duration-300"
              />
              <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                <Tablet className="w-3.5 h-3.5" />
                <span>حامل تابلت شفاف مدمج</span>
              </div>
              <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-xl">
                جيوب متعددة + أحزمة تثبيت محكمة
              </div>
            </div>

            {/* Clickable Gallery Thumbnails */}
            <div className="grid grid-cols-4 gap-2">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(img.src)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition cursor-pointer p-1 bg-white ${
                    selectedImage === img.src ? "border-blue-600 shadow-md ring-2 ring-blue-200" : "border-slate-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={img.src} alt={img.label} fill className="object-contain p-1" />
                </button>
              ))}
            </div>

            {/* Quick Micro Badges */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <Car className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <span className="font-bold text-[11px] text-slate-800">يناسب كل العربيات</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <Baby className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <span className="font-bold text-[11px] text-slate-800">حماية من الأوساخ</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                <span className="font-bold text-[11px] text-slate-800">معاينة قبل الدفع</span>
              </div>
            </div>
          </div>

          {/* Headline & Immediate Value Hook */}
          <div className="lg:col-span-6 space-y-4 text-right">
            {/* Rating */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs">
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <span className="font-bold text-blue-950">4.96 (أكثر من 410 تقييم حقيقي في مصر)</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black font-heading text-slate-950 leading-tight">
              سيارة مرتبة وفندقية بدون كركبة.. وحامل تابلت يسلي أولادك طول الطريق
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              منظم مقعد السيارة الذكي متعدد الجيوب. يجمع أغراضك، زجاجات المياه، والمناديل في مكان واحد، ويحمي مقاعد سيارتك من أقدام الأطفال، مع شاشة تابلت لمشاهدة الكرتون في كل رحلة.
            </p>

            {/* Checklist of Core Benefits */}
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">حامل شفاف يدعم شاشات التابلت لمشاهدة الفيديوهات بدون مسك باليد</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">جيوب مخصصة للمناديل وزجاجات المياه لمنع التدحرج والانسكاب</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">حماية كاملة لظهر المقعد من آثار أقدام وأحذية الأطفال وسهل المسح</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">خامات قوية مضادة للماء تناسب جميع موديلات وأنواع السيارات</span>
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-xs text-slate-500 block">سعر العرض الخاص اليوم:</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-blue-700 font-mono">{selectedOffer.price} ج.م</span>
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
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-base sm:text-lg shadow-xl shadow-blue-600/25 active:scale-98 transition cursor-pointer flex items-center justify-center gap-2"
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
            معاناة كل رحلة وسفر بالسيارة
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading">
            فوضى الكنبة الخلفية وأوساخ أقدام الأطفال المستمرة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-red-600 font-bold text-sm">❌ كركبة وتشتت أثناء القيادة</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                زجاجات مياه متدحرجة تحت المقاعد، المناديل مش لاقيها في الطوارئ، وأكياس وحلويات مبعثرة على الكنبة في كل مشوار.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-red-600 font-bold text-sm">❌ تجيير وبقع ظهر المقاعد الأمامية</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                رجلين الأطفال دايماً بتخبط في ظهر الكرسي وتوسخ الفرش ببقع تراب وعصير صعبة جداً في التنظيف والغسيل.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works in 3 Steps (من فيديو اللايت فانلز) */}
      <section className="py-12 px-4 sm:px-6 max-w-4xl mx-auto space-y-6 text-center">
        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          سهولة في 3 خطوات فقط
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading">
          إزاي بيشتغل في 3 خطوات بسيطة؟
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-right pt-2">
          {carOrganizerConfig.steps.map((st) => (
            <div key={st.num} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-full bg-blue-700 text-white font-black text-sm flex items-center justify-center">
                {st.num}
              </div>
              <h3 className="font-bold text-sm text-slate-900">{st.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{st.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4.5. Interactive Use Cases Section (حالات الاستخدام اليومية - تصميم صورة العميل) */}
      <section className="py-14 bg-[#0a0f1d] text-white px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3.5 py-1 rounded-full border border-blue-500/20">
              منظم واحد لكل مشاويرك وعائلتك
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-white">
              أينما انطلقت.. سيارة مرتبة وترفيه كامل في متناول يدك
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              اختر وضع الاستخدام وشوف إزاي المنظم بيحول رحلتك لتجربة راقية ومريحة
            </p>
          </div>

          {/* Interactive Rounded Pill Tab Switcher */}
          <div className="flex justify-center gap-2 max-w-md mx-auto p-1.5 rounded-full bg-[#11192e] border border-slate-800">
            <button
              onClick={() => setActiveUseTab("cinema")}
              className={`flex-1 py-2.5 px-3 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                activeUseTab === "cinema"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 font-black"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>سينما السفر</span>
            </button>
            <button
              onClick={() => setActiveUseTab("storage")}
              className={`flex-1 py-2.5 px-3 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                activeUseTab === "storage"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 font-black"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Coffee className="w-4 h-4" />
              <span>تنظيم المشروبات</span>
            </button>
            <button
              onClick={() => setActiveUseTab("protection")}
              className={`flex-1 py-2.5 px-3 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                activeUseTab === "protection"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 font-black"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>حماية الفرش</span>
            </button>
          </div>

          {/* Active Tab Showcase Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0f172a] border border-slate-800 text-right">
            {activeUseTab === "cinema" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-5 relative aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                  <Image
                    src="/landing-pages/car-organizer/images/features_2.webp"
                    alt="حامل تابلت وسينما سفر للأطفال"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-blue-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full">
                    شاشة تاتش شفافة
                  </div>
                </div>
                <div className="md:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 text-cyan-400 font-black text-lg sm:text-xl">
                    <Tv className="w-6 h-6 shrink-0" />
                    <span>سينما السفر وترفيه الأطفال في الكنبة الخلفية (Kids Road Cinema)</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    جيب تابلت شفاف يدعم التاتش من الخارج، يشغل كرتون وفيديوهات للأطفال طول الطريق بدون ما يمسكوا الأجهزة في إيديهم أو يوقعوها، لرحلة سفر هادئة وبدون زن وصراخ.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm text-slate-300">
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>نافذة شفافة تدعم لمس شاشة التابلت</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>فتحات جانبية لكابل الشاحن والسماعات</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>ثبات تام بدون اهتزاز أثناء المطبات السريعة</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>يمنع دوار الحركة ويحافظ على استقامة رقبة الطفل</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeUseTab === "storage" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-5 relative aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                  <Image
                    src="/landing-pages/car-organizer/images/features_1.webp"
                    alt="تنظيم ذكي للزجاجات والمناديل"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-indigo-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full">
                    9 جيوب ذكية
                  </div>
                </div>
                <div className="md:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 text-indigo-400 font-black text-lg sm:text-xl">
                    <Coffee className="w-6 h-6 shrink-0" />
                    <span>تنظيم ذكي للزجاجات والمناديل والوجبات (Smart Storage Mode)</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    ودّع فوضى الكنبة والكركبة تحت الكراسي! جيوب مخصصة لعلب المناديل، زجاجات المياه والعصير، الألعاب، وشواحن الموبايل في مكان واحد سهل الوصول إليه بدون تشتيت السائق.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm text-slate-300">
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>جيب مركزي مخصص لعلبة المناديل سريعة السحب</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>جيبين شبكيين لزجاجات المياه والكانز بأمان</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>جيوب سفلية واسعة للألعاب والوجبات الخفيفة</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>وصول فوري لكل احتياجاتك وأنت سايق بأمان</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeUseTab === "protection" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-5 relative aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                  <Image
                    src="/landing-pages/car-organizer/images/features_3.webp"
                    alt="حماية فرش ظهر مقاعد السيارة"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full">
                    مقاوم للماء والأتربة
                  </div>
                </div>
                <div className="md:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 text-emerald-400 font-black text-lg sm:text-xl">
                    <Shield className="w-6 h-6 shrink-0" />
                    <span>حماية فائقة لظهر الكراسي من بقع وأقدام الأطفال (Kick Mat Mode)</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    أقدام الأطفال بتخبط طول الوقت في ظهر الكرسي الأمامي وبتسيب بقع تراب وعصير صعبة. المنظم مصنوع من خامة جلد أوكسفورد عازلة تحمي فرش العربية بنسبة 100% وتتنظف بمسحة منديل مبلل.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm text-slate-300">
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>عازل تام للمياه والسوائل والأتربة والطين</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>تنظيف فوري بمسحة فوطة أو منديل بدون فك</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>أحزمة قوية ومخفية تلتف بإحكام حول الكرسي</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>يحافظ على فخامة صالون سيارتك كأنها جديدة</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. Before & After Comparison Box (تصميم فريم 4 من الفيديو) */}
      <section className="py-12 bg-slate-100/80 border-y border-slate-200 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6 text-center">
          <span className="text-xs font-bold text-blue-700 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
            الفرق واضح
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading">
            سيارتك قبل وبعد منظم المقاعد الذكي
          </h2>
          <p className="text-xs text-slate-600">نفس العربية والأطفال... لكن تجربة سفر هادئة ومنظمة 100%</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-right">
            {/* Without */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="text-red-600 font-black text-base flex items-center gap-1.5">
                <span>من غيره</span> <span>😵</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                {carOrganizerConfig.beforeAfter.without.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-red-600">
                    <span>❌</span> <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* With Device */}
            <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-3 border border-slate-800">
              <div className="text-blue-400 font-black text-base flex items-center gap-1.5">
                <span>معاه</span> <span>😌</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-200">
                {carOrganizerConfig.beforeAfter.with.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-emerald-400">
                    <span>✓</span> <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Value Hook */}
          <div className="pt-4 text-center">
            <h3 className="text-lg sm:text-xl font-black text-slate-950 font-heading">
              {carOrganizerConfig.beforeAfter.valueHook}
            </h3>
            <p className="text-xs text-slate-600 mt-1 max-w-xl mx-auto">
              مش محتاج تنزل تغسل الفرش كل أسبوع وتدفع فلوس تنظيف.. المنظم بيحافظ على عربيتك جديدة وفندقية دايماً.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Customer Reviews */}
      <section className="py-12 px-4 sm:px-6 max-w-4xl mx-auto space-y-6 text-center">
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          تجارب حقيقية
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading">
          آراء العملاء بعد تجربة المنظم
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right pt-2">
          {carOrganizerConfig.reviews.map((rev, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-amber-500">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <span className="text-[11px] text-slate-400">{rev.date}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">&ldquo;{rev.comment}&rdquo;</p>
              <div className="text-xs font-bold text-blue-800 pt-1 border-t border-slate-100 flex items-center justify-between">
                <span>{rev.name}</span>
                <span className="text-[10px] text-slate-400 font-normal">{rev.city}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Embedded Checkout Form Section (بياناتك للتوصيل) */}
      <section id="order-form-section" className="py-12 bg-gradient-to-b from-slate-100 to-slate-200 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6 space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>معاينة وفحص واختبار مع المندوب قبل دفع أي مليم</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading">
              بياناتك للتوصيل
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              مش هتدفع أي حاجة دلوقتي — هنكلمك نأكد الأوردر وميعاد الاستلام قبل الشحن
            </p>
          </div>

          {/* The Form */}
          <div className="bg-white rounded-3xl shadow-xl p-4 sm:p-8 border border-slate-200/90">
            <EgyptianCheckoutForm
              product={product}
              landingPageSlug={landingPage.slug}
              selectedOffer={selectedOffer}
              onOfferSelect={(offer) => setSelectedOffer(offer)}
            />
          </div>
        </div>
      </section>

      {/* 8. FAQs & Objection Handling */}
      <section className="py-12 px-4 sm:px-6 max-w-3xl mx-auto space-y-6 text-center">
        <h2 className="text-2xl font-black text-slate-950 font-heading">الأسئلة الشائعة</h2>
        <div className="space-y-3 text-right">
          {carOrganizerConfig.faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 font-bold text-sm text-slate-900 flex items-center justify-between gap-4 text-right cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-blue-600 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. 14-Day Golden Guarantee */}
      <section className="py-10 px-4 max-w-3xl mx-auto text-center">
        <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 space-y-2">
          <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-lg font-black text-emerald-950">ضمان ذهبي 14 يوماً مع حق المعاينة قبل الاستلام</h3>
          <p className="text-xs text-emerald-800 max-w-lg mx-auto leading-relaxed">
            افتح الشحنة بنفسك مع المندوب وعاين خامة الجلد والجيوب وحامل التابلت قبل أن تدفع أي مليم. وفي حالة وجود أي عيب صناعة، يتم الاستبدال فوراً حتى باب بيتك.
          </p>
        </div>
      </section>

      {/* 10. Sticky Mobile Buy Bar */}
      <StickyBuyBar
        productTitle={product.title_ar}
        price={selectedOffer.price || product.base_price}
        compareAtPrice={selectedOffer.original_price || product.compare_at_price}
        onCtaClick={scrollToCheckout}
      />
    </main>
  );
}
