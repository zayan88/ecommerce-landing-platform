import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";

/**
 * Safka Order Hook (GET)
 * Health check & verification for Safka order webhook
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    service: "Safka Egypt Order Hook",
    status: "active and ready to receive order status updates",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Safka Order Hook (POST)
 * Receives order status changes from Safka Egypt dropshipping platform.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));
    console.log("[Safka Order Hook Received]", JSON.stringify(payload));

    const safkaOrderId = payload.order_id || payload._id || payload.data?._id || payload.order_number;
    const rawStatus = (payload.status || payload.data?.status || "").toLowerCase();

    if (safkaOrderId) {
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
      message: "Order hook received successfully",
    });
  } catch (err: any) {
    console.error("[Safka Order Hook Error]", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
