import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("[Safqa Webhook Received]", JSON.stringify(payload));

    const invoiceId = payload.invoice_id || payload.data?.invoice_id;
    const status = payload.status || payload.data?.status; // e.g. 'paid', 'failed'
    const referenceId = payload.reference_id || payload.data?.reference_id; // our order_number

    if (referenceId) {
      const order = await dbStore.getOrder(referenceId);
      if (order) {
        let newSafqaStatus = "pending";
        if (status === "paid" || status === "success") newSafqaStatus = "paid";
        if (status === "failed" || status === "cancelled") newSafqaStatus = "failed";

        await dbStore.updateSafqaInfo(order.id, {
          safqa_invoice_id: invoiceId,
          safqa_status: newSafqaStatus as any,
          safqa_response: payload,
        });

        if (newSafqaStatus === "paid") {
          await dbStore.updateOrderStatus(order.id, "confirmed");
        }
      }
    }

    return NextResponse.json({ success: true, received: true });
  } catch (err: any) {
    console.error("[Safqa Webhook Error]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
