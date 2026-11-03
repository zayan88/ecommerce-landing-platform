import { Order } from "@/types";
import { dbStore } from "../db/store";

export interface SafqaInvoiceResponse {
  success: boolean;
  invoice_id?: string;
  invoice_url?: string;
  error?: string;
  raw_response?: any;
}

export class SafqaClient {
  /**
   * Forwards an order to Safqa Payment Gateway to generate an invoice/payment link.
   * If in sandbox mode or if no API token is configured, it simulates a successful sandbox invoice
   * so the checkout flow never breaks.
   */
  static async createInvoice(order: Order): Promise<SafqaInvoiceResponse> {
    try {
      const settings = await dbStore.getSettings();
      const token = settings.safqa_api_secret_token || process.env.SAFQA_API_SECRET_TOKEN;
      const baseUrl = settings.safqa_api_base_url || "https://api.safqapay.com/v1";
      const isSandbox = settings.safqa_sandbox_mode;

      // If token is missing or sandbox is active without real credentials, return simulated sandbox invoice
      if (!token || token.startsWith("MOCK") || isSandbox) {
        const mockInvoiceId = `SFQ-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
        const mockInvoiceUrl = `https://pay.safqapay.com/sandbox/invoice/${mockInvoiceId}`;

        // Update order in store
        await dbStore.updateSafqaInfo(order.id, {
          safqa_invoice_id: mockInvoiceId,
          safqa_invoice_url: mockInvoiceUrl,
          safqa_status: "pending",
          safqa_response: {
            mode: "sandbox_simulation",
            invoice_id: mockInvoiceId,
            message: "تم إنشاء فاتورة تجريبية عبر صفقة بنجاح",
            amount: order.final_amount,
            currency: "EGP",
          },
        });

        return {
          success: true,
          invoice_id: mockInvoiceId,
          invoice_url: mockInvoiceUrl,
          raw_response: { mode: "sandbox_simulation", invoice_id: mockInvoiceId },
        };
      }

      // Real Safqa API call
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const payload = {
        amount: order.final_amount,
        currency: "EGP",
        customer_name: order.customer_name,
        mobile_number: order.customer_phone,
        client_email: `${order.customer_phone}@store.local`,
        reference_id: order.order_number,
        language: "ar",
        call_back_url: `${appUrl}/api/safqa/webhook`,
        error_url: `${appUrl}/p/${order.landing_page_slug}`,
        notify_customer: false,
      };

      const response = await fetch(`${baseUrl}/invoice/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `Safqa API error ${response.status}`);
      }

      const invoiceId = responseData.data?.invoice_id || responseData.invoice_id || `SFQ-${Date.now()}`;
      const invoiceUrl = responseData.data?.url || responseData.invoice_url;

      await dbStore.updateSafqaInfo(order.id, {
        safqa_invoice_id: invoiceId,
        safqa_invoice_url: invoiceUrl,
        safqa_status: "pending",
        safqa_response: responseData,
      });

      return {
        success: true,
        invoice_id: invoiceId,
        invoice_url: invoiceUrl,
        raw_response: responseData,
      };
    } catch (err: any) {
      console.error("[SafqaClient Error]", err.message);

      // Record failure state
      await dbStore.updateSafqaInfo(order.id, {
        safqa_status: "failed",
        safqa_response: { error: err.message },
      });

      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Manual retry for syncing an order with Safqa
   */
  static async retrySync(orderId: string): Promise<SafqaInvoiceResponse> {
    const order = await dbStore.getOrder(orderId);
    if (!order) {
      return { success: false, error: "الطلب غير موجود" };
    }
    return this.createInvoice(order);
  }
}
