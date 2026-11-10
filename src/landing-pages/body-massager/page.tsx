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
                src="/landing-pages/body-massager/images/hero.webp"
                alt={bodyMassagerConfig.productTitle}
                fill
                priority
                className="object-contain p-4"
              />
              <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                <span>كمادات حرارية + مساج اهتزازي</span>
              </div>
              <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-xl">
                لاسلكي بشاشة ديجيتال + شحن USB
              </div>
            </div>

            {/* Quick Micro Badges */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
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

      {/* 4. Specifications & Anatomy Breakdown (Image 2) */}
      <section className="py-14 bg-slate-900 text-white px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-3.5 py-1 rounded-full border border-orange-500/20">
              التشريح الهندسي والمواصفات
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-white">
              تشريح ومواصفات جهاز التدليك الشامل 5×1
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              تصميم مريح يلتف بإحكام على أي منطقة في جسمك مع أحدث تقنيات المساج والحرارة
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Infographic Image 2 */}
            <div className="lg:col-span-6">
              <div className="relative aspect-square rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
                <Image
                  src="/landing-pages/body-massager/images/features_1.webp"
                  alt="تشريح ومواصفات جهاز التدليك الشامل 5 في 1"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Feature Cards Column */}
            <div className="lg:col-span-6 space-y-3.5 text-right">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-orange-400 font-black text-sm">
                  <Zap className="w-4 h-4 shrink-0" />
                  <span>شاشة ديجيتال باللمس LED</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  تحكم سهل وسريع في 3 مستويات حرارة (45° - 55° - 65°) و3 سرعات اهتزاز ومؤقت أمان ذكي.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-orange-400 font-black text-sm">
                  <Flame className="w-4 h-4 shrink-0" />
                  <span>كمادات حرارية بالأشعة تحت الحمراء</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  تغلغل حراري عميق لتسكين فوري للألم وتنشيط الدورة الدموية وفك تيبس المفاصل والفقرات.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-orange-400 font-black text-sm">
                  <Activity className="w-4 h-4 shrink-0" />
                  <span>مساج واهتزاز عميق متعدد الأنماط</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  مواتير قوية لتفكيك العقد العضلية والشد العضلي الناتج عن الجلوس أو التمارين الشاقة.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-orange-400 font-black text-sm">
                  <BatteryCharging className="w-4 h-4 shrink-0" />
                  <span>بطارية ليثيوم لاسلكية وشحن USB Type-C</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  حرية حركة كاملة بدون أي أسلاك مقيدة، استخدمه في البيت أو المكتب أو أثناء السفر.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 4-in-1 Body Zones Showcase (Image 3) */}
      <section className="py-14 bg-white border-b border-slate-200 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3.5 py-1 rounded-full border border-orange-200">
              جهاز واحد لجسمك كله
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-slate-950">
              4 استخدامات حقيقية في جهاز واحد
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              حزام مرن بأشرطة فيلكرو مطاطية يلتف بسهولة على أي منطقة تحتاج راحة وتسكين فوري
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Zones Description Column */}
            <div className="lg:col-span-6 space-y-3 text-right order-2 lg:order-1">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-600 text-white text-xs flex items-center justify-center font-mono">1</span>
                  <span>الكتف والرقبة</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  تسكين إجهاد وتشنجات المكاتب والشاشات وصداع الرقبة وفك تيبس لوح الكتف فوراً.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-600 text-white text-xs flex items-center justify-center font-mono">2</span>
                  <span>الظهر والفقرات</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  دعم فقرات الظهر القطنية وتخفيف آلام الجلوس الطويل والقيادة والشد العضلي.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-600 text-white text-xs flex items-center justify-center font-mono">3</span>
                  <span>البطن والوسط</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  كمادات تدفئة مهدئة لتسكين التقلصات والمغص وتحسين الراحة في أيام البرد الشديد.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-600 text-white text-xs flex items-center justify-center font-mono">4</span>
                  <span>الركبة والمفاصل والرجل</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  علاج خشونة الركبة والمفاصل وتسهيل الحركة وصعود السلالم بدون ألم لكبار السن والرياضيين.
                </p>
              </div>
            </div>

            {/* Infographic Image 3 */}
            <div className="lg:col-span-6 order-1 lg:order-2">
              <div className="relative aspect-square rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-slate-950">
                <Image
                  src="/landing-pages/body-massager/images/features_2.webp"
                  alt="4 مناطق استخدام في جهاز واحد"
                  fill
                  className="object-contain"
                />
              </div>
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

      {/* 5. Package Contents & Guarantee (Image 4) */}
      <section className="py-14 bg-slate-900 text-white px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3.5 py-1 rounded-full border border-amber-500/20">
              ماذا ستستلم في شحنتك؟
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-white">
              محتويات العلبة الأصلية والضمان
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              علبة متكاملة وجهاز أصلي جاهز للاستخدام الفوري فور استلامه
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Infographic Image 4 */}
            <div className="lg:col-span-6">
              <div className="relative aspect-square rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
                <Image
                  src="/landing-pages/body-massager/images/features_3.webp"
                  alt="محتويات علبة جهاز التدليك والمساج الشامل"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Checklist & Guarantee Column */}
            <div className="lg:col-span-6 space-y-3.5 text-right">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>جهاز المساج والتدليك 5×1 الأصلي</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  الجهاز الرئيسي بشاشة اللمس LED وبطارية ليثيوم مدمجة وألواح التدفئة المتقدمة.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>حزام تثبيت فيلكرو مرن وقابل للتعديل</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  أشرطة مطاطية قوية تلتف بإحكام وثبات على الرقبة، الكتف، الظهر، البطن، أو الركبة.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>كابل شحن سريع Type-C أصلي</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  شحن سهل وسريع من أي شاحن موبايل أو باوربانك أو منفذ USB في العربية.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>كتيب إرشادات الاستخدام بالعربية والإنجليزية</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  دليل توضيحي لطرق الاستخدام المثالية والمدة الموصى بها لكل منطقة بالجسم.
                </p>
              </div>

              {/* Inspection & 14-day warranty pill */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                <span>ضمان 14 يوم استبدال أو استرجاع + حق فتح الشحنة ومعاينتها بالكامل قبل الدفع للمندوب.</span>
              </div>
            </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right pt-2">
            {bodyMassagerConfig.reviews.map((rev, idx) => (
              <div key={idx} className="p-5 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-2xs space-y-3 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{rev.name}</h3>
                      <span className="text-[11px] text-slate-500">{rev.city}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex text-amber-500">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        <Check className="w-2.5 h-2.5 text-emerald-600" /> شراء مؤكد
                      </span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">&ldquo;{rev.comment}&rdquo;</p>
                </div>
                <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span>تم تقييم المنتج بعد الاستخدام الفعلي</span>
                  <span>{rev.date}</span>
                </div>
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
            landingPageSlug={landingPage.slug || "body-massager"}
            landingPage={landingPage}
            selectedOffer={selectedOffer}
            onOfferSelect={(offer) => setSelectedOffer(offer)}
            onOfferChange={(offer) => setSelectedOffer(offer)}
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
