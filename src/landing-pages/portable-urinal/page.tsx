"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Product, LandingPage, ProductOffer } from "@/types";
import { urinalLandingConfig } from "./config";
import { EgyptianCheckoutForm } from "@/components/shared/EgyptianCheckoutForm";
import { StickyBuyBar } from "@/components/shared/StickyBuyBar";
import {
  Star,
  CheckCircle,
  Truck,
  ShieldCheck,
  RotateCcw,
  Clock,
  HeartHandshake,
  ChevronDown,
  Sparkles,
  ArrowDownCircle,
  AlertTriangle,
} from "lucide-react";

interface PortableUrinalPageProps {
  product: Product;
  landingPage: LandingPage;
}

export default function PortableUrinalPage({ product, landingPage }: PortableUrinalPageProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedOffer, setSelectedOffer] = useState<ProductOffer>(
    product.offers?.find((o) => o.is_popular) || product.offers?.[0] || ({} as ProductOffer)
  );
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const images = urinalLandingConfig.images;

  const scrollToCheckout = () => {
    const el = document.getElementById("order-form-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      {/* 1. TOP URGENCY ANNOUNCEMENT BAR */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white text-xs md:text-sm py-2.5 px-4 text-center font-bold shadow-xs">
        <div className="container mx-auto flex items-center justify-center gap-2 flex-wrap">
          <span className="bg-amber-400 text-gray-950 px-2 py-0.5 rounded-full text-xs font-black animate-pulse">
            عرض اليوم الحصري
          </span>
          <span>شحن مجاني + خصم يصل إلى 50% عند طلب قطعتين أو أكثر لفترة محدودة!</span>
        </div>
      </div>

      {/* 2. HEADER */}
      <header className="bg-white border-b border-gray-100 py-4 px-4 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md">
              ع
            </div>
            <div>
              <span className="font-heading font-black text-lg md:text-xl text-gray-900 block leading-tight">
                الرعاية الطبية الذكية
              </span>
              <span className="text-[11px] text-gray-500 font-medium">وسائل مساعدة صحية معتمدة</span>
            </div>
          </div>

          <button
            onClick={scrollToCheckout}
            className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition"
          >
            اطلب الآن
          </button>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section className="py-8 md:py-16 px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Images Gallery */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-white border border-gray-200/80 shadow-lg">
              <Image
                src={images[activeImageIndex].src}
                alt={images[activeImageIndex].alt}
                fill
                className="object-contain p-2"
                priority
              />
              <span className="absolute top-4 right-4 bg-emerald-600/90 backdrop-blur-xs text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> خامة طبية أصلية
              </span>
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-5 gap-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-white ${
                    activeImageIndex === idx
                      ? "border-emerald-600 ring-2 ring-emerald-600/30 shadow-md"
                      : "border-gray-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={img.src} alt={img.alt} fill className="object-cover p-1" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Hero Info & Pitch */}
          <div className="lg:col-span-6 space-y-5 text-right">
            <div className="flex items-center gap-2">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs font-bold text-gray-700">4.9 / 5</span>
              <span className="text-xs text-gray-400">(أكثر من 1,400 عميل سعيد في مصر)</span>
            </div>

            <h1 className="text-2xl md:text-4xl font-black text-gray-950 font-heading leading-tight">
              {urinalLandingConfig.productTitle}
            </h1>

            <p className="text-base md:text-lg text-gray-600 leading-relaxed">
              {urinalLandingConfig.subtitle} — حل عملي ومريح يمنح كبار السن والمرضى الاستقلالية التامة، وينقذك في زحمة السفر والمشاوير الطويلة.
            </p>

            {/* Price Badge */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-800 font-semibold block">السعر الحالي للقطعة:</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-700">{product.base_price} ج.م</span>
                  {product.compare_at_price && (
                    <span className="text-base text-gray-400 line-through">
                      {product.compare_at_price} ج.م
                    </span>
                  )}
                </div>
              </div>
              <span className="bg-emerald-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg">
                وفر 151 ج.م اليوم
              </span>
            </div>

            {/* Quick Benefits Checklist */}
            <ul className="space-y-2.5">
              {urinalLandingConfig.heroBadges.map((badge, idx) => (
                <li key={idx} className="flex items-center gap-2.5 text-sm font-bold text-gray-800">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>{badge}</span>
                </li>
              ))}
            </ul>

            {/* Call To Action Button */}
            <div className="pt-2">
              <button
                onClick={scrollToCheckout}
                className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xl shadow-xl shadow-emerald-600/30 active:scale-98 transition flex items-center justify-center gap-3 animate-pulse-glow"
              >
                <ArrowDownCircle className="w-6 h-6" />
                <span>اطلب الآن واستلم عند باب بيتك</span>
              </button>
              <p className="text-center text-xs text-gray-500 mt-2 flex items-center justify-center gap-1">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                <span>المعاينة مجانية قبل استلام الطلب والدفع</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PAIN POINTS / EMPATHY SECTION */}
      <section className="py-12 bg-white border-y border-gray-100 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider bg-red-50 px-3 py-1 rounded-full border border-red-200">
              لماذا تحتاج هذا المنتج؟
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-3 font-heading">
              مواقف صعبة لا يجب أن تتركها للصدفة
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {urinalLandingConfig.painPoints.map((point, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-50 border border-gray-200/80 hover:border-emerald-300 transition-all flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 font-heading mb-1">{point.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{point.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FEATURES IN-DEPTH WITH PHOTOS */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            المواصفات والامتيازات
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-3 font-heading">
            صُمم ليوفر أقصى درجات الراحة والنظافة
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {urinalLandingConfig.features.map((feat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              <div className="relative aspect-16/10 w-full bg-slate-100">
                <Image src={feat.img} alt={feat.title} fill className="object-cover" />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 font-heading mb-2">{feat.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feat.desc}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs font-semibold text-emerald-600">
                  <CheckCircle className="w-4 h-4" /> ضمان الجودة الطبية
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. TECHNICAL SPECS TABLE */}
      <section className="py-12 bg-white border-y border-gray-100 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6 font-heading">
            المواصفات الفنية للوعاء
          </h2>
          <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <table className="w-full text-right text-sm">
              <tbody>
                {urinalLandingConfig.specs.map((item, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-slate-50/60" : "bg-white"}`}
                  >
                    <td className="py-3.5 px-5 font-bold text-gray-900 w-1/3">{item.label}</td>
                    <td className="py-3.5 px-5 text-gray-600">{item.val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 7. AUTHENTIC CUSTOMER REVIEWS */}
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            تجارب حقيقية
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-3 font-heading">
            ماذا يقول عملاؤنا في مصر؟
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {urinalLandingConfig.reviews.map((rev, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex text-amber-400 mb-3">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">"{rev.text}"</p>
              </div>
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span className="font-bold text-gray-900">{rev.name}</span>
                <span>{rev.location}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. HIGH-CONVERTING EGYPTIAN CHECKOUT FORM */}
      <section className="py-12 bg-slate-100 px-4">
        <div className="max-w-4xl mx-auto">
          <EgyptianCheckoutForm
            product={product}
            landingPageSlug={landingPage.slug}
            selectedOffer={selectedOffer}
            onOfferSelect={(offer) => setSelectedOffer(offer)}
          />
        </div>
      </section>

      {/* 9. FAQ ACCORDION */}
      <section className="py-14 px-4 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8 font-heading">
          الأسئلة الشائعة
        </h2>
        <div className="space-y-3">
          {urinalLandingConfig.faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs transition"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-right font-bold text-gray-900 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50"
                >
                  <span className="text-base">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-sm text-gray-600 leading-relaxed border-t border-gray-100 bg-slate-50/40">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-10 px-4 text-center text-xs pb-24 md:pb-10">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex justify-center items-center gap-6 text-gray-400">
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-400" /> شحن لجميع محافظات مصر
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> معاينة قبل الاستلام
            </span>
            <span className="flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-emerald-400" /> استبدال واسترجاع 14 يوم
            </span>
          </div>
          <p className="text-gray-500 max-w-xl mx-auto">
            جميع الحقوق محفوظة © {new Date().getFullYear()} - منصة المنتجات الطبية والرعاية الصحية.
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
