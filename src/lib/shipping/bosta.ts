/**
 * Bosta courier (https://bosta.co) integration: creates a delivery for an order and maps its webhook states.
 *
 * Source of the request shapes: the public Bosta docs (docs.bosta.co "How to" pages) and the official
 * Node SDK. The API reference (Swagger) could not be read when this was written, so the parts marked
 * UNVERIFIED must be confirmed with a real API key (first shipment from a test order): the city value,
 * the package type spelling and the receiver fields. Every API error is returned to the admin as text
 * (code + message), never swallowed, and an order is never marked as shipped unless Bosta answered with
 * a tracking number.
 *
 * Security: the API key is sent only in the `Authorization` header to the Bosta host, is never logged and
 * never appears in an error message. Edge-safe: only fetch + Web APIs.
 */
import type { Order, SystemSettings } from "@/types";
import { EGYPTIAN_GOVERNORATES } from "@/lib/constants/governorates";

const BOSTA_BASE = "https://app.bosta.co";

/** Tests (and a Bosta staging key) can point at another host; production always uses app.bosta.co. */
function baseUrl(): string {
  const o = (process.env.BOSTA_API_BASE || "").trim().replace(/\/+$/, "");
  if (/^https:\/\/(app|stg-app)\.bosta\.co$/.test(o)) return o;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)) return o; // local mock server only
  return BOSTA_BASE;
}

export interface ShipmentResult {
  ok: boolean;
  tracking_number?: string;
  external_id?: string;
  error?: string;
}

/** Bosta delivery states (webhook `state`) -> our order status + a short Arabic label. */
export const BOSTA_STATES: Record<number, { label: string; status?: "shipped" | "delivered" | "returned" | "cancelled" }> = {
  10: { label: "تم طلب الاستلام من التاجر" },
  11: { label: "في انتظار خط السير" },
  20: { label: "تم تعيين مندوب", status: "shipped" },
  21: { label: "تم الاستلام من التاجر", status: "shipped" },
  24: { label: "وصل المخزن", status: "shipped" },
  30: { label: "في الطريق بين الفروع", status: "shipped" },
  41: { label: "تم الاستلام", status: "shipped" },
  45: { label: "تم التسليم", status: "delivered" },
  46: { label: "رجع للتاجر", status: "returned" },
  47: { label: "مشكلة في التسليم" },
  48: { label: "تم الإنهاء", status: "cancelled" },
  49: { label: "ملغي", status: "cancelled" },
  100: { label: "مفقود" },
  101: { label: "تالف" },
  102: { label: "تحت الفحص" },
  103: { label: "في انتظار إجراء منك" },
  105: { label: "معلّق" },
};

export function bostaStateInfo(code: number): { label: string; status?: "shipped" | "delivered" | "returned" | "cancelled" } {
  return BOSTA_STATES[code] || { label: `حالة ${code}` };
}

const norm = (v: string) =>
  v
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\(.*?\)/g, "")
    .replace(/\b(al|el)\b[\s-]*/g, "")
    .replace(/[^a-z0-9؀-ۿ]/g, "");

/** English city name for one of our governorate options ("الدقهلية (المنصورة)" -> "Dakahlia"). */
export function governorateEnglish(governorate: string): string {
  const g = norm(governorate);
  const hit = EGYPTIAN_GOVERNORATES.find((x) => norm(x.nameAr) === g || norm(x.nameEn) === g);
  return hit ? hit.nameEn : governorate;
}

/** Picks the Bosta city that matches the governorate from Bosta's own list (by Arabic or English name). UNVERIFIED shape: tolerant. */
export function matchCity(list: any[], governorate: string): string | null {
  const wanted = [norm(governorate), norm(governorateEnglish(governorate))];
  for (const c of list) {
    const names = [c?.name, c?.nameAr, c?.otherName, c?.code].filter((x) => typeof x === "string").map(norm);
    if (names.some((n) => n && wanted.includes(n))) return String(c?.name || c?.nameAr || c?.code);
  }
  return null;
}

async function bostaFetch(apiKey: string, method: string, path: string, body?: unknown): Promise<{ status: number; json: any }> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 15000);
  try {
    const res = await fetch(`${baseUrl()}${path}`, {
      method,
      headers: { Authorization: apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctl.signal,
    });
    const json = await res.json().catch(() => null);
    return { status: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || "عميل";
  const lastName = parts.slice(1).join(" ") || firstName;
  return { firstName, lastName };
}

/** Egyptian mobile in the 01xxxxxxxxx form the courier expects. */
function cleanPhone(p: string): string {
  const d = (p || "").replace(/[^0-9]/g, "");
  return d.startsWith("20") && d.length === 12 ? "0" + d.slice(2) : d;
}

export function buildBostaPayload(order: Order, city: string, opts: { locationId?: string; webhookUrl?: string; webhookKey?: string }) {
  const { firstName, lastName } = splitName(order.customer_name || "");
  const firstLine = (order.address || "").trim().padEnd(6, " ").slice(0, 250).trim() || order.governorate;
  const payload: Record<string, unknown> = {
    type: 10, // Deliver
    specs: {
      packageType: "Small", // UNVERIFIED casing: docs example "Small", docs list "SMALL"
      packageDetails: { itemsCount: Math.max(1, Math.round(order.quantity || 1)), description: (order.product?.title_ar || "طلب").slice(0, 100) },
    },
    cod: Math.max(0, Math.round(order.final_amount || 0)),
    dropOffAddress: { city, firstLine },
    receiver: { firstName, lastName, phone: cleanPhone(order.customer_phone) },
    businessReference: order.order_number,
  };
  if (order.notes) payload.notes = String(order.notes).slice(0, 250);
  if (opts.locationId) payload.businessLocationId = opts.locationId;
  if (opts.webhookUrl && opts.webhookKey) {
    payload.webhookUrl = opts.webhookUrl;
    payload.webhookCustomHeaders = { Authorization: opts.webhookKey };
  }
  return payload;
}

export async function createBostaDelivery(
  order: Order,
  settings: Pick<SystemSettings, "bosta_api_key" | "bosta_location_id" | "bosta_webhook_key">,
  webhookUrl?: string
): Promise<ShipmentResult> {
  const key = (settings.bosta_api_key || "").trim();
  if (!key) return { ok: false, error: "مفتاح بوسطة مش مضاف في الإعدادات" };
  if (order.final_amount > 30000) return { ok: false, error: "بوسطة بتقبل تحصيل لحد 30,000 ج.م للطلب" };
  try {
    // city: Bosta's own spelling when its list is reachable, else our English governorate name
    let city = governorateEnglish(order.governorate);
    try {
      const cities = await bostaFetch(key, "GET", "/api/v2/cities");
      const list = Array.isArray(cities.json) ? cities.json : Array.isArray(cities.json?.data) ? cities.json.data : Array.isArray(cities.json?.cities) ? cities.json.cities : [];
      const m = list.length ? matchCity(list, order.governorate) : null;
      if (m) city = m;
    } catch {
      // keep the English name
    }
    const payload = buildBostaPayload(order, city, {
      locationId: (settings.bosta_location_id || "").trim() || undefined,
      webhookUrl,
      webhookKey: (settings.bosta_webhook_key || "").trim() || undefined,
    });
    const res = await bostaFetch(key, "POST", "/api/v2/deliveries?apiVersion=1", payload);
    const body = res.json || {};
    const data = body.data || body;
    const tracking = data.trackingNumber ?? data.tracking_number;
    if (res.status >= 200 && res.status < 300 && body.success !== false && tracking) {
      return { ok: true, tracking_number: String(tracking), external_id: data._id ? String(data._id) : undefined };
    }
    const msg = typeof body.message === "string" ? body.message.slice(0, 200) : `HTTP ${res.status}`;
    return { ok: false, error: `بوسطة رفضت الطلب${body.errorCode ? ` (${body.errorCode})` : ""}: ${msg}` };
  } catch (err) {
    const aborted = (err as Error)?.name === "AbortError";
    return { ok: false, error: aborted ? "بوسطة مردّتش في الوقت المناسب، جرّب تاني" : "تعذر الاتصال ببوسطة" };
  }
}
