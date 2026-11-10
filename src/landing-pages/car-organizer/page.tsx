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
          {/* Product Image (Clean Hero - No Clutter) */}
          <div className="lg:col-span-6 space-y-3">
            <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-white aspect-square">
              <Image
                src="/landing-pages/car-organizer/images/hero.webp"
                alt="منظم ظهر مقعد السيارة متعدد الجيوب مع حامل تابلت"
                fill
                priority
                className="object-cover"
              />
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
            {/* Rating & Hook */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <span className="font-bold text-blue-950">4.96 (أكثر من 410 تقييم حقيقي في مصر)</span>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-bold">
                🚗 كراسي عربيتك اتبهدلت من تخبيط رجلين العيال والأكياس المدحرجة؟
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black font-heading text-slate-950 leading-tight">
              منظم الكراسي مع حامل التابلت الشفاف: يحمي الفرش، يلم الفوضى، ويخلي الأولاد هاديين ومبسوطين طول الطريق
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              منظم ظهر مقعد السيارة الفاخر متعدد الجيوب من الجلد المعالج. يجمع كل أغراضك وزجاجات المياه والمناديل في مكانها، ويحمي كراسي سيارتك من البقع والخدوش مع جيب تابلت تاتش لرحلات هادئة.
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

      {/* 4. 9-in-1 Smart Pockets Architecture (Image 2) */}
      <section className="py-14 bg-slate-900 text-white px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3.5 py-1 rounded-full border border-blue-500/20">
              التشريح الهندسي والجيوب
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-white">
              تقسيم الجيوب الذكية 9×1 لكل احتياجات العائلة
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              استغلال مثالي لمساحة الكنبة الخلفية وحفظ الأغراض في مكانها الثابت
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Infographic Image 2 */}
            <div className="lg:col-span-6">
              <div className="relative aspect-square rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
                <Image
                  src="/landing-pages/car-organizer/images/features_1.webp"
                  alt="تقسيم الجيوب الذكية 9 في 1 لمنظم السيارة"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Feature Cards Column */}
            <div className="lg:col-span-6 space-y-3.5 text-right">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-blue-400 font-black text-sm">
                  <Tablet className="w-4 h-4 shrink-0" />
                  <span>حامل تابلت تفاعلي بلمس الشاشة</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  نافذة شفافة تدعم اللمس المباشر لتابلت حتى 10.5 بوصة مع فتحات لسماعات الرأس والشاحن.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-blue-400 font-black text-sm">
                  <Coffee className="w-4 h-4 shrink-0" />
                  <span>2 جيب مخصص لزجاجات المياه والكانز</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  جيوب عميقة محكمة تمنع تدحرج وسقوط الزجاجات أثناء المطبات والفرامل المفاجئة.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-blue-400 font-black text-sm">
                  <Package className="w-4 h-4 shrink-0" />
                  <span>جيب مركزي لسحب المناديل الفوري</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  فتحة سحب مباشرة لعلبة المناديل لسهولة الوصول في حالات انسكاب العصائر وتنظيف الأيدي.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-blue-400 font-black text-sm">
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>جيوب سفلية عميقة للألعاب والكتب والمظلات</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  سعة تخزين واسعة تضمن بقاء الكنبة الخلفية فارغة ونظيفة تماماً طوال الرحلة.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Premium Leather & Seat Protection (Image 3) */}
      <section className="py-14 bg-white border-b border-slate-200 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
              حماية كاملة للصالون
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-slate-950">
              حماية فرش المقاعد من أقدام الأطفال والخدوش
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              جلد PU فاخر متعدد الطبقات مقاوم للماء والأوساخ وسهل التنظيف بلمسة واحدة
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Protection Description Column */}
            <div className="lg:col-span-6 space-y-3 text-right order-2 lg:order-1">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>مضاد لأقدام وركلات الأطفال</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  يغطي ظهر المقعد بالكامل ويمنع وصول آثار الأحذية والأتربة للفرش الأصلي للسيارة.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>مقاوم للماء وسهل التنظيف في 5 ثوانٍ</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  أي عصير أو بقعة تنمسح بفوطة مبللة فوراً ويرجع يلمع كأنه جديد بدون غسيل مكلف.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="font-black text-sm text-blue-400 flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>مظهر جلدي أنيق يليق بأفخم السيارات</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  خياطة دقيقة وملمس ناعم يمنح صالون سيارتك طابعاً فاخراً ومنظماً.
                </p>
              </div>
            </div>

            {/* Infographic Image 3 */}
            <div className="lg:col-span-6 order-1 lg:order-2">
              <div className="relative aspect-square rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-slate-950">
                <Image
                  src="/landing-pages/car-organizer/images/features_2.webp"
                  alt="حماية كاملة لفرش كراسي السيارة من الأوساخ والخدوش"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Quick Installation & Guarantee (Image 4) */}
      <section className="py-14 bg-slate-900 text-white px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3.5 py-1 rounded-full border border-blue-500/20">
              تركيب فوري وسهل
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-white">
              تثبيت محكم في 10 ثوانٍ وحق المعاينة قبل الدفع
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              أحزمة مطاطية وكلبسات مخفية تثبت على أي سيارة سيدان أو SUV أو هاتشباك
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Infographic Image 4 */}
            <div className="lg:col-span-6">
              <div className="relative aspect-square rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
                <Image
                  src="/landing-pages/car-organizer/images/features_3.webp"
                  alt="تثبيت منظم ظهر مقعد السيارة وضمان المعاينة"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Checklist Column */}
            <div className="lg:col-span-6 space-y-3.5 text-right">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>حزام علوي يلتف حول مسند الرأس</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  كلبس سريع الإغلاق قابل للتعديل ليتناسب مع ارتفاع أي كرسي.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>خطافات سفلية مخفية لتثبيت أسفل المقعد</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  تمنع المنظم من التأرجح أو الابتعاد عن ظهر الكرسي أثناء حركة الركاب.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>مقاس قياسي يغطي ظهر الكرسي بالكامل (Universal Fit)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  مناسب لجميع أنواع السيارات بدون استثناء.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                <span>ضمان 14 يوم استبدال فوري + حق فتح الشحنة وتركيب المنظم وتجربته قبل دفع مليم للمندوب.</span>
              </div>
            </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right pt-2">
          {carOrganizerConfig.reviews.map((rev, idx) => (
            <div key={idx} className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{rev.name}</h3>
                    <span className="text-[11px] text-slate-500">{rev.city}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex text-amber-500">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> شراء مؤكد
                    </span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">&ldquo;{rev.comment}&rdquo;</p>
              </div>
              <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span>تقييم موثق بعد التجربة في السفر</span>
                <span>{rev.date}</span>
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
              landingPageSlug={landingPage.slug || "car-organizer"}
              landingPage={landingPage}
              selectedOffer={selectedOffer}
              onOfferSelect={(offer) => setSelectedOffer(offer)}
              onOfferChange={(offer) => setSelectedOffer(offer)}
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
