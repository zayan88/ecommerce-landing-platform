"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Product, LandingPage, ProductOffer } from "@/types";
import { EgyptianCheckoutForm } from "@/components/shared/EgyptianCheckoutForm";
import { StickyBuyBar } from "@/components/shared/StickyBuyBar";
import { HeroOfferSelector } from "@/components/shared/HeroOfferSelector";
import {
  Star,
  ShieldCheck,
  Truck,
  VolumeX,
  BatteryCharging,
  Sparkles,
  Clock,
  Check,
  ArrowDown,
  Package,
  CheckCircle2,
  PhoneCall,
  Zap,
} from "lucide-react";

interface MeshNebulizerPageProps {
  product: Product;
  landingPage: LandingPage;
}

const GALLERY_IMAGES = [
  { src: "/landing-pages/mesh-nebulizer/images/hero.webp", label: "الجهاز الرئيسي" },
  { src: "/landing-pages/mesh-nebulizer/images/features_3.webp", label: "محتويات العلبة" },
  { src: "/landing-pages/mesh-nebulizer/images/features_1.webp", label: "المواصفات" },
  { src: "/landing-pages/mesh-nebulizer/images/use_case_baby.webp", label: "أثناء النوم" },
];

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
      ? product.offers.find((o) => o.quantity === 1) || product.offers[0]
      : defaultOffer;

  const [selectedOffer, setSelectedOffer] = useState<ProductOffer>(initialOffer);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const scrollToCheckout = () => {
    const el = document.getElementById("order-form-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-cyan-500 selection:text-white pb-24 md:pb-16" dir="rtl">
      {/* 1. Announcement Bar */}
      <div className="bg-gradient-to-r from-cyan-700 via-sky-600 to-cyan-800 text-white py-2 px-3 text-center text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2">
        <Truck className="w-4 h-4 text-cyan-200 shrink-0" />
        <span>شحن مجاني 100% لجميع محافظات مصر + حق المعاينة والتجربة قبل الدفع 💵</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* 2. Main Product Card (Hero & Gallery) */}
        <div className="bg-white rounded-3xl p-4 sm:p-7 border border-slate-200/90 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Gallery Column */}
            <div className="space-y-3">
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                <Image
                  src={GALLERY_IMAGES[activeImageIndex].src}
                  alt={product.title_ar}
                  fill
                  priority
                  className="object-contain p-2"
                />
              </div>

              {/* Thumbnails */}
              <div className="grid grid-cols-4 gap-2">
                {GALLERY_IMAGES.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition cursor-pointer bg-slate-50 ${
                      activeImageIndex === idx ? "border-cyan-600 ring-2 ring-cyan-600/20" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <Image src={img.src} alt={img.label} fill className="object-cover" />
                  </button>
                ))}
              </div>

              {/* Trust Badges under Image */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                  <ShieldCheck className="w-4 h-4 text-sky-600 mx-auto mb-0.5" />
                  <span className="font-bold text-[11px] text-slate-700 block">معاينة قبل الدفع</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                  <VolumeX className="w-4 h-4 text-cyan-600 mx-auto mb-0.5" />
                  <span className="font-bold text-[11px] text-slate-700 block">صامت تماماً</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                  <BatteryCharging className="w-4 h-4 text-emerald-600 mx-auto mb-0.5" />
                  <span className="font-bold text-[11px] text-slate-700 block">بطارية + USB</span>
                </div>
              </div>
            </div>

            {/* Info & Core Specs Column */}
            <div className="space-y-4 text-right">
              {/* Reviews & Stock Alert */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <span className="text-slate-800">4.9 / 5.0 (420+ تقييم إيجابي)</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  ✓ متوفر في المخزن (شحن فوري)
                </span>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-black font-heading text-slate-950 leading-snug">
                {product.title_ar}
              </h1>

              {/* Core Specs (3-4 Bullet Points only - No fluff!) */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs sm:text-sm">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-bold">صامت تماماً (أقل من 25dB):</strong>
                    <span className="text-slate-600 text-xs">يعمل بتقنية Mesh بدون صوت الموتور القديم، مناسب للاستخدام للطفل أثناء نومه.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-bold">رذاذ ناعم فائق الدقة (≤ 5µm):</strong>
                    <span className="text-slate-600 text-xs">يحول الدواء والمحلول لبخار ناعم تمتصه الرئة والشعب الهوائية مباشرة بدون هدر.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-bold">تشغيل مزدوج (بطاريات أو USB):</strong>
                    <span className="text-slate-600 text-xs">يعمل ببطاريتين قلم (AA) أو بكابل Type-C من شاحن الموبايل أو الباوربانك.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-bold">حجم جيب فائق الخفة (100 جرام):</strong>
                    <span className="text-slate-600 text-xs">سهل الحمل في الشنطة أو العربية للطوارئ والسفر والرحلات.</span>
                  </div>
                </div>
              </div>

              {/* Price Display */}
              <div className="bg-cyan-50/70 border border-cyan-200/80 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-cyan-900 block font-medium">السعر في العرض الحالي:</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-cyan-800 font-mono">{selectedOffer.price} ج.م</span>
                    {selectedOffer.original_price && (
                      <span className="text-sm text-slate-400 line-through font-mono">{selectedOffer.original_price} ج.م</span>
                    )}
                  </div>
                </div>
                <div className="text-left">
                  <span className="inline-block text-xs font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300">
                    🚚 شحن مجاني
                  </span>
                  <span className="block text-[11px] text-cyan-800 mt-1 font-semibold">الدفع عند الاستلام</span>
                </div>
              </div>

              {/* CTA Button to Form */}
              <button
                type="button"
                onClick={scrollToCheckout}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white font-black text-base sm:text-lg shadow-lg shadow-cyan-600/25 active:scale-98 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>اطلب الآن - الدفع بعد الفحص والمعاينة</span>
                <ArrowDown className="w-5 h-5 animate-bounce" />
              </button>
            </div>

          </div>
        </div>

        {/* 3. Box Contents & Easy 3 Steps (Clean & Visual) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* What's in the box */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
              <Package className="w-5 h-5 text-cyan-700" />
              <span>محتويات العلبة الأصلية (طقم كامل):</span>
            </div>
            <ul className="text-xs sm:text-sm text-slate-700 space-y-2 pr-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 shrink-0" />
                <span><strong>1× جهاز النيبولايزر</strong> الأصلي فائق الهدوء.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 shrink-0" />
                <span><strong>1× ماسك مخصص للأطفال</strong> من السيليكون الطبي الناعم.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 shrink-0" />
                <span><strong>1× ماسك مخصص للكبار</strong> مريح للوجه.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 shrink-0" />
                <span><strong>1× قطعة استنشاق للفم</strong> (Mouthpiece).</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 shrink-0" />
                <span><strong>1× كابل شحن USB</strong> + كتالوج التشغيل.</span>
              </li>
            </ul>
          </div>

          {/* 3 Quick Steps */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
              <Zap className="w-5 h-5 text-amber-600" />
              <span>طريقة الاستخدام السريعة في 3 خطوات:</span>
            </div>
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 pr-1">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span>افتح الغطاء وضع جرعة محلول الملح أو الدواء في الكوب.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span>اختر الماسك المناسب (أطفال أو كبار) وركبه بسهولة.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span>اضغط زر التشغيل، واستنشق البخار في هدوء تام.</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Offer Tier Selector (Directly above the checkout form) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="text-right">
            <span className="text-xs font-bold text-cyan-800 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200">
              اختر العرض المناسب لك
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-950 mt-2 font-heading">
              عروض التوفير الخاصة (شحن مجاني لجميع العروض)
            </h2>
          </div>

          <HeroOfferSelector
            offers={product.offers || []}
            selectedOffer={selectedOffer}
            onSelectOffer={(offer) => setSelectedOffer(offer)}
            accentColor="cyan"
          />
        </div>

        {/* 5. The Prominent Checkout Form Section */}
        <div id="order-form-section" className="scroll-mt-6">
          <EgyptianCheckoutForm
            product={product}
            selectedOffer={selectedOffer}
            landingPageSlug={landingPage.slug}
          />
        </div>

        {/* 6. Assurance Footer */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs text-slate-600 pt-2">
          <div className="p-3 rounded-2xl bg-white border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <span className="font-bold block text-slate-800">معاينة قبل الدفع</span>
            <span className="text-[10px] text-slate-500">افحص طلبك مع المندوب</span>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-slate-200">
            <Truck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <span className="font-bold block text-slate-800">شحن مجاني</span>
            <span className="text-[10px] text-slate-500">لكل محافظات مصر</span>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-slate-200">
            <Clock className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <span className="font-bold block text-slate-800">توصيل سريع</span>
            <span className="text-[10px] text-slate-500">من 5 إلى 7 أيام</span>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-slate-200">
            <PhoneCall className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <span className="font-bold block text-slate-800">تأكيد فوري</span>
            <span className="text-[10px] text-slate-500">اتصال لتأكيد الميعاد</span>
          </div>
        </div>
      </div>

      {/* Sticky Buy Bar */}
      <StickyBuyBar
        product={product}
        selectedOffer={selectedOffer}
        onBuyClick={scrollToCheckout}
      />
    </main>
  );
}
