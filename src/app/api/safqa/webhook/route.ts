import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";
import { SafkaClient } from "@/lib/safqa/safka-client";

/**
 * Safqa Webhook Verification & Health Check (GET)
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    service: "Safka Egypt Webhook Gateway",
    status: "active and listening",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Safqa Webhook Handler (POST)
 * Handles both Product imports from Safka and Order Status notifications.
 */
export async function POST(req: NextRequest) {
  try {
    let payload: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try {
        payload = await req.json();
      } catch {
        payload = {};
      }
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      try {
        const formData = await req.formData();
        const obj: Record<string, any> = {};
        formData.forEach((val, key) => {
          obj[key] = val;
        });
        payload = obj;
      } catch {
        const text = await req.text();
        const params = new URLSearchParams(text);
        const obj: Record<string, any> = {};
        params.forEach((val, key) => {
          obj[key] = val;
        });
        payload = obj;
      }
    } else {
      try {
        const text = await req.text();
        if (text) {
          try {
            payload = JSON.parse(text);
          } catch {
            payload = { raw: text };
          }
        }
      } catch {}
    }

    console.log("[Safqa Webhook Received Payload]", JSON.stringify(payload).substring(0, 500));

    // CHECK IF PAYLOAD IS A SAFKA PRODUCT PUSH
    const productData = payload.data || payload.product || payload;
    if (
      productData &&
      (productData.name || productData.barcode || (productData.properties && productData.sale_price))
    ) {
      console.log("[Safqa Webhook] Detected Safka Product Import!");
      const imported = await SafkaClient.importSafkaProduct(productData);
      return NextResponse.json({
        success: true,
        message: "تم استلام المنتج من صفقة وإنشاء صفحة الهبوط له بنجاح",
        product_id: imported.product.id,
        landing_page_url: imported.landingPageUrl,
      });
    }

    // CHECK IF PAYLOAD IS AN ORDER STATUS UPDATE
    const safkaOrderId =
      payload.order_id ||
      payload._id ||
      payload.data?._id ||
      payload.order_number ||
      payload.invoice_id;

    const rawStatus = (
      payload.status ||
      payload.data?.status ||
      ""
    ).toLowerCase();

    if (safkaOrderId) {
      // Find matching order in dbStore
      const orders = await dbStore.getOrders();
      const matched = orders.find(
        (o) =>
          o.safqa_invoice_id === safkaOrderId ||
          o.order_number === safkaOrderId ||
          (payload.client_phone1 && o.customer_phone === payload.client_phone1)
      );

      if (matched) {
        let newStatus = matched.status;
        if (rawStatus.includes("ship") || rawStatus.includes("مكتمل") || rawStatus.includes("جار")) {
          newStatus = "shipped";
        } else if (rawStatus.includes("deliver") || rawStatus.includes("تم التسليم")) {
          newStatus = "delivered";
        } else if (rawStatus.includes("cancel") || rawStatus.includes("ملغي")) {
          newStatus = "cancelled";
        } else if (rawStatus.includes("return") || rawStatus.includes("مرتجع")) {
          newStatus = "returned";
        }

        await dbStore.updateOrderStatus(matched.id, newStatus);
        await dbStore.updateSafqaInfo(matched.id, {
          safqa_status: newStatus === "delivered" ? "paid" : "pending",
          safqa_response: payload,
        });

        return NextResponse.json({
          success: true,
          message: `تم تحديث حالة الطلب ${matched.order_number} إلى ${newStatus}`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "تم استلام الإشعار بنجاح",
      received: payload,
    });
  } catch (err: any) {
    console.error("[Safqa Webhook Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "حدث خطأ أثناء معالجة الويب هوك" },
      { status: 500 }
    );
  }
}
