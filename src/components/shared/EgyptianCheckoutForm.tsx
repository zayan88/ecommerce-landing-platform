"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EGYPTIAN_GOVERNORATES } from "@/lib/constants/governorates";
import { captureUtmParams, generateEventId } from "@/lib/tracking/utm";
import { trackMetaEvent } from "@/lib/tracking/meta-pixel";
import { trackMarketingEvent } from "@/lib/tracking/marketing-pixels";
import { Product, ProductOffer } from "@/types";
import { HeroOfferSelector } from "./HeroOfferSelector";
import { useBrand } from "@/components/brand/BrandProvider";
import { bestAutoCoupon, computeShipping, shippingHint } from "@/lib/commerce";
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
  /** Editor preview: blocks submit/redirect/tracking and shows a small note. Default false. */
  previewOnly?: boolean;
  /** Merchant turned the offer tiers off: one flat price, no selector. */
  hideOffers?: boolean;
  /** Merchant turned the repeated trust icons off. */
  hideTrust?: boolean;
  /** Custom text of the order button (merchant setting). */
  ctaText?: string;
}

export function EgyptianCheckoutForm({
  product,
  landingPageSlug,
  landingPage,
  selectedOffer,
  onOfferSelect,
  onOfferChange,
  accentColor = "orange",
  previewOnly = false,
  hideOffers = false,
  hideTrust = false,
  ctaText,
}: EgyptianCheckoutFormProps) {
  const router = useRouter();

  // Simplified Form fields (Name, Phone once, Governorate, Address, Notes/Details)
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [governorate, setGovernorate] = useState("القاهرة");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const brand = useBrand();
  const [payMethod, setPayMethod] = useState<"cod" | "vodafone_cash" | "instapay">("cod");
  const [payRef, setPayRef] = useState("");
  const [copied, setCopied] = useState(false);
  const copyPayTarget = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // old browsers: select the text in a temporary field and use the legacy command
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        return;
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  // Honeypot: hidden from humans; bots that fill it get a fake success server-side
  const [website, setWebsite] = useState("");

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Default initial offer (Prioritize single piece offer or fallback)
  const defaultFirstOffer = product.offers && product.offers.length > 0
    ? (product.offers.find((o) => o.quantity === 1) || product.offers[0])
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
    if (typeof window !== "undefined" && window.storeTrack) {
      window.storeTrack("SelectOffer", {
        offer_id: offer.id,
        title: offer.title_ar,
        quantity: offer.quantity,
        price: offer.price,
      });
    }
  };

  const quantity = activeOffer?.quantity || 1;
  const totalAmount = activeOffer?.price || product.base_price || 0;

  // Shipping fee / minimum order / coupon: the numbers shown here mirror what /api/orders decides on the server
  const shipCfg = brand.commerce?.shipping;
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponMsg, setCouponMsg] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number; shipping: number; auto?: boolean } | null>(null);
  const offerFree = Boolean(activeOffer?.free_shipping);
  // the merchant's automatic discount is computed here from the public list (no request); the server re-decides
  const autoRes = brand.commerce?.auto_coupons
    ? bestAutoCoupon(brand.commerce.auto_coupons, { subtotal: totalAmount, quantity: activeOffer?.quantity || 1, productId: product.id })
    : null;
  const autoCoupon =
    autoRes && autoRes.ok
      ? {
          code: autoRes.code || "",
          discount: autoRes.discount,
          auto: true as const,
          shipping: autoRes.free_shipping || !shipCfg ? 0 : computeShipping(shipCfg, { total: totalAmount - autoRes.discount, productId: product.id, offerFree }),
        }
      : null;
  const eff = coupon ?? autoCoupon;
  const discount = eff?.discount || 0;
  const shipFee = eff
    ? eff.shipping
    : shipCfg
    ? computeShipping(shipCfg, { total: totalAmount, productId: product.id, offerFree })
    : 0;
  const finalTotal = totalAmount - discount + shipFee;
  const belowMin = Boolean(shipCfg && shipCfg.min_order > 0 && totalAmount < shipCfg.min_order);
  const ship = shipCfg ? shippingHint(shipCfg) : { free: true, text: "شحن مجاني" };

  const applyCouponCode = async (raw: string, silent = false) => {
    const code = raw.trim();
    if (!code) return;
    setCouponBusy(true);
    try {
      const res = await fetch("/api/coupons/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          product_id: product.id,
          offer_id: activeOffer?.id && product.offers?.some((o) => o.id === activeOffer.id) ? activeOffer.id : undefined,
        }),
      });
      const j = await res.json();
      if (j.valid) {
        setCoupon({ code: String(j.code || code).toUpperCase(), discount: j.discount, shipping: j.shipping, auto: Boolean(j.auto) });
        setCouponMsg("");
        setCouponOpen(true);
        setCouponInput(code.toUpperCase());
      } else {
        setCoupon(null);
        if (!silent) setCouponMsg(j.reason || "الكوبون ده مش صحيح");
      }
    } catch {
      if (!silent) setCouponMsg("تعذر التحقق من الكوبون، جرّب تاني");
    } finally {
      setCouponBusy(false);
    }
  };
  // a new offer changes the total: check the coupon again; the downsell popup applies its coupon through this event
  const appliedCode = coupon?.code;
  useEffect(() => {
    if (appliedCode) applyCouponCode(appliedCode, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOffer?.id]);
  useEffect(() => {
    const onApply = (e: Event) => {
      const code = String((e as CustomEvent).detail || "");
      if (code) {
        setCouponInput(code);
        applyCouponCode(code);
      }
    };
    window.addEventListener("apply-coupon", onApply);
    return () => window.removeEventListener("apply-coupon", onApply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOffer?.id, product.id]);

  // Abandoned checkout: once a valid mobile number and a name are typed, tell the server (debounced,
  // once per distinct value). Never in the editor preview, never after the order was submitted.
  const lastReported = useRef("");
  const orderSent = useRef(false);
  useEffect(() => {
    if (previewOnly || orderSent.current) return;
    const digits = phone.replace(/[^0-9]/g, "");
    if (digits.length < 10 || name.trim().length < 2) return;
    const payload = {
      phone,
      name: name.trim(),
      governorate,
      product_id: product.id,
      product_title: product.title_ar,
      landing_slug: landingPageSlug || landingPage?.slug,
      offer_title: activeOffer?.title_ar,
      amount: totalAmount,
      utm_source: new URLSearchParams(window.location.search).get("utm_source") || undefined,
    };
    const fingerprint = JSON.stringify([phone, name.trim(), governorate, activeOffer?.id]);
    if (fingerprint === lastReported.current) return;
    const t = setTimeout(() => {
      if (orderSent.current) return;
      lastReported.current = fingerprint;
      fetch("/api/abandoned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }, 1800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, name, governorate, activeOffer?.id]);

  // Track InitiateCheckout on initial interaction
  const [hasInteracted, setHasInteracted] = useState(false);
  const handleFirstInteraction = () => {
    if (previewOnly) return;
    if (!hasInteracted) {
      setHasInteracted(true);
      trackMetaEvent("InitiateCheckout", {
        content_name: product.title_ar,
        currency: "EGP",
        value: totalAmount,
        num_items: quantity,
      });
      trackMarketingEvent("InitiateCheckout", { content_name: product.title_ar, content_ids: [product.id], currency: "EGP", value: totalAmount });
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
    if (previewOnly) return;
    setErrorMessage("");

    const error = validateForm();
    if (error) {
      setErrorMessage(error);
      return;
    }

    if (belowMin) {
      setErrorMessage(`أقل قيمة للطلب ${shipCfg?.min_order} ج.م`);
      return;
    }
    setIsSubmitting(true);
    orderSent.current = true;

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
        // Only send real offers; the synthetic default (no offers configured) is priced server-side from base_price
        offer_id:
          activeOffer?.id && product.offers?.some((o) => o.id === activeOffer.id)
            ? activeOffer.id
            : undefined,
        quantity,
        website: website || undefined,
        payment_method: payMethod,
        payment_reference: payMethod === "cod" ? undefined : payRef.trim() || undefined,
        coupon_code: coupon?.code,
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

      // Track Purchase on Client-Side Pixel
      trackMetaEvent(
        "Purchase",
        {
          content_name: product.title_ar,
          content_type: "product",
          currency: "EGP",
          value: data.order?.final_amount || totalAmount,
          num_items: quantity,
        },
        eventId
      );
      trackMarketingEvent("Purchase", {
        content_name: product.title_ar,
        content_ids: [product.id],
        currency: "EGP",
        value: data.order?.final_amount || totalAmount,
        transaction_id: data.order?.order_number,
      });

      // Save order summary to sessionStorage for thank-you page
      try {
        sessionStorage.setItem(
          "sf_last_order",
          JSON.stringify({
            orderNumber: data.order.order_number,
            name: data.order.customer_name,
            phone: data.order.customer_phone,
            gov: data.order.governorate || governorate,
            address: data.order.address || address.trim(),
            total: data.order.final_amount,
            savedAt: Date.now(),
          })
        );
      } catch {
        // Private mode or storage quota can throw — failure must not block redirect
      }

      // Redirect to customized Arabic thank-you page
      router.push(
        `/p/${effectiveSlug}/thank-you?orderNumber=${encodeURIComponent(data.order.order_number)}`
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
        {!hideOffers && product.offers && product.offers.length > 0 && (
          <div className="pb-1">
            <HeroOfferSelector
              offers={product.offers}
              selectedOffer={activeOffer || product.offers[0]}
              onSelectOffer={(offer) => handleSelectOffer(offer)}
              accentColor={(accentColor as any) || "orange"}
            />
          </div>
        )}

        {/* Honeypot (invisible to humans and screen readers) */}
        <div aria-hidden="true" className="sr-only">
          <label>
            Website
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
        </div>

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
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 placeholder-slate-400 text-sm outline-none transition"
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
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 placeholder-slate-400 text-sm outline-none transition text-right font-mono"
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
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 text-sm outline-none transition bg-white"
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
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 placeholder-slate-400 text-sm outline-none transition"
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
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 placeholder-slate-400 text-sm outline-none transition resize-none"
          />
        </div>

        {/* Coupon */}
        <div>
          {!couponOpen && !coupon ? (
            <button type="button" onClick={() => setCouponOpen(true)} className="text-sm font-bold text-orange-600 hover:text-orange-700 cursor-pointer min-h-[44px]">
              عندك كوبون خصم؟
            </button>
          ) : (
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  dir="ltr"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  maxLength={20}
                  placeholder="كود الكوبون"
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-sm font-mono outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => applyCouponCode(couponInput)}
                  disabled={couponBusy || !couponInput.trim()}
                  className="min-h-[48px] px-5 rounded-xl bg-slate-900 text-white text-sm font-black cursor-pointer disabled:opacity-50"
                >
                  {couponBusy ? "..." : "تطبيق"}
                </button>
              </div>
              {coupon && <p className="text-xs font-bold text-emerald-700">✓ اتطبّق خصم {coupon.discount} ج.م</p>}
              {couponMsg && <p className="text-xs font-bold text-rose-700">{couponMsg}</p>}
            </div>
          )}
        </div>

        {/* Pricing Summary */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between text-slate-600">
            <span>سعر الطلب ({activeOffer?.title_ar || "المنتج"}):</span>
            <span className="font-bold text-slate-900">{totalAmount} ج.م</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>{eff?.auto ? "خصم تلقائي:" : `خصم الكوبون (${eff?.code}):`}</span>
              <span className="font-bold">- {discount} ج.م</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>الشحن والتوصيل إلى {governorate}:</span>
            {shipFee > 0 ? (
              <span className="font-bold text-slate-900">{shipFee} ج.م</span>
            ) : (
              <span className="font-bold text-emerald-600">مجاناً بالكامل علينا 🎁</span>
            )}
          </div>
          {belowMin && (
            <div className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
              أقل قيمة للطلب {shipCfg?.min_order} ج.م. اختار عرض أكبر عشان تكمّل.
            </div>
          )}
          <div className="pt-2.5 border-t border-slate-200 flex justify-between items-baseline text-sm sm:text-base font-extrabold text-slate-900">
            <span>المبلغ المطلوب عند الاستلام:</span>
            <span className="text-2xl font-black text-orange-600 font-mono">{finalTotal} ج.م</span>
          </div>
          <div className="text-[11px] text-slate-500 pt-0.5">
            ✓ هتدفع للمندوب بس لما تستلم الشحنة وتعاينها بنفسك.
          </div>
        </div>

        {/* Payment method: cash on delivery by default; transfer options only when the merchant enabled them */}
        {(brand.payments.vodafone_cash || brand.payments.instapay) && (
          <fieldset className="space-y-2">
            <legend className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">طريقة الدفع</legend>
            {(
              [
                ["cod", "الدفع عند الاستلام", "ادفع للمندوب بعد ما تفتح الشحنة وتعاينها"],
                ...(brand.payments.vodafone_cash ? [["vodafone_cash", "فودافون كاش", "حوّل المبلغ على رقم المتجر"]] : []),
                ...(brand.payments.instapay ? [["instapay", "إنستاباي", "حوّل المبلغ على عنوان المتجر"]] : []),
              ] as [typeof payMethod, string, string][]
            ).map(([id, title, hint]) => (
              <label
                key={id}
                className={`flex items-start gap-3 rounded-xl border-2 p-3 min-h-[56px] cursor-pointer transition ${
                  payMethod === id ? "border-orange-500 bg-orange-50/60" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input type="radio" name="pay_method" value={id} checked={payMethod === id} onChange={() => setPayMethod(id)} className="mt-1 w-4 h-4 accent-orange-600" />
                <span>
                  <span className="block text-sm font-black text-slate-900">{title}</span>
                  <span className="block text-xs text-slate-500">{hint}</span>
                </span>
              </label>
            ))}
            {payMethod !== "cod" && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2 text-sm">
                <p className="font-bold text-slate-800">
                  حوّل <span className="font-mono">{Number(finalTotal).toLocaleString("en-US")}</span> {brand.currency} على:
                </p>
                {(() => {
                  const target = (payMethod === "vodafone_cash" ? brand.payments.vodafone_cash?.number : brand.payments.instapay?.address) || "";
                  return (
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-white border border-slate-200 px-3 py-2">
                      <span className="font-mono text-base font-black text-slate-950" dir="ltr">{target}</span>
                      <button
                        type="button"
                        onClick={() => copyPayTarget(target)}
                        className={`min-h-[44px] px-4 rounded-xl text-sm font-black cursor-pointer transition ${
                          copied ? "bg-emerald-600 text-white" : "bg-slate-900 text-white hover:bg-slate-800"
                        }`}
                      >
                        {copied ? "تم النسخ ✓" : "نسخ الرقم"}
                      </button>
                    </div>
                  );
                })()}
                {(payMethod === "vodafone_cash" ? brand.payments.vodafone_cash?.holder : brand.payments.instapay?.holder) && (
                  <p className="text-xs text-slate-600">
                    باسم: {payMethod === "vodafone_cash" ? brand.payments.vodafone_cash?.holder : brand.payments.instapay?.holder}
                  </p>
                )}
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  maxLength={60}
                  placeholder="رقم العملية أو آخر 4 أرقام من رقم التحويل (اختياري)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-slate-500 leading-relaxed">بنأكد الطلب لما التحويل يوصلنا ونكلمك. لو حوّلت بعد ما تبعت الطلب، ابعت صورة الإيصال لنا على واتساب.</p>
              </div>
            )}
          </fieldset>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || previewOnly}
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
              <span>{ctaText?.trim() || "أكّد طلبي.. وهدفع عند الاستلام 🛒"}</span>
            </>
          )}
        </button>

        {previewOnly && (
          <p className="text-center text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded-xl p-2">معاينة فقط — الطلب غير مفعّل داخل المحرر</p>
        )}

        {!hideTrust && (<>
        {/* Security & Guarantees Strip */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center text-xs text-slate-600 font-medium">
          🔒 مفيش دفع أونلاين • معاينة كاملة قبل الدفع للمندوب • استبدال فوري لو في أي عيب
        </div>

        {/* Security & Guarantees */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[11px] text-slate-500">
          <div className="flex flex-col items-center gap-1">
            <TruckIcon className="w-4 h-4 text-emerald-600" />
            <span>{ship.free ? "شحن مجاني (5-7 أيام)" : `${ship.text} (5-7 أيام)`}</span>
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
        </>)}
      </form>
    </div>
  );
}
