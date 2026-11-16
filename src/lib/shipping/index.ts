/**
 * Shipping orchestration: sends orders to the merchant's courier and applies the courier's status webhooks.
 * The shipment is stored on the order as `tracking.shipping` (no schema change), so it works on both the
 * D1 and the KV order backends. Only Bosta has an API connection so far; "none" means "ship by file export".
 */
import type { Order, OrderShipment, OrderStatus } from "@/types";
import { dbStore } from "@/lib/db/store";
import { bostaStateInfo, createBostaDelivery } from "./bosta";

export const SHIPPING_PROVIDERS = ["none", "bosta"] as const;
export type ShippingProvider = (typeof SHIPPING_PROVIDERS)[number];

export interface SendResult {
  order_id: string;
  order_number: string;
  ok: boolean;
  tracking_number?: string;
  error?: string;
  skipped?: boolean;
}

/** Sends up to 50 orders to the configured courier, one by one (a failure never stops the rest). */
export async function sendOrdersToShipping(orderIds: string[], origin: string): Promise<{ provider: ShippingProvider; results: SendResult[] }> {
  const settings = await dbStore.getSettings();
  const provider = (settings.shipping_provider as ShippingProvider) || "none";
  if (provider !== "bosta") return { provider, results: [] };

  const results: SendResult[] = [];
  const webhookUrl = /^https:\/\//.test(origin) ? `${origin}/api/shipping/bosta-webhook` : undefined; // couriers need a public https URL
  for (const id of orderIds.slice(0, 50)) {
    const order = await dbStore.getOrder(id);
    if (!order) {
      results.push({ order_id: id, order_number: id, ok: false, error: "الطلب مش موجود" });
      continue;
    }
    if (order.tracking?.shipping?.tracking_number) {
      results.push({ order_id: order.id, order_number: order.order_number, ok: true, skipped: true, tracking_number: order.tracking.shipping.tracking_number });
      continue;
    }
    if (order.status === "cancelled" || order.status === "delivered" || order.status === "returned") {
      results.push({ order_id: order.id, order_number: order.order_number, ok: false, error: "حالة الطلب ما تسمحش بالشحن" });
      continue;
    }
    const r = await createBostaDelivery(order, settings, webhookUrl);
    if (!r.ok || !r.tracking_number) {
      results.push({ order_id: order.id, order_number: order.order_number, ok: false, error: r.error || "تعذر إنشاء الشحنة" });
      continue;
    }
    const shipment: OrderShipment = {
      provider,
      tracking_number: r.tracking_number,
      external_id: r.external_id,
      state_label: "تم إنشاء الشحنة",
      created_at: new Date().toISOString(),
    };
    const nextStatus: OrderStatus = order.status === "pending" ? "confirmed" : order.status;
    await dbStore.updateOrder(order.id, { tracking: { ...(order.tracking || {}), shipping: shipment }, status: nextStatus });
    results.push({ order_id: order.id, order_number: order.order_number, ok: true, tracking_number: r.tracking_number });
  }
  return { provider, results };
}

const RANK: Record<string, number> = { pending: 0, confirmed: 1, shipped: 2, delivered: 3, returned: 3, cancelled: 3 };

/** Applies one Bosta webhook payload. Returns whether an order was found (the endpoint answers 200 either way). */
export async function applyBostaWebhook(body: any): Promise<boolean> {
  const state = Number(body?.state);
  const reference = typeof body?.businessReference === "string" ? body.businessReference.trim() : "";
  const tracking = body?.trackingNumber !== undefined ? String(body.trackingNumber) : "";
  if (!Number.isFinite(state) || (!reference && !tracking)) return false;

  let order: Order | null = reference ? await dbStore.getOrder(reference) : null;
  if (!order && reference) {
    const found = await dbStore.getOrders({ search: reference } as any);
    order = found.find((o: Order) => o.order_number === reference) || null;
  }
  if (!order) return false;
  const current = order.tracking?.shipping;
  // The webhook must belong to this order's own shipment (reference alone is guessable)
  if (!current || (tracking && current.tracking_number && current.tracking_number !== tracking)) return false;

  const info = bostaStateInfo(state);
  const shipment: OrderShipment = { ...current, state, state_label: info.label, updated_at: new Date().toISOString() };
  if (typeof body?.exceptionReason === "string" && state === 47) shipment.note = body.exceptionReason.slice(0, 200);
  const patch: Partial<Order> = { tracking: { ...(order.tracking || {}), shipping: shipment } };
  // The order status only moves forward (a late "shipped" event never reopens a delivered order)
  if (info.status && (RANK[info.status] ?? 0) >= (RANK[order.status] ?? 0)) patch.status = info.status;
  await dbStore.updateOrder(order.id, patch);
  return true;
}
