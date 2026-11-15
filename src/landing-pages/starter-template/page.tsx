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
  Check,
  ArrowDown,
  Package,
  Clock,
  Sparkles,
  PhoneCall,
  Zap,
  XCircle,
  CheckCircle2,
  ThumbsUp,
} from "lucide-react";

interface StarterLandingPageProps {
  product: Product;
  landingPage: LandingPage;
}

export default function StarterLandingPage({ product, landingPage }: StarterLandingPageProps) {
  // Built-in Dynamic Offers
  const defaultOffers: ProductOffer[] = [
    {
      id: `offer-1-${product.id}`,
      product_id: product.id,
      title_ar: "قطعة واحدة (تجربة)",
      quantity: 1,
      price: product.base_price,
      original_price: product.compare_at_price || Math.round(product.base_price * 1.35),
      discount_label: "خصم خاص",
      is_popular: false,
      free_shipping: true,
      sort_order: 1,
    },
    {
      id: `offer-2-${product.id}`,
      product_id: product.id,
      title_ar: "قطعتان (الأكثر طلباً - توفير إضافي)",
      quantity: 2,
      price: Math.round(product.base_price * 1.75),
      original_price: Math.round((product.compare_at_price || product.base_price * 1.35) * 2),
      discount_label: "وفر أكثر + شحن مجاني",
      is_popular: true,
      free_shipping: true,
      sort_order: 2,
    },
    {
      id: `offer-3-${product.id}`,
      product_id: product.id,
      title_ar: "3 قطع (عرض التوفير العائلي الشامل)",
      quantity: 3,
      price: Math.round(product.base_price * 2.45),
      original_price: Math.round((product.compare_at_price || product.base_price * 1.35) * 3),
      discount_label: "أعلى توفير + شحن مجاني",
      is_popular: false,
      free_shipping: true,
      sort_order: 3,
    },
  ];

  const availableOffers =
    product.offers && product.offers.length > 0 ? product.offers : defaultOffers;

  const [selectedOffer, setSelectedOffer] = useState<ProductOffer>(
    availableOffers.find((o) => o.quantity === 1) || availableOffers[0]
  );

  const images = product.images && product.images.length > 0 ? product.images : ["/landing-pages/mesh-nebulizer/images/hero.webp"];
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Extract clean bullet points from product description
  const descriptionLines = (product.description_ar || "")
    .split(/[\n.!؟]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8)
    .slice(0, 4);

  const c = landingPage.content_config;

  const announcementText =
    c?.announcement_bar ||
    "شحن مجاني 100% لجميع محافظات مصر + حق المعاينة والتجربة قبل الدفع 💵";
  const heroTitle = c?.hero_headline || product.title_ar;
  const heroSubtitle =
    c?.hero_subheadline ||
    (descriptionLines[0]
      ? `💡 ${descriptionLines[0]}`
      : "💡 احصل على أفضل تجربة مع المنتج الأصلي المعتمد وبأعلى معايير الجودة.");
  const heroBadge = c?.hero_badge || "4.9 / 5.0 (أكثر من 350 تقييم إيجابي)";
  const heroImageSrc = c?.hero_image || images[activeImageIndex] || images[0];

  const features =
    c?.hero_bullets && c.hero_bullets.length > 0
      ? c.hero_bullets
      : descriptionLines.length > 0
      ? descriptionLines
      : [
          "خامات أصلية عالية الجودة تضمن المتانة والتحمل طويل الأمد.",
          "تصميم عملي وعصري يلبي احتياجات الاستخدام اليومي بكل سهولة.",
          "آمن وسهل الاستخدام مع ضمان كامل وحق الفحص والمعاينة قبل الدفع.",
          "شحن سريع ومجاني لجميع محافظات مصر وتأكيد فوري للطلب.",
        ];

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
          <div className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
            <Image
              src={heroImageSrc}
              alt={heroTitle}
              fill
              priority
              className="object-contain p-2"
            />
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(0, 4).map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition cursor-pointer bg-slate-50 ${
                    activeImageIndex === idx ? "border-indigo-600 ring-2 ring-indigo-600/20" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Image src={img} alt={`صورة ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-0.5" />
              <span className="font-bold text-[11px] text-slate-700 block">معاينة قبل الدفع</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
              <Truck className="w-4 h-4 text-indigo-600 mx-auto mb-0.5" />
              <span className="font-bold text-[11px] text-slate-700 block">شحن مجاني 100%</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
              <Clock className="w-4 h-4 text-amber-600 mx-auto mb-0.5" />
              <span className="font-bold text-[11px] text-slate-700 block">توصيل 5-7 أيام</span>
            </div>
          </div>
        </div>

        {/* Info & Core Specs */}
        <div className="space-y-4 text-right">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <span className="text-slate-800">{heroBadge}</span>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              ✓ متوفر في المخزن (شحن فوري)
            </span>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black font-heading text-slate-950 leading-snug">
              {heroTitle}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-950 font-semibold mt-1.5 leading-relaxed bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100">
              {heroSubtitle}
            </p>
          </div>

          {/* Core Features List */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs sm:text-sm">
            {features.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="text-slate-700 font-medium leading-relaxed">{feat}</span>
              </div>
            ))}
          </div>

          {/* Offer Selector Directly in the Hero */}
          <div className="pt-1">
            <HeroOfferSelector
              offers={availableOffers}
              selectedOffer={selectedOffer}
              onSelectOffer={(offer) => setSelectedOffer(offer)}
              accentColor="emerald"
            />
          </div>

          {/* Price Display */}
          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-indigo-950 block font-medium">السعر في العرض الحالي:</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-indigo-900 font-mono">{selectedOffer.price} ج.م</span>
                {selectedOffer.original_price && (
                  <span className="text-sm text-slate-400 line-through font-mono">{selectedOffer.original_price} ج.م</span>
                )}
              </div>
            </div>
            <div className="text-left">
              <span className="inline-block text-xs font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300">
                🚚 شحن مجاني
              </span>
              <span className="block text-[11px] text-indigo-800 mt-1 font-semibold">الدفع عند الاستلام</span>
            </div>
          </div>

          {/* CTA Button */}
          <button
            type="button"
            onClick={scrollToCheckout}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-base sm:text-lg shadow-lg shadow-emerald-600/25 active:scale-98 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <span>اطلب الآن - الدفع بعد الفحص والمعاينة</span>
            <ArrowDown className="w-5 h-5 animate-bounce" />
          </button>
        </div>
      </div>
    </div>
  );

  // 2. COMPARISON SECTION
  const renderComparison = () => {
    const comparisonImage =
      c?.comparison_image ||
      (product.images && product.images.length > 1 ? product.images[1] : null);
    const comparisonTitle = c?.comparison_title || "الفرق بين المنتج التقليدي والمنتج الأصلي";
    const oldTitle = c?.comparison_old_title || "المنتجات والبدائل التقليدية";
    const oldPoints = c?.comparison_old_points || [
      "خامات رديئة وضعيفة تتلف بسرعة بعد فترة قصيرة.",
      "بدون ضمان أو معاينة حقيقية قبل الدفع.",
      "صعوبة في الاستخدام ولا تلبي النتيجة المتوقعة.",
    ];
    const newTitle = c?.comparison_new_title || "المنتج الأصلي من متجرنا";
    const newPoints = c?.comparison_new_points || [
      "خامات أصلية 100% مختبرة ومضمونة الجودة.",
      "حق فتح الشحنة والفحص والتجربة قبل الدفع للمندوب.",
      "استبدال واسترجاع مجاني خلال 14 يوماً وخدمة عملاء مستمرة.",
    ];

    return (
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-4 text-center">
        <div>
          <span className="text-xs font-bold text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            {c?.comparison_badge || "ليه ده أفضل اختيار؟"}
          </span>
          <h2 className="text-lg sm:text-xl font-black text-slate-950 mt-2 font-heading">
            {comparisonTitle}
          </h2>
        </div>

        <div className={`grid grid-cols-1 ${comparisonImage ? "md:grid-cols-12" : "sm:grid-cols-2"} gap-4 text-right pt-1 items-center`}>
          <div className={`${comparisonImage ? "md:col-span-7 space-y-3" : "contents"}`}>
            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <XCircle className="w-5 h-5 shrink-0" />
                <span>{oldTitle}</span>
              </div>
              <ul className="text-xs text-rose-900 space-y-1.5 pr-2">
                {oldPoints.map((pt, i) => (
                  <li key={i}>• {pt}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{newTitle}</span>
              </div>
              <ul className="text-xs text-emerald-900 space-y-1.5 pr-2">
                {newPoints.map((pt, i) => (
                  <li key={i}>• {pt}</li>
                ))}
              </ul>
            </div>
          </div>

          {comparisonImage && (
            <div className="md:col-span-5 w-full">
              <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                <Image
                  src={comparisonImage}
                  alt={product.title_ar}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-contain p-2"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 3. BOX CONTENTS
  const renderBoxContents = () => {
    const boxImage =
      c?.box_image ||
      (product.images && product.images.length > 2 ? product.images[2] : null);
    const boxTitle = c?.box_title || "محتويات الشحنة الأصلية:";
    const boxItems = c?.box_items || [
      "المنتج الأصلي بكافة ملحقاته المعتمدة ومغلف بعناية.",
      "كتالوج ودليل الاستخدام السريع باللغة العربية.",
      "كارت الضمان الرسمي وحق الاستبدال والمعاينة.",
    ];

    return (
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-4 text-right">
        <div className="flex items-center gap-2 text-slate-900 font-black text-base font-heading">
          <Package className="w-5 h-5 text-indigo-700" />
          <span>{boxTitle}</span>
        </div>

        <div className={`grid grid-cols-1 ${boxImage ? "md:grid-cols-12" : ""} gap-4 items-center pt-1`}>
          {boxImage && (
            <div className="md:col-span-5 order-2 md:order-1 w-full">
              <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                <Image
                  src={boxImage}
                  alt="محتويات الشحنة"
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-contain p-2"
                />
              </div>
            </div>
          )}

          <div className={`${boxImage ? "md:col-span-7 order-1 md:order-2" : ""} space-y-2`}>
            <ul className="text-xs sm:text-sm text-slate-700 space-y-2.5 pr-1">
              {boxItems.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                  <span className="text-slate-800 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // 4. HOW TO USE
  const renderHowToUse = () => (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3 text-right">
      <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
        <Zap className="w-5 h-5 text-amber-600" />
        <span>طريقة الاستخدام والطلب في خطوات بسيطة:</span>
      </div>
      <div className="space-y-2 text-xs sm:text-sm text-slate-700 pr-1">
        <div className="flex items-start gap-2.5">
          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
          <span>اكتب بياناتك (الاسم، الموبايل، المحافظة) في الفورم بالأسفل.</span>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
          <span>سيتصل بك فريق التأكيد هاتفياً لمراجعة العنوان وميعاد التسليم.</span>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
          <span>افحص الشحنة بنفسك مع المندوب ثم ادفع بعد التأكد من سلامة المنتج.</span>
        </div>
      </div>
    </div>
  );

  // 5. REVIEWS & SOCIAL PROOF
  const renderReviews = () => (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4 text-right">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-black text-slate-900 font-heading flex items-center gap-2">
          <ThumbsUp className="w-4 h-4 text-indigo-600" />
          <span>تجارب حقيقية لعملائنا في مصر:</span>
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
            <strong className="text-slate-900 font-bold">أحمد الشناوي (المعادي، القاهرة)</strong>
            <span className="text-[10px] text-emerald-600 font-semibold">✓ مشتري موثق</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            "المنتج ممتاز ونفس المواصفات المكتوبة بالظبط، والتوصيل كان سريع جداً واستلمت بعد 3 أيام."
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <strong className="text-slate-900 font-bold">مروة يوسف (سموحة، الإسكندرية)</strong>
            <span className="text-[10px] text-emerald-600 font-semibold">✓ مشترية موثقة</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            "شجعتني فكرة إني أعاين المنتج مع المندوب قبل ما أدفع.. بجد خدمة ممتازة وخامة محترمة."
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <strong className="text-slate-900 font-bold">كريم حسني (المنصورة)</strong>
            <span className="text-[10px] text-emerald-600 font-semibold">✓ مشتري موثق</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            "اشتريت عرض القطعتين عشان التوفير، التغليف ممتاز والمنتج شغال بكفاءة عالية وأنصح بيه."
          </p>
        </div>
      </div>
    </div>
  );

  // 6. ORDER FORM
  const renderOrderForm = () => (
    <div id="order-form-section" className="scroll-mt-6">
      <EgyptianCheckoutForm
        product={product}
        selectedOffer={selectedOffer}
        onOfferChange={(offer) => setSelectedOffer(offer)}
        landingPageSlug={landingPage.slug}
        accentColor="emerald"
      />
    </div>
  );

  // 7. GUARANTEES FOOTER
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
      case "order_form":
        return renderOrderForm();
      case "guarantees":
        return renderGuarantees();
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-500 selection:text-white pb-24 md:pb-16" dir="rtl">
      {/* 1. Announcement Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white py-2 px-3 text-center text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2 border-b border-indigo-500/20">
        <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>{announcementText}</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
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
