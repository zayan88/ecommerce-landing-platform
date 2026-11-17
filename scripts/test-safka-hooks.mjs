// Safka's documented callback (api_safka_key) and order-status webhook (order.status.updated).
// Usage: node scripts/test-safka-hooks.mjs
import assert from "node:assert/strict";
import { startTestKit } from "./lib/test-kit.mjs";

const { kvSeed, mod, call, request, test, finish } = await startTestKit({ env: { ORDERS_BACKEND: "d1", SAFQA_WEBHOOK_SECRET: "hook-secret-xyz" } });
const P = { id: "prod-sk", title_ar: "منتج", slug: "sk-p", base_price: 500, images: [], description_ar: "", stock_quantity: 10, status: "active", created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z", offers: [] };
kvSeed("prod:prod-sk", P);
kvSeed("custom_products_all", [P]);
const safka = await mod("app/api/safqa/[[...action]]/route.ts");
const orders = await mod("app/api/orders/route.ts");
const { dbStore } = await mod("lib/db/store.ts");
const { mapSafkaStatus } = await mod("lib/safqa/order-status.ts");
let n = 0;
const hook = async (action, body, secret = "hook-secret-xyz") => {
  const res = await safka.POST(request(`/api/safqa/${action}${secret ? `?secret=${secret}` : ""}`, { method: "POST", body }), { params: { action: [action] } });
  return { status: res.status, body: await res.json().catch(() => null) };
};
const place = async () => (await call(orders.POST, "/api/orders", { method: "POST", headers: { "cf-connecting-ip": `10.7.0.${++n}` }, body: { customer_name: "منى علي", customer_phone: "0115580" + String(2000 + n), governorate: "الجيزة", address: "٥ شارع الهرم بجوار المسجد", product_id: "prod-sk", landing_page_slug: "sk-p", quantity: 1, payment_method: "cod" } })).body.order;

await test("status codes map to ours", () => {
  assert.equal(mapSafkaStatus("shipped"), "shipped");
  assert.equal(mapSafkaStatus("available"), "delivered");
  assert.equal(mapSafkaStatus("collected"), "delivered");
  assert.equal(mapSafkaStatus("declined2"), "cancelled");
  assert.equal(mapSafkaStatus("returned1"), "returned");
  assert.equal(mapSafkaStatus("preparing"), "confirmed");
  assert.equal(mapSafkaStatus("pending"), null);
  assert.equal(mapSafkaStatus("holding"), null);
});

await test("callbackAPI: the key arrives as api_safka_key and is saved; no secret = refused", async () => {
  assert.equal((await hook("connect-callback", { api_safka_key: "spk_abc123", name: "x", _id: "1" }, "")).status, 401);
  const r = await hook("connect-callback", { api_safka_key: "spk_abc123", name: "x", _id: "1" });
  assert.equal(r.status, 200);
  assert.equal((await dbStore.getSettings()).safqa_api_secret_token, "spk_abc123");
});

await test("order hook: Safka's documented payload updates the order (by Safka id, falling back to the phone)", async () => {
  const o = await place();
  await dbStore.updateSafqaInfo(o.id, { safqa_invoice_id: "6966a3b27fd9c61da95eeb94", safqa_status: "pending" });
  const r = await hook("orders", { event: "order.status.updated", order: { _id: "6966a3b27fd9c61da95eeb94", status: "shipped", status_ar: "في الشحن", previous_status: "preparing", serial_number: "sk-abc", client_phone1: "0100000000" } });
  assert.equal(r.status, 200);
  assert.equal((await dbStore.getOrder(o.id)).status, "shipped");
  await hook("orders", { event: "order.status.updated", order: { _id: "6966a3b27fd9c61da95eeb94", status: "collected" } });
  assert.equal((await dbStore.getOrder(o.id)).status, "delivered");

  const o2 = await place();
  const phone = (await dbStore.getOrder(o2.id)).customer_phone;
  await hook("orders", { event: "order.status.updated", order: { _id: "unknown-id", status: "declined1", client_phone1: phone } });
  assert.equal((await dbStore.getOrder(o2.id)).status, "cancelled");
});
finish();
