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
  const [selectedImage, setSelectedImage] = useState("/landing-pages/mesh-nebulizer/images/hero.webp");
  const [activeUseTab, setActiveUseTab] = useState<"sleep" | "office" | "travel">("sleep");

  const galleryImages = [
    { src: "/landing-pages/mesh-nebulizer/images/hero.webp", label: "الجهاز الصامت والمواصفات" },
    { src: "/landing-pages/mesh-nebulizer/images/features_1.webp", label: "تشريح وأجزاء النيبولايزر" },
    { src: "/landing-pages/mesh-nebulizer/images/features_2.webp", label: "دواعي الاستعمال العائلية" },
    { src: "/landing-pages/mesh-nebulizer/images/features_3.webp", label: "محتويات الطقم الطبي كاملة" },
  ];

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
          {/* Product Image & Interactive Gallery */}
          <div className="lg:col-span-6 space-y-3">
            <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-white aspect-square">
              <Image
                src={selectedImage}
                alt="جهاز استنشاق البخار المحمول ميني Mesh Nebulizer"
                fill
                priority
                className="object-contain p-4 transition-all duration-300"
              />
              <div className="absolute top-3 right-3 bg-cyan-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                <VolumeX className="w-3.5 h-3.5" />
                <span>صامت تماماً 0dB</span>
              </div>
              <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-xl">
                ماسك أطفال + ماسك كبار + قطعة فم
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
                    selectedImage === img.src ? "border-cyan-600 shadow-md ring-2 ring-cyan-200" : "border-slate-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={img.src} alt={img.label} fill className="object-contain p-1" />
                </button>
              ))}
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

      {/* 2.5. Comprehensive Visual Infographics Section (يغنيك عن القراءة) */}
      <section className="py-12 bg-slate-900 text-white px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3.5 py-1 rounded-full border border-cyan-500/20">
              كل التفاصيل واضحة بالصور
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-white">
              انفوجرافيك تفصيلي للنيبولايزر الأصلي يغنيك عن القراءة
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              تعرّف على التشريح الطبي الدقيق، ودواعي الاستخدام، ومحتويات العلبة بالكامل
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl group hover:border-cyan-500/50 transition">
              <div className="relative aspect-square">
                <Image
                  src="/landing-pages/mesh-nebulizer/images/features_1.webp"
                  alt="تشريح ومواصفات النيبولايزر الذكي"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="p-4 bg-slate-900/90 text-right space-y-1">
                <h3 className="font-black text-sm text-cyan-400">1. تشريح الجهاز والمواصفات</h3>
                <p className="text-xs text-slate-300">زر تشغيل ذكي بلمسة واحدة + منفذ USB + درج بطاريات AA</p>
              </div>
            </div>

            <div className="rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl group hover:border-cyan-500/50 transition">
              <div className="relative aspect-square">
                <Image
                  src="/landing-pages/mesh-nebulizer/images/features_2.webp"
                  alt="دواعي الاستعمال العائلية"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="p-4 bg-slate-900/90 text-right space-y-1">
                <h3 className="font-black text-sm text-cyan-400">2. دواعي الاستعمال العائلية</h3>
                <p className="text-xs text-slate-300">للأطفال والرضع أثناء النوم بدون فزع، ولكبار السن في السفر</p>
              </div>
            </div>

            <div className="rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl group hover:border-cyan-500/50 transition">
              <div className="relative aspect-square">
                <Image
                  src="/landing-pages/mesh-nebulizer/images/features_3.webp"
                  alt="محتويات العلبة الطبية كاملة"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="p-4 bg-slate-900/90 text-right space-y-1">
                <h3 className="font-black text-sm text-cyan-400">3. محتويات الطقم الطبي (افتح واختبر)</h3>
                <p className="text-xs text-slate-300">ماسك أطفال + ماسك كبار + قطعة فم + كابل USB + دليل التشغيل</p>
              </div>
            </div>
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

      {/* 4.5. Interactive Use Cases Section (حالات الاستخدام اليومية) */}
      <section className="py-14 bg-slate-900 text-white px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              جهاز واحد لكل أوقاتك وعائلتك
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-white">
              أينما كنت.. جلسة استنشاق هادئة وفعالة في متناول يدك
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              حل فوري متكامل صمم ليعمل في كافة الظروف اليومية بهدوء وكفاءة
            </p>
          </div>

          {/* Interactive Rounded Pill Tab Switcher */}
          <div className="flex justify-center gap-2 max-w-md mx-auto p-1.5 rounded-full bg-[#11192e] border border-slate-800">
            <button
              onClick={() => setActiveUseTab("sleep")}
              className={`flex-1 py-2.5 px-3 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeUseTab === "sleep"
                  ? "bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-lg shadow-cyan-600/30 font-black"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>أثناء نوم الطفل</span>
            </button>
            <button
              onClick={() => setActiveUseTab("office")}
              className={`flex-1 py-2.5 px-3 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeUseTab === "office"
                  ? "bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-lg shadow-cyan-600/30 font-black"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>في المكتب</span>
            </button>
            <button
              onClick={() => setActiveUseTab("travel")}
              className={`flex-1 py-2.5 px-3 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeUseTab === "travel"
                  ? "bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-lg shadow-cyan-600/30 font-black"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Plane className="w-4 h-4" />
              <span>في السفر</span>
            </button>
          </div>

          {/* Active Tab Showcase Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800 text-right">
            {activeUseTab === "sleep" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-5 relative aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                  <Image
                    src="/landing-pages/mesh-nebulizer/images/features_1.webp"
                    alt="جلسة استنشاق والطفل نائم في السرير"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-cyan-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full">
                    صوت هادئ أقل من 25dB
                  </div>
                </div>
                <div className="md:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 text-cyan-400 font-black text-lg">
                    <Moon className="w-5 h-5" />
                    <span>جلسة هادئة والطفل مستغرق في نومه (Night Sleep Mode)</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    ودّع معارك وبكاء منتصف الليل! الجهاز صامت تماماً بتقنية الـ Ultrasonic Mesh، تقدر تقربه من أنف طفلك وهو نايم في سريره وتعمل له الجلسة كاملة بدون ما يصحى أو يتفزع من صوت الموتور الضخم.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-slate-300">
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>ماسك سيليكون طبي ناعم للأطفال</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>بدون اهتزاز أو سخونة للجهاز</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>إسعاف فوري لأزمات ضيق التنفس والكحة</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>يغلق تلقائياً عند انتهاء الدواء بأمان</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeUseTab === "office" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-5 relative aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                  <Image
                    src="/landing-pages/mesh-nebulizer/images/features_2.webp"
                    alt="دواعي استعمال جهاز البخار في المكتب"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-cyan-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full">
                    وزن 100 جرام بحجم الجيب
                  </div>
                </div>
                <div className="md:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 text-amber-400 font-black text-lg">
                    <Briefcase className="w-5 h-5" />
                    <span>إسعاف فوري لأزمات الحساسية والربو في العمل (Office Emergency)</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    لو بتعاني من حساسية الصدر أو الجيوب الأنفية مع تكييفات المكاتب والتراب، الجهاز بحجم كف اليد تقدر تشغله على مكتبك بوصلة الـ USB أو البطاريات وتاخد جرعتك بقطعة الفم في 3 دقائق وتكمل شغلك براحة تامة.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-slate-300">
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>يعمل على شاحن الموبايل أو اللابتوب</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>قطعة استنشاق فموية سريعة ومباشرة</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>لا يسبب أي إحراج أو إزعاج لزملائك</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>خزان محكم مانع للتسريب في الحقيبة</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeUseTab === "travel" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-5 relative aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                  <Image
                    src="/landing-pages/mesh-nebulizer/images/features_3.webp"
                    alt="جهاز استنشاق البخار في السفر والسيارة"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-cyan-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full">
                    جاهز للسفر والطوارئ
                  </div>
                </div>
                <div className="md:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 text-emerald-400 font-black text-lg">
                    <Plane className="w-5 h-5" />
                    <span>رفيقك في شنطة السفر والسيارة (Travel & On-the-Go)</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    تقلبات الجو في السفر ونزلات البرد المفاجئة على الطرق السريعة مش هتقلقك بعد اليوم. ركّب بطاريتين عاديتين أو وصّله بولاعة العربية واستخدمه فوراً دون الحاجة للبحث عن صيدليات أو مستشفيات طوارئ.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-slate-300">
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>يعمل ببطاريتين AA أو باور بانك</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>طقم متكامل للكبار والأطفال في علبة واحدة</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>خفيف وسهل الغسيل بمياه دافئة في ثوانٍ</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>أمان تام ومعتمد للاستخدام المنزلي والخارجي</span>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right pt-2">
          {meshNebulizerConfig.reviews.map((rev, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-amber-500">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <span className="text-[11px] text-slate-400">{rev.date}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">&ldquo;{rev.text || (rev as any).comment}&rdquo;</p>
              <div className="text-xs font-bold text-cyan-800 pt-1 border-t border-slate-100 flex items-center justify-between">
                <span>{rev.name}</span>
                <span className="text-[10px] text-slate-400 font-normal">{rev.location}</span>
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
