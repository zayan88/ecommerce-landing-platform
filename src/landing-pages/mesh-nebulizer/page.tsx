"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Product, LandingPage, ProductOffer, LandingPageSectionConfig, DEFAULT_LANDING_PAGE_SECTIONS } from "@/types";
import { EgyptianCheckoutForm } from "@/components/shared/EgyptianCheckoutForm";
import { StickyBuyBar } from "@/components/shared/StickyBuyBar";
import { HeroOfferSelector } from "@/components/shared/HeroOfferSelector";
import {
  Star,
  ShieldCheck,
  Truck,
  VolumeX,
  BatteryCharging,
  Check,
  ArrowDown,
  Package,
  CheckCircle2,
  PhoneCall,
  Zap,
  XCircle,
  ThumbsUp,
  Clock,
} from "lucide-react";

interface MeshNebulizerPageProps {
  product: Product;
  landingPage: LandingPage;
}

const GALLERY_IMAGES = [
  { src: "/landing-pages/mesh-nebulizer/images/hero.webp", label: "الجهاز الرئيسي" },
  { src: "/landing-pages/mesh-nebulizer/images/use_case_baby.webp", label: "أثناء نوم الطفل" },
  { src: "/landing-pages/mesh-nebulizer/images/features_1.webp", label: "المواصفات والتشريح" },
  { src: "/landing-pages/mesh-nebulizer/images/features_3.webp", label: "محتويات العلبة" },
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
    discount_label: "خصم 30%",
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

  const sections: LandingPageSectionConfig[] =
    landingPage.sections_config && landingPage.sections_config.length > 0
      ? landingPage.sections_config
      : DEFAULT_LANDING_PAGE_SECTIONS;

  // 1. HERO SECTION
  const renderHero = () => (
    <div className="bg-white rounded-3xl p-4 sm:p-7 border border-slate-200/90 shadow-sm space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Gallery Column */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner">
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

          {/* 3 Core Trust Badges */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <ShieldCheck className="w-4 h-4 text-sky-600 mx-auto mb-1" />
              <span className="font-bold text-[11px] text-slate-800 block">معاينة قبل الدفع</span>
              <span className="text-[10px] text-slate-500">افحص وجرب</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <VolumeX className="w-4 h-4 text-cyan-600 mx-auto mb-1" />
              <span className="font-bold text-[11px] text-slate-800 block">صامت تماماً</span>
              <span className="text-[10px] text-slate-500">أقل من 25dB</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <BatteryCharging className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <span className="font-bold text-[11px] text-slate-800 block">بطارية + USB</span>
              <span className="text-[10px] text-slate-500">طوارئ وسفر</span>
            </div>
          </div>
        </div>

        {/* Info & Core Specs Column */}
        <div className="space-y-4 text-right">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <span className="text-slate-800">4.9 / 5.0 (420+ تقييم من أمهات في مصر)</span>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              ✓ متوفر بالمخزن (شحن فوري)
            </span>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black font-heading text-slate-950 leading-snug">
              جهاز استنشاق البخار المحمول ميني (Mesh Nebulizer) الصامت للأطفال والكبار
            </h1>
            <p className="text-xs sm:text-sm text-cyan-900 font-semibold mt-1.5 leading-relaxed bg-cyan-50/70 p-2.5 rounded-xl border border-cyan-100">
              💡 جلسة بخار فورية وهادية لطفلك في سريره بدون صوت يخوفه ولا بهدلة نزول مستشفيات الفجر في برد الشتاء.
            </p>
          </div>

          {/* Balanced Key Specs */}
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition">
              <div className="w-5 h-5 rounded-md bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <strong className="text-slate-900 font-bold">صوت معدوم (Ultrasonic):</strong>
                <span className="text-slate-600 text-xs block">مش بيصحي الطفل ولا بيخوفه زي الأجهزة القديمة.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition">
              <div className="w-5 h-5 rounded-md bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <strong className="text-slate-900 font-bold">بخار ناعم دقيق جداً (≤ 5 ميكرون):</strong>
                <span className="text-slate-600 text-xs block">بيفتت محلول الملح لرذاذ دقيق بيوصل للشعب الهوائية بدون هدر.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition">
              <div className="w-5 h-5 rounded-md bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <strong className="text-slate-900 font-bold">طقم عائلي متكامل:</strong>
                <span className="text-slate-600 text-xs block">ماسك أطفال + ماسك كبار + قطعة فم + كابل USB.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition">
              <div className="w-5 h-5 rounded-md bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <strong className="text-slate-900 font-bold">يعمل ببطاريتين أو USB:</strong>
                <span className="text-slate-600 text-xs block">وزنه 100 جرام بحجم الجيب، يعمل في أي مكان وفي العربية.</span>
              </div>
            </div>
          </div>

          {/* Offer Selector Directly in the Hero */}
          <div className="pt-1">
            <HeroOfferSelector
              offers={product.offers || []}
              selectedOffer={selectedOffer}
              onSelectOffer={(offer) => setSelectedOffer(offer)}
              accentColor="cyan"
            />
          </div>

          {/* Price Banner */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block font-medium">السعر في العرض الحالي:</span>
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
              <span className="block text-[11px] text-slate-600 mt-1 font-semibold">الدفع عند الاستلام</span>
            </div>
          </div>

          {/* Fast Jump Button */}
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
  );

  // 2. COMPARISON SECTION
  const renderComparison = () => (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-4 text-center">
      <div>
        <span className="text-xs font-bold text-cyan-800 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200">
          ليه تغير جهازك القديم؟
        </span>
        <h2 className="text-lg sm:text-xl font-black text-slate-950 mt-2 font-heading">
          الفرق بين النيبولايزر القديم وجهاز Mesh الذكي
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-right pt-1">
        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-2">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
            <XCircle className="w-5 h-5 shrink-0" />
            <span>أجهزة النيبولايزر التقليدية</span>
          </div>
          <ul className="text-xs text-rose-900 space-y-1.5 pr-2">
            <li>• صوت موتور عالي ومخيف بيخلي الطفل يصرخ ويرفض الجلسة.</li>
            <li>• حجم ضخم وتقيل ولازم فيشة كهرباء جنبك.</li>
            <li>• نزول طوارئ ومستشفيات الفجر في البرد بسبب ضيق التنفس.</li>
          </ul>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>جهاز Mesh Nebulizer المحمول</span>
          </div>
          <ul className="text-xs text-emerald-900 space-y-1.5 pr-2">
            <li>• صامت تماماً، بتعمل الجلسة للطفل في سريره وهو نايم في هدوء.</li>
            <li>• حجم جيب 100 جرام، يشتغل بالبطاريات أو USB في أي مكان.</li>
            <li>• إسعاف فوري في البيت بلمسة زر واحدة بدون بهدلة.</li>
          </ul>
        </div>
      </div>
    </div>
  );

  // 3. BOX CONTENTS
  const renderBoxContents = () => (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3 text-right">
      <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
        <Package className="w-5 h-5 text-cyan-700" />
        <span>محتويات العلبة الأصلية (طقم متكامل):</span>
      </div>
      <ul className="text-xs sm:text-sm text-slate-700 space-y-2 pr-1">
        <li className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 shrink-0" />
          <span><strong>1× جهاز النيبولايزر المحمول</strong> الأصلي.</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 shrink-0" />
          <span><strong>1× ماسك مخصص للأطفال</strong> سيليكون ناعم ومريح.</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 shrink-0" />
          <span><strong>1× ماسك مخصص للكبار</strong> مناسب لكل الأعمار.</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 shrink-0" />
          <span><strong>1× قطعة استنشاق للفم</strong> (Mouthpiece).</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 shrink-0" />
          <span><strong>1× كابل شحن USB</strong> + كتالوج التعليمات.</span>
        </li>
      </ul>
    </div>
  );

  // 4. HOW TO USE (3 QUICK STEPS)
  const renderHowToUse = () => (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3 text-right">
      <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
        <Zap className="w-5 h-5 text-amber-600" />
        <span>طريقة الاستخدام السريعة في 3 خطوات:</span>
      </div>
      <div className="space-y-2 text-xs sm:text-sm text-slate-700 pr-1">
        <div className="flex items-start gap-2.5">
          <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
          <span>افتح الغطاء وضع جرعة محلول الملح أو الدواء في الكوب.</span>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
          <span>اختر الماسك المناسب (أطفال أو كبار) وركبه بسهولة على الجهاز.</span>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
          <span>اضغط زر التشغيل، واستنشق البخار في هدوء تام وامتصاص سريع.</span>
        </div>
      </div>
    </div>
  );

  // 5. REVIEWS & SOCIAL PROOF
  const renderReviews = () => (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4 text-right">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-black text-slate-900 font-heading flex items-center gap-2">
          <ThumbsUp className="w-4 h-4 text-cyan-600" />
          <span>تجارب حقيقية لعملاء في مصر:</span>
        </h3>
        <div className="flex text-amber-400">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-amber-400" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <strong className="text-slate-900 font-bold">أم سليم (التجمع، القاهرة)</strong>
            <span className="text-[10px] text-emerald-600 font-semibold">✓ مشترية موثقة</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            "بجد اختراع رحمني! ابني كان بيصرخ من صوت الجهاز القديم، ده بعمله الجلسة وهو نايم ومش بيحس بحاجة خالص."
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <strong className="text-slate-900 font-bold">د. محمود كمال (الجيزة)</strong>
            <span className="text-[10px] text-emerald-600 font-semibold">✓ مشترية موثقة</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            "البخار بتاعه ناعم جداً وكفاءته ممتازة مقارنة بحجمه، واشتريت قطعتين واحدة للبيت والتانية في شنطة العربية."
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <strong className="text-slate-900 font-bold">هدى عبد الرحمن (الإسكندرية)</strong>
            <span className="text-[10px] text-emerald-600 font-semibold">✓ مشترية موثقة</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            "الشحن وصلني في 3 أيام وعاينت الجهاز وجربت البخار قدام المندوب قبل ما أدفع.. منتج أصلي وخدمة محترمة."
          </p>
        </div>
      </div>
    </div>
  );

  // 6. OFFERS & TIERS
  const renderOffers = () => (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
      <div className="text-right">
        <span className="text-xs font-bold text-cyan-800 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200">
          عروض التوفير الخاصة
        </span>
        <h2 className="text-lg sm:text-xl font-black text-slate-950 mt-2 font-heading">
          اختر العرض المناسب لك (شحن مجاني لجميع العروض)
        </h2>
      </div>

      <HeroOfferSelector
        offers={product.offers || []}
        selectedOffer={selectedOffer}
        onSelectOffer={(offer) => setSelectedOffer(offer)}
        accentColor="cyan"
      />
    </div>
  );

  // 7. ORDER FORM (COD CHECKOUT)
  const renderOrderForm = () => (
    <div id="order-form-section" className="scroll-mt-6">
      <EgyptianCheckoutForm
        product={product}
        selectedOffer={selectedOffer}
        landingPageSlug={landingPage.slug}
      />
    </div>
  );

  // 8. GUARANTEES FOOTER
  const renderGuarantees = () => (
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
  );

  const renderSection = (id: string) => {
    switch (id) {
      case "hero":
        return renderHero();
      case "comparison":
        return renderComparison();
      case "box_contents":
        return renderBoxContents();
      case "how_to_use":
        return renderHowToUse();
      case "reviews":
        return renderReviews();
      case "offers":
        return renderOffers();
      case "order_form":
        return renderOrderForm();
      case "guarantees":
        return renderGuarantees();
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-cyan-500 selection:text-white pb-24 md:pb-16" dir="rtl">
      {/* 1. Announcement Bar */}
      <div className="bg-gradient-to-r from-cyan-700 via-sky-600 to-cyan-800 text-white py-2 px-3 text-center text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2">
        <Truck className="w-4 h-4 text-cyan-200 shrink-0" />
        <span>عرض الشتاء: شحن مجاني لجميع المحافظات + حق فتح الشحنة والتجربة قبل الدفع 💵</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {sections.map((sec) => {
          if (!sec.enabled) return null;
          return <React.Fragment key={sec.id}>{renderSection(sec.id)}</React.Fragment>;
        })}
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
