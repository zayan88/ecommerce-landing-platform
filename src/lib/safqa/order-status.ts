/**
 * Safka's order-status webhook (docs: public-api-docs.safka-eg.com/integration-flow). Safka POSTs
 * { event: "order.status.updated", order: { _id, serial_number, status, status_ar, client_phone1, ... } }
 * with status codes like pending / preparing / shipped / available (delivered) / collected (paid) / declined1 / returned1.
 */
import type { OrderStatus } from "@/types";

const CODE_MAP: Record<string, OrderStatus> = {
  preparing: "confirmed",
  printing: "confirmed",
  shipped: "shipped",
  available: "delivered",
  collected: "delivered",
  declined1: "cancelled",
  declined2: "cancelled",
  skip: "returned",
  returned1: "returned",
  returned2: "returned",
  returned_exchange: "returned",
};

/** Our order status for a Safka status (code or Arabic/English text); null = leave the order as it is (pending, on hold, asks...). */
export function mapSafkaStatus(raw: unknown): OrderStatus | null {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return null;
  if (CODE_MAP[s]) return CODE_MAP[s];
  if (s === "pending" || s === "holding" || s === "ask_to_exchange" || s === "ask_to_return") return null;
  // older / free-text payloads
  if (s.includes("deliver") || s.includes("تم التسليم") || s.includes("تم التوصيل") || s.includes("تم التحصيل")) return "delivered";
  if (s.includes("cancel") || s.includes("ملغي")) return "cancelled";
  if (s.includes("return") || s.includes("مرتجع") || s.includes("استرجاع")) return "returned";
  if (s.includes("ship") || s.includes("مكتمل") || s.includes("جار") || s.includes("في الشحن")) return "shipped";
  return null;
}

/** The ids / fields of an order-status payload, in Safka's documented shape (and the older flat shapes). */
export function readSafkaOrderPayload(payload: any): { ids: string[]; phone: string | null; status: string } {
  const o = payload?.order && typeof payload.order === "object" ? payload.order : payload?.data && typeof payload.data === "object" ? payload.data : payload || {};
  const ids = [o._id, o.serial_number, o.order_id, o.order_number, payload?.order_id, payload?._id]
    .filter((x) => typeof x === "string" && x)
    .map(String);
  const phone = typeof o.client_phone1 === "string" ? o.client_phone1 : typeof payload?.client_phone1 === "string" ? payload.client_phone1 : null;
  return { ids: Array.from(new Set(ids)), phone, status: String(o.status ?? payload?.status ?? "") };
}
