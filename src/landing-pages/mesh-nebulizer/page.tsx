"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Product, LandingPage, ProductOffer } from "@/types";
import { EgyptianCheckoutForm } from "@/components/shared/EgyptianCheckoutForm";
import { StickyBuyBar } from "@/components/shared/StickyBuyBar";
import { meshNebulizerConfig } from "./config";
import {
  Star,
  ShieldCheck,
  Truck,
  CheckCircle2,
  ChevronDown,
  VolumeX,
  Wind,
  BatteryCharging,
  Sparkles,
  Clock,
  Heart,
  Baby,
  Check,
  ArrowDown,
  Package,
  Activity,
  ThumbsUp,
  Moon,
  Briefcase,
  Plane,
  Home,
  Zap,
} from "lucide-react";

interface MeshNebulizerPageProps {
  product: Product;
  landingPage: LandingPage;
}

export default function MeshNebulizerLandingPage({
  product,
  landingPage,
}: MeshNebulizerPageProps) {
  const defaultOffer: ProductOffer = {
    id: `offer-default-${product.id}`,
    product_id: product.id,
    title_ar: "قطعة واحدة (تجربة)",
    quantity: 1,
    price: product.base_price || 599,
    original_price: product.compare_at_price || 850,
    discount_label: "خصم 35%",
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
  const [timeLeft, setTimeLeft] = useState({ hours: 3, minutes: 28, seconds: 45 });

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
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-cyan-500 selection:text-white" dir="rtl">
      {/* 1. Top Urgency Announcement Bar */}
      <div className="bg-gradient-to-r from-cyan-700 via-sky-600 to-cyan-800 text-white py-2.5 px-4 text-center text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
        <span>عرض شتاء 2026: شحن مجاني 100% لجميع المحافظات + حق المعاينة والتجربة قبل الدفع</span>
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
                src="/landing-pages/mesh-nebulizer/images/hero.webp"
                alt="جهاز استنشاق البخار المحمول ميني Mesh Nebulizer"
                fill
                priority
                className="object-contain p-4"
              />
              <div className="absolute top-3 right-3 bg-cyan-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                <VolumeX className="w-3.5 h-3.5" />
                <span>صامت تماماً 0dB</span>
              </div>
              <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-xl">
                ماسك أطفال + ماسك كبار + قطعة فم
              </div>
            </div>

            {/* Quick Micro Badges */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <Baby className="w-4 h-4 text-cyan-600 mx-auto mb-1" />
                <span className="font-bold text-[11px] text-slate-800">والطفل نائم</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <BatteryCharging className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <span className="font-bold text-[11px] text-slate-800">بطاريات + USB</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-sky-600 mx-auto mb-1" />
                <span className="font-bold text-[11px] text-slate-800">معاينة قبل الدفع</span>
              </div>
            </div>
          </div>

          {/* Headline & Immediate Value Hook */}
          <div className="lg:col-span-6 space-y-4 text-right">
            {/* Rating */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-xs">
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <span className="font-bold text-cyan-900">4.95 (أكثر من 420 أسرة راضية)</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black font-heading text-slate-950 leading-tight">
              جلسة بخار هادئة لطفلك وهو نايم في سريره وبدون بكاء ولا خوف
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              جهاز استنشاق البخار المحمول ميني (Mesh Nebulizer) فائق الهدوء. يحول الدواء والمحلول لرذاذ دقيق وسريع الامتصاص للرئة، بحجم الجيب للبيت والسفر والمستشفى.
            </p>

            {/* Checklist of Core Benefits */}
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">صامت تماماً (بدون صوت الكمبروسر المزعج والمخيف للأطفال)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">رذاذ ناعم جداً بتقنية Mesh يصل مباشرة للشعب الهوائية</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">وزن 100 جرام بحجم الجيب يشتغل بالبطاريات أو شاحن الموبايل</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">طقم كامل: ماسك أطفال + ماسك كبار + قطعة استنشاق للفم</span>
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-xs text-slate-500 block">سعر العرض الخاص اليوم:</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-cyan-700 font-mono">{selectedOffer.price} ج.م</span>
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
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white font-black text-base sm:text-lg shadow-xl shadow-cyan-600/25 active:scale-98 transition cursor-pointer flex items-center justify-center gap-2"
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
            المشكلة اللي بتواجه كل أب وأم في الشتاء
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading">
            رعب أزمات منتصف الليل ونزلات البرد المفاجئة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-red-600 font-bold text-sm">❌ نزول المستشفى في عز السقعة والمطر</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                لما صدر الطفل يقفل فجأة وتضطر تنزل بيه الفجر تدور على طوارئ أو صيدلية تعمل جلسة بخار وسط العدوى والميكروبات.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-red-600 font-bold text-sm">❌ معركة وصراخ الطفل مع الأجهزة القديمة</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                صوت الموتور الضخم بيخوف الطفل فيرفض الجلسة تماماً، والبكاء يزيد من ضيق التنفس ويخلي الجلسة عذاب للجميع.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works in 3 Steps (من فيديو اللايت فانلز) */}
      <section className="py-12 px-4 sm:px-6 max-w-4xl mx-auto space-y-6 text-center">
        <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200">
          سهولة في 3 خطوات فقط
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading">
          إزاي بيشتغل في 3 خطوات بسيطة؟
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-right pt-2">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-full bg-cyan-700 text-white font-black text-sm flex items-center justify-center">
              1
            </div>
            <h3 className="font-bold text-sm text-slate-900">ضع المحلول في الكوب</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              افتح الغطاء وضع جرعة محلول الملح أو الدواء الموصوف في الكوب واقفل الغطاء بإحكام.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-full bg-cyan-700 text-white font-black text-sm flex items-center justify-center">
              2
            </div>
            <h3 className="font-bold text-sm text-slate-900">ركّب الماسك المناسب</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              اختر ماسك الأطفال أو الكبار أو قطعة الفم وركّبها على الجهاز بسهولة.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-full bg-cyan-700 text-white font-black text-sm flex items-center justify-center">
              3
            </div>
            <h3 className="font-bold text-sm text-slate-900">اضغط زر التشغيل</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              بلمسة زر واحدة يبدأ البخار الناعم بالتدفق في هدوء تام وامتصاص فوري في الرئة.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Specifications & Anatomy Breakdown (Image 2) */}
      <section className="py-14 bg-slate-900 text-white px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3.5 py-1 rounded-full border border-cyan-500/20">
              التشريح الطبي والمواصفات
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-white">
              تشريح ومواصفات جهاز Mesh Nebulizer المحمول
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              تقنية شبكية دقيقة تحول الدواء إلى رذاذ فائق النعومة يخترق الشعب الهوائية فوراً
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Infographic Image 2 */}
            <div className="lg:col-span-6">
              <div className="relative aspect-square rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
                <Image
                  src="/landing-pages/mesh-nebulizer/images/features_1.webp"
                  alt="تشريح ومواصفات جهاز استنشاق البخار المحمول"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Feature Cards Column */}
            <div className="lg:col-span-6 space-y-3.5 text-right">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-cyan-400 font-black text-sm">
                  <VolumeX className="w-4 h-4 shrink-0" />
                  <span>محرك صامت تماماً بتقنية Ultrasonic Mesh</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  مستوى صوت أقل من 25dB يتيح عمل الجلسة للطفل أثناء نومه دون أي فزع أو انزعاج.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-cyan-400 font-black text-sm">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>حجم جزيئات رذاذ ميكروني دقيق جداً (≤ 5µm)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  أقصى كفاءة امتصاص للدواء في الحويصلات الهوائية مع تقليل الهدر والترسيب.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-cyan-400 font-black text-sm">
                  <BatteryCharging className="w-4 h-4 shrink-0" />
                  <span>تشغيل مزدوج (بطاريات AA + منفذ USB Type-C)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  مرونة كاملة في الاستخدام المنزلي أو أثناء السفر والرحلات بدون الحاجة لمصدر كهرباء ثابت.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-cyan-400 font-black text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>إيقاف تلقائي ذكي عند انتهاء الدواء</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  نظام حماية يوقف الجهاز تلقائياً لحماية الشبكة المعدنية وإطالة عمر الجهاز.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Family Use Cases & Scenarios (Image 3) */}
      <section className="py-14 bg-white border-b border-slate-200 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-3.5 py-1 rounded-full border border-cyan-200">
              دواعي الاستعمال العائلية
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-slate-950">
              جهاز واحد يلبي احتياجات كل أفراد الأسرة
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              من الرضع والأطفال حتى كبار السن ومرضى الجيوب الأنفية وحساسية الصدر
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Scenarios Description Column */}
            <div className="lg:col-span-6 space-y-3 text-right order-2 lg:order-1">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <Baby className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>للأطفال والرضع أثناء النوم</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  تسكين فوري للكحة وضيق التنفس الفجري دون إيقاظ الطفل أو مقاومة وبكاء.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>في المكتب وبيئات العمل المكيفة</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  جلسة سريعة في 3 دقائق بقطعة الفم لتخفيف جفاف الشعب الهوائية وتهيج الحساسية.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <Plane className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>في السفر والسيارة والطوارئ</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  حجم جيب فائق الخفة يغنيك عن البحث عن مستشفيات أو صيدليات على الطرق السريعة.
                </p>
              </div>
            </div>

            {/* Infographic Image 3 */}
            <div className="lg:col-span-6 order-1 lg:order-2">
              <div className="relative aspect-square rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-slate-950">
                <Image
                  src="/landing-pages/mesh-nebulizer/images/features_2.webp"
                  alt="دواعي الاستعمال العائلية لجهاز استنشاق البخار"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Medical Kit Checklist & Guarantee (Image 4) */}
      <section className="py-14 bg-slate-900 text-white px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3.5 py-1 rounded-full border border-cyan-500/20">
              طقم طبي متكامل
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-white">
              محتويات العلبة الأصلية وحق المعاينة
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              كل ما تحتاجه لبدء الجلسة فوراً مع حق الفحص والتجربة قبل الدفع
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Infographic Image 4 */}
            <div className="lg:col-span-6">
              <div className="relative aspect-square rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
                <Image
                  src="/landing-pages/mesh-nebulizer/images/features_3.webp"
                  alt="محتويات علبة جهاز استنشاق البخار ميني نيبولايزر"
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
                  <span>جهاز النيبولايزر الذكي الأصلي</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  الوحدة الأساسية المجهزة بالشبكة الميكرونية وخزان المحلول الطبي.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>ماسك سيليكون طبي للأطفال + ماسك للكبار</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  ماسكات ناعمة ومريحة ومضادة للحساسية تناسب كل الأعمار.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>قطعة استنشاق فموية مباشرة (Mouthpiece)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  لجلسات الكبار السريعة ومرضى الجيوب الأنفية والربو.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>كابل شحن USB + كتيب تعليمات التشغيل</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  دليل إرشادات الاستخدام والتنظيف مع كابل توصيل سريع.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                <span>ضمان 14 يوم استبدال فوري + حق فتح الكرتونة ومعاينة المحتويات قبل الدفع للمندوب.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Before & After Comparison Box (تصميم فريم 4 من الفيديو) */}
      <section className="py-12 bg-slate-100/80 border-y border-slate-200 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6 text-center">
          <span className="text-xs font-bold text-cyan-700 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
            الفرق واضح
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading">
            يومك قبل وبعد جهاز Mesh Nebulizer
          </h2>
          <p className="text-xs text-slate-600">نفس الطفل، نفس البرد... لكن تجربة علاج هادئة ومريحة تماماً</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-right">
            {/* Without */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="text-red-600 font-black text-base flex items-center gap-1.5">
                <span>من غيره</span> <span>😵</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                <li className="flex items-center gap-2 text-red-600">
                  <span>❌</span> <span className="text-slate-700">صوت رنان ومزعج يرعب الطفل</span>
                </li>
                <li className="flex items-center gap-2 text-red-600">
                  <span>❌</span> <span className="text-slate-700">تقيّد بفيشة وسلك كهرباء الحيطة</span>
                </li>
                <li className="flex items-center gap-2 text-red-600">
                  <span>❌</span> <span className="text-slate-700">نزول طوارئ ومستشفيات نص الليل</span>
                </li>
                <li className="flex items-center gap-2 text-red-600">
                  <span>❌</span> <span className="text-slate-700">جهاز ضخم تقيل مستحيل تاخده في شنطة</span>
                </li>
              </ul>
            </div>

            {/* With Device */}
            <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-3 border border-slate-800">
              <div className="text-cyan-400 font-black text-base flex items-center gap-1.5">
                <span>معاه</span> <span>😌</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-200">
                <li className="flex items-center gap-2 text-emerald-400">
                  <span>✓</span> <span>صامت تماماً.. الجلسة والطفل نايم</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-400">
                  <span>✓</span> <span>يعمل بالبطاريات و USB في أي مكان</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-400">
                  <span>✓</span> <span>إسعاف فوري في سرير بيتك وبأمان</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-400">
                  <span>✓</span> <span>حجم كف اليد (100 جرام) في أي شنطة</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Value Hook */}
          <div className="pt-4 text-center">
            <h3 className="text-lg sm:text-xl font-black text-slate-950 font-heading">
              الفرق مش في السعر... الفرق في راحة نفس طفلك وهدوء بيتك
            </h3>
            <p className="text-xs text-slate-600 mt-1 max-w-xl mx-auto">
              الجهاز القديم بيعمل جلسة بصعوبة وصراخ.. لكن جهاز الميش بيوفرلك راحة البال وجلسة سريعة في ثواني.
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
          آراء الأمهات والآباء بعد التجربة
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right pt-2">
          {meshNebulizerConfig.reviews.map((rev, idx) => (
            <div key={idx} className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{rev.name}</h3>
                    <span className="text-[11px] text-slate-500">{rev.location}</span>
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
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">&ldquo;{rev.text || (rev as any).comment}&rdquo;</p>
              </div>
              <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span>تجربة علاجية موثقة</span>
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
              landingPageSlug={landingPage.slug || "mesh-nebulizer"}
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
          {meshNebulizerConfig.faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 font-bold text-sm text-slate-900 flex items-center justify-between gap-4 text-right cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-cyan-600 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
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
            افتح الشحنة بنفسك مع المندوب وتأكد من محتويات العلبة وسلامتها تماماً قبل أن تدفع أي مليم. وفي حالة وجود أي عيب صناعة، يتم الاستبدال فوراً لباب منزلك.
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
