"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Product, LandingPage, ProductOffer, LandingPageSectionConfig, mergeSections } from "@/types";
import { cssVarsFor, isThemeColor } from "@/lib/palettes";
import { buildDefaultOffers } from "@/lib/offers";
import { LandingFooter } from "@/components/shared/LandingFooter";
import { FaqAccordion } from "@/components/shared/FaqAccordion";
import { GuaranteesStrip } from "@/components/shared/GuaranteesStrip";
import { SocialProofWall } from "@/components/shared/SocialProofWall";
import { shippingHint } from "@/lib/commerce";
import { useBrand } from "@/components/brand/BrandProvider";
import { EgyptianCheckoutForm } from "@/components/shared/EgyptianCheckoutForm";
import { StickyBuyBar } from "@/components/shared/StickyBuyBar";
import { HeroOfferSelector } from "@/components/shared/HeroOfferSelector";
import { EText, EImage } from "@/components/editor/Editable";
import { useEdit } from "@/components/editor/EditContext";
import {
  Star,
  ShieldCheck,
  Truck,
  Check,
  ArrowDown,
  Package,
  Clock,
  Sparkles,
  Zap,
  XCircle,
  CheckCircle2,
  ThumbsUp,
} from "lucide-react";

interface StarterLandingPageProps {
  product: Product;
  landingPage: LandingPage;
}

const DEFAULT_REVIEWS: { name: string; comment: string; badge: string }[] = [
  {
    name: "أحمد الشناوي (المعادي، القاهرة)",
    comment: "المنتج ممتاز ونفس المواصفات المكتوبة بالظبط، والتوصيل كان سريع جداً واستلمت بعد 3 أيام.",
    badge: "✓ مشتري موثق",
  },
  {
    name: "مروة يوسف (سموحة، الإسكندرية)",
    comment: "شجعتني فكرة إني أعاين المنتج مع المندوب قبل ما أدفع.. بجد خدمة ممتازة وخامة محترمة.",
    badge: "✓ مشترية موثقة",
  },
  {
    name: "كريم حسني (المنصورة)",
    comment: "اشتريت عرض القطعتين عشان التوفير، التغليف ممتاز والمنتج شغال بكفاءة عالية وأنصح بيه.",
    badge: "✓ مشتري موثق",
  },
];

const DEFAULT_STEPS: { step_num: number; title: string; desc: string }[] = [
  { step_num: 1, title: "", desc: "اكتب بياناتك (الاسم، الموبايل، المحافظة) في الفورم بالأسفل." },
  { step_num: 2, title: "", desc: "سيتصل بك فريق التأكيد هاتفياً لمراجعة العنوان وميعاد التسليم." },
  { step_num: 3, title: "", desc: "افحص الشحنة بنفسك مع المندوب ثم ادفع بعد التأكد من سلامة المنتج." },
];

export default function StarterLandingPage({ product, landingPage }: StarterLandingPageProps) {
  // Editor (admin) provides edit mode; on the public site this is always false
  const { editMode } = useEdit();
  // Built-in default tiers (the merchant can override them in the editor's offers tab)
  const defaultOffers: ProductOffer[] = buildDefaultOffers(product);

  const hideOffers = !!landingPage.content_config?.hide_offers;
  const allOffers = product.offers && product.offers.length > 0 ? product.offers : defaultOffers;
  // "No offers": one flat price (the single-piece tier), no selector
  const availableOffers = hideOffers ? [allOffers.find((o) => o.quantity === 1) || allOffers[0]] : allOffers;

  const [selectedOffer, setSelectedOffer] = useState<ProductOffer>(
    availableOffers.find((o) => o.quantity === 1) || availableOffers[0]
  );

  // Keep the selection in sync when offers are edited live in the editor
  useEffect(() => {
    setSelectedOffer(
      (prev) =>
        availableOffers.find((o) => o.id === prev.id) ||
        availableOffers.find((o) => o.quantity === 1) ||
        availableOffers[0]
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(availableOffers)]);

  // Ad links: ?offer=<offer id> pre-selects that tier, ?go=checkout scrolls to the order form.
  // Only picks among this product's own offers (the price always comes from the offer, never from the URL).
  useEffect(() => {
    if (editMode) return;
    const q = new URLSearchParams(window.location.search);
    const wanted = q.get("offer");
    if (wanted) {
      const o = availableOffers.find((x) => x.id === wanted);
      if (o) setSelectedOffer(o);
    }
    if (q.get("go") === "checkout") {
      // instant on purpose: someone arriving from an ad should land on the form, not watch a long animation
      setTimeout(() => document.getElementById("order-form-section")?.scrollIntoView({ behavior: "auto" }), 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const images = product.images && product.images.length > 0 ? product.images : ["/landing-pages/mesh-nebulizer/images/hero.webp"];
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Extract clean bullet points from product description
  const descriptionLines = (product.description_ar || "")
    .split(/[\n.!؟]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8)
    .slice(0, 4);

  const c = landingPage.content_config;
  const shipHint = shippingHint(useBrand().commerce.shipping);

  const announcementText =
    c?.announcement_bar ||
    (shipHint.free ? "شحن مجاني 100% لجميع محافظات مصر" : shipHint.text) + " + حق المعاينة والتجربة قبل الدفع 💵";
  const heroTitle = c?.hero_headline || product.title_ar;
  const heroSubtitle =
    c?.hero_subheadline ||
    (descriptionLines[0]
      ? `💡 ${descriptionLines[0]}`
      : "💡 احصل على أفضل تجربة مع المنتج الأصلي المعتمد وبأعلى معايير الجودة.");
  // No invented rating: the badge only shows when the merchant wrote one.
  const heroBadge = c?.hero_badge || "";
  const heroImageSrc = c?.hero_image || images[activeImageIndex] || images[0];

  // The first description line is already used as the subtitle: do not repeat it in the bullet list.
  const bulletLines = descriptionLines.slice(!c?.hero_subheadline && descriptionLines[0] ? 1 : 0);
  const features =
    c?.hero_bullets && c.hero_bullets.length > 0
      ? c.hero_bullets
      : bulletLines.length > 0
      ? bulletLines
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

  // Pages saved before new sections existed still get them (saved order/flags win)
  const sections: LandingPageSectionConfig[] = mergeSections(landingPage.sections_config);

  // Optional per-page colors (only emitted when the merchant picked them; otherwise the store brand applies
  // and the rendered markup has no style attribute at all).
  const pageTheme: React.CSSProperties | undefined = (() => {
    const p = isThemeColor(c?.theme_primary) ? c?.theme_primary : null;
    const a = isThemeColor(c?.theme_accent) ? c?.theme_accent : null;
    if (!p && !a) return undefined;
    return { ...(p ? cssVarsFor("primary", p) : {}), ...(a ? cssVarsFor("accent", a) : {}) } as React.CSSProperties;
  })();

  // 1. HERO SECTION
  const renderHero = () => (
    <div className="bg-white rounded-3xl p-4 sm:p-7 border border-slate-200/90 shadow-sm space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Gallery Column */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50">
            <Image
              src={heroImageSrc}
              alt={heroTitle}
              fill
              priority
              className="object-contain p-1"
            />
            <EImage field="hero_image" value={heroImageSrc} />
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(0, 4).map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition cursor-pointer bg-slate-50 ${
                    activeImageIndex === idx ? "border-orange-500 ring-2 ring-orange-500/25" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Image src={img} alt={`صورة ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Trust Badges */}
          {!c?.hide_hero_trust && (<div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-0.5" />
              <span className="font-bold text-[11px] text-slate-700 block">معاينة قبل الدفع</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
              <Truck className="w-4 h-4 text-emerald-600 mx-auto mb-0.5" />
              <span className="font-bold text-[11px] text-slate-700 block">{shipHint.free ? "شحن مجاني 100%" : shipHint.text}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
              <Clock className="w-4 h-4 text-amber-600 mx-auto mb-0.5" />
              <span className="font-bold text-[11px] text-slate-700 block">توصيل 5-7 أيام</span>
            </div>
          </div>)}
        </div>

        {/* Info & Core Specs */}
        <div className="space-y-4 text-right">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {(heroBadge || editMode) && (
              <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                <EText field="hero_badge" as="span" className="text-slate-800" value={heroBadge || "اضغط لإضافة شارة (اختياري)"} />
              </div>
            )}
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              ✓ متوفر الآن
            </span>
          </div>

          <div>
            <EText
              field="hero_headline"
              as="h1"
              className="text-xl sm:text-2xl font-black font-heading text-slate-950 leading-snug"
              value={heroTitle}
            />
            <EText
              field="hero_subheadline"
              as="p"
              className="text-xs sm:text-sm text-slate-900 font-semibold mt-1.5 leading-relaxed bg-slate-50/70 p-2.5 rounded-xl border border-slate-200"
              value={heroSubtitle}
            />
          </div>

          {/* Core Features List */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs sm:text-sm">
            {features.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <EText field={`hero_bullets.${idx}`} base={features} as="span" className="text-slate-700 font-medium leading-relaxed" value={feat} />
              </div>
            ))}
          </div>

          {/* Offer Selector Directly in the Hero */}
          {!hideOffers && <div className="pt-1">
            <HeroOfferSelector
              offers={availableOffers}
              selectedOffer={selectedOffer}
              onSelectOffer={(offer) => setSelectedOffer(offer)}
              accentColor="emerald"
            />
          </div>}

          {/* Price Display */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-900 block font-medium">السعر في العرض الحالي:</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-950 font-mono">{Number(selectedOffer.price).toLocaleString("en-US")} ج.م</span>
                {selectedOffer.original_price && (
                  <span className="text-sm text-slate-400 line-through font-mono">{Number(selectedOffer.original_price).toLocaleString("en-US")} ج.م</span>
                )}
              </div>
            </div>
            <div className="text-left">
              <span className="inline-block text-xs font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300">
                🚚 {shipHint.free ? "شحن مجاني" : shipHint.text}
              </span>
              <span className="block text-[11px] text-emerald-800 mt-1 font-semibold">الدفع عند الاستلام</span>
            </div>
          </div>

          {/* CTA Button */}
          <button
            type="button"
            onClick={scrollToCheckout}
            className="w-full py-4 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-base sm:text-lg shadow-lg shadow-orange-500/25 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
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
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-4 text-center">
        <div>
          <EText
            field="comparison_badge"
            as="span"
            className="text-xs font-bold text-emerald-800 bg-slate-50 px-3 py-1 rounded-full border border-slate-200"
            value={c?.comparison_badge || "ليه ده أفضل اختيار؟"}
          />
          <EText
            field="comparison_title"
            as="h2"
            className="text-lg sm:text-xl font-black text-slate-950 mt-2 font-heading"
            value={comparisonTitle}
          />
        </div>

        <div className={`grid grid-cols-1 ${comparisonImage ? "md:grid-cols-12" : "sm:grid-cols-2"} gap-4 text-right pt-1 items-center`}>
          <div className={`${comparisonImage ? "md:col-span-7 space-y-3" : "contents"}`}>
            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <XCircle className="w-5 h-5 shrink-0" />
                <EText field="comparison_old_title" as="span" value={oldTitle} />
              </div>
              <ul className="text-xs text-rose-900 space-y-1.5 pr-2">
                {oldPoints.map((pt, i) => (
                  <EText key={i} field={`comparison_old_points.${i}`} base={oldPoints} as="li" prefix="• " value={pt} />
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <EText field="comparison_new_title" as="span" value={newTitle} />
              </div>
              <ul className="text-xs text-emerald-900 space-y-1.5 pr-2">
                {newPoints.map((pt, i) => (
                  <EText key={i} field={`comparison_new_points.${i}`} base={newPoints} as="li" prefix="• " value={pt} />
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
                <EImage field="comparison_image" value={comparisonImage} />
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
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-4 text-right">
        <div className="flex items-center gap-2 text-slate-900 font-black text-base font-heading">
          <Package className="w-5 h-5 text-emerald-700" />
          <EText field="box_title" as="span" value={boxTitle} />
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
                <EImage field="box_image" value={boxImage} />
              </div>
            </div>
          )}

          <div className={`${boxImage ? "md:col-span-7 order-1 md:order-2" : ""} space-y-2`}>
            <ul className="text-xs sm:text-sm text-slate-700 space-y-2.5 pr-1">
              {boxItems.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                  <EText field={`box_items.${idx}`} base={boxItems} as="span" className="text-slate-800 leading-relaxed" value={item} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // 4. HOW TO USE
  const renderHowToUse = () => {
    const steps = c?.how_to_use_steps && c.how_to_use_steps.length > 0 ? c.how_to_use_steps : DEFAULT_STEPS;
    return (
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3 text-right">
        <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
          <Zap className="w-5 h-5 text-amber-600" />
          <EText
            field="how_to_use_title"
            as="span"
            value={c?.how_to_use_title || "طريقة الاستخدام والطلب في خطوات بسيطة:"}
          />
        </div>
        <div className="space-y-2 text-xs sm:text-sm text-slate-700 pr-1">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-200 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <EText field={`how_to_use_steps.${i}.desc`} base={steps} as="span" value={step.desc} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 5. REVIEWS & SOCIAL PROOF
  const renderReviews = () => {
    // Saved reviews have separate name/location; the page shows them as "name (location)"
    const reviews =
      c?.reviews && c.reviews.length > 0
        ? c.reviews.map((r, i) => ({
            name: r.location ? `${r.name} (${r.location})` : r.name,
            location: "",
            comment: r.comment,
            rating: r.rating,
            badge: DEFAULT_REVIEWS[i]?.badge || "✓ مشتري موثق",
          }))
        : DEFAULT_REVIEWS.map((r) => ({ name: r.name, location: "", comment: r.comment, rating: 5, badge: r.badge }));
    const reviewsBase = reviews.map(({ name, location, comment, rating }) => ({ name, location, comment, rating }));

    return (
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4 text-right">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 font-heading flex items-center gap-2">
            <ThumbsUp className="w-4 h-4 text-emerald-600" />
            <EText field="reviews_title" as="span" value={c?.reviews_title || "تجارب حقيقية لعملائنا في مصر:"} />
          </h3>
          <div className="flex text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400" />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {reviews.map((rv, i) => (
            <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <EText field={`reviews.${i}.name`} base={reviewsBase} as="strong" className="text-slate-900 font-bold" value={rv.name} />
                <span className="text-[10px] text-emerald-600 font-semibold">{rv.badge}</span>
              </div>
              <EText
                field={`reviews.${i}.comment`}
                base={reviewsBase}
                as="p"
                className="text-slate-600 leading-relaxed"
                prefix={'"'}
                suffix={'"'}
                merge
                value={rv.comment}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 6. ORDER FORM
  const renderOrderForm = () => (
    <div id="order-form-section" className="scroll-mt-6">
      <EgyptianCheckoutForm
        product={product}
        selectedOffer={selectedOffer}
        onOfferChange={(offer) => setSelectedOffer(offer)}
        landingPageSlug={landingPage.slug}
        accentColor="emerald"
        previewOnly={editMode}
        hideOffers={hideOffers}
        hideTrust={!!c?.hide_checkout_trust}
        ctaText={c?.cta_text}
      />
    </div>
  );

  // 7. GUARANTEES FOOTER
  const renderGuarantees = () => (
    <GuaranteesStrip title={c?.guarantees_title || "ضماناتنا ليك"} items={c?.guarantees} editable />
  );

  // 8. TRUST STRIP (stage 2) — only real rating/count are shown, never invented
  const renderSocialProof = () => (
    <SocialProofWall
      rating={c?.proof_rating}
      reviewsCount={c?.proof_reviews_count}
      statements={c?.proof_statements}
      governorates={c?.proof_governorates}
      editable
    />
  );

  // 10. FINAL CALL TO ACTION: one more button at the end of the page
  const renderFinalCta = () => (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 text-center space-y-3">
      <EText
        field="final_cta_title"
        as="h2"
        className="text-xl sm:text-2xl font-black font-heading text-slate-950 leading-snug"
        value={c?.final_cta_title || heroTitle}
      />
      <EText
        field="final_cta_desc"
        as="p"
        className="text-sm text-slate-600 leading-relaxed"
        value={c?.final_cta_desc || "اطلب دلوقتي وادفع لما يوصلك، وافتح الشحنة وجرّبها قبل ما تدفع."}
      />
      <button
        type="button"
        onClick={scrollToCheckout}
        className="min-h-[52px] px-8 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-base shadow-lg shadow-orange-500/25 active:scale-[0.98] transition cursor-pointer"
      >
        {c?.cta_text?.trim() || "اطلب دلوقتي"}
      </button>
    </div>
  );

  // 9. FAQ (stage 9)
  const renderFaq = () => <FaqAccordion title={c?.faq_title} items={c?.faq_items} editable />;

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
      case "social_proof":
        return renderSocialProof();
      case "faq":
        return renderFaq();
      case "final_cta":
        return renderFinalCta();
      default:
        return null;
    }
  };

  return (
    <main style={pageTheme} className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-500 selection:text-white" dir="rtl">
      {/* 1. Announcement Bar */}
      {!c?.hide_announcement && (
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900 text-white py-2 px-3 text-center text-xs sm:text-sm font-bold shadow-sm flex items-center justify-center gap-2 border-b border-slate-500/20">
        <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
        <EText field="announcement_bar" as="span" value={announcementText} />
      </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {sections.map((sec) => {
          if (!sec.enabled) return null;
          return <React.Fragment key={sec.id}>{renderSection(sec.id)}</React.Fragment>;
        })}
      </div>

      {/* Store footer */}
      <LandingFooter extraBottomSpace={!editMode} />

      {/* Sticky Buy Bar */}
      {!editMode && !c?.hide_sticky_bar && (
        <StickyBuyBar
          ctaText={c?.cta_text?.trim() || undefined}
          product={product}
          selectedOffer={selectedOffer}
          onBuyClick={scrollToCheckout}
        />
      )}
    </main>
  );
}
