import { NextRequest, NextResponse } from "next/server";
import { orderFormSchema } from "@/lib/validation/order";
import { dbStore } from "@/lib/db/store";
import { getGovernorateDeliveryFee } from "@/lib/constants/governorates";
import { SafkaClient } from "@/lib/safqa/safka-client";
import { MetaCapiClient } from "@/lib/tracking/meta-capi";
import { generateEventId } from "@/lib/tracking/utm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validate payload with Zod
    const validation = orderFormSchema.safeParse(body);
    if (!validation.success) {
      const firstErrorMessage = validation.error.issues?.[0]?.message || "بيانات الطلب غير صالحة";
      return NextResponse.json(
        {
          success: false,
          error: firstErrorMessage,
          details: validation.error.format(),
        },
        { status: 400 }
      );
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

    // 3. Resolve pricing & offers (All shipping is 100% Free)
    const finalGov = data.governorate || data.shipping_governorate || "القاهرة";
    const finalAddress = data.address || data.shipping_address || "العنوان بالتفصيل";
    const finalNotes = data.notes || data.customer_notes || "";

    let unitPrice = product.base_price;
    let totalAmount = unitPrice * data.quantity;
    let shippingFee = 0; // الشحن مجاني لجميع الطلبات
    let discountAmount = 0;

    if (data.offer_id && product.offers) {
      const selectedOffer = product.offers.find((o) => o.id === data.offer_id);
      if (selectedOffer) {
        totalAmount = selectedOffer.price;
        unitPrice = selectedOffer.price / selectedOffer.quantity;
        if (selectedOffer.original_price) {
          discountAmount = selectedOffer.original_price - selectedOffer.price;
        }
      }
    }

    const finalAmount = totalAmount; // Zero shipping added

    // 4. Resolve client IP and User-Agent for CAPI
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "";
    const eventId = data.event_id || generateEventId("order");

    // 5. Store order in DB
    const createdOrder = await dbStore.createOrder({
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
      quantity: data.quantity,
      unit_price: unitPrice,
      total_amount: totalAmount,
      shipping_fee: 0,
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
      },
    });

    // 6. Forward order to Safka Egypt Dropshipping API (Awaited to ensure completion on Serverless/Vercel)
    let safkaResult = null;
    try {
      safkaResult = await SafkaClient.createOrder(createdOrder);
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

    return NextResponse.json({
      success: true,
      message: "تم تسجيل طلبك بنجاح وسيتواصل معك مندوبنا للتأكيد",
      order: {
        id: createdOrder.id,
        order_number: createdOrder.order_number,
        customer_name: createdOrder.customer_name,
        customer_phone: createdOrder.customer_phone,
        final_amount: createdOrder.final_amount,
        shipping_fee: createdOrder.shipping_fee,
        governorate: createdOrder.governorate,
        landing_page_slug: createdOrder.landing_page_slug,
        event_id: eventId,
      },
    });
  } catch (error: any) {
    console.error("[Create Order Error]", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ غير متوقع أثناء معالجة الطلب" },
      { status: 500 }
    );
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

    const orders = await dbStore.getOrders({
      landing_page_slug,
      status,
      search,
    });

    // Sync live orders from Safka Dropshipping platform only when sync is explicitly requested
    if (syncSafka) {
      try {
        const safkaOrders = await SafkaClient.fetchSafkaMcpOrders(20);
        if (Array.isArray(safkaOrders) && safkaOrders.length > 0) {
          const existingSerials = new Set(
            orders.map((o) => o.safqa_invoice_id || o.order_number)
          );

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

    return NextResponse.json({ success: true, orders });
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

    const { status, action } = body;

    // Retry Safka Sync action
    if (action === "retry_safqa") {
      const order = await dbStore.getOrder(orderId);
      if (!order) return NextResponse.json({ success: false, error: "الطلب غير موجود" }, { status: 404 });
      const res = await SafkaClient.createOrder(order);
      return NextResponse.json(res);
    }

    if (status) {
      const updated = await dbStore.updateOrderStatus(orderId, status);
      return NextResponse.json({ success: updated });
    }

    return NextResponse.json({ success: false, error: "لا يوجد إجراء محدد" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
