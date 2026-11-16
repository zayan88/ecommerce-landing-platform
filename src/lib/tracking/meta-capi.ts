import { capiTargets } from "./pixel-config";
import { sha256 } from "@/lib/crypto/sha256";
import { Order } from "@/types";
import { dbStore } from "../db/store";

function normalizeEgyptianPhone(phone: string): string {
  // Format to standard E.164: +201xxxxxxxxx
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "2" + cleaned; // 010... -> 2010...
  } else if (!cleaned.startsWith("20") && cleaned.startsWith("1")) {
    cleaned = "20" + cleaned;
  }
  return cleaned;
}

export interface CapiEventPayload {
  event_name: "PageView" | "ViewContent" | "InitiateCheckout" | "Purchase";
  event_id: string;
  event_source_url: string;
  order?: Order;
  phone?: string;
  ip_address?: string;
  user_agent?: string;
  fbp?: string;
  fbc?: string;
  custom_data?: Record<string, any>;
}

export class MetaCapiClient {
  /**
   * Sends a server-side event to Meta Conversions API (CAPI).
   * Ensures deduplication with browser pixel via event_id.
   */
  static async sendEvent(payload: CapiEventPayload): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const settings = await dbStore.getSettings();
      const targets = capiTargets(settings, {
        pixel: process.env.NEXT_PUBLIC_META_PIXEL_ID,
        token: process.env.META_CAPI_ACCESS_TOKEN,
        test: process.env.META_TEST_EVENT_CODE,
      }).filter((t) => !t.token.startsWith("MOCK"));

      if (targets.length === 0) {
        // Mock mode logging
        console.log(`[Meta CAPI Simulation] ${payload.event_name} dispatched with event_id: ${payload.event_id}`);
        return {
          success: true,
          data: { simulated: true, event_id: payload.event_id, event_name: payload.event_name },
        };
      }

      // Hash sensitive user data
      const userData: Record<string, any> = {
        client_ip_address: payload.ip_address || "127.0.0.1",
        client_user_agent: payload.user_agent || "Mozilla/5.0",
      };

      const rawPhone = payload.phone || payload.order?.customer_phone;
      if (rawPhone) {
        userData.ph = [sha256(normalizeEgyptianPhone(rawPhone))];
      }

      const rawName = payload.order?.customer_name;
      if (rawName) {
        userData.fn = [sha256(rawName.trim().split(/\s+/)[0].toLowerCase())];
      }

      if (payload.fbp) userData.fbp = payload.fbp;
      if (payload.fbc) userData.fbc = payload.fbc;

      const eventData: any = {
        event_name: payload.event_name,
        event_time: Math.floor(Date.now() / 1000),
        event_id: payload.event_id,
        event_source_url: payload.event_source_url,
        action_source: "website",
        user_data: userData,
        custom_data: {
          currency: "EGP",
          value: payload.order?.final_amount || payload.custom_data?.value || 0,
          content_type: "product",
          content_name: payload.order?.product?.title_ar || payload.custom_data?.content_name,
          num_items: payload.order?.quantity || 1,
          ...payload.custom_data,
        },
      };

      // One request per configured pixel. The token goes in the body, never in the URL (URLs end up in logs).
      const results = await Promise.allSettled(
        targets.map(async (t) => {
          const bodyPayload: any = { data: [eventData], access_token: t.token };
          if (t.test_code) bodyPayload.test_event_code = t.test_code;
          const response = await fetch(`https://graph.facebook.com/v19.0/${t.pixel_id}/events`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyPayload),
          });
          const resJson = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(resJson.error?.message || `CAPI Error ${response.status}`);
          return resJson;
        })
      );
      const ok = results.filter((r) => r.status === "fulfilled") as PromiseFulfilledResult<any>[];
      if (ok.length === 0) {
        const firstErr = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
        throw new Error(firstErr?.reason?.message || "CAPI failed");
      }
      return { success: true, data: ok.length === 1 ? ok[0].value : { sent: ok.length, failed: results.length - ok.length } };
    } catch (err: any) {
      console.error("[MetaCapiClient Error]", err.message);
      return { success: false, error: err.message };
    }
  }
}
