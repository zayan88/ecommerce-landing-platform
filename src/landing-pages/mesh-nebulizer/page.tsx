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
  Users,
  Check,
  AlertTriangle,
  ArrowDown,
  Package,
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
    price: product.base_price || 549,
    original_price: product.compare_at_price || 850,
    discount_label: "خصم حصري",
    is_popular: false,
    free_shipping: false,
    sort_order: 1,
  };

  const initialOffer =
    product.offers && product.offers.length > 0
      ? product.offers.find((o) => o.is_popular) || product.offers[0]
      : defaultOffer;

  const [selectedOffer, setSelectedOffer] = useState<ProductOffer>(initialOffer);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Live Countdown Timer (Simulated Urgency)
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

  const discountAmount = product.compare_at_price
    ? product.compare_at_price - product.base_price
    : 300;
  const discountPercent = product.compare_at_price
    ? Math.round((discountAmount / product.compare_at_price) * 100)
    : 35;

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-cyan-600 selection:text-white pb-24 md:pb-12"
      dir="rtl"
    >
      {/* 1. Top Urgency Bar */}
      <div className="bg-gradient-to-r from-cyan-700 via-teal-700 to-cyan-800 text-white text-xs md:text-sm py-2.5 px-4 text-center font-bold flex items-center justify-center gap-2 shadow-sm">
        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
        <span>عرض خاص لدخلة الشتا: خصم {discountPercent}% + المعاينة قبل الدفع مع المندوب</span>
        <div className="hidden sm:inline-flex items-center gap-1 bg-black/25 px-2 py-0.5 rounded-full font-mono text-xs text-amber-200">
          <Clock className="w-3.5 h-3.5" />
          <span>ينتهي العرض خلال {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}</span>
        </div>
      </div>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-6 md:pt-12 pb-12 bg-gradient-to-b from-white via-cyan-50/30 to-slate-50 border-b border-cyan-100/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Visual Column */}
            <div className="lg:col-span-6 order-1 lg:order-2">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Floating Highlights */}
                <div className="absolute -top-3 -right-3 z-20 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>صامت 100% بدون خوف للطفل</span>
                </div>

                <div className="relative rounded-3xl overflow-hidden border-2 border-cyan-200/80 bg-white shadow-2xl p-2">
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100">
                    <img
                      src="/landing-pages/mesh-nebulizer/images/hero.jpg"
                      alt="جهاز استنشاق البخار المحمول ميني"
                      className="w-full h-full object-cover object-center"
                    />
                  </div>

                  {/* Trust Badge Below Image */}
                  <div className="mt-3 p-3 rounded-xl bg-cyan-50/80 border border-cyan-200/50 flex items-center justify-between text-xs font-bold text-cyan-900">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-cyan-700" />
                      معاينة كاملة واختبار قبل الاستلام
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <Truck className="w-4 h-4" />
                      شحن سريع لجميع المحافظات
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Text & Pitch Column */}
            <div className="lg:col-span-6 order-2 lg:order-1 space-y-5 text-right">
              {/* Category Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 text-cyan-900 border border-cyan-300 text-xs font-black">
                <Wind className="w-3.5 h-3.5 text-cyan-700" />
                <span>حماية الجهاز التنفسي والربو في الشتاء</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 leading-tight tracking-tight">
                ودّع رعب جلسات البخار الفجرية في الشتا..{" "}
                <span className="text-cyan-700 underline decoration-cyan-400 decoration-wavy decoration-2">
                  جلسة صامتة لطفلك وهو نايم
                </span>{" "}
                في سريره!
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                جهاز النيبولايزر المحمول الذكي (Mesh Nebulizer) بحجم الجيب؛ يحول الدواء والمحلول لرذاذ فائق النعومة يخترق الرئة فوراً ويفك أزمات الكحة والحساسية بدون صوت مرعب وبدون فيشة كهرباء.
              </p>

              {/* Key Bullet Points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {meshNebulizerConfig.heroBadges.map((badge, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-white/90 p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                    <span>{badge}</span>
                  </div>
                ))}
              </div>

              {/* Price Display */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">سعر العرض الحصري اليوم</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-cyan-400">{product.base_price || 549}</span>
                    <span className="text-sm font-bold text-cyan-200">ج.م</span>
                    {product.compare_at_price && (
                      <span className="text-xs text-slate-400 line-through mr-2">
                        {product.compare_at_price} ج.م
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-left bg-cyan-600/30 border border-cyan-500/40 px-3 py-1.5 rounded-xl">
                  <span className="text-[11px] text-cyan-300 block font-medium">وفرت اليوم</span>
                  <span className="text-base font-black text-amber-300">{discountAmount} ج.م</span>
                </div>
              </div>

              {/* Direct Scroll Button */}
              <button
                onClick={scrollToCheckout}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-700 hover:from-cyan-700 hover:to-teal-700 text-white font-black text-base shadow-xl shadow-cyan-600/30 flex items-center justify-center gap-2 transition transform active:scale-98 cursor-pointer"
              >
                <span>احصل على الجهاز الآن (معاينة قبل الدفع)</span>
                <ArrowDown className="w-4 h-4 animate-bounce" />
              </button>

              {/* Rating Proof */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <div className="flex items-center gap-1">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="font-bold text-slate-700 mr-1">4.95 / 5</span>
                  <span>(أكثر من 420 أسرة راضية)</span>
                </div>
                <span className="text-emerald-700 font-bold">● متوفر بالمخزن وجاهز للشحن</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Pain vs Solution Comparison */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-black text-cyan-700 uppercase tracking-widest block mb-2">
              لماذا هذا الجهاز ضروري لكل بيت؟
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
              الفرق بين معاناة الأجهزة القديمة.. وراحة Mesh Nebulizer
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Old Pain */}
            <div className="p-6 rounded-3xl bg-red-50/60 border border-red-200/80 space-y-4">
              <div className="flex items-center gap-2.5 text-red-700 font-black text-base">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>أجهزة البخار القديمة والمستشفيات</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span>صوت عالي ومزعج جداً يخيف الأطفال ويجعل الجلسة بكاء وصراخ.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span>حجم ضخم ووزن ثقيل ومقيد بفيشة الكهرباء، لا يمكن نقله خارج المنزل.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span>النزول بالطفل في برد الفجر للبحث عن جلسة بخار في طوارئ المستشفيات.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span>أسعار مبالغ فيها في الصيدليات تصل إلى 2,000 و2,500 جنيه.</span>
                </li>
              </ul>
            </div>

            {/* The Mesh Solution */}
            <div className="p-6 rounded-3xl bg-cyan-50/60 border-2 border-cyan-300 space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5 text-cyan-900 font-black text-base">
                <Sparkles className="w-5 h-5 text-cyan-600 shrink-0" />
                <span>جهاز Mesh Nebulizer الحديث</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-800 font-medium">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>صامت 100%:</strong> تقدر تعمل الجلسة للطفل وهو نائم ومستغطي بدون أن يستيقظ.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>بحجم كف اليد:</strong> وزنه 100 جرام يوضع في الشنطة أو جيب الجاكيت أينما ذهبت.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>يعمل بالبطاريات وUSB:</strong> لا تحتاج لمقبس حائط، يعمل بباوربانك أو بطاريتين في أي مكان.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>قيمة اقتصادية:</strong> وفر أكثر من 60% من سعر الأجهزة المستوردة بنفس الكفاءة الطبية.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Features Grid */}
      <section className="py-12 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-black text-cyan-700 uppercase tracking-widest block mb-2">
              مميزات صممت لراحتك
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
              كل ما تحتاجه لجلسة بخار آمنة وسريعة
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {meshNebulizerConfig.features.map((feat, i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-2.5"
              >
                <div className="w-10 h-10 rounded-2xl bg-cyan-100/80 text-cyan-700 flex items-center justify-center font-bold">
                  {i + 1}
                </div>
                <h3 className="text-base font-black text-slate-900">{feat.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. What's in the box */}
      <section className="py-10 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-cyan-900 via-slate-900 to-cyan-950 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-3 text-right">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-400/30">
                  <Package className="w-3.5 h-3.5" />
                  <span>محتويات الطقم الكامل</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black">جاهز للاستخدام الفوري فور الاستلام:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs sm:text-sm text-cyan-100">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" /> جهاز Mesh Nebulizer الرئيسي
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" /> ماسك مريح مخصص للأطفال
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" /> ماسك طبي للبالغين والكبار
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" /> قطعة استنشاق مباشر للفم (Mouthpiece)
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" /> كابل توصيل USB
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" /> كتالوج إرشادات التشغيل بالعربية
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-center">
                <button
                  onClick={scrollToCheckout}
                  className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-lg transition active:scale-95 cursor-pointer"
                >
                  اطلب الطقم الآن
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Reviews */}
      <section className="py-12 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-black text-cyan-700 uppercase tracking-widest block mb-2">
              آراء وتجارب حقيقية
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
              ماذا يقول عملاؤنا عن الجهاز؟
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {meshNebulizerConfig.reviews.map((rev, i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 text-right flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex text-amber-400">
                      {[...Array(rev.rating)].map((_, idx) => (
                        <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-400">{rev.date}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                    &quot;{rev.text}&quot;
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-900">{rev.name}</div>
                  <div className="text-[11px] text-slate-500">{rev.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQs */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-8">
            <span className="text-xs font-black text-cyan-700 uppercase tracking-widest block mb-2">
              الأسئلة الشائعة
            </span>
            <h2 className="text-2xl font-black text-slate-950">
              كل ما تريد معرفته قبل الطلب
            </h2>
          </div>

          <div className="space-y-3">
            {meshNebulizerConfig.faqs.map((faq, i) => {
              const isOpen = openFaqIndex === i;
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                    className="w-full p-4 text-right flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:text-cyan-800 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform ${
                        isOpen ? "rotate-180 text-cyan-600" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-white">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. The Checkout Section (Egyptian COD Form) */}
      <section id="order-form-section" className="py-12 bg-gradient-to-b from-slate-100 to-slate-200 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>معاينة واختبار مع المندوب قبل دفع أي مليم</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading">
              اطلب الآن واستلم خلال 5 إلى 7 أيام
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              املأ بياناتك أدناه وسيتواصل معك فريق التأكيد لشحن طلبك فوراً
            </p>
          </div>

          {/* Checkout Form Card */}
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-4 sm:p-8">
            <EgyptianCheckoutForm
              product={product}
              landingPageSlug={landingPage.slug}
              selectedOffer={selectedOffer}
              onOfferSelect={(offer) => setSelectedOffer(offer)}
            />
          </div>
        </div>
      </section>

      {/* 9. Mobile Sticky CTA */}
      <StickyBuyBar
        productTitle={product.title_ar}
        price={selectedOffer.price || product.base_price}
        compareAtPrice={selectedOffer.original_price || product.compare_at_price}
      />
    </div>
  );
}
