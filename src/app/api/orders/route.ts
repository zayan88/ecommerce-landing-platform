import { NextRequest, NextResponse } from "next/server";
import { orderFormSchema } from "@/lib/validation/order";
import { dbStore } from "@/lib/db/store";
import { getGovernorateDeliveryFee } from "@/lib/constants/governorates";
import { SafkaClient } from "@/lib/safqa/safka-client";
import { SAFKA_ENABLED } from "@/lib/features";
import { receiptExists } from "@/lib/db/receipts-repo";
import { MetaCapiClient } from "@/lib/tracking/meta-capi";
import { generateEventId } from "@/lib/tracking/utm";
import { TelegramNotifier } from "@/lib/notifications/telegram";
import type { Order } from "@/types";
import { markAbandonedConverted } from "@/lib/db/abandoned-repo";
import { effectiveOptions, formatOptionsNote, sanitizeVariantsOff } from "@/lib/product-options";
import { applyCoupon, bestAutoCoupon, computeShipping, sanitizeCoupons, sanitizeShipping } from "@/lib/commerce";
import {
  beginOrder,
  consumeOrderRateLimit,
  generateOrderId,
  generateOrderNumber,
  getOrderClientIp,
  orderDedupeKey,
  type OrderSlot,
  type PublicOrderSnapshot,
} from "@/lib/orders/guard";

export const runtime = "edge";

/** Page size limits of GET /api/orders (rows per request). */
const MAX_PAGE = 100;
const MAX_EXPORT_PAGE = 1000;

const ORDER_SUCCESS_MESSAGE = "تم تسجيل طلبك بنجاح وسيتواصل معك مندوبنا للتأكيد";

export async function POST(req: NextRequest) {
  // Reserved duplicate-guard slot; released in `finally` if we bail out before an order exists.
  let slot: OrderSlot | null = null;
  let slotSettled = false;

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "بيانات الطلب غير صالحة" },
        { status: 400 }
      );
    }

    // 1. Validate payload with Zod (details are logged, never returned to the client)
    const validation = orderFormSchema.safeParse(body);
    if (!validation.success) {
      const firstErrorMessage = validation.error.issues?.[0]?.message || "بيانات الطلب غير صالحة";
      console.warn(
        "[Create Order] validation failed",
        JSON.stringify(validation.error.issues.map((i) => ({ path: i.path, code: i.code, message: i.message })))
      );
      return NextResponse.json({ success: false, error: firstErrorMessage }, { status: 400 });
    }

    const data = validation.data;

    // 2. Fetch product & offer to strictly verify amounts server-side
    const product = await dbStore.getProduct(data.product_id);
    if (!product) {
      return NextResponse.json(
        { success: false, error: "المنتج غير موجود" },
        { status: 404 }
      );
    }
    if (product.status !== "active") {
      return NextResponse.json(
        { success: false, error: "هذا المنتج غير متاح للطلب حالياً" },
        { status: 400 }
      );
    }

    // 3. Resolve pricing & offers server-side only (All shipping is 100% Free)
    const finalGov = data.governorate || data.shipping_governorate || "القاهرة";
    const finalAddress = data.address || data.shipping_address || "العنوان بالتفصيل";
    // Color / size etc.: required when the product has options, checked against the product itself, then written into the notes
    const optionsCheck = formatOptionsNote(effectiveOptions(product), data.options, sanitizeVariantsOff((product as any).variants_off));
    if (optionsCheck.error) {
      return NextResponse.json({ success: false, error: optionsCheck.error }, { status: 400 });
    }
    const finalNotes = [optionsCheck.note ? `الخيارات: ${optionsCheck.note}` : "", data.notes || data.customer_notes || ""].filter(Boolean).join(" | ");

    let quantity: number;
    let unitPrice: number;
    let totalAmount: number;
    let discountAmount = 0;
    let offerFreeShipping = false;

    if (data.offer_id) {
      // An offer id must match one of this product's offers; price AND quantity come from the offer.
      const selectedOffer = (product.offers || []).find((o) => o.id === data.offer_id);
      const offerPrice = Number(selectedOffer?.price);
      const offerQty = Number(selectedOffer?.quantity);
      if (
        !selectedOffer ||
        !Number.isFinite(offerPrice) ||
        offerPrice <= 0 ||
        !Number.isInteger(offerQty) ||
        offerQty < 1
      ) {
        return NextResponse.json(
          { success: false, error: "العرض المختار غير متاح، يرجى تحديث الصفحة" },
          { status: 400 }
        );
      }
      // A single-piece offer can be ordered several times (the customer raised the number of pieces): price = offer price x pieces.
      // Multi-piece offers keep their own fixed quantity and price.
      const pieces = offerQty === 1 ? data.quantity : 1;
      quantity = offerQty * pieces;
      offerFreeShipping = Boolean(selectedOffer.free_shipping);
      totalAmount = offerPrice * pieces;
      unitPrice = offerPrice / offerQty;
      const originalPrice = Number(selectedOffer.original_price);
      if (Number.isFinite(originalPrice) && originalPrice > offerPrice) {
        discountAmount = (originalPrice - offerPrice) * pieces;
      }
    } else {
      // No offer: base price × quantity (quantity already limited to 1..5 by the schema).
      const basePrice = Number(product.base_price);
      if (!Number.isFinite(basePrice) || basePrice <= 0) {
        return NextResponse.json(
          { success: false, error: "تعذر تحديد سعر المنتج، يرجى تحديث الصفحة والمحاولة مرة أخرى" },
          { status: 400 }
        );
      }
      quantity = data.quantity;
      unitPrice = basePrice;
      totalAmount = basePrice * quantity;
    }

    // Minimum order, coupon and shipping fee: always decided here, never taken from the browser.
    const commerceSettings = await dbStore.getSettings();
    const shippingCfg = sanitizeShipping(commerceSettings.shipping_config);
    if (shippingCfg.min_order > 0 && totalAmount < shippingCfg.min_order) {
      return NextResponse.json(
        { success: false, error: `أقل قيمة للطلب ${shippingCfg.min_order} ج.م` },
        { status: 400 }
      );
    }
    let couponApplied: { code: string; amount: number; auto?: boolean; free_shipping?: boolean } | null = null;
    const allCoupons = sanitizeCoupons(commerceSettings.coupons);
    const couponCtx = { subtotal: totalAmount, quantity, productId: product.id, usage: ((commerceSettings as any).coupon_usage || {}) as Record<string, number> };
    if (data.coupon_code) {
      const c = applyCoupon(allCoupons, data.coupon_code, couponCtx);
      if (!c.ok) {
        return NextResponse.json({ success: false, error: c.reason || "الكوبون ده مش صحيح أو منتهي" }, { status: 400 });
      }
      couponApplied = { code: c.code as string, amount: c.discount, ...(c.free_shipping ? { free_shipping: true } : {}) };
    } else {
      // no code typed: the merchant's automatic discount (if any) applies by itself
      const auto = bestAutoCoupon(allCoupons, couponCtx);
      if (auto.ok) couponApplied = { code: auto.code as string, amount: auto.discount, auto: true, ...(auto.free_shipping ? { free_shipping: true } : {}) };
    }
    if (couponApplied) discountAmount += couponApplied.amount;
    const afterCoupon = totalAmount - (couponApplied?.amount || 0);
    const shippingFee = couponApplied?.free_shipping
      ? 0
      : computeShipping(shippingCfg, { total: afterCoupon, productId: product.id, offerFree: offerFreeShipping, governorate: data.governorate });
    const finalAmount = afterCoupon + shippingFee;

    // 4. Resolve client IP and User-Agent for CAPI / rate limiting
    const clientIp = getOrderClientIp(req.headers);
    const ipAddress = clientIp || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "";
    const eventId = data.event_id || generateEventId("order");

    // 4a. Honeypot: bots that fill the hidden field get a believable success and nothing else happens.
    if (data.website) {
      console.warn("[Create Order] honeypot triggered, order discarded", { ip: ipAddress });
      return NextResponse.json({
        success: true,
        message: ORDER_SUCCESS_MESSAGE,
        order: {
          id: generateOrderId(),
          order_number: generateOrderNumber(),
          customer_name: data.customer_name,
          customer_phone: data.customer_phone,
          final_amount: finalAmount,
          shipping_fee: 0,
          governorate: finalGov,
          address: finalAddress,
          landing_page_slug: data.landing_page_slug,
          event_id: eventId,
        },
      });
    }

    // 4a-bis. Manual payment methods must be enabled by the merchant; the amount always comes from the server.
    const manualMethod = data.payment_method === "vodafone_cash" || data.payment_method === "instapay" ? data.payment_method : null;
    if (manualMethod) {
      const enabled = Boolean((await dbStore.getSettings()).payment_methods?.[manualMethod]?.enabled);
      if (!enabled) {
        return NextResponse.json({ success: false, error: "طريقة الدفع دي مش متاحة حالياً، اختار الدفع عند الاستلام" }, { status: 400 });
      }
    }

    // The customer's transfer screenshot (uploaded earlier through /api/receipts), only if it really exists
    let receiptId: string | undefined;
    if (manualMethod && data.payment_receipt && (await receiptExists(data.payment_receipt).catch(() => false))) receiptId = data.payment_receipt;

    // 4b. Duplicate guard: same phone + product inside 15 minutes returns the existing order.
    slot = await beginOrder(orderDedupeKey(data.customer_phone, product.id));
    if (slot.existing) {
      slotSettled = true;
      return NextResponse.json({
        success: true,
        message: ORDER_SUCCESS_MESSAGE,
        order: slot.existing,
      });
    }

    // 4c. Per-IP rate limit (5 new orders / 10 minutes)
    const rate = await consumeOrderRateLimit(clientIp);
    if (!rate.allowed) {
      console.warn("[Create Order] rate limit exceeded", { ip: ipAddress });
      return NextResponse.json(
        {
          success: false,
          error: "تم استلام طلبات كثيرة من نفس الجهاز، يرجى المحاولة بعد قليل أو التواصل معنا عبر واتساب",
        },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
      );
    }

    // 5. Store order in DB — if it cannot be persisted, stop here: nothing is forwarded or notified.
    let createdOrder: Order;
    try {
      createdOrder = await dbStore.createOrder({
        landing_page_slug: data.landing_page_slug,
        product_id: product.id,
        offer_id: data.offer_id || undefined,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_phone2: data.customer_phone2 || undefined,
        governorate: finalGov,
        city: data.city || data.shipping_city || finalGov,
        address: finalAddress,
        notes: finalNotes,
        quantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        shipping_fee: shippingFee,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        payment_method: data.payment_method,
        tracking: {
          utm_source: data.utm_source || undefined,
          utm_medium: data.utm_medium || undefined,
          utm_campaign: data.utm_campaign || undefined,
          utm_content: data.utm_content || undefined,
          utm_term: data.utm_term || undefined,
          referrer: data.referrer || undefined,
          ip_address: ipAddress,
          user_agent: userAgent,
          fbp: data.fbp || undefined,
          fbc: data.fbc || undefined,
          event_id: eventId,
          ...(couponApplied ? { coupon: couponApplied } : {}),
          ...(manualMethod
            ? { payment: { method: manualMethod, reference: data.payment_reference || undefined, ...(receiptId ? { receipt_id: receiptId } : {}), status: "awaiting" as const } }
            : {}),
        },
      });
    } catch (persistErr) {
      console.error("[Create Order] order could not be persisted", persistErr);
      return NextResponse.json(
        { success: false, error: "تعذر حفظ الطلب، يرجى المحاولة مرة أخرى أو التواصل معنا" },
        { status: 500 }
      );
    }

    const publicOrder: PublicOrderSnapshot = {
      id: createdOrder.id,
      order_number: createdOrder.order_number,
      customer_name: createdOrder.customer_name,
      customer_phone: createdOrder.customer_phone,
      final_amount: createdOrder.final_amount,
      shipping_fee: createdOrder.shipping_fee,
      governorate: createdOrder.governorate,
      address: createdOrder.address,
      landing_page_slug: createdOrder.landing_page_slug,
      event_id: eventId,
    };

    // Count the coupon use (best effort; the limit is approximate under heavy parallel orders)
    if (couponApplied) {
      try {
        const cur = ((await dbStore.getSettings()) as any).coupon_usage || {};
        await dbStore.updateSettings({ coupon_usage: { ...cur, [couponApplied.code]: (Number(cur[couponApplied.code]) || 0) + 1 } } as any);
      } catch (e) {
        console.warn("[coupon usage]", (e as Error)?.message);
      }
    }

    // 5-bis. The visitor finished: close their abandoned-checkout rows (best effort, never blocks the order)
    await markAbandonedConverted(createdOrder.customer_phone).catch(() => {});

    // 5a. Remember this order for the duplicate guard (best-effort, never throws)
    slotSettled = true;
    await slot.settle(publicOrder);

    // 6. Forward order to Safka Egypt Dropshipping API (Awaited to ensure completion on Serverless/Vercel)
    let safkaResult = null;
    try {
      const safkaOn = SAFKA_ENABLED || Boolean(((await dbStore.getSettings()) as any).safka_enabled);
      if (safkaOn) safkaResult = await SafkaClient.createOrder(createdOrder);
      console.log(`[Order Created] Linked to Safka Egypt:`, safkaResult);
    } catch (err) {
      console.error("[Safka dropshipping forward error]", err);
    }

    // 7. Dispatch Meta Conversions API (CAPI) event with identical event_id
    MetaCapiClient.sendEvent({
      event_name: "Purchase",
      event_id: eventId,
      event_source_url: `${req.nextUrl.origin}/p/${data.landing_page_slug}`,
      order: createdOrder,
      ip_address: ipAddress,
      user_agent: userAgent,
      fbp: data.fbp || undefined,
      fbc: data.fbc || undefined,
    }).catch((err) => {
      console.error("[Background Meta CAPI error]", err);
    });

    // 8. Log internal analytics
    dbStore.logAnalyticsEvent({
      event_name: "Purchase",
      event_id: eventId,
      product_id: product.id,
      page_url: `/p/${data.landing_page_slug}`,
      utm_source: data.utm_source || undefined,
      utm_medium: data.utm_medium || undefined,
      utm_campaign: data.utm_campaign || undefined,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: { order_number: createdOrder.order_number, total: finalAmount },
    });

    // 9. Dispatch Instant Mobile & Telegram Sales Alert
    try {
      await TelegramNotifier.sendOrderNotification(createdOrder, product);
    } catch (telegramErr) {
      console.error("[Background Telegram Notification error]", telegramErr);
    }

    return NextResponse.json({
      success: true,
      message: ORDER_SUCCESS_MESSAGE,
      order: publicOrder,
    });
  } catch (error: any) {
    console.error("[Create Order Error]", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ غير متوقع أثناء معالجة الطلب" },
      { status: 500 }
    );
  } finally {
    // Release the duplicate-guard reservation if no order came out of this request.
    if (slot && !slotSettled) {
      await slot.settle(null).catch(() => {});
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (id) {
      const order = await dbStore.getOrder(id);
      if (!order) return NextResponse.json({ success: false, error: "الطلب غير موجود" }, { status: 404 });
      return NextResponse.json({ success: true, order });
    }

    const landing_page_slug = searchParams.get("lp") || undefined;
    const status = (searchParams.get("status") as any) || undefined;
    const search = searchParams.get("q") || undefined;
    const syncSafka = searchParams.get("sync") === "true";

    // Optional filters / pagination (all absent by default → same full list as before).
    const dayStart = (v: string | null, endOfDay = false): number | undefined => {
      if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
      // Egypt time (UTC+2; summer time shifts the edge by one hour at most)
      const t = Date.parse(`${v}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+02:00`);
      return Number.isFinite(t) ? t : undefined;
    };
    const intParam = (name: string): number | undefined => {
      const raw = searchParams.get(name);
      return raw !== null && /^\d{1,7}$/.test(raw) ? Number(raw) : undefined;
    };

    const filters = {
      landing_page_slug,
      status,
      search,
      governorate: searchParams.get("gov") || undefined,
      created_from: dayStart(searchParams.get("from")),
      created_to: dayStart(searchParams.get("to"), true),
    };
    const limit = intParam("limit");
    const offset = intParam("offset") || 0;
    // `export=1` (CSV export): bigger pages, no product/landing-page relations in the payload.
    const isExport = searchParams.get("export") === "1";

    let orders: Order[];
    let page: {
      total: number | null;
      total_capped: boolean;
      has_more: boolean;
      limit: number;
      offset: number;
      status_counts?: Record<string, number>;
    } | null = null;
    if (limit !== undefined) {
      // Paginated (admin orders page): `limit` rows, whether a next page exists, and a capped total.
      // `total=0` skips the COUNT (page flips reuse the total they already have).
      const pageLimit = Math.min(Math.max(limit, 1), isExport ? MAX_EXPORT_PAGE : MAX_PAGE);
      const res = await dbStore.getOrdersPage(filters, {
        limit: pageLimit,
        offset,
        withTotal: searchParams.get("total") !== "0",
        relations: !isExport,
      });
      orders = res.orders;
      page = { total: res.total, total_capped: res.total_capped, has_more: res.has_more, limit: pageLimit, offset, status_counts: res.status_counts };
    } else {
      // No `limit`: the full list, as before (kept for compatibility; the admin UI no longer uses it).
      orders = await dbStore.getOrders({ ...filters, offset: intParam("offset") });
    }

    // Sync live orders from Safka Dropshipping platform only when sync is explicitly requested
    if (syncSafka && offset === 0) {
      try {
        const safkaOrders = await SafkaClient.fetchSafkaMcpOrders(20);
        if (Array.isArray(safkaOrders) && safkaOrders.length > 0) {
          // Deletions are recorded durably in KV; load them so isOrderDeleted() sees other isolates' deletes.
          await dbStore.refreshDeletedOrderIds();
          // With pagination only one page is loaded, so "already stored" is asked of the store
          // (indexed lookup on D1) instead of being derived from the listed orders.
          const existingSerials: Set<string> = page
            ? await dbStore.findKnownOrderTokens(
                safkaOrders.map((s: any) => String(s?.serial_number || "")).filter(Boolean)
              )
            : new Set(orders.map((o) => o.safqa_invoice_id || o.order_number));

          for (const sOrd of safkaOrders) {
            if (!existingSerials.has(sOrd.serial_number) && !dbStore.isOrderDeleted(sOrd.serial_number)) {
              let mappedStatus: any = "pending";
              if (sOrd.status?.startsWith("declined")) mappedStatus = "cancelled";
              else if (sOrd.status === "shipped") mappedStatus = "shipped";
              else if (sOrd.status === "available" || sOrd.status === "collected") mappedStatus = "delivered";
              else if (sOrd.status === "preparing" || sOrd.status === "printing") mappedStatus = "confirmed";

              const virtualOrder: any = {
                id: `sfk-${sOrd.serial_number}`,
                order_number: sOrd.serial_number,
                landing_page_slug: "safka-direct",
                product_id: "prod-astrobeam-6ab19443",
                customer_name: "عميل صفقة",
                customer_phone: sOrd.client_phone1 || "01000000000",
                governorate: typeof sOrd.governorate === "string" ? sOrd.governorate : sOrd.governorate?.untrustedText || "القاهرة",
                address: "طلب مسجل في منصة صفقة (دروبشيبينغ)",
                quantity: 1,
                unit_price: sOrd.total || 0,
                total_amount: sOrd.total || 0,
                shipping_fee: 0,
                discount_amount: 0,
                final_amount: sOrd.total || 0,
                currency: "EGP",
                status: mappedStatus,
                payment_method: "cod",
                safqa_invoice_id: sOrd.serial_number,
                safqa_status: "paid",
                created_at: sOrd.created_at || new Date().toISOString(),
                updated_at: sOrd.created_at || new Date().toISOString(),
                safqa_response: sOrd,
              };

              orders.push(virtualOrder);
              existingSerials.add(sOrd.serial_number);
            }
          }

          orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
      } catch (e) {
        console.error("[Safka Sync in GET Orders Error]", e);
      }
    }

    return NextResponse.json({ success: true, orders, ...(page || {}) }, { headers: { "Cache-Control": "no-store" } });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const singleId = searchParams.get("id") || body.id;
    const ids: string[] = body.ids || (singleId ? [singleId] : []);

    if (!ids || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "معرف الطلب أو قائمة الطلبات مطلوبة للحذف" },
        { status: 400 }
      );
    }

    if (ids.length === 1) {
      const deleted = await dbStore.deleteOrder(ids[0]);
      return NextResponse.json({
        success: deleted,
        message: "تم حذف الطلب بنجاح نهائياً",
        deletedId: ids[0],
      });
    }

    const result = await dbStore.deleteOrders(ids);
    return NextResponse.json({
      success: true,
      message: `تم حذف ${result.count} طلب بنجاح`,
      deletedCount: result.count,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const orderId = searchParams.get("id") || body.id || body.orderId;

    if (!orderId) {
      return NextResponse.json({ success: false, error: "معرف الطلب مطلوب" }, { status: 400 });
    }

    const { action } = body;

    // Retry Safka Sync action
    if (action === "retry_safqa") {
      const order = await dbStore.getOrder(orderId);
      if (!order) return NextResponse.json({ success: false, error: "الطلب غير موجود" }, { status: 404 });
      const res = await SafkaClient.createOrder(order);
      return NextResponse.json(res);
    }

    // The merchant saw the transfer: mark the payment as received and confirm the order
    if (action === "confirm_payment") {
      const order = await dbStore.getOrder(orderId);
      if (!order) return NextResponse.json({ success: false, error: "الطلب غير موجود" }, { status: 404 });
      const pay = order.tracking?.payment;
      if (!pay) return NextResponse.json({ success: false, error: "الطلب ده دفعه عند الاستلام" }, { status: 400 });
      const updated = await dbStore.updateOrder(orderId, {
        tracking: { ...(order.tracking || {}), payment: { ...pay, status: "paid", confirmed_at: new Date().toISOString() } },
        status: order.status === "pending" ? "confirmed" : order.status,
      });
      return NextResponse.json({ success: true, order: updated });
    }

    // General update for order fields
    const allowedFields = [
      "status",
      "customer_name",
      "customer_phone",
      "customer_phone2",
      "governorate",
      "city",
      "address",
      "notes",
      "product_id",
      "offer_id",
      "quantity",
      "unit_price",
      "total_amount",
      "shipping_fee",
      "discount_amount",
      "final_amount",
      "landing_page_slug",
    ];

    const updates: any = {};
    for (const key of allowedFields) {
      if (key in body && body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length > 0) {
      const updated = await dbStore.updateOrder(orderId, updates);
      if (!updated) {
        return NextResponse.json({ success: false, error: "الطلب غير موجود للتحديث" }, { status: 404 });
      }
      return NextResponse.json({ success: true, order: updated });
    }

    return NextResponse.json({ success: false, error: "لا يوجد حقول محددة للتحديث" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
