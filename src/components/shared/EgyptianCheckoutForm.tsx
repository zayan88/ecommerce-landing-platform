"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { EGYPTIAN_GOVERNORATES } from "@/lib/constants/governorates";
import { captureUtmParams, generateEventId } from "@/lib/tracking/utm";
import { trackMetaEvent } from "@/lib/tracking/meta-pixel";
import { Product, ProductOffer } from "@/types";
import {
  CheckCircleIcon,
  ShieldCheckIcon,
  TruckIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";

interface EgyptianCheckoutFormProps {
  product: Product;
  landingPageSlug?: string;
  landingPage?: { slug?: string; [key: string]: any };
  selectedOffer?: ProductOffer;
  onOfferSelect?: (offer: ProductOffer) => void;
  onOfferChange?: (offer: ProductOffer) => void;
  accentColor?: string;
}

export function EgyptianCheckoutForm({
  product,
  landingPageSlug,
  landingPage,
  selectedOffer,
  onOfferSelect,
  onOfferChange,
}: EgyptianCheckoutFormProps) {
  const router = useRouter();

  // Simplified Form fields (Name, Phone once, Governorate, Address, Notes/Details)
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [governorate, setGovernorate] = useState("القاهرة");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Default initial offer (First offer or fallback)
  const defaultFirstOffer = product.offers && product.offers.length > 0
    ? (product.offers.find((o) => o.is_popular) || product.offers[0])
    : {
        id: `offer-default-${product.id}`,
        product_id: product.id,
        title_ar: "قطعة واحدة (تجربة)",
        quantity: 1,
        price: product.base_price || 799,
        original_price: product.compare_at_price || 1200,
        discount_label: "خصم خاص",
        is_popular: false,
        free_shipping: true,
        sort_order: 1,
      };

  // Internal active offer state (guarantees clicking an offer ALWAYS updates immediately)
  const [activeOffer, setActiveOffer] = useState<ProductOffer>(() => {
    return selectedOffer && selectedOffer.price ? selectedOffer : defaultFirstOffer;
  });

  // Sync if selectedOffer prop updates from parent
  React.useEffect(() => {
    if (selectedOffer && selectedOffer.id && selectedOffer.id !== activeOffer.id) {
      setActiveOffer(selectedOffer);
    }
  }, [selectedOffer]);

  const handleSelectOffer = (offer: ProductOffer) => {
    setActiveOffer(offer);
    if (onOfferSelect) onOfferSelect(offer);
    if (onOfferChange) onOfferChange(offer);
  };

  const quantity = activeOffer?.quantity || 1;
  const totalAmount = activeOffer?.price || product.base_price || 0;

  // Track InitiateCheckout on initial interaction
  const [hasInteracted, setHasInteracted] = useState(false);
  const handleFirstInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      trackMetaEvent("InitiateCheckout", {
        content_name: product.title_ar,
        currency: "EGP",
        value: totalAmount,
        num_items: quantity,
      });
    }
  };

  // Validation
  const validateForm = () => {
    if (!name.trim()) return "يرجى كتابة الاسم بالكامل";
    const cleanedPhone = phone.trim().replace(/\s+/g, "");
    const egPhoneRegex = /^01[0125][0-9]{8}$/;
    if (!egPhoneRegex.test(cleanedPhone)) {
      return "يرجى كتابة رقم هاتف مصري صحيح (11 رقم يبدأ بـ 010 أو 011 أو 012 أو 015)";
    }
    if (!address.trim() || address.trim().length < 3) {
      return "يرجى كتابة العنوان بالتفصيل (المدينة أو الشارع أو علامة مميزة)";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const error = validateForm();
    if (error) {
      setErrorMessage(error);
      return;
    }

    setIsSubmitting(true);

    try {
      const utms = captureUtmParams();
      const eventId = generateEventId();
      const cleanedPhone = phone.trim().replace(/\s+/g, "");

      // Resolve landing page slug safely
      const effectiveSlug =
        landingPageSlug ||
        landingPage?.slug ||
        product?.slug ||
        "body-massager";

      // Track Purchase on Client-Side Pixel
      trackMetaEvent(
        "Purchase",
        {
          content_name: product.title_ar,
          content_type: "product",
          currency: "EGP",
          value: totalAmount,
          num_items: quantity,
        },
        eventId
      );

      const payload = {
        product_id: product.id,
        landing_page_slug: effectiveSlug,
        customer_name: name.trim(),
        customer_phone: cleanedPhone,
        governorate: governorate || "القاهرة",
        shipping_governorate: governorate || "القاهرة",
        city: governorate || "القاهرة",
        shipping_city: governorate || "القاهرة",
        address: address.trim(),
        shipping_address: address.trim(),
        notes: notes.trim() || undefined,
        customer_notes: notes.trim() || undefined,
        offer_id: activeOffer?.id || undefined,
        quantity,
        payment_method: "cod",
        event_id: eventId,
        ...utms,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "تعذر إرسال الطلب، يرجى التأكد من البيانات");
      }

      // Redirect to customized Arabic thank-you page
      router.push(
        `/p/${effectiveSlug}/thank-you?orderId=${data.order.id}&orderNumber=${data.order.order_number}&total=${data.order.final_amount}&name=${encodeURIComponent(
          data.order.customer_name
        )}&phone=${encodeURIComponent(data.order.customer_phone)}&gov=${encodeURIComponent(
          data.order.governorate || governorate
        )}&address=${encodeURIComponent(data.order.address || address.trim())}`
      );
    } catch (err: any) {
      setErrorMessage(err.message || "حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="order-form-section"
      className="bg-white rounded-3xl shadow-xl border border-slate-200/90 p-5 md:p-8 max-w-2xl mx-auto my-6 text-right"
      dir="rtl"
    >
      <div className="text-center pb-5 border-b border-slate-100">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <TruckIcon className="w-4 h-4 text-emerald-600" /> الشحن علينا لحد باب بيتك + معاينة كاملة قبل ما تدفع
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-2.5 font-heading">
          اطلب دلوقتي.. وادفع بس لما الشحنة توصلك وتعاينها
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-lg mx-auto leading-relaxed">
          مش هتدفع ولا جنيه دلوقتي. سيب بياناتك، ولما المندوب يوصلك افتح الشحنة وعاينها براحتك، وبعدين ادفع.
        </p>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2.5 font-bold">
          <ExclamationCircleIcon className="w-5 h-5 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4" onFocus={handleFirstInteraction}>
        {/* Tiered Offers Selection */}
        {product.offers && product.offers.length > 0 && (
          <div className="space-y-2.5">
            <label className="block text-sm font-bold text-slate-900">
              اختر العرض المناسب لك:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {product.offers.map((offer) => {
                const isSelected = activeOffer?.id === offer.id || activeOffer?.quantity === offer.quantity;
                return (
                  <div
                    key={offer.id}
                    onClick={() => handleSelectOffer(offer)}
                    className={`relative cursor-pointer rounded-2xl p-3 border-2 transition-all ${
                      isSelected
                        ? "border-orange-500 bg-orange-50/70 shadow-sm ring-2 ring-orange-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    {offer.is_popular && (
                      <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                        الأكثر طلباً ⭐
                      </span>
                    )}
                    <div className="flex items-start justify-between">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">{offer.title_ar}</div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                          isSelected ? "border-orange-600 bg-orange-600" : "border-slate-300"
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-1.5">
                      <span className="text-base sm:text-lg font-black text-orange-600 font-mono">
                        {offer.price} ج.م
                      </span>
                      {offer.original_price && (
                        <span className="text-xs text-slate-400 line-through">
                          {offer.original_price} ج.م
                        </span>
                      )}
                    </div>
                    <span className="inline-block mt-0.5 text-[10px] font-bold text-emerald-600">
                      ✓ شحن مجاني
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 1. Name */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
            اسمك بالكامل <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: محمد السيد"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 placeholder-slate-400 text-sm outline-hidden transition"
          />
        </div>

        {/* 2. Phone */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs sm:text-sm font-bold text-slate-800">
              رقم موبايلك (هنكلمك نأكد معاك الشحن) <span className="text-red-500">*</span>
            </label>
            <span className="text-[10px] text-emerald-700 font-medium">🔒 في أمان تام</span>
          </div>
          <input
            type="tel"
            required
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01012345678"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 placeholder-slate-400 text-sm outline-hidden transition text-right font-mono"
          />
        </div>

        {/* 3. Governorate */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
            محافظتك <span className="text-red-500">*</span>
          </label>
          <select
            value={governorate}
            onChange={(e) => setGovernorate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 text-sm outline-hidden transition bg-white"
          >
            {EGYPTIAN_GOVERNORATES.map((gov) => (
              <option key={gov.id} value={gov.nameAr}>
                {gov.nameAr}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Detailed Address */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
            عنوانك بالتفصيل <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="المدينة، اسم الشارع، أو أقرب علامة مميزة"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 placeholder-slate-400 text-sm outline-hidden transition"
          />
        </div>

        {/* 5. Details / Notes */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
            عندك ملاحظة للمندوب؟ <span className="text-slate-400 font-normal">(اختياري)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="رقم العمارة والشقة، أو الوقت الأنسب لك للاستلام..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 placeholder-slate-400 text-sm outline-hidden transition resize-none"
          />
        </div>

        {/* Pricing Summary */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between text-slate-600">
            <span>سعر الطلب ({activeOffer?.title_ar || "المنتج"}):</span>
            <span className="font-bold text-slate-900">{totalAmount} ج.م</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>الشحن والتوصيل إلى {governorate}:</span>
            <span className="font-bold text-emerald-600">مجاناً بالكامل علينا 🎁</span>
          </div>
          <div className="pt-2.5 border-t border-slate-200 flex justify-between items-baseline text-sm sm:text-base font-extrabold text-slate-900">
            <span>المبلغ المطلوب عند الاستلام:</span>
            <span className="text-2xl font-black text-orange-600 font-mono">{totalAmount} ج.م</span>
          </div>
          <div className="text-[11px] text-slate-500 pt-0.5">
            ✓ هتدفع للمندوب بس لما تستلم الشحنة وتعاينها بنفسك.
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-base sm:text-lg shadow-xl shadow-orange-500/25 active:scale-[0.99] transition transform cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>جاري تسجيل طلبك...</span>
            </div>
          ) : (
            <>
              <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>أكّد طلبي.. وهدفع عند الاستلام 🛒</span>
            </>
          )}
        </button>

        {/* Security & Guarantees Strip */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center text-xs text-slate-600 font-medium">
          🔒 مفيش دفع أونلاين • معاينة كاملة قبل الدفع للمندوب • استبدال فوري لو في أي عيب
        </div>

        {/* Security & Guarantees */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[11px] text-slate-500">
          <div className="flex flex-col items-center gap-1">
            <TruckIcon className="w-4 h-4 text-emerald-600" />
            <span>شحن مجاني وسريع</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
            <span>معاينة قبل الدفع</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ClockIcon className="w-4 h-4 text-emerald-600" />
            <span>استبدال 14 يوم</span>
          </div>
        </div>
      </form>
    </div>
  );
}
