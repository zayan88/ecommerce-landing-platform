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
import { comboAvailable, effectiveOptions, pickValue, sanitizeVariantsOff } from "@/lib/product-options";
import { OptionsPicker } from "@/components/shared/OptionsPicker";
import { useLang } from "@/components/i18n/LangProvider";
import { compressImage } from "@/lib/image-compress";
import { InstapayMark, VodafoneMark } from "./PayMarks";
import { Camera, Loader2, Trash2 } from "lucide-react";
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
  /** Color / size picks kept by the page, so the hero and the form show the same choice. */
  pickedOptions?: Record<string, string>;
  onPickedOptionsChange?: (v: Record<string, string>) => void;
}

const MAX_PIECES = 10;

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
  pickedOptions,
  onPickedOptionsChange,
  ctaText,
}: EgyptianCheckoutFormProps) {
  const router = useRouter();
  const { t, dir, lang } = useLang();

  // Simplified Form fields (Name, Phone once, Governorate, Address, Notes/Details)
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [governorate, setGovernorate] = useState("القاهرة");
  // Digital product (file / course / theme): no address or shipping, an email instead
  const digital = Boolean((product as any).digital);
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  // Color / size etc. the merchant defined on the product: the customer must pick each one
  const productOptions = effectiveOptions(product);
  const variantsOff = sanitizeVariantsOff((product as any).variants_off);
  const [pickedInner, setPickedInner] = useState<Record<string, string>>({});
  const picked = pickedOptions ?? pickedInner;
  const setPicked = (fn: (p: Record<string, string>) => Record<string, string>) => {
    const next = fn(picked);
    if (onPickedOptionsChange) onPickedOptionsChange(next);
    else setPickedInner(next);
  };
  const brand = useBrand();
  const [payMethod, setPayMethod] = useState<"cod" | "vodafone_cash" | "instapay">("cod");
  const [payRef, setPayRef] = useState("");
  // transfer screenshot (uploaded as soon as it is picked; the order only carries its id)
  const [receiptId, setReceiptId] = useState("");
  const [receiptPreview, setReceiptPreview] = useState("");
  const [receiptBusy, setReceiptBusy] = useState(false);
  const [receiptErr, setReceiptErr] = useState("");
  const pickReceipt = async (file: File | undefined) => {
    if (!file) return;
    setReceiptErr("");
    setReceiptBusy(true);
    try {
      const blob = await compressImage(file, 1280, 700_000);
      const fd = new FormData();
      fd.append("file", blob, "receipt.webp");
      const res = await fetch("/api/receipts", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.id) throw new Error(j.error || t("co.receipt_err"));
      setReceiptId(j.id);
      setReceiptPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(blob);
      });
    } catch (e: any) {
      setReceiptErr(e?.message || t("co.receipt_err"));
    } finally {
      setReceiptBusy(false);
    }
  };
  const clearReceipt = () => {
    setReceiptId("");
    setReceiptPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return "";
    });
  };
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

  // No 2 / 3-piece offers (one price only): the customer can still raise the number of pieces. Price = the single-piece price x pieces.
  const showQty = hideOffers || (product.offers?.length ?? 0) <= 1;
  const [pieces, setPieces] = useState(1);
  const extraPieces = showQty && (activeOffer?.quantity || 1) === 1 ? pieces : 1;
  const quantity = (activeOffer?.quantity || 1) * extraPieces;
  const totalAmount = (activeOffer?.price || product.base_price || 0) * extraPieces;

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
    ? bestAutoCoupon(brand.commerce.auto_coupons, { subtotal: totalAmount, quantity, productId: product.id })
    : null;
  const autoCoupon =
    autoRes && autoRes.ok
      ? {
          code: autoRes.code || "",
          discount: autoRes.discount,
          auto: true as const,
          shipping: autoRes.free_shipping || !shipCfg ? 0 : computeShipping(shipCfg, { total: totalAmount - autoRes.discount, productId: product.id, offerFree, governorate }),
        }
      : null;
  const eff = coupon ?? autoCoupon;
  const discount = eff?.discount || 0;
  const shipFee = digital
    ? 0
    : eff
    ? eff.shipping
    : shipCfg
    ? computeShipping(shipCfg, { total: totalAmount, productId: product.id, offerFree, governorate })
    : 0;
  const finalTotal = totalAmount - discount + shipFee;
  const belowMin = Boolean(shipCfg && shipCfg.min_order > 0 && totalAmount < shipCfg.min_order);
  const ship = shipCfg ? shippingHint(shipCfg, product.id) : { free: true, text: "شحن مجاني" };

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
          governorate,
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
        if (!silent) setCouponMsg(j.reason || t("co.coupon_bad"));
      }
    } catch {
      if (!silent) setCouponMsg(t("co.coupon_err"));
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
    for (const o of productOptions) {
      if (!picked[o.name]) return `اختار ${o.name} الأول`;
    }
    if (productOptions.length > 0 && !comboAvailable(productOptions, variantsOff, picked)) return "الاختيار ده خلص من المخزون، اختار حاجة تانية";
    if (!name.trim()) return t("co.v_name");
    const cleanedPhone = phone.trim().replace(/\s+/g, "");
    const egPhoneRegex = /^01[0125][0-9]{8}$/;
    if (!egPhoneRegex.test(cleanedPhone)) {
      return t("co.v_phone");
    }
    if (digital) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return "اكتب إيميل صحيح عشان نبعتلك المنتج";
    } else if (!address.trim() || address.trim().length < 3) {
      return t("co.v_addr");
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
      setErrorMessage(t("co.min_order", { n: shipCfg?.min_order ?? 0, cur: t("currency") }));
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
        address: digital ? "منتج رقمي - تسليم إلكتروني" : address.trim(),
        shipping_address: digital ? "منتج رقمي - تسليم إلكتروني" : address.trim(),
        email: digital ? email.trim() : undefined,
        options: productOptions.length > 0 ? picked : undefined,
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
        payment_receipt: payMethod === "cod" ? undefined : receiptId || undefined,
        coupon_code: coupon?.code,
        event_id: eventId,
        ...utms,
      };

      // A busy edge can answer a request with a temporary 5xx / an empty reply. The server de-duplicates the same order
      // (same phone + product + event id), so sending it again is safe: retry quietly instead of showing the customer an error.
      let data: any = null;
      let failure: Error | null = null;
      for (let attempt = 0; attempt < 4; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 700 * attempt));
        try {
          const res = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const body: any = await res.json().catch(() => null);
          if (res.ok && body?.success) {
            data = body;
            failure = null;
            break;
          }
          if (res.status < 500 && body) {
            // a definite answer (validation, rate limit, ...): show it, do not retry
            failure = new Error(body.error || t("co.err_send"));
            break;
          }
          failure = new Error(t("co.err_conn")); // 5xx or unreadable reply: retry
        } catch {
          failure = new Error(t("co.err_conn")); // network hiccup: retry
        }
      }
      if (!data) throw failure || new Error(t("co.err_conn"));

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
      setErrorMessage(err.message || t("co.err_conn"));
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="order-form-section"
      className="bg-white rounded-3xl shadow-xl border border-slate-200/90 p-5 md:p-8 max-w-2xl mx-auto my-6 text-right"
      dir={dir}
    >
      <div className="text-center pb-5 border-b border-slate-100">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <TruckIcon className="w-4 h-4 text-emerald-600" /> {t("co.banner")}
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-2.5 font-heading">
          {t("co.h2")}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-lg mx-auto leading-relaxed">
          {t("co.sub")}
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
        {!hideOffers && product.offers && product.offers.length > 1 && (
          <div className="pb-1">
            <HeroOfferSelector
              offers={product.offers}
              selectedOffer={activeOffer || product.offers[0]}
              onSelectOffer={(offer) => handleSelectOffer(offer)}
              accentColor={(accentColor as any) || "orange"}
            />
          </div>
        )}

        {/* Product options: color / size ... */}
        <OptionsPicker options={productOptions} off={variantsOff} picked={picked} onPick={(name, v) => setPicked((p) => pickValue(productOptions, variantsOff, p, name, v))} />

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
            {t("co.name")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("co.name_ph")}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 placeholder-slate-400 text-sm outline-none transition"
          />
        </div>

        {/* 2. Phone */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs sm:text-sm font-bold text-slate-800">
              {t("co.phone")} <span className="text-red-500">*</span>
            </label>
            <span className="text-[10px] text-emerald-700 font-medium">{t("co.safe")}</span>
          </div>
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            inputMode="tel"
            required
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01012345678"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 placeholder-slate-400 text-sm outline-none transition text-right font-mono"
          />
        </div>

        {/* Digital product: where to send it */}
        {digital && (
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
              الإيميل <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              dir="ltr"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 placeholder-slate-400 text-sm outline-none transition"
            />
            <p className="text-[11px] text-slate-500 mt-1">هنبعتلك المنتج على الإيميل ده بعد تأكيد الطلب.</p>
          </div>
        )}

        {!digital && (
          <>
        {/* 3. Governorate */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
            {t("co.gov")} <span className="text-red-500">*</span>
          </label>
          <select
            name="governorate"
            autoComplete="address-level1"
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
            {t("co.addr")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="address"
            autoComplete="street-address"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t("co.addr_ph")}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 placeholder-slate-400 text-sm outline-none transition"
          />
        </div>
          </>
        )}

        {/* 5. Details / Notes */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
            {t("co.note")} <span className="text-slate-400 font-normal">{t("co.optional")}</span>
          </label>
          <textarea
            name="notes"
            autoComplete="off"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("co.note_ph")}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 placeholder-slate-400 text-sm outline-none transition resize-none"
          />
        </div>

        {/* Coupon */}
        <div>
          {!couponOpen && !coupon ? (
            <button type="button" onClick={() => setCouponOpen(true)} className="text-sm font-bold text-orange-600 hover:text-orange-700 cursor-pointer min-h-[44px]">
              {t("co.has_coupon")}
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
                  placeholder={t("co.coupon_ph")}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-sm font-mono outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => applyCouponCode(couponInput)}
                  disabled={couponBusy || !couponInput.trim()}
                  className="min-h-[48px] px-5 rounded-xl bg-slate-900 text-white text-sm font-black cursor-pointer disabled:opacity-50"
                >
                  {couponBusy ? "..." : t("co.apply")}
                </button>
              </div>
              {coupon && <p className="text-xs font-bold text-emerald-700">{t("co.applied", { n: coupon.discount, cur: t("currency") })}</p>}
              {couponMsg && <p className="text-xs font-bold text-rose-700">{couponMsg}</p>}
            </div>
          )}
        </div>

        {/* Quantity: only when the product has no multi-piece offers */}
        {showQty && (activeOffer?.quantity || 1) === 1 && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
            <span className="text-sm font-bold text-slate-800">{lang === "en" ? "Quantity" : "الكمية"}</span>
            <div className="flex items-center gap-1" role="group" aria-label={lang === "en" ? "Quantity" : "الكمية"}>
              <button type="button" aria-label="-" disabled={pieces <= 1} onClick={() => setPieces((n) => Math.max(1, n - 1))} className="w-12 h-12 rounded-xl border border-slate-300 bg-white text-xl font-black text-slate-800 disabled:opacity-40 cursor-pointer">−</button>
              <span className="w-12 text-center text-lg font-black font-mono text-slate-950" aria-live="polite">{pieces}</span>
              <button type="button" aria-label="+" disabled={pieces >= MAX_PIECES} onClick={() => setPieces((n) => Math.min(MAX_PIECES, n + 1))} className="w-12 h-12 rounded-xl border border-slate-300 bg-white text-xl font-black text-slate-800 disabled:opacity-40 cursor-pointer">+</button>
            </div>
          </div>
        )}

        {/* Pricing Summary */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between text-slate-600">
            <span>{t("co.order_price", { item: activeOffer?.title_ar || t("co.product") })}</span>
            <span className="font-bold text-slate-900">{totalAmount} {t("currency")}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>{eff?.auto ? t("co.auto_disc") : t("co.coupon_disc", { code: eff?.code ?? "" })}</span>
              <span className="font-bold">- {discount} {t("currency")}</span>
            </div>
          )}
          {!digital && (<div className="flex justify-between text-slate-600">
            <span>{t("co.ship_to", { gov: governorate })}</span>
            {shipFee > 0 ? (
              <span className="font-bold text-slate-900">{shipFee} {t("currency")}</span>
            ) : (
              <span className="font-bold text-emerald-600">{t("co.free_all")}</span>
            )}
          </div>)}
          {belowMin && (
            <div className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
              {t("co.min_hint", { n: shipCfg?.min_order ?? 0, cur: t("currency") })}
            </div>
          )}
          <div className="pt-2.5 border-t border-slate-200 flex justify-between items-baseline text-sm sm:text-base font-extrabold text-slate-900">
            <span>{t("co.total_due")}</span>
            <span className="text-2xl font-black text-orange-600 font-mono">{finalTotal} {t("currency")}</span>
          </div>
          <div className="text-[11px] text-slate-500 pt-0.5">
            {t("co.pay_note")}
          </div>
        </div>

        {/* Payment method: cash on delivery by default; transfer options only when the merchant enabled them */}
        {(brand.payments.vodafone_cash || brand.payments.instapay) && (
          <fieldset className="space-y-2">
            <legend className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">{t("co.pay_method")}</legend>
            {(
              [
                ["cod", t("co.cod_t"), t("co.cod_d")],
                ...(brand.payments.vodafone_cash ? [["vodafone_cash", t("co.vf_t"), t("co.vf_d")]] : []),
                ...(brand.payments.instapay ? [["instapay", t("co.ip_t"), t("co.ip_d")]] : []),
              ] as [typeof payMethod, string, string][]
            ).map(([id, title, hint]) => (
              <label
                key={id}
                className={`flex items-start gap-3 rounded-xl border-2 p-3 min-h-[56px] cursor-pointer transition ${
                  payMethod === id ? "border-orange-500 bg-orange-50/60" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input type="radio" name="pay_method" value={id} checked={payMethod === id} onChange={() => setPayMethod(id)} className="mt-1 w-4 h-4 accent-orange-600" />
                {id === "vodafone_cash" && <VodafoneMark className="w-8 h-8 shrink-0" />}
                {id === "instapay" && <InstapayMark className="w-8 h-8 shrink-0" />}
                <span className="flex-1">
                  <span className="block text-sm font-black text-slate-900">{title}</span>
                  <span className="block text-xs text-slate-500">{hint}</span>
                </span>
              </label>
            ))}
            {payMethod !== "cod" && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2 text-sm">
                <p className="font-bold text-slate-800 flex items-center gap-2">
                  {payMethod === "vodafone_cash" ? <VodafoneMark className="w-6 h-6 shrink-0" /> : <InstapayMark className="w-6 h-6 shrink-0" />}
                  {t("co.transfer", { amt: Number(finalTotal).toLocaleString("en-US"), cur: t("currency") })}
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
                        {copied ? t("co.copied") : t("co.copy")}
                      </button>
                    </div>
                  );
                })()}
                {(payMethod === "vodafone_cash" ? brand.payments.vodafone_cash?.holder : brand.payments.instapay?.holder) && (
                  <p className="text-xs text-slate-600">
                    {t("co.holder")} {payMethod === "vodafone_cash" ? brand.payments.vodafone_cash?.holder : brand.payments.instapay?.holder}
                  </p>
                )}
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  maxLength={60}
                  placeholder={t("co.ref_ph")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                />
                {/* Transfer screenshot: goes with the order, deleted once the merchant decides it */}
                <div className="space-y-1.5">
                  <p className="text-xs sm:text-sm font-bold text-slate-800">
                    {t("co.receipt")} <span className="text-slate-400 font-normal">{t("co.optional")}</span>
                  </p>
                  {receiptId && receiptPreview ? (
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={receiptPreview} alt={t("co.receipt")} className="w-16 h-16 rounded-lg object-cover border border-emerald-200" />
                      <span className="flex-1 text-xs font-bold text-emerald-800">{t("co.receipt_ok")}</span>
                      <button type="button" onClick={clearReceipt} className="min-h-[40px] px-3 rounded-lg text-red-600 hover:bg-red-50 text-xs font-bold flex items-center gap-1 cursor-pointer">
                        <Trash2 className="w-4 h-4" /> {t("co.receipt_remove")}
                      </button>
                    </div>
                  ) : (
                    <label className={`flex items-center justify-center gap-2 min-h-[56px] rounded-xl border-2 border-dashed px-3 text-sm font-bold cursor-pointer transition ${receiptBusy ? "border-slate-300 text-slate-500" : "border-orange-300 text-orange-700 hover:bg-orange-50"}`}>
                      {receiptBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                      <span>{receiptBusy ? t("co.receipt_busy") : t("co.receipt_pick")}</span>
                      <input type="file" accept="image/*" className="sr-only" disabled={receiptBusy} onChange={(e) => { pickReceipt(e.target.files?.[0]); e.target.value = ""; }} />
                    </label>
                  )}
                  {receiptErr && <p className="text-xs font-bold text-red-700">{receiptErr}</p>}
                  <p className="text-[11px] text-slate-500 leading-relaxed">{t("co.receipt_hint")}</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{t("co.transfer_note")}</p>
              </div>
            )}
          </fieldset>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || previewOnly}
          className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-base sm:text-lg shadow-xl shadow-orange-500/25 active:scale-[0.99] transition transform cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t("co.submitting")}</span>
            </div>
          ) : (
            <>
              <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>{ctaText?.trim() || ((brand.payments.vodafone_cash || brand.payments.instapay) ? t("co.cta_plain") : t("co.cta"))}</span>
            </>
          )}
        </button>

        {previewOnly && (
          <p className="text-center text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded-xl p-2">{t("co.preview_only")}</p>
        )}

        {!hideTrust && (<>
        {/* Security & Guarantees Strip */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center text-xs text-slate-600 font-medium">
          {t("co.trust_line")}
        </div>

        {/* Security & Guarantees */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[11px] text-slate-500">
          <div className="flex flex-col items-center gap-1">
            <TruckIcon className="w-4 h-4 text-emerald-600" />
            <span>{ship.free ? t("co.ship_days_free") : t("co.ship_days", { text: ship.text })}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
            <span>{t("co.inspect")}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ClockIcon className="w-4 h-4 text-emerald-600" />
            <span>{t("co.swap14")}</span>
          </div>
        </div>
        </>)}
      </form>
    </div>
  );
}
