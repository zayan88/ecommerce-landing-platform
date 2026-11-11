"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Product, LandingPage, ProductOffer } from "@/types";
import { EgyptianCheckoutForm } from "@/components/shared/EgyptianCheckoutForm";
import { StickyBuyBar } from "@/components/shared/StickyBuyBar";
import { HeroOfferSelector } from "@/components/shared/HeroOfferSelector";
import { astrobeamConfig } from "./config";
import {
  Star,
  ShieldCheck,
  Truck,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Clock,
  Heart,
  Check,
  ArrowDown,
  Package,
  Layers,
  Moon,
  Compass,
  Usb,
  Eye,
  Camera,
  Gift,
} from "lucide-react";

interface AstroBeamPageProps {
  product: Product;
  landingPage: LandingPage;
}

export default function AstroBeamLandingPage({
  product,
  landingPage,
}: AstroBeamPageProps) {
  const defaultOffer: ProductOffer = {
    id: `offer-default-${product.id}`,
    product_id: product.id,
    title_ar: "قطعة واحدة (تجربة)",
    quantity: 1,
    price: product.base_price || 450,
    original_price: product.compare_at_price || 650,
    discount_label: "خصم 31%",
    is_popular: false,
    free_shipping: true,
    sort_order: 1,
  };

  const initialOffer =
    product.offers && product.offers.length > 0
      ? product.offers.find((o) => o.quantity === 1) || product.offers[0]
      : defaultOffer;

  const [selectedOffer, setSelectedOffer] = useState<ProductOffer>(initialOffer);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Live Urgency Timer
  const [timeLeft, setTimeLeft] = useState({ hours: 3, minutes: 48, seconds: 20 });

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
        return { hours: 3, minutes: 45, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const scrollToCheckout = () => {
    const el = document.getElementById("order-form-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-600 selection:text-white" dir="rtl">
      {/* 1. Top Urgency Announcement Bar */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white py-2.5 px-4 text-center text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 border-b border-purple-500/30">
        <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />
        <span>عرض خاص اليوم: شحن مجاني 100% لكافة المحافظات + حق المعاينة والتجربة قبل الدفع</span>
        <span className="hidden sm:inline bg-purple-500/20 px-2 py-0.5 rounded-full text-xs font-mono font-black text-purple-200 border border-purple-400/30">
          ينتهي خلال {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
        </span>
      </div>

      {/* 2. Hero Section */}
      <section className="pt-6 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Product Image */}
          <div className="lg:col-span-6 space-y-3">
            <div className="relative rounded-3xl overflow-hidden border border-purple-500/30 shadow-2xl bg-slate-900 aspect-square">
              <Image
                src={astrobeamConfig.images[0].src}
                alt={astrobeamConfig.productTitle}
                fill
                priority
                className="object-cover"
              />
              <div className="absolute top-3 right-3 bg-purple-600/90 backdrop-blur-md text-white text-xs font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1 border border-purple-400/30">
                <Moon className="w-3.5 h-3.5" />
                <span>6 غيارات فضاء عالية النقاء</span>
              </div>
              <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md text-purple-300 text-[11px] font-bold px-3 py-1 rounded-xl border border-purple-500/20">
                ذراع مرن 360° + تشغيل USB
              </div>
            </div>

            {/* Quick Micro Badges */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-purple-500/20 shadow-xs">
                <Moon className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <span className="font-bold text-[11px] text-slate-200">6 غيارات متنوعة</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-purple-500/20 shadow-xs">
                <Compass className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                <span className="font-bold text-[11px] text-slate-200">دوران 360 درجة</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-purple-500/20 shadow-xs">
                <Usb className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <span className="font-bold text-[11px] text-slate-200">تشغيل بـ USB</span>
              </div>
            </div>
          </div>

          {/* Value Hook & Pricing */}
          <div className="lg:col-span-6 space-y-4 text-right">
            {/* Social Proof */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-xs">
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-purple-200">{astrobeamConfig.rating} (أكثر من {astrobeamConfig.reviewsCount} عميل راضٍ)</span>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold">
                🚀 حوّل أوضتك لعالم تاني
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black font-heading text-white leading-tight">
              {astrobeamConfig.productTitle}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {astrobeamConfig.subtitle}
            </p>

            {/* Core Badges Checklist */}
            <div className="space-y-2 py-2">
              {astrobeamConfig.heroBadges.map((badge, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span className="font-medium">{badge}</span>
                </div>
              ))}
            </div>

            {/* Interactive Hero Offer Selector */}
            <HeroOfferSelector
              offers={product.offers || []}
              selectedOffer={selectedOffer}
              onSelectOffer={(offer) => setSelectedOffer(offer)}
              accentColor="purple"
              isDarkTheme={true}
            />

            {/* Pricing Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 to-slate-900 border border-purple-500/40 shadow-lg flex items-center justify-between">
              <div>
                <span className="text-xs text-purple-300 block font-bold">
                  {selectedOffer?.quantity === 1 ? "سعر القطعة الواحدة في العرض:" : `سعر العرض (${selectedOffer?.quantity} قطع):`}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-400 font-heading">
                    {selectedOffer?.price || astrobeamConfig.basePrice} ج.م
                  </span>
                  <span className="text-sm text-slate-400 line-through">
                    {selectedOffer?.original_price || astrobeamConfig.comparePrice} ج.م
                  </span>
                  {selectedOffer?.quantity === 1 && (
                    <span className="text-xs bg-purple-900/90 text-purple-200 font-bold px-2 py-0.5 rounded-full border border-purple-700">
                      قطعة واحدة
                    </span>
                  )}
                  {selectedOffer?.discount_label && selectedOffer.quantity > 1 && (
                    <span className="text-xs bg-red-600/90 text-white font-bold px-2 py-0.5 rounded-full">
                      {selectedOffer.discount_label}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-left text-xs text-emerald-400 font-bold">
                <div>✓ شحن مجاني 100%</div>
                <div>✓ معاينة قبل الدفع</div>
              </div>
            </div>

            {/* Direct CTA Button */}
            <button
              onClick={scrollToCheckout}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-base shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transform active:scale-98 transition cursor-pointer"
            >
              <span>اطلب الآن وعاين المنتج مع المندوب قبل الدفع</span>
              <ArrowDown className="w-5 h-5 animate-bounce" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. Visual Gallery & Highlights */}
      <section className="py-12 bg-slate-900/60 border-y border-purple-500/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-purple-400 tracking-wider uppercase">
              تفاصيل ومميزات الجهاز
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
              تجربة بصرية مذهلة تحول أي جدار أو سقف لتحفة فنية
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 rounded-3xl overflow-hidden border border-purple-500/20 shadow-md">
              <div className="relative aspect-4/3">
                <Image
                  src={astrobeamConfig.images[1].src}
                  alt={astrobeamConfig.images[1].alt}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4 space-y-1">
                <h3 className="font-bold text-white text-sm">6 غيارات فضائية متنوعة</h3>
                <p className="text-xs text-slate-400">
                  بدّل بسهولة بين القمر، سديم المجرات، كوكب الأرض، والكواكب بدقة عرض فائقة النقاء.
                </p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl overflow-hidden border border-purple-500/20 shadow-md">
              <div className="relative aspect-4/3">
                <Image
                  src={astrobeamConfig.images[2].src}
                  alt={astrobeamConfig.images[2].alt}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4 space-y-1">
                <h3 className="font-bold text-white text-sm">ذراع مرن 360 درجة</h3>
                <p className="text-xs text-slate-400">
                  وجّه الإضاءة نحو السقف بالكامل، أو الحائط، أو أي زاوية تريدها بثبات ومرونة تامة.
                </p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl overflow-hidden border border-purple-500/20 shadow-md">
              <div className="relative aspect-4/3">
                <Image
                  src={astrobeamConfig.images[3].src}
                  alt={astrobeamConfig.images[3].alt}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4 space-y-1">
                <h3 className="font-bold text-white text-sm">تشغيل USB خفيف وعملي</h3>
                <p className="text-xs text-slate-400">
                  يعمل بشاحن الهاتف أو الباوربانك، بحجم صغير يسهل نقله لأي غرفة أو أخذه في السفر.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Pain Points vs Solution */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-purple-400 tracking-wider uppercase">
            لماذا AstroBeam؟
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
            أكثر من مجرد بروجكتور.. راحة نفسية ونوم هادئ في بيتك
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {astrobeamConfig.painPoints.map((item, idx) => (
            <div key={idx} className="p-5 rounded-3xl bg-slate-900/80 border border-purple-500/20 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-sm">
                0{idx + 1}
              </div>
              <h3 className="font-bold text-white text-base">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Before & After */}
      <section className="py-12 bg-slate-900/40 border-y border-purple-500/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
              قارن بنفسك: الفرق قبل وبعد AstroBeam
            </h2>
            <p className="text-xs sm:text-sm text-purple-300">
              {astrobeamConfig.beforeAfter.valueHook}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Without */}
            <div className="p-6 rounded-3xl bg-red-950/20 border border-red-500/30 space-y-4">
              <h3 className="font-black text-red-400 text-lg flex items-center gap-2">
                <span>✕</span>
                <span>بدون AstroBeam:</span>
              </h3>
              <div className="space-y-3">
                {astrobeamConfig.beforeAfter.without.map((text, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-300">
                    <span className="text-red-400 font-bold shrink-0">✕</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* With */}
            <div className="p-6 rounded-3xl bg-purple-950/30 border border-purple-500/40 space-y-4 shadow-lg shadow-purple-950/50">
              <h3 className="font-black text-purple-300 text-lg flex items-center gap-2">
                <span>✓</span>
                <span>مع AstroBeam:</span>
              </h3>
              <div className="space-y-3">
                {astrobeamConfig.beforeAfter.with.map((text, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-200 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Checkout Form Section */}
      <section id="order-form-section" className="py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>كميات محدودة متبقية من دفعة هذا الأسبوع</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
            سجّل طلبك الآن والدفع عند الاستلام
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            املأ بياناتك وسيصلك اتصال من خدمة العملاء لتأكيد الطلب وشحنه لباب بيتك مجاناً
          </p>
        </div>

        {/* Offers Selection Box */}
        {product.offers && product.offers.length > 0 && (
          <div className="space-y-3 mb-6">
            <label className="block text-xs font-bold text-purple-300">
              اختر باقة العرض المناسبة لك:
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {product.offers.map((offer) => {
                const isSelected = selectedOffer?.id === offer.id;
                return (
                  <div
                    key={offer.id}
                    onClick={() => setSelectedOffer(offer)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-purple-950/80 border-purple-500 shadow-md shadow-purple-500/20"
                        : "bg-slate-900 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? "border-purple-400 bg-purple-600" : "border-slate-600"
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>{offer.title_ar}</span>
                          {offer.is_popular && (
                            <span className="text-[10px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                              الأكثر طلباً
                            </span>
                          )}
                        </div>
                        {offer.discount_label && (
                          <div className="text-xs text-purple-300">{offer.discount_label}</div>
                        )}
                      </div>
                    </div>

                    <div className="text-left">
                      <div className="text-lg font-black text-amber-400 font-heading">
                        {offer.price} ج.م
                      </div>
                      {offer.original_price && (
                        <div className="text-xs text-slate-500 line-through">
                          {offer.original_price} ج.م
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Embedded Checkout Form */}
        <EgyptianCheckoutForm
          product={product}
          landingPageSlug={landingPage.slug}
          selectedOffer={selectedOffer}
          onOfferSelect={setSelectedOffer}
        />
      </section>

      {/* 7. Egyptian Verified Customer Reviews */}
      <section className="py-12 bg-slate-900/60 border-y border-purple-500/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-purple-400 tracking-wider uppercase">
              آراء وتجارب حقيقية
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
              ماذا قال عملاؤنا في مصر بعد تجربة AstroBeam؟
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {astrobeamConfig.reviews.map((rev, idx) => (
              <div key={idx} className="p-5 rounded-3xl bg-slate-900 border border-purple-500/20 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{rev.name}</h4>
                    <span className="text-[11px] text-slate-400">{rev.city}</span>
                  </div>
                  <div className="flex items-center text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{rev.comment}</p>
                <div className="pt-2 border-t border-slate-800 text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>شراء مؤكد ومعاينة قبل الاستلام</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQs Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
            الأسئلة الشائعة
          </h2>
          <p className="text-xs text-slate-400">كل ما تريد معرفته عن المنتج وسياسة الشحن والضمان</p>
        </div>

        <div className="space-y-3">
          {astrobeamConfig.faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900 border border-purple-500/20 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-right flex items-center justify-between font-bold text-sm text-white hover:bg-slate-800/50 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-purple-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. Mobile Sticky CTA Bar */}
      <StickyBuyBar
        product={product}
        price={selectedOffer?.price || astrobeamConfig.basePrice}
        compareAtPrice={selectedOffer?.original_price || astrobeamConfig.comparePrice}
        ctaText="اطلب الآن ومعاينة قبل الدفع"
      />
    </main>
  );
}
