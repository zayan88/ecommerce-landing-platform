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
  landingPageSlug: string;
  selectedOffer?: ProductOffer;
  onOfferSelect?: (offer: ProductOffer) => void;
  accentColor?: string;
}

export function EgyptianCheckoutForm({
  product,
  landingPageSlug,
  selectedOffer,
  onOfferSelect,
}: EgyptianCheckoutFormProps) {
  const router = useRouter();

  // Simplified Form fields (Name, Phone once, Governorate, Address)
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [governorate, setGovernorate] = useState("القاهرة");
  const [address, setAddress] = useState("");

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Offers & Pricing calculations (100% Free Shipping Everywhere)
  const currentOffer = (selectedOffer && selectedOffer.price) ? selectedOffer : product.offers?.[0];
  const quantity = currentOffer?.quantity || 1;
  const totalAmount = currentOffer?.price || product.base_price || 0;

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
      return "يرجى كتابة العنوان (المدينة أو الشارع أو علامة مميزة)";
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

      // Track Lead / Purchase on Client-Side Pixel
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
        landing_page_slug: landingPageSlug,
        customer_name: name.trim(),
        customer_phone: cleanedPhone,
        governorate: governorate,
        shipping_governorate: governorate,
        city: governorate,
        shipping_city: governorate,
        address: address.trim(),
        shipping_address: address.trim(),
        offer_id: currentOffer?.id || undefined,
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
        `/p/${landingPageSlug}/thank-you?orderId=${data.order.id}&orderNumber=${data.order.order_number}&total=${data.order.final_amount}&name=${encodeURIComponent(
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
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <TruckIcon className="w-3.5 h-3.5 text-emerald-600" /> شحن مجاني 100% لكافة محافظات مصر
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-2 font-heading">
          اطلب الآن واستلم في أسرع وقت
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          أدخل بياناتك وسيتم شحن المنتج فوراً مع إمكانية فتح الشحنة والتأكد منها قبل الدفع
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
                const isSelected = currentOffer?.id === offer.id;
                return (
                  <div
                    key={offer.id}
                    onClick={() => onOfferSelect && onOfferSelect(offer)}
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
            الاسم بالكامل <span className="text-red-500">*</span>
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

        {/* 2. Phone (Single clean phone field) */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
            رقم الهاتف المحمول (للتواصل والشحن) <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            required
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01012345678"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 placeholder-slate-400 text-sm outline-hidden transition text-right"
          />
        </div>

        {/* 3. Governorate (Free delivery across all) */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
            المحافظة <span className="text-red-500">*</span>
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
            العنوان بالتفصيل <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="المدينة / المنطقة، اسم الشارع، أو علامة مميزة"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 placeholder-slate-400 text-sm outline-hidden transition"
          />
        </div>

        {/* Pricing Summary (Zero Shipping Guaranteed) */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-1.5 text-xs sm:text-sm">
          <div className="flex justify-between text-slate-600">
            <span>سعر المنتج ({currentOffer?.title_ar || "الطلب"}):</span>
            <span className="font-bold text-slate-900">{totalAmount} ج.م</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>تكلفة الشحن إلى {governorate}:</span>
            <span className="font-black text-emerald-600">مجاني 100% 🎁</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm sm:text-base font-extrabold text-slate-900">
            <span>الإجمالي عند الاستلام (معاينة قبل الدفع):</span>
            <span className="text-2xl font-black text-orange-600 font-mono">{totalAmount} ج.م</span>
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
              <span>اضغط هنا لتأكيد الطلب الآن</span>
            </>
          )}
        </button>

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
