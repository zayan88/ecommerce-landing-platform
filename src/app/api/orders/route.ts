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
      return NextResponse.json(
        {
          success: false,
          error: "بيانات الطلب غير صالحة",
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

    // 3. Resolve pricing & offers
    let unitPrice = product.base_price;
    let totalAmount = unitPrice * data.quantity;
    let shippingFee = getGovernorateDeliveryFee(data.governorate);
    let discountAmount = 0;

    if (data.offer_id && product.offers) {
      const selectedOffer = product.offers.find((o) => o.id === data.offer_id);
      if (selectedOffer) {
        totalAmount = selectedOffer.price;
        unitPrice = selectedOffer.price / selectedOffer.quantity;
        if (selectedOffer.free_shipping) {
          shippingFee = 0;
        }
        if (selectedOffer.original_price) {
          discountAmount = selectedOffer.original_price - selectedOffer.price;
        }
      }
    } else if (data.quantity >= 2) {
      // Automatic free shipping for 2+ items
      shippingFee = 0;
    }

    const finalAmount = totalAmount + shippingFee;

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
      offer_id: data.offer_id,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_phone2: data.customer_phone2,
      governorate: data.governorate,
      city: data.city || "",
      address: data.address,
      notes: data.notes,
      quantity: data.quantity,
      unit_price: unitPrice,
      total_amount: totalAmount,
      shipping_fee: shippingFee,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      payment_method: data.payment_method,
      tracking: {
        utm_source: data.utm_source,
        utm_medium: data.utm_medium,
        utm_campaign: data.utm_campaign,
        utm_content: data.utm_content,
        utm_term: data.utm_term,
        referrer: data.referrer,
        ip_address: ipAddress,
        user_agent: userAgent,
        fbp: data.fbp,
        fbc: data.fbc,
        event_id: eventId,
      },
    });

    // 6. Forward order to Safka Egypt Dropshipping API automatically (Safe background forwarder)
    SafkaClient.createOrder(createdOrder).catch((err) => {
      console.error("[Background Safka dropshipping forward error]", err);
    });

    // 7. Dispatch Meta Conversions API (CAPI) event with identical event_id
    MetaCapiClient.sendEvent({
      event_name: "Purchase",
      event_id: eventId,
      event_source_url: `${req.nextUrl.origin}/p/${data.landing_page_slug}`,
      order: createdOrder,
      ip_address: ipAddress,
      user_agent: userAgent,
      fbp: data.fbp,
      fbc: data.fbc,
    }).catch((err) => {
      console.error("[Background Meta CAPI error]", err);
    });

    // 8. Log internal analytics
    dbStore.logAnalyticsEvent({
      event_name: "Purchase",
      event_id: eventId,
      product_id: product.id,
      page_url: `/p/${data.landing_page_slug}`,
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
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
    const landing_page_slug = searchParams.get("lp") || undefined;
    const status = (searchParams.get("status") as any) || undefined;
    const search = searchParams.get("q") || undefined;

    const orders = await dbStore.getOrders({
      landing_page_slug,
      status,
      search,
    });

    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
