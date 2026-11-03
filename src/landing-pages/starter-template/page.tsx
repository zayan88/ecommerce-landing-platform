"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product, LandingPage, ProductOffer } from "@/types";
import { starterLandingConfig } from "./config";
import { EgyptianCheckoutForm } from "@/components/shared/EgyptianCheckoutForm";
import { StickyBuyBar } from "@/components/shared/StickyBuyBar";
import {
  StarIcon,
  ShieldCheckIcon,
  TruckIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  SparklesIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  FireIcon,
  PhoneIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  HeartIcon,
  EyeIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/solid";

interface StarterLandingPageProps {
  product: Product;
  landingPage: LandingPage;
}

export default function StarterLandingPage({ product, landingPage }: StarterLandingPageProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedOffer, setSelectedOffer] = useState<ProductOffer>(
    product.offers?.find((o) => o.is_popular) || product.offers?.[0] || ({} as ProductOffer)
  );
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Live Countdown Timer (Simulated Urgency)
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 27, seconds: 43 });

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
        return { hours: 4, minutes: 30, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Distributed image assets: Hero, Detail/Materials, Lifestyle/In-Action
  const images =
    product.images && product.images.length > 0
      ? product.images.map((src, idx) => ({
          src,
          alt: `${product.title_ar} - صورة ${idx + 1}`,
          caption:
            idx === 0
              ? "التصميم العصري الأنيق - متانة فائقة وجودة استثنائية"
              : idx === 1
              ? "خامات فولاذية مقاومة للصدأ مع طلاء حراري معالج"
              : "تنظيم فوري يمنحك 80% مساحة إضافية ومظهراً فائق الأناقة",
        }))
      : starterLandingConfig.images;

  const heroImage = images[activeImageIndex] || images[0];
  const detailImage = images[1] || images[0];
  const lifestyleImage = images[2] || images[0];

  const scrollToCheckout = () => {
    const el = document.getElementById("order-form-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const discountAmount = product.compare_at_price
    ? product.compare_at_price - product.base_price
    : 150;
  const discountPercent = product.compare_at_price
    ? Math.round((discountAmount / product.compare_at_price) * 100)
    : 36;

  return (
    <div
      className="min-h-screen bg-slate-50/70 text-slate-900 font-sans selection:bg-indigo-600 selection:text-white"
      dir="rtl"
    >
      {/* 1. TOP URGENCY COUNTDOWN ANNOUNCEMENT BAR */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white text-xs md:text-sm py-2.5 px-4 sticky top-0 z-50 shadow-md border-b border-indigo-500/20">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1 shadow-xs animate-pulse">
              <FireIcon className="w-3.5 h-3.5 fill-slate-950" /> عرض حصري لفترة محدودة
            </span>
            <span className="hidden sm:inline text-slate-200">
              معاينة مجانية قبل الدفع + شحن مجاني عند طلب قطعتين أو أكثر
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs font-black bg-white/10 px-3 py-1 rounded-xl backdrop-blur-xs border border-white/10">
            <ClockIcon className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-slate-300">ينتهي خلال:</span>
            <span className="bg-black/60 px-1.5 py-0.5 rounded text-amber-300">
              {String(timeLeft.hours).padStart(2, "0")}
            </span>
            :
            <span className="bg-black/60 px-1.5 py-0.5 rounded text-amber-300">
              {String(timeLeft.minutes).padStart(2, "0")}
            </span>
            :
            <span className="bg-black/60 px-1.5 py-0.5 rounded text-amber-300">
              {String(timeLeft.seconds).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* 2. HEADER */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-3.5 px-4 sticky top-10 md:top-11 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-indigo-600/25 group-hover:scale-105 transition">
              R
            </div>
            <div>
              <span className="font-heading font-black text-lg md:text-xl text-slate-900 block leading-tight">
                RexRack
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                المتجر المعتمد - معاينة مجانية وفحص قبل الدفع 🇪🇬
              </span>
            </div>
          </Link>

          <button
            onClick={scrollToCheckout}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white text-xs md:text-sm font-black shadow-md shadow-orange-500/25 active:scale-95 transition cursor-pointer flex items-center gap-1.5"
          >
            <ShoppingBagIcon className="w-4 h-4" />
            <span>اطلب الآن</span>
          </button>
        </div>
      </header>

      {/* 3. HERO SECTION (With Prominent Large Product Visual Anchor) */}
      <section className="py-8 md:py-14 px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Main Visual Showcase (Large, Crisp, High-Converting) */}
          <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-28">
            <div className="relative aspect-4/3 md:aspect-16/11 w-full rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-2xl shadow-indigo-950/10 group">
              <Image
                src={heroImage.src}
                alt={heroImage.alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                priority
              />

              {/* Floating Quality Tag */}
              <div className="absolute top-4 right-4 bg-indigo-950/90 backdrop-blur-md text-white text-xs font-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-indigo-500/30">
                <SparklesIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>أصلي 100% - معاينة قبل الدفع</span>
              </div>

              {/* Scarcity Tag */}
              <div className="absolute bottom-4 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg">
                <FireIcon className="w-4 h-4 fill-white" />
                <span>متبقي 6 قطع فقط بسعر العرض</span>
              </div>
            </div>

            {/* Subtle Visual Angle Selector (Clean pills, NOT clustered box) */}
            {images.length > 1 && (
              <div className="flex items-center justify-center gap-2 pt-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeImageIndex === idx
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-102"
                        : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    <EyeIcon className="w-3.5 h-3.5" />
                    <span>زاوية {idx + 1}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Trust Mini-Cards */}
            <div className="grid grid-cols-3 gap-2.5 pt-2 text-center text-xs font-bold text-slate-700">
              <div className="p-3 rounded-2xl bg-white border border-slate-200/90 flex flex-col items-center gap-1.5 shadow-xs">
                <ShieldCheckIcon className="w-6 h-6 text-indigo-600" />
                <span>معاينة قبل الدفع</span>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-slate-200/90 flex flex-col items-center gap-1.5 shadow-xs">
                <TruckIcon className="w-6 h-6 text-blue-600" />
                <span>توصيل خلال 48 ساعة</span>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-slate-200/90 flex flex-col items-center gap-1.5 shadow-xs">
                <ArrowPathIcon className="w-6 h-6 text-amber-500" />
                <span>استبدال 14 يوم</span>
              </div>
            </div>
          </div>

          {/* Product Hero Details & Instant Offer Selector */}
          <div className="lg:col-span-6 space-y-6 text-right">
            {/* Rating & Sold Counter */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 bg-amber-50 px-3.5 py-1 rounded-full border border-amber-200/80">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="w-4 h-4 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs font-black text-amber-950">4.9 / 5</span>
                <span className="text-[11px] text-amber-800 font-semibold">(380+ تقييم موثق)</span>
              </div>

              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/80">
                ✓ تم بيع أكثر من 1,200 قطعة في مصر
              </span>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 font-heading leading-tight tracking-tight">
              {product.title_ar || starterLandingConfig.productTitle}
            </h1>

            {/* Subtitle */}
            <p className="text-base text-slate-600 leading-relaxed font-normal">
              {product.description_ar || starterLandingConfig.subtitle}
            </p>

            {/* Current Price Block (Vibrant Modern Indigo & Amber) */}
            <div className="p-4 md:p-5 rounded-3xl bg-gradient-to-r from-indigo-50/80 via-blue-50/40 to-indigo-50/80 border border-indigo-200/80 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs text-indigo-900 font-bold block">
                  السعر الحالي للقطعة:
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-black font-heading text-indigo-950">
                    {product.base_price} ج.م
                  </span>
                  {product.compare_at_price && (
                    <span className="text-base text-slate-400 line-through">
                      {product.compare_at_price} ج.م
                    </span>
                  )}
                </div>
              </div>

              <div className="text-left">
                <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-xs block text-center">
                  خصم {discountPercent}%
                </span>
                <span className="text-[11px] font-bold text-indigo-900 block mt-1 text-center">
                  وفر {discountAmount} ج.م اليوم
                </span>
              </div>
            </div>

            {/* Interactive Quantity Offer Cards (Khairy/Lovable Style) */}
            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-900">
                👇 اختر العرض المناسب لك (شحن مجاني على قطعتين أو أكثر):
              </label>

              <div className="space-y-2.5">
                {product.offers?.map((offer) => {
                  const isSelected = selectedOffer.id === offer.id;
                  return (
                    <div
                      key={offer.id}
                      onClick={() => setSelectedOffer(offer)}
                      className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-md"
                          : "border-slate-200 bg-white hover:border-indigo-300"
                      }`}
                    >
                      {offer.is_popular && (
                        <span className="absolute -top-3 left-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                          🔥 الأكثر طلباً وتوفيراً
                        </span>
                      )}

                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-slate-300"
                          }`}
                        >
                          {isSelected && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div>
                          <span className="font-heading font-black text-sm text-slate-900 block">
                            {offer.title_ar}
                          </span>
                          <span className="text-xs text-slate-500 block font-medium">
                            {offer.discount_label ||
                              (offer.free_shipping ? "شحن مجاني" : "دفع عند الاستلام")}
                          </span>
                        </div>
                      </div>

                      <div className="text-left">
                        <span className="text-lg font-black font-heading text-indigo-950 block">
                          {offer.price} ج.م
                        </span>
                        {offer.original_price && (
                          <span className="text-xs text-slate-400 line-through block">
                            {offer.original_price} ج.م
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Primary Action Button (High-Converting Sunset Amber & Fire Orange) */}
            <div className="pt-2 space-y-2.5">
              <button
                onClick={scrollToCheckout}
                className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-lg md:text-xl shadow-xl shadow-orange-500/30 hover:shadow-orange-500/40 active:scale-98 transition flex items-center justify-center gap-3 cursor-pointer"
              >
                <ArrowDownIcon className="w-6 h-6 animate-bounce" />
                <span>اضغط هنا واطلب الآن (الدفع عند الاستلام)</span>
              </button>

              <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-500 pt-1">
                <span className="flex items-center gap-1 text-emerald-700">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600" /> فحص ومعاينة قبل الدفع
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-indigo-700">
                  <TruckIcon className="w-4 h-4 text-indigo-600" /> شحن لكافة المحافظات
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURE SPOTLIGHT 1: LARGE MACRO DETAIL IMAGE (Distributed Down the Page) */}
      <section className="py-14 bg-white border-y border-slate-200 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Visual Column: Large Detail Photo */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="relative aspect-4/3 w-full rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xl group">
                <Image
                  src={detailImage.src}
                  alt={detailImage.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-6">
                  <div className="text-white">
                    <span className="bg-indigo-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                      تفاصيل التصنيع
                    </span>
                    <p className="text-sm font-bold text-slate-100">
                      {detailImage.caption || "خامات فولاذية متينة مطلية حرارياً لمقاومة الصدأ والخدوش"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Copy Column */}
            <div className="lg:col-span-6 order-1 lg:order-2 space-y-5 text-right">
              <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-3.5 py-1 rounded-full border border-indigo-200/80">
                هندسة دقيقة وخامات تدوم
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-heading leading-tight">
                مصنوع من الفولاذ المقاوم للصدأ ليتحمل الاستخدام اليومي الشاق
              </h2>
              <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                على عكس الحوامل البلاستيكية الرديئة المنتشرة في الأسواق التي تنكسر أو تنحني بعد فترة قصيرة، تم تصميم هذا المنتج بهيكل معدني معزز وقواعد سيليكونية مانعة للانزلاق لضمان أقصى درجات الثبات والأمان لأجهزتك وأغراضك.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <ShieldCheckIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">مقاومة تامة للصدأ</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">طلاء حراري معالج للرطوبة</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <SparklesIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">ثبات 100%</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">قواعد سيليكون مانعة للاهتزاز</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FEATURE SPOTLIGHT 2: LIFESTYLE / IN-ACTION IMAGE & PROBLEM VS SOLUTION */}
      <section className="py-14 px-4 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-3.5 py-1 rounded-full border border-indigo-200/80">
            الحل الفعلي على أرض الواقع
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-heading">
            وداعاً للكركبة والفوضى.. نظّم مساحتك في ثوانٍ معدودة
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Copy & Comparison Cards */}
          <div className="lg:col-span-6 space-y-4 text-right">
            {/* The RexRack Way (Premium Dark Indigo Card) */}
            <div className="p-6 rounded-3xl bg-slate-950 text-white border border-indigo-500/30 shadow-xl space-y-3">
              <div className="flex items-center gap-2.5 text-amber-400 font-black text-base font-heading">
                <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center">
                  <CheckIcon className="w-4 h-4" />
                </div>
                <span>حلول RexRack الأصلية المعتمدة</span>
              </div>
              <ul className="space-y-2.5 text-xs md:text-sm text-slate-200">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>توفير 80% من مساحة المكتب والمنزل واستغلال الزوايا الرأسية.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>حقك الكامل في فتح الطرد ومعاينته أمام المندوب قبل دفع أي مليم.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>ضمان استبدال حقيقي 14 يوماً مع شحن سريع خلال 24 - 48 ساعة.</span>
                </li>
              </ul>
            </div>

            {/* Traditional Market Products */}
            <div className="p-5 rounded-3xl bg-rose-50/60 border border-rose-200/80 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs font-heading">
                <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center">
                  <XMarkIcon className="w-4 h-4 text-rose-600" />
                </div>
                <span>المنتجات التقليدية مجهولة المصدر</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">✕</span>
                  <span>خامات بلاستيكية هشة تنهار وتنكسر بعد أسبوع واحد.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">✕</span>
                  <span>المندوب يرفض المعاينة ويشترط الدفع قبل فتح العلبة.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Visual Column: Large Lifestyle In-Action Photo */}
          <div className="lg:col-span-6">
            <div className="relative aspect-4/3 w-full rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xl group">
              <Image
                src={lifestyleImage.src}
                alt={lifestyleImage.alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md text-amber-300 text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                <SparklesIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>استخدام واقعي فوري</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FULL-WIDTH VISUAL SHOWCASE GRID (Distributed Image Cards Across the Page) */}
      <section className="py-14 bg-gradient-to-b from-slate-100 to-white border-y border-slate-200 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-3.5 py-1 rounded-full border border-indigo-200/80">
              معرض الصور الكامل
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-heading">
              شاهد المنتج بدقة من كافة الزوايا قبل الشراء
            </h2>
            <p className="text-xs md:text-sm text-slate-600">
              الصور التالية مطابقة تماماً لما ستستلمه وتفتحه بنفسك عند وصول مندوب التوصيل
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-slate-900/75 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                    لقطة {idx + 1}
                  </div>
                </div>
                <div className="p-4 text-right">
                  <h4 className="font-heading font-black text-slate-900 text-sm">
                    {idx === 0
                      ? "التصميم العصري الأنيق"
                      : idx === 1
                      ? "جودة الخامات والتصنيع"
                      : "الاستخدام العملي الواقعي"}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {img.caption || img.alt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. 3-STEP EASY ORDERING PROCESS */}
      <section className="py-14 px-4 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-3.5 py-1 rounded-full border border-indigo-200/80">
            خطوات بسيطة وسريعة
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-heading">
            كيف تطلب وتستلم منتجك؟
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 font-black text-xl flex items-center justify-center mx-auto">
              1
            </div>
            <h3 className="font-heading font-black text-base text-slate-900">سجل بياناتك</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              اكتب اسمك ورقم هاتفك ومحافظتك في الاستمارة أدناه، وسيتم تسجيل طلبك في أقل من نصف دقيقة.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 font-black text-xl flex items-center justify-center mx-auto">
              2
            </div>
            <h3 className="font-heading font-black text-base text-slate-900">تأكيد وشحن فوري</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              يتصل بك فريق الدعم الفني لتأكيد العنوان وموعد التوصيل المناسب لك، ويتم تجهيز الشحنة فوراً.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 font-black text-xl flex items-center justify-center mx-auto">
              3
            </div>
            <h3 className="font-heading font-black text-base text-slate-900">معاينة واستلام</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              افتح الطرد بنفسك وافحص المنتج وتأكد من مطابقته قبل دفع أي أموال للمندوب.
            </p>
          </div>
        </div>
      </section>

      {/* 8. COD CHECKOUT FORM SECTION */}
      <section id="order-form-section" className="py-16 bg-slate-100 border-t border-slate-200 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-3.5 py-1 rounded-full border border-indigo-200/80">
              استمارة الطلب المباشر
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-heading">
              أدخل بياناتك وسيصلك الطلب حتى باب بيتك
            </h2>
            <p className="text-xs text-slate-600">
              الدفع عند الاستلام بعد المعاينة والفحص. شحن سريع لكافة محافظات مصر.
            </p>
          </div>

          <EgyptianCheckoutForm
            product={product}
            landingPageSlug={landingPage.slug}
            selectedOffer={selectedOffer}
            onOfferSelect={(offer) => setSelectedOffer(offer)}
          />
        </div>
      </section>

      {/* 9. GOLDEN GUARANTEE CERTIFICATE */}
      <section className="py-14 px-4 max-w-4xl mx-auto">
        <div className="p-8 md:p-10 rounded-3xl bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 border-2 border-amber-300 shadow-lg text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-md">
            <HeartIcon className="w-8 h-8 text-amber-600" />
          </div>

          <h3 className="text-2xl font-black font-heading text-amber-950">
            شهادة ضمان RexRack الذهبية 100%
          </h3>

          <p className="text-sm text-slate-700 max-w-2xl mx-auto leading-relaxed">
            نحن واثقون تماماً من جودة منتجاتنا. لذلك نمنحك ضماناً حقيقياً لمدة 14 يوماً كاملاً: إذا وجدت أي عيب صناعة أو لم يكن المنتج مطابقاً تماماً لما رأيته، سنقوم باستبداله فوراً مجاناً أو استرداد كامل المبلغ دون أي تعقيد.
          </p>

          <div className="pt-2 flex items-center justify-center gap-6 text-xs font-bold text-amber-900 flex-wrap">
            <span className="flex items-center gap-1">
              <CheckCircleIcon className="w-4 h-4 text-amber-600" /> ضمان استبدال 14 يوم
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircleIcon className="w-4 h-4 text-amber-600" /> معاينة كاملة قبل الدفع
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircleIcon className="w-4 h-4 text-amber-600" /> خدمة عملاء ومتابعة مستمرة
            </span>
          </div>
        </div>
      </section>

      {/* 10. REAL CUSTOMER REVIEWS WITH PHOTOS (Social Proof Visuals) */}
      <section className="py-14 bg-white border-y border-slate-200 px-4">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black text-amber-700 bg-amber-50 px-3.5 py-1 rounded-full border border-amber-200/80">
              تجارب موثقة بالصور
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-heading">
              آراء عملائنا الكرام بعد الاستلام والمعاينة
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {starterLandingConfig.reviews.map((rev: any, idx) => (
              <div
                key={idx}
                className="bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
              >
                {/* Real Unboxing Customer Photo */}
                {rev.photo && (
                  <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-200">
                    <Image
                      src={rev.photo}
                      alt={`تصوير العميل ${rev.name}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                    <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      تصوير العميل عند الاستلام 📸
                    </div>
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex text-amber-400 mb-2">
                      {[...Array(rev.rating)].map((_, i) => (
                        <StarIcon key={i} className="w-4 h-4 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium">
                      "{rev.text}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{rev.name}</span>
                      <span className="text-slate-500 text-[11px]">{rev.location}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                      مشتري موثق ✓
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. FAQ ACCORDION */}
      <section className="py-14 px-4 max-w-3xl mx-auto">
        <div className="text-center mb-8 space-y-2">
          <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-3.5 py-1 rounded-full border border-indigo-200/80">
            إجابات واضحة
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-heading">
            الأسئلة الأكثر شيوعاً
          </h2>
        </div>

        <div className="space-y-3">
          {starterLandingConfig.faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 md:p-5 text-right font-bold text-slate-900 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50"
                >
                  <span className="text-sm md:text-base">{faq.q}</span>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-slate-500 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="p-4 md:p-5 pt-0 text-xs md:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 12. FOOTER */}
      <footer className="bg-slate-950 text-white py-12 px-4 text-center text-xs pb-28 md:pb-12 border-t border-slate-800">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex justify-center items-center gap-6 text-slate-400 flex-wrap">
            <span className="flex items-center gap-1.5 font-bold">
              <TruckIcon className="w-4 h-4 text-indigo-400" /> شحن لجميع محافظات مصر
            </span>
            <span className="flex items-center gap-1.5 font-bold">
              <ShieldCheckIcon className="w-4 h-4 text-indigo-400" /> معاينة مجانية قبل الدفع
            </span>
            <span className="flex items-center gap-1.5 font-bold">
              <ArrowPathIcon className="w-4 h-4 text-indigo-400" /> استبدال واسترجاع 14 يوم
            </span>
          </div>

          <p className="text-slate-500">
            جميع الحقوق محفوظة © {new Date().getFullYear()} - RexRack (RexRack.com).
          </p>
        </div>
      </footer>

      {/* 13. MOBILE STICKY CTA */}
      <StickyBuyBar
        productTitle={product.title_ar}
        price={selectedOffer.price || product.base_price}
        compareAtPrice={selectedOffer.original_price || product.compare_at_price}
        onCtaClick={scrollToCheckout}
      />
    </div>
  );
}
