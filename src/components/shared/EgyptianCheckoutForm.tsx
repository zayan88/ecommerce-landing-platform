"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { EGYPTIAN_GOVERNORATES, getGovernorateDeliveryFee } from "@/lib/constants/governorates";
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

  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phone2, setPhone2] = useState("");
  const [governorate, setGovernorate] = useState("القاهرة");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Offers & Pricing calculations
  const currentOffer = (selectedOffer && selectedOffer.price) ? selectedOffer : product.offers?.[0];
  const quantity = currentOffer?.quantity || 1;
  const baseSubtotal = currentOffer?.price || product.base_price || 0;
  const deliveryFee = currentOffer?.free_shipping ? 0 : getGovernorateDeliveryFee(governorate);
  const totalAmount = baseSubtotal + deliveryFee;

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
    if (!address.trim() || address.trim().length < 5) {
      return "يرجى كتابة العنوان بالتفصيل (اسم الشارع ورقم العقار أو علامة مميزة)";
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
        customer_phone: phone.trim(),
        customer_phone2: phone2.trim() || null,
        shipping_governorate: governorate,
        shipping_city: governorate,
        shipping_address: address.trim(),
        customer_notes: notes.trim() || null,
        offer_id: currentOffer?.id || null,
        base_price: baseSubtotal,
        shipping_fee: deliveryFee,
        discount_amount: 0,
        final_amount: totalAmount,
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
        throw new Error(data.error || "تعذر إرسال الطلب، يرجى المحاولة ثانية");
      }

      // Redirect to customized Arabic thank-you page
      router.push(
        `/p/${landingPageSlug}/thank-you?orderId=${data.order.id}&orderNumber=${data.order.order_number}&total=${data.order.final_amount}&name=${encodeURIComponent(
          data.order.customer_name
        )}&phone=${encodeURIComponent(data.order.customer_phone)}`
      );
    } catch (err: any) {
      setErrorMessage(err.message || "حدث خطأ في الاتصال، يرجى التأكد من الإنترنت");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="order-form-section"
      className="bg-white rounded-3xl shadow-xl border border-slate-200/90 p-6 md:p-8 max-w-2xl mx-auto my-8 text-right"
      dir="rtl"
    >
      <div className="text-center pb-6 border-b border-slate-100">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
          <TruckIcon className="w-3.5 h-3.5 text-indigo-600" /> الدفع عند الاستلام بعد المعاينة الكاملة
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-3 font-heading">
          اطلب الآن واستلم في أسرع وقت
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          أدخل بياناتك وسيتم شحن المنتج فوراً مع إمكانية فتح الشحنة والتأكد منها قبل الدفع
        </p>
      </div>

      {errorMessage && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
          <ExclamationCircleIcon className="w-5 h-5 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" onFocus={handleFirstInteraction}>
        {/* Tiered Offers Selection */}
        {product.offers && product.offers.length > 0 && (
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-900">
              اختر العرض المناسب لك:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {product.offers.map((offer) => {
                const isSelected = currentOffer?.id === offer.id;
                return (
                  <div
                    key={offer.id}
                    onClick={() => onOfferSelect && onOfferSelect(offer)}
                    className={`relative cursor-pointer rounded-2xl p-3.5 border-2 transition-all ${
                      isSelected
                        ? "border-orange-500 bg-orange-50/70 shadow-sm ring-2 ring-orange-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    {offer.is_popular && (
                      <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                        الأكثر طلباً ⭐
                      </span>
                    )}
                    <div className="flex items-start justify-between">
                      <div className="font-bold text-slate-900 text-sm">{offer.title_ar}</div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                          isSelected ? "border-orange-600 bg-orange-600" : "border-slate-300"
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-lg font-black text-orange-600 font-mono">
                        {offer.price} ج.م
                      </span>
                      {offer.original_price && (
                        <span className="text-xs text-slate-400 line-through">
                          {offer.original_price} ج.م
                        </span>
                      )}
                    </div>
                    {offer.free_shipping && (
                      <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-600">
                        + شحن مجاني
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            الاسم بالكامل <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: أحمد محمد علي"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder-slate-400 text-base outline-hidden transition"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            رقم الهاتف المحمول (للتواصل وتأكيد الشحن) <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            required
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01012345678"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder-slate-400 text-base outline-hidden transition text-right"
          />
        </div>

        {/* Phone 2 Optional */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            رقم هاتف إضافي أو واتساب (اختياري)
          </label>
          <input
            type="tel"
            dir="ltr"
            value={phone2}
            onChange={(e) => setPhone2(e.target.value)}
            placeholder="01187654321"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder-slate-400 text-base outline-hidden transition text-right"
          />
        </div>

        {/* Governorate */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            المحافظة <span className="text-red-500">*</span>
          </label>
          <select
            value={governorate}
            onChange={(e) => setGovernorate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 text-base outline-hidden transition bg-white"
          >
            {EGYPTIAN_GOVERNORATES.map((gov) => (
              <option key={gov.id} value={gov.nameAr}>
                {gov.nameAr} ({gov.deliveryDays} - مصاريف الشحن: {gov.deliveryFee} ج.م)
              </option>
            ))}
          </select>
        </div>

        {/* Detailed Address */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            العنوان بالتفصيل <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="المنطقة، اسم الشارع، رقم العمارة، رقم الشقة أو علامة مميزة"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder-slate-400 text-base outline-hidden transition"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            ملاحظات لمندوب الشحن (اختياري)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="مثال: يرجى الاتصال قبل الوصول"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 placeholder-slate-400 text-sm outline-hidden transition"
          />
        </div>

        {/* Pricing Summary */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>سعر المنتج ({currentOffer?.title_ar || "الطلب"}):</span>
            <span className="font-bold text-slate-900">{baseSubtotal} ج.م</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>تكلفة الشحن إلى {governorate}:</span>
            <span className="font-bold text-slate-900">
              {deliveryFee === 0 ? (
                <span className="text-emerald-600 font-bold">مجاني 🎉</span>
              ) : (
                `${deliveryFee} ج.م`
              )}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-base font-extrabold text-slate-900">
            <span>المبلغ الإجمالي عند الاستلام:</span>
            <span className="text-2xl font-black text-slate-950 font-mono">{totalAmount} ج.م</span>
          </div>
        </div>

        {/* Submit Button (Sunset Amber & Fire Orange Gradient) */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-lg md:text-xl shadow-xl shadow-orange-500/25 active:scale-[0.99] transition transform cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>جاري تسجيل طلبك...</span>
            </div>
          ) : (
            <>
              <CheckCircleIcon className="w-6 h-6" />
              <span>اضغط هنا لتأكيد الطلب الآن</span>
            </>
          )}
        </button>

        {/* Security & Guarantees */}
        <div className="grid grid-cols-3 gap-2 pt-3 text-center text-xs text-slate-500">
          <div className="flex flex-col items-center gap-1">
            <TruckIcon className="w-4 h-4 text-indigo-600" />
            <span>شحن سريع لكافة المحافظات</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ShieldCheckIcon className="w-4 h-4 text-indigo-600" />
            <span>معاينة قبل الدفع</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ClockIcon className="w-4 h-4 text-indigo-600" />
            <span>ضمان استبدال 14 يوم</span>
          </div>
        </div>
      </form>
    </div>
  );
}
