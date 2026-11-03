"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product, LandingPage, ProductOffer } from "@/types";
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
  const [selectedOffer, setSelectedOffer] = useState<ProductOffer>(
    product.offers?.find((o) => o.is_popular) || product.offers?.[0] || ({} as ProductOffer)
  );
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Live Countdown Timer (Simulated Urgency)
  const [timeLeft, setTimeLeft] = useState({ hours: 3, minutes: 42, seconds: 18 });

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

  const scrollToCheckout = () => {
    const el = document.getElementById("order-form-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const discountAmount = product.compare_at_price
    ? product.compare_at_price - product.base_price
    : 200;
  const discountPercent = product.compare_at_price
    ? Math.round((discountAmount / product.compare_at_price) * 100)
    : 36;

  // High quality images distributed per section
  const heroImageSrc =
    product.images?.[0] ||
    "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=1200&q=90";
  const problemImageSrc =
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=90";
  const solutionImageSrc =
    product.images?.[2] ||
    "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=1200&q=90";
  const detailImageSrc =
    product.images?.[1] ||
    "https://images.unsplash.com/photo-1544816155-12df9643f363?w=1200&q=90";
  const unboxingImageSrc =
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=90";

  return (
    <div
      className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-orange-500 selection:text-white"
      dir="rtl"
    >
      {/* 1. TOP STICKY URGENCY BAR */}
      <div className="bg-slate-950 text-white text-xs md:text-sm py-2.5 px-4 sticky top-0 z-50 shadow-md border-b border-orange-500/30">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1 shadow-xs animate-pulse">
              <FireIcon className="w-3.5 h-3.5 fill-slate-950" /> عرض خاص وحصري اليوم
            </span>
            <span className="hidden sm:inline text-slate-200 font-bold">
              معاينة مجانية قبل الدفع + خصم يصل لـ 50%
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs font-black bg-white/10 px-3 py-1 rounded-xl backdrop-blur-xs border border-white/10">
            <ClockIcon className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-slate-300">ينتهي العرض خلال:</span>
            <span className="bg-black/70 px-1.5 py-0.5 rounded text-amber-300 font-bold">
              {String(timeLeft.hours).padStart(2, "0")}
            </span>
            :
            <span className="bg-black/70 px-1.5 py-0.5 rounded text-amber-300 font-bold">
              {String(timeLeft.minutes).padStart(2, "0")}
            </span>
            :
            <span className="bg-black/70 px-1.5 py-0.5 rounded text-amber-300 font-bold">
              {String(timeLeft.seconds).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* 2. HEADER */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-4 sticky top-10 md:top-11 z-40 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-950 to-indigo-900 text-white flex items-center justify-center font-black text-xl shadow-md group-hover:scale-105 transition">
              R
            </div>
            <div>
              <span className="font-heading font-black text-xl text-slate-950 block leading-tight">
                RexRack
              </span>
              <span className="text-[11px] text-orange-600 font-black">
                المتجر المعتمد - معاينة قبل الدفع 🇪🇬
              </span>
            </div>
          </Link>

          <button
            onClick={scrollToCheckout}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white text-xs md:text-sm font-black shadow-md shadow-orange-500/30 active:scale-95 transition cursor-pointer flex items-center gap-1.5"
          >
            <ShoppingBagIcon className="w-4 h-4" />
            <span>اطلب الآن</span>
          </button>
        </div>
      </header>

      {/* 3. HERO SECTION (Full-Width Impactful Visual Showcase) */}
      <section className="py-8 md:py-12 px-4 max-w-4xl mx-auto text-center space-y-6">
        {/* Rating and Trust Pill */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-300">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="w-4 h-4 text-amber-400" />
              ))}
            </div>
            <span className="text-xs font-black text-amber-950">4.9 / 5</span>
            <span className="text-[11px] text-amber-800 font-bold">(1,280+ تقييم حقيقي في مصر)</span>
          </div>

          <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-300">
            ✓ فحص ومعاينة مجانية أمام المندوب قبل الدفع
          </span>
        </div>

        {/* Main Product Headline */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-950 font-heading leading-tight tracking-tight">
          {product.title_ar || "حامل ومنظم RexRack الذكي متعدد الوظائف"}
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed font-medium">
          وداعاً للفوضى وتكدس الأغراض.. نظّم بيتك ومكتبك ووفر 80% من المساحة بخامات فولاذية فاخرة تدوم طويلاً وتتحمل أثقل الأوزان بثبات فائق.
        </p>

        {/* Big Hero Image #1 (Prominent, High-Resolution, Centered) */}
        <div className="relative aspect-16/10 md:aspect-16/9 w-full rounded-3xl overflow-hidden bg-white border-2 border-slate-300 shadow-2xl group">
          <Image
            src={heroImageSrc}
            alt="صورة RexRack الرئيسية"
            fill
            sizes="(max-width: 768px) 100vw, 900px"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            priority
          />
          {/* Floating badges */}
          <div className="absolute top-4 right-4 bg-slate-950/90 backdrop-blur-md text-white text-xs font-black px-4 py-2 rounded-full flex items-center gap-1.5 shadow-xl border border-white/20">
            <SparklesIcon className="w-4 h-4 text-amber-400" />
            <span>منتج أصلي 100% معتمد</span>
          </div>

          <div className="absolute bottom-4 right-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-black px-4 py-2 rounded-2xl flex items-center gap-1.5 shadow-xl">
            <FireIcon className="w-4 h-4 fill-white" />
            <span>متبقي 6 قطع فقط بسعر العرض</span>
          </div>
        </div>

        {/* Price & Current Savings Box */}
        <div className="p-5 rounded-3xl bg-white border-2 border-slate-300 shadow-lg flex items-center justify-between max-w-xl mx-auto flex-wrap gap-4">
          <div className="text-right">
            <span className="text-xs text-slate-500 font-bold block">السعر الحالي للقطعة:</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black font-heading text-slate-950">
                {product.base_price} ج.م
              </span>
              {product.compare_at_price && (
                <span className="text-base text-slate-400 line-through font-bold">
                  {product.compare_at_price} ج.م
                </span>
              )}
            </div>
          </div>

          <div className="text-left">
            <span className="bg-red-600 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-xs block text-center">
              خصم {discountPercent}% فوري
            </span>
            <span className="text-xs font-black text-emerald-700 block mt-1 text-center">
              وفر {discountAmount} ج.م اليوم
            </span>
          </div>
        </div>

        {/* Tiered Offer Selector (Khairy / Lovable High-Converting Pattern) */}
        <div className="space-y-3 max-w-xl mx-auto text-right">
          <label className="block text-sm font-black text-slate-950">
            👇 اختر باقة العرض المناسبة لك:
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
                      ? "border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20 shadow-md"
                      : "border-slate-300 bg-white hover:border-orange-300"
                  }`}
                >
                  {offer.is_popular && (
                    <span className="absolute -top-3 left-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black px-3 py-0.5 rounded-full shadow-xs">
                      🔥 الأكثر طلباً وتوفيراً
                    </span>
                  )}

                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? "border-orange-600 bg-orange-600 text-white" : "border-slate-400"
                      }`}
                    >
                      {isSelected && <CheckIcon className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </div>
                    <div>
                      <span className="font-heading font-black text-sm text-slate-950 block">
                        {offer.title_ar}
                      </span>
                      <span className="text-xs text-slate-600 block font-bold">
                        {offer.discount_label || (offer.free_shipping ? "شحن مجاني" : "دفع عند الاستلام")}
                      </span>
                    </div>
                  </div>

                  <div className="text-left">
                    <span className="text-lg font-black font-heading text-slate-950 block">
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

        {/* Big Orange CTA Button */}
        <div className="pt-2 max-w-xl mx-auto space-y-3">
          <button
            onClick={scrollToCheckout}
            className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-lg md:text-xl shadow-xl shadow-orange-500/35 active:scale-98 transition flex items-center justify-center gap-3 cursor-pointer"
          >
            <ArrowDownIcon className="w-6 h-6 animate-bounce" />
            <span>اضغط هنا واطلب الآن (الدفع عند الاستلام بعد المعاينة)</span>
          </button>

          <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-600 pt-1">
            <span className="flex items-center gap-1 text-emerald-700">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600" /> فحص مجاني قبل الدفع
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-800">
              <TruckIcon className="w-4 h-4 text-orange-600" /> شحن لجميع المحافظات
            </span>
          </div>
        </div>
      </section>

      {/* 4. SECTION 2: THE PROBLEM (Large Image #2 Distributed Here) */}
      <section className="py-14 bg-white border-y border-slate-200 px-4">
        <div className="max-w-4xl mx-auto space-y-8 text-right">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black text-rose-700 bg-rose-50 px-3.5 py-1 rounded-full border border-rose-200">
              المشكلة اليومية
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-slate-950 font-heading">
              هل تعاني من فوضى الأغراض وضيق المساحة كل يوم؟
            </h2>
            <p className="text-sm text-slate-600">
              تراكم الأجهزة، الأسلاك، والمستلزمات في كل مكان يسبب مظهراً غير مريح وضياع مستمر للوقت
            </p>
          </div>

          {/* Distributed Large Image #2: The Problem Context */}
          <div className="relative aspect-16/10 md:aspect-16/9 w-full rounded-3xl overflow-hidden bg-slate-100 border-2 border-slate-300 shadow-xl">
            <Image
              src={problemImageSrc}
              alt="مشكلة الفوضى وتكدس المساحات"
              fill
              sizes="(max-width: 768px) 100vw, 900px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-end p-6 md:p-8">
              <div className="text-white space-y-1">
                <span className="bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full inline-block">
                  قبل RexRack
                </span>
                <p className="text-sm md:text-base font-bold text-slate-100">
                  فوضى مستمرة على المكتب والمنزل، صعوبة إيجاد أشيائك، ومنتجات بلاستيكية رديئة تنكسر سريعاً
                </p>
              </div>
            </div>
          </div>

          {/* Pain Points Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2">
              <div className="flex items-center gap-2 text-rose-600 font-black text-sm">
                <XMarkIcon className="w-5 h-5 text-rose-600" />
                <span>ضياع الوقت والجهد</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                البحث المتكرر عن الهاتف أو المتعلقات وسط كركبة المكتب وتشتت التركيز.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2">
              <div className="flex items-center gap-2 text-rose-600 font-black text-sm">
                <XMarkIcon className="w-5 h-5 text-rose-600" />
                <span>حوامل هشة تنكسر</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                معظم المنتجات الرخيصة مصنوعة من بلاستيك ضعيف يسقط أجهزتك ويتلف في أيام.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2">
              <div className="flex items-center gap-2 text-rose-600 font-black text-sm">
                <XMarkIcon className="w-5 h-5 text-rose-600" />
                <span>شراء مجهول المصدر</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                الخوف من الشراء أونلاين واستلام منتج غير مطابق بدون أي ضمان أو معاينة.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION 3: THE SOLUTION (Large Image #3 Distributed Here) */}
      <section className="py-14 px-4 max-w-4xl mx-auto text-right space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-300">
            الحل السحري والنهائي
          </span>
          <h2 className="text-2xl md:text-4xl font-black text-slate-950 font-heading">
            إليك الحل مع RexRack: تنظيم فوري وتوفير 80% من المساحة
          </h2>
          <p className="text-sm text-slate-600">
            تصميم هندسي متطور يستغل المساحات الرأسية ويمنحك شكلاً ديكورياً فائق الرقي
          </p>
        </div>

        {/* Distributed Large Image #3: Solution in Action */}
        <div className="relative aspect-16/10 md:aspect-16/9 w-full rounded-3xl overflow-hidden bg-white border-2 border-slate-300 shadow-xl group">
          <Image
            src={solutionImageSrc}
            alt="حل RexRack الفعلي لتنظيم المساحة"
            fill
            sizes="(max-width: 768px) 100vw, 900px"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute top-4 right-4 bg-emerald-600 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg">
            بعد استخدام RexRack ✓
          </div>
        </div>

        {/* The Solution Advantages Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckIcon className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <h4 className="font-bold text-slate-950 text-sm">استغلال مثالي للمساحات</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                يوفر أكثر من 80% من مساحة مكتبك وغرفتك بتصميم رأسي ذكي يجمع كل أغراضك في مكان واحد.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
              <SparklesIcon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-950 text-sm">مظهر عصري ديكوري فاخر</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                يضيف لمسة فخامة وأناقة تليق بمنزلك أو مكتبك بدلاً من الفوضى المزعجة.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECTION 4: MATERIALS & QUALITY (Large Image #4 Distributed Here) */}
      <section className="py-14 bg-slate-950 text-white border-y border-slate-800 px-4">
        <div className="max-w-4xl mx-auto space-y-8 text-right">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black text-amber-300 bg-white/10 px-3.5 py-1 rounded-full border border-amber-300/30">
              جودة لا تضاهى
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-white font-heading">
              مصنوع من الفولاذ المقاوم للصدأ ومصمم ليدوم طويلاً
            </h2>
            <p className="text-sm text-slate-300">
              هيكل صلب معزز بقواعد سيليكون مانعة للانزلاق لتحمل الاستخدام الشاق والأوزان الثقيلة
            </p>
          </div>

          {/* Distributed Large Image #4: Detail & Craftsmanship */}
          <div className="relative aspect-16/10 md:aspect-16/9 w-full rounded-3xl overflow-hidden bg-slate-900 border-2 border-slate-700 shadow-2xl group">
            <Image
              src={detailImageSrc}
              alt="تفاصيل خامات وجودة تصنيع RexRack"
              fill
              sizes="(max-width: 768px) 100vw, 900px"
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex items-end p-6 md:p-8">
              <div className="text-white space-y-1">
                <span className="bg-orange-500 text-white text-xs font-black px-3 py-1 rounded-full inline-block">
                  طلاء حراري معالج
                </span>
                <p className="text-sm md:text-base font-bold text-slate-200">
                  مقاوم للصدأ، الخدوش، والرطوبة، مع ثبات تام يمنع أي اهتزاز أو سقوط للأجهزة.
                </p>
              </div>
            </div>
          </div>

          {/* Spec Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <ShieldCheckIcon className="w-6 h-6 text-orange-400 mx-auto" />
              <h4 className="font-black text-sm text-white">فولاذ مقاوم للصدأ</h4>
              <p className="text-[11px] text-slate-400">يدوم لسنوات</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <CheckCircleIcon className="w-6 h-6 text-emerald-400 mx-auto" />
              <h4 className="font-black text-sm text-white">ثبات 100%</h4>
              <p className="text-[11px] text-slate-400">قواعد سيليكونية مانعة</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <TruckIcon className="w-6 h-6 text-blue-400 mx-auto" />
              <h4 className="font-black text-sm text-white">شحن 24-48 ساعة</h4>
              <p className="text-[11px] text-slate-400">لكافة أنحاء مصر</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <ArrowPathIcon className="w-6 h-6 text-amber-400 mx-auto" />
              <h4 className="font-black text-sm text-white">استبدال 14 يوم</h4>
              <p className="text-[11px] text-slate-400">ضمان ذهبي معتمد</p>
            </div>
          </div>

          {/* Mid-Page Call to Action */}
          <div className="text-center pt-4">
            <button
              onClick={scrollToCheckout}
              className="py-4 px-8 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 text-white font-black text-base md:text-lg shadow-xl shadow-orange-500/30 active:scale-95 transition cursor-pointer inline-flex items-center gap-2"
            >
              <ShoppingBagIcon className="w-5 h-5" />
              <span>احجز قطعتك الآن بسعر العرض قبل نفاذ الكمية</span>
            </button>
          </div>
        </div>
      </section>

      {/* 7. SECTION 5: UNBOXING & LAWFUL INSPECTION (Large Image #5 Distributed Here) */}
      <section className="py-14 bg-white border-b border-slate-200 px-4">
        <div className="max-w-4xl mx-auto space-y-8 text-right">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-300">
              حقك الكامل 100%
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-slate-950 font-heading">
              افتح الطرد وعاين المنتج بنفسك أمام المندوب قبل دفع مليم واحد
            </h2>
            <p className="text-sm text-slate-600">
              سياسة RexRack تضمن لك راحة البال الكاملة: لن تدفع جنيهاً واحداً إلا بعد أن تتأكد من مطابقة وجودة المنتج بنفسك.
            </p>
          </div>

          {/* Distributed Large Image #5: Unboxing & Inspection */}
          <div className="relative aspect-16/10 md:aspect-16/9 w-full rounded-3xl overflow-hidden bg-slate-100 border-2 border-slate-300 shadow-xl">
            <Image
              src={unboxingImageSrc}
              alt="معاينة وفتح الطرد أمام مندوب الشحن"
              fill
              sizes="(max-width: 768px) 100vw, 900px"
              className="object-cover"
            />
            <div className="absolute bottom-4 right-4 bg-slate-950/90 text-white text-xs font-black px-4 py-2 rounded-2xl flex items-center gap-2 border border-white/20">
              <ShieldCheckIcon className="w-5 h-5 text-emerald-400" />
              <span>معاينة حقيقية مجانية عند باب بيتك</span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. SECTION 6: COD DIRECT CHECKOUT FORM */}
      <section id="order-form-section" className="py-16 bg-slate-200 border-t border-slate-300 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-black text-orange-700 bg-orange-100 px-3.5 py-1 rounded-full border border-orange-300">
              استمارة الطلب المباشر
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-950 font-heading">
              أدخل بياناتك وسيصلك الطلب خلال 24 - 48 ساعة
            </h2>
            <p className="text-xs text-slate-700 font-bold">
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

      {/* 9. SECTION 7: 14-DAY GOLDEN GUARANTEE */}
      <section className="py-14 px-4 max-w-4xl mx-auto">
        <div className="p-8 md:p-10 rounded-3xl bg-gradient-to-br from-amber-500/15 via-white to-orange-500/10 border-2 border-amber-400 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto shadow-md">
            <HeartIcon className="w-8 h-8" />
          </div>

          <h3 className="text-2xl md:text-3xl font-black font-heading text-slate-950">
            شهادة ضمان RexRack الذهبية 100%
          </h3>

          <p className="text-sm md:text-base text-slate-700 max-w-2xl mx-auto leading-relaxed">
            نحن واثقون تماماً من جودة منتجاتنا. لذلك نمنحك ضماناً حقيقياً لمدة 14 يوماً كاملاً: إذا وجدت أي عيب صناعة أو لم يكن المنتج مطابقاً تماماً لما رأيته، سنقوم باستبداله فوراً مجاناً أو استرداد كامل المبلغ دون أي تعقيد.
          </p>

          <div className="pt-2 flex items-center justify-center gap-6 text-xs md:text-sm font-black text-amber-950 flex-wrap">
            <span className="flex items-center gap-1">
              <CheckCircleIcon className="w-5 h-5 text-emerald-600" /> ضمان استبدال 14 يوم
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircleIcon className="w-5 h-5 text-emerald-600" /> معاينة كاملة قبل الدفع
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircleIcon className="w-5 h-5 text-emerald-600" /> خدمة عملاء ومتابعة مستمرة
            </span>
          </div>
        </div>
      </section>

      {/* 10. SECTION 8: FAQ ACCORDION */}
      <section className="py-14 bg-white border-t border-slate-200 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center mb-8 space-y-2">
            <span className="text-xs font-black text-slate-800 bg-slate-100 px-3.5 py-1 rounded-full border border-slate-300">
              إجابات واضحة
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-950 font-heading">
              الأسئلة الأكثر شيوعاً
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "هل يمكنني فتح الشحنة ومعاينة المنتج قبل دفع أي أموال؟",
                a: "نعم بكل تأكيد! يحق لك بالكامل فتح الطرد، فحص المنتج والتأكد من خامته وجودته أمام مندوب التوصيل قبل دفع ثمن الطلب أو مصاريف الشحن.",
              },
              {
                q: "كم يستغرق وصول الطلب إلى باب منزلي؟",
                a: "يتم تجهيز وشحن الطلب فورياً؛ يستغرق التوصيل من 24 إلى 48 ساعة فقط لمحافظات القاهرة الكبرى والجيزة والإسكندرية، ومن 2 إلى 3 أيام لباقي محافظات الجمهورية.",
              },
              {
                q: "ما هو ضمان RexRack في حالة وجود أي عيب أو تلف؟",
                a: "نمنحك شهادة ضمان ذهبية لمدة 14 يوماً كاملة. في حالة وجود أي ملاحظة أو عيب صناعة، يتم استبدال المنتج بقطعة جديدة فوراً لباب منزلك بدون أي مصاريف شحن.",
              },
              {
                q: "كيف أستفيد من عرض الشحن المجاني؟",
                a: "عند اختيارك عرض القطعتين أو أكثر، يتم تطبيق خصم فوري إضافي ويصبح الشحن مجانياً 100% إلى جميع محافظات مصر.",
              },
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 md:p-5 text-right font-black text-slate-900 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-100"
                  >
                    <span className="text-sm md:text-base">{faq.q}</span>
                    <ChevronDownIcon
                      className={`w-5 h-5 text-slate-500 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="p-4 md:p-5 pt-0 text-xs md:text-sm text-slate-600 leading-relaxed border-t border-slate-200 bg-white">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="bg-slate-950 text-white py-12 px-4 text-center text-xs pb-28 md:pb-12 border-t border-slate-800">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-center items-center gap-6 text-slate-400 flex-wrap">
            <span className="flex items-center gap-1.5 font-bold">
              <TruckIcon className="w-4 h-4 text-orange-400" /> شحن لجميع محافظات مصر
            </span>
            <span className="flex items-center gap-1.5 font-bold">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-400" /> معاينة مجانية قبل الدفع
            </span>
            <span className="flex items-center gap-1.5 font-bold">
              <ArrowPathIcon className="w-4 h-4 text-amber-400" /> استبدال واسترجاع 14 يوم
            </span>
          </div>

          <p className="text-slate-500">
            جميع الحقوق محفوظة © {new Date().getFullYear()} - RexRack (RexRack.com).
          </p>
        </div>
      </footer>

      {/* 12. MOBILE STICKY CTA */}
      <StickyBuyBar
        productTitle={product.title_ar}
        price={selectedOffer.price || product.base_price}
        compareAtPrice={selectedOffer.original_price || product.compare_at_price}
        onCtaClick={scrollToCheckout}
      />
    </div>
  );
}
