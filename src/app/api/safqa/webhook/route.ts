import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";

/**
 * Safqa Webhook Verification & Health Check (GET)
 * Used by payment gateways or uptime monitors to verify the webhook endpoint is reachable.
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    service: "Safqa Payment Gateway Webhook",
    status: "active and listening",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Safqa Webhook Handler (POST)
 * Receives IPN (Instant Payment Notifications) from Safqa when an invoice is created, paid, or cancelled.
 * Supports JSON, x-www-form-urlencoded, and raw text payloads without throwing errors.
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

    console.log("[Safqa Webhook Received Payload]", JSON.stringify(payload));

    // Extract identifiers across Safqa's various payload formats
    const invoiceId =
      payload.invoice_id ||
      payload.data?.invoice_id ||
      payload.InvoiceId ||
      payload.invoiceId ||
      payload.id;

    const rawStatus = (
      payload.status ||
      payload.data?.status ||
      payload.InvoiceStatus ||
      payload.invoice_status ||
      ""
    ).toLowerCase();

    const referenceId =
      payload.reference_id ||
      payload.data?.reference_id ||
      payload.ReferenceId ||
      payload.order_id ||
      payload.customer_reference;

    if (referenceId) {
      const order = await dbStore.getOrder(referenceId);
      if (order) {
        let newSafqaStatus: "pending" | "paid" | "failed" = "pending";
        if (rawStatus === "paid" || rawStatus === "success" || rawStatus === "completed") {
          newSafqaStatus = "paid";
        } else if (rawStatus === "failed" || rawStatus === "cancelled" || rawStatus === "expired") {
          newSafqaStatus = "failed";
        }

        await dbStore.updateSafqaInfo(order.id, {
          safqa_invoice_id: invoiceId || order.safqa_invoice_id,
          safqa_status: newSafqaStatus,
          safqa_response: payload,
        });

        if (newSafqaStatus === "paid") {
          await dbStore.updateOrderStatus(order.id, "confirmed");
        }
      }
    }

    // Always respond with 200 OK so Safqa considers the notification successfully delivered
    return NextResponse.json({
      success: true,
      received: true,
      invoice_id: invoiceId || null,
      message: "Webhook processed successfully",
    });
  } catch (err: any) {
    console.error("[Safqa Webhook Processing Error]", err.message);
    // Even on error, return 200 with error note so the gateway does not retry aggressively
    return NextResponse.json({
      success: true,
      received: true,
      warning: err.message,
    });
  }
}
