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
    price: product.base_price || 499,
    original_price: product.compare_at_price || 750,
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

  const galleryImages = [
    { src: "/landing-pages/body-massager/images/hero.webp", label: "الجهاز والرؤوس" },
    { src: "/landing-pages/body-massager/images/features_1.webp", label: "رؤوس التدليك" },
    { src: "/landing-pages/body-massager/images/features_2.webp", label: "المواصفات" },
    { src: "/landing-pages/body-massager/images/features_3.webp", label: "طريقة الاستخدام" },
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
                alt="جهاز التدليك والمساج الشامل 5×1 الحراري والاهتزازي"
                fill
                priority
                className="object-contain p-4 transition-all duration-300"
              />
              <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                <span>تدفئة حرارية + اهتزاز عميق</span>
              </div>
              <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-xl">
                طقم 5 رؤوس مساج سيليكونية مرفق
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
                    selectedImage === img.src ? "border-orange-600 shadow-md ring-2 ring-orange-200" : "border-slate-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={img.src} alt={img.label} fill className="object-contain p-1" />
                </button>
              ))}
            </div>

            {/* Quick Micro Badges */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <Zap className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <span className="font-bold text-[11px] text-slate-800">موتور قوي وعميق</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <Flame className="w-4 h-4 text-red-500 mx-auto mb-1" />
                <span className="font-bold text-[11px] text-slate-800">حرارة مهدئة</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <span className="font-bold text-[11px] text-slate-800">معاينة قبل الدفع</span>
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
              <span className="font-bold text-orange-950">4.93 (أكثر من 340 عميل راضٍ في مصر)</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black font-heading text-slate-950 leading-tight">
              فك تشنج الرقبة والكتفين وآلام أسفل الظهر بلمسة زر واحدة في بيتك
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              جهاز التدليك والمساج الشامل 5×1 المتطور. يجمع بين المساج الاهتزازي العميق والتدفئة الحرارية لتنشيط الدورة الدموية وإراحة العضلات المتصلبة بعد ساعات العمل والقيادة.
            </p>

            {/* Checklist of Core Benefits */}
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">تفكيك فوري للشد العضلي والكتف المتصلب بعد يوم شغل مرهق</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">خاصية التدفئة الحرارية اللطيفة لتخفيف آلام الفقرات والمفاصل</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">5 رؤوس تدليك متخصصة تناسب الرقبة، الظهر، الكتف، والساقين</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">لاسلكي ويعمل بالشحن السريع USB-C لسهولة الحمل في أي مكان</span>
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
            المعاناة اليومية مع إجهاد العضلات
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading">
            آلام وتصلب عضلات الرقبة والظهر اللي بتعطلك عن يومك
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-red-600 font-bold text-sm">❌ قعدة الشاشات والمكاتب الطويلة</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                الجلوس الخاطئ 8 ساعات قدام الكمبيوتر أو الموبايل بيسبب شد عضلي مستمر في الرقبة والكتف وصداع يومي مزمن.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-red-600 font-bold text-sm">❌ تكاليف جلسات المساج والعلاج الطبيعي</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                جلسات المساج بقت بمئات الجنيهات ومفيش وقت تروح مراكز متخصصة بعد يوم شغل وتعب في الزحمة.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works in 3 Steps (من فيديو اللايت فانلز) */}
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

      {/* 5. Before & After Comparison Box (تصميم فريم 4 من الفيديو) */}
      <section className="py-12 bg-slate-100/80 border-y border-slate-200 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6 text-center">
          <span className="text-xs font-bold text-orange-700 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
            الفرق واضح
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading">
            يومك قبل وبعد جهاز التدليك الشامل 5×1
          </h2>
          <p className="text-xs text-slate-600">نفس المجهود والعمل... لكن مع راحة واسترخاء فوري لعضلاتك</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-right">
            {/* Without */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="text-red-600 font-black text-base flex items-center gap-1.5">
                <span>من غيره</span> <span>😵</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                {bodyMassagerConfig.beforeAfter.without.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-red-600">
                    <span>❌</span> <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* With Device */}
            <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-3 border border-slate-800">
              <div className="text-amber-400 font-black text-base flex items-center gap-1.5">
                <span>معاه</span> <span>😌</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-200">
                {bodyMassagerConfig.beforeAfter.with.map((item, idx) => (
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
              {bodyMassagerConfig.beforeAfter.valueHook}
            </h3>
            <p className="text-xs text-slate-600 mt-1 max-w-xl mx-auto">
              مش محتاج تسيب بيتك أو تدفع مبالغ ضخمة في جلسات خارجية.. راحة عضلاتك أصبحت في متناول يدك دائماً.
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
          آراء العملاء بعد تجربة الجهاز
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right pt-2">
          {bodyMassagerConfig.reviews.map((rev, idx) => (
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
              <div className="text-xs font-bold text-orange-800 pt-1 border-t border-slate-100 flex items-center justify-between">
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
          {bodyMassagerConfig.faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 font-bold text-sm text-slate-900 flex items-center justify-between gap-4 text-right cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-orange-600 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
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
            افتح الشحنة بنفسك مع المندوب واختبر محتويات العلبة وسلامة الجهاز والرؤوس المرفقة قبل أن تدفع أي مليم. وفي حالة وجود أي عيب صناعة، يتم الاستبدال فوراً حتى باب بيتك.
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
