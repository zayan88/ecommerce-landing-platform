"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product, LandingPage, ProductOffer } from "@/types";
import { starterLandingConfig } from "./config";
import { EgyptianCheckoutForm } from "@/components/shared/EgyptianCheckoutForm";
import { StickyBuyBar } from "@/components/shared/StickyBuyBar";
import {
  Star,
  CheckCircle,
  Truck,
  ShieldCheck,
  RotateCcw,
  ChevronDown,
  Sparkles,
  ArrowDownCircle,
  AlertTriangle,
  Clock,
  Check,
  X,
  Flame,
  PhoneCall,
  ShoppingBag,
  PackageCheck,
  HeartHandshake,
  CheckCircle2,
} from "lucide-react";

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

  const images =
    product.images && product.images.length > 0
      ? product.images.map((src, idx) => ({ src, alt: `${product.title_ar} - صورة ${idx + 1}` }))
      : starterLandingConfig.images;

  const scrollToCheckout = () => {
    const el = document.getElementById("order-form-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const discountAmount = product.compare_at_price
    ? product.compare_at_price - product.base_price
    : 150;
  const discountPercent = product.compare_at_price
    ? Math.round((discountAmount / product.compare_at_price) * 100)
    : 35;

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      {/* 1. TOP URGENCY COUNTDOWN ANNOUNCEMENT BAR */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white text-xs md:text-sm py-2.5 px-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full text-xs font-black animate-pulse flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-current" /> عرض حصري لفترة محدودة
            </span>
            <span className="hidden sm:inline text-slate-200">
              شحن مجاني + خصم فوري يصل إلى 50%
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs font-black bg-white/10 px-3 py-1 rounded-xl backdrop-blur-xs border border-white/10">
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span>ينتهي خلال:</span>
            <span className="bg-black/40 px-1.5 py-0.5 rounded text-amber-300">
              {String(timeLeft.hours).padStart(2, "0")}
            </span>
            :
            <span className="bg-black/40 px-1.5 py-0.5 rounded text-amber-300">
              {String(timeLeft.minutes).padStart(2, "0")}
            </span>
            :
            <span className="bg-black/40 px-1.5 py-0.5 rounded text-amber-300">
              {String(timeLeft.seconds).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* 2. HEADER */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 py-3.5 px-4 sticky top-10 md:top-11 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xl shadow-md group-hover:scale-105 transition">
              R
            </div>
            <div>
              <span className="font-heading font-black text-lg md:text-xl text-gray-900 block leading-tight">
                RexRack
              </span>
              <span className="text-[11px] text-gray-500 font-medium">المتجر المعتمد - معاينة مجانية قبل الدفع</span>
            </div>
          </Link>

          <button
            onClick={scrollToCheckout}
            className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-black shadow-md shadow-emerald-600/25 active:scale-95 transition cursor-pointer flex items-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>اطلب الآن</span>
          </button>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section className="py-8 md:py-14 px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Images Gallery (Left side on LTR, Right on RTL) */}
          <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-28">
            <div className="relative aspect-4/3 w-full rounded-3xl overflow-hidden bg-white border border-gray-200/90 shadow-xl group">
              <Image
                src={images[activeImageIndex].src}
                alt={images[activeImageIndex].alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                priority
              />

              {/* Floating Quality Tag */}
              <div className="absolute top-4 right-4 bg-emerald-600/90 backdrop-blur-md text-white text-xs font-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>منتج أصلي 100% معتمد</span>
              </div>

              {/* Stock Scarcity Tag */}
              <div className="absolute bottom-4 right-4 bg-slate-900/85 backdrop-blur-md text-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>متبقي 6 قطع فقط بسعر العرض</span>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-3 gap-3">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer bg-white ${
                    activeImageIndex === idx
                      ? "border-emerald-600 ring-4 ring-emerald-500/20 shadow-md scale-98"
                      : "border-gray-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={img.src} alt={img.alt} fill className="object-cover" />
                </button>
              ))}
            </div>

            {/* Trust Points Mini-Row */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[11px] font-bold text-gray-600">
              <div className="p-2.5 rounded-2xl bg-white border border-gray-200 flex flex-col items-center gap-1 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>معاينة قبل الدفع</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-white border border-gray-200 flex flex-col items-center gap-1 shadow-xs">
                <Truck className="w-5 h-5 text-blue-600" />
                <span>توصيل خلال 48 ساعة</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-white border border-gray-200 flex flex-col items-center gap-1 shadow-xs">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <span>استبدال 14 يوم</span>
              </div>
            </div>
          </div>

          {/* Product Hero Details & Instant Offer Selector */}
          <div className="lg:col-span-6 space-y-6 text-right">
            {/* Rating & Sold Counter */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs font-black text-amber-900">4.9 / 5</span>
                <span className="text-[11px] text-amber-700">(380+ تقييم حقيقي)</span>
              </div>

              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                ✓ تم بيع أكثر من 1,200 قطعة
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 font-heading leading-tight tracking-tight">
              {product.title_ar || starterLandingConfig.productTitle}
            </h1>

            {/* Subtitle / Description */}
            <p className="text-base text-gray-600 leading-relaxed">
              {product.description_ar || starterLandingConfig.subtitle}
            </p>

            {/* Current Price Block */}
            <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-800 font-bold block">السعر الحالي للقطعة:</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-black font-heading text-emerald-700">
                    {product.base_price} ج.م
                  </span>
                  {product.compare_at_price && (
                    <span className="text-base text-gray-400 line-through">
                      {product.compare_at_price} ج.م
                    </span>
                  )}
                </div>
              </div>

              <div className="text-left">
                <span className="bg-red-600 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-xs block text-center">
                  خصم {discountPercent}%
                </span>
                <span className="text-[11px] font-bold text-emerald-800 block mt-1 text-center">
                  وفر {discountAmount} ج.م اليوم
                </span>
              </div>
            </div>

            {/* Interactive Quantity Offer Cards (Lovable/Khairy Signature Pattern) */}
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
                          ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-md"
                          : "border-gray-200 bg-white hover:border-emerald-300"
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
                            isSelected ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-300"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <span className="font-heading font-black text-sm text-slate-900 block">
                            {offer.title_ar}
                          </span>
                          <span className="text-xs text-gray-500 block">
                            {offer.discount_label || (offer.free_shipping ? "شحن مجاني" : "دفع عند الاستلام")}
                          </span>
                        </div>
                      </div>

                      <div className="text-left">
                        <span className="text-lg font-black font-heading text-emerald-700 block">
                          {offer.price} ج.م
                        </span>
                        {offer.original_price && (
                          <span className="text-xs text-gray-400 line-through block">
                            {offer.original_price} ج.م
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2 space-y-2">
              <button
                onClick={scrollToCheckout}
                className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-lg md:text-xl shadow-xl shadow-emerald-600/30 hover:shadow-emerald-600/40 active:scale-98 transition flex items-center justify-center gap-3 cursor-pointer"
              >
                <ArrowDownCircle className="w-6 h-6 animate-bounce" />
                <span>اضغط هنا واطلب الآن (الدفع عند الاستلام)</span>
              </button>

              <div className="flex items-center justify-center gap-4 text-xs font-bold text-gray-500 pt-1">
                <span className="flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" /> فحص مجاني قبل الدفع
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-blue-700">
                  <Truck className="w-4 h-4" /> شحن لكافة المحافظات
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PROBLEM VS REXRACK SOLUTION (Lovable / High-Converting Pattern) */}
      <section className="py-14 bg-white border-y border-gray-200 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
              المقارنة الحقيقية
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 font-heading">
              لماذا RexRack أفضل بمراحل من المنتجات التقليدية؟
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Old / Conventional Way */}
            <div className="p-6 md:p-8 rounded-3xl bg-red-50/50 border border-red-200 space-y-4">
              <div className="flex items-center gap-2.5 text-red-600 font-black text-lg font-heading">
                <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
                  <X className="w-5 h-5 stroke-[3]" />
                </div>
                <span>المنتجات العادية في السوق</span>
              </div>

              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>خامات بلاستيكية رديئة تتلف وتنكسر بعد أيام قليلة من الاستخدام.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>لا يوجد أي ضمان ولا خدمة ما بعد البيع في حال وجود عيب.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>مندوب الشحن يجبرك على الدفع قبل فتح أو معاينة محتويات الشحنة.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>تأخير مستمر في التوصيل قد يصل إلى أسابيع دون تواصل أو تأكيد.</span>
                </li>
              </ul>
            </div>

            {/* The RexRack Way */}
            <div className="p-6 md:p-8 rounded-3xl bg-emerald-50/70 border-2 border-emerald-500 space-y-4 shadow-lg shadow-emerald-500/10">
              <div className="flex items-center gap-2.5 text-emerald-700 font-black text-lg font-heading">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
                <span>حلول RexRack الأصلية المعتمدة</span>
              </div>

              <ul className="space-y-3 text-sm text-gray-800">
                <li className="flex items-start gap-2.5 font-bold">
                  <span className="text-emerald-600">✓</span>
                  <span>خامات فاخرة متينة ومختبرة بأعلى معايير الجودة لتحمل الاستخدام الشاق.</span>
                </li>
                <li className="flex items-start gap-2.5 font-bold">
                  <span className="text-emerald-600">✓</span>
                  <span>ضمان استبدال واسترجاع حقيقي لمدة 14 يوماً مع دعم فني 24/7.</span>
                </li>
                <li className="flex items-start gap-2.5 font-bold">
                  <span className="text-emerald-600">✓</span>
                  <span>حقك الكامل في فتح الطرد وفحص المنتج أمام المندوب قبل دفع أي مليم.</span>
                </li>
                <li className="flex items-start gap-2.5 font-bold">
                  <span className="text-emerald-600">✓</span>
                  <span>توصيل سريع خلال 24 - 48 ساعة لباب منزلك مع تأكيد هاتفى فوري.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 3-STEP ORDERING PROCESS */}
      <section className="py-14 px-4 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
            بساطة وسرعة
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-heading">
            كيف تطلب منتجك في 3 خطوات بسيطة؟
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 font-black text-xl flex items-center justify-center mx-auto">
              1
            </div>
            <h3 className="font-heading font-black text-base text-slate-900">املأ الاستمارة</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              اكتب اسمك ورقم هاتفك ومحافظتك في نموذج الطلب أسفل الصفحة (يستغرق أقل من 30 ثانية).
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 font-black text-xl flex items-center justify-center mx-auto">
              2
            </div>
            <h3 className="font-heading font-black text-base text-slate-900">تأكيد وشحن فوري</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              يتواصل معك فريق خدمة العملاء هاتفياً لتأكيد العنوان ويتم إرسال الشحنة في نفس اليوم.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 font-black text-xl flex items-center justify-center mx-auto">
              3
            </div>
            <h3 className="font-heading font-black text-base text-slate-900">معاينة واستلام</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              افتح الطرد وعاين المنتج وتأكد من جودته بنفسك أمام المندوب، ثم ادفع نقداً أو بمحفظة.
            </p>
          </div>
        </div>
      </section>

      {/* 6. COD CHECKOUT FORM SECTION */}
      <section id="order-form-section" className="py-16 bg-slate-100 border-t border-gray-200 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
              استمارة الشراء المباشر
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-heading">
              أدخل بياناتك وسيصلك الطلب حتى باب بيتك
            </h2>
            <p className="text-xs text-gray-600">
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

      {/* 7. GOLDEN GUARANTEE CERTIFICATE */}
      <section className="py-14 px-4 max-w-4xl mx-auto">
        <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-50 via-white to-amber-50/40 border-2 border-amber-300 shadow-lg text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-md">
            <HeartHandshake className="w-8 h-8" />
          </div>

          <h3 className="text-2xl font-black font-heading text-amber-950">
            شهادة ضمان RexRack الذهبية 100%
          </h3>

          <p className="text-sm text-gray-700 max-w-2xl mx-auto leading-relaxed">
            نحن واثقون تماماً من جودة وفائدة منتجاتنا. لذلك نمنحك ضماناً حقيقياً لمدة 14 يوماً كاملاً: إذا وجدت أي عيب صناعة أو لم يكن المنتج مطابقاً تماماً لما رأيته، سنقوم باستبداله فوراً مجاناً أو استرداد كامل المبلغ دون أي تعقيد.
          </p>

          <div className="pt-2 flex items-center justify-center gap-6 text-xs font-bold text-amber-900">
            <span>✓ ضمان استبدال 14 يوم</span>
            <span>•</span>
            <span>✓ معاينة كاملة قبل الدفع</span>
            <span>•</span>
            <span>✓ دعم فني متواصل</span>
          </div>
        </div>
      </section>

      {/* 8. CUSTOMER REVIEWS */}
      <section className="py-14 bg-white border-y border-gray-200 px-4">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black text-amber-600 bg-amber-50 px-3.5 py-1 rounded-full border border-amber-200">
              تجارب موثقة
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-heading">
              آراء وتقييمات عملائنا في مصر
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {starterLandingConfig.reviews.map((rev, idx) => (
              <div
                key={idx}
                className="bg-slate-50 p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex text-amber-400 mb-2">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">"{rev.text}"</p>
                </div>

                <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{rev.name}</span>
                    <span className="text-gray-500 text-[11px]">{rev.location}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                    مشتري موثق ✓
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FAQ ACCORDION */}
      <section className="py-14 px-4 max-w-3xl mx-auto">
        <div className="text-center mb-8 space-y-2">
          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
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
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs transition"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 md:p-5 text-right font-bold text-slate-900 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50"
                >
                  <span className="text-sm md:text-base">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="p-4 md:p-5 pt-0 text-xs md:text-sm text-gray-600 leading-relaxed border-t border-gray-100 bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="bg-slate-950 text-white py-12 px-4 text-center text-xs pb-28 md:pb-12">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex justify-center items-center gap-6 text-slate-400 flex-wrap">
            <span className="flex items-center gap-1.5 font-bold">
              <Truck className="w-4 h-4 text-emerald-400" /> شحن لجميع محافظات مصر
            </span>
            <span className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> معاينة مجانية قبل الدفع
            </span>
            <span className="flex items-center gap-1.5 font-bold">
              <RotateCcw className="w-4 h-4 text-emerald-400" /> استبدال واسترجاع 14 يوم
            </span>
          </div>

          <p className="text-slate-500">
            جميع الحقوق محفوظة © {new Date().getFullYear()} - RexRack (RexRack.com).
          </p>
        </div>
      </footer>

      {/* 11. MOBILE STICKY CTA */}
      <StickyBuyBar
        productTitle={product.title_ar}
        price={selectedOffer.price || product.base_price}
        compareAtPrice={selectedOffer.original_price || product.compare_at_price}
        onCtaClick={scrollToCheckout}
      />
    </div>
  );
}
