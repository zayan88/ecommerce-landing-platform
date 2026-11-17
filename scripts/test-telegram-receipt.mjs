// The customer's transfer screenshot is sent to Telegram together with the order alert.
// Usage: node scripts/test-telegram-receipt.mjs
import assert from "node:assert/strict";
import { startTestKit } from "./lib/test-kit.mjs";

const { kvSeed, mod, call, request, test, finish } = await startTestKit({ env: { ORDERS_BACKEND: "d1", TELEGRAM_BOT_TOKEN: "123:abc", TELEGRAM_CHAT_ID: "42" } });
const P = { id: "prod-tg", title_ar: "منتج", slug: "tg-p", base_price: 500, images: [], description_ar: "", stock_quantity: 10, status: "active", created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z", offers: [] };
kvSeed("prod:prod-tg", P);
kvSeed("custom_products_all", [P]);
const ordersRoute = await mod("app/api/orders/route.ts");
const receiptsRoute = await mod("app/api/receipts/route.ts");
const settingsRoute = await mod("app/api/settings/route.ts");
await call(settingsRoute.POST, "/api/settings", { method: "POST", admin: true, body: { payment_methods: { vodafone_cash: { enabled: true, number: "01012345678" } } } });

const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x1a, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x4c, 1, 2, 3, 4]);
const form = new FormData();
form.set("file", new File([WEBP], "r.webp", { type: "image/webp" }));
const req = request("/api/receipts", { method: "POST", headers: { "cf-connecting-ip": "10.4.0.1" } });
const up = await receiptsRoute.POST(new (req.constructor)(new Request(req.url, { method: "POST", body: form, headers: req.headers })));
const receiptId = (await up.json()).id;

const realFetch = globalThis.fetch;
const sent = [];
globalThis.fetch = async (url, init) => {
  if (String(url).includes("api.telegram.org")) { sent.push({ url: String(url), body: init?.body }); return new Response(JSON.stringify({ ok: true, result: { message_id: 1 } }), { status: 200 }); }
  return realFetch(url, init);
};

await test("the receipt photo follows the order message to Telegram", async () => {
  const r = await call(ordersRoute.POST, "/api/orders", { method: "POST", headers: { "cf-connecting-ip": "10.4.0.2" }, body: { customer_name: "منى علي", customer_phone: "01155701234", governorate: "الجيزة", address: "٥ شارع الهرم بجوار المسجد", product_id: "prod-tg", landing_page_slug: "tg-p", quantity: 1, payment_method: "vodafone_cash", payment_receipt: receiptId } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.ok(sent.some((x) => x.url.endsWith("/sendMessage")));
  const photo = sent.find((x) => x.url.endsWith("/sendPhoto"));
  assert.ok(photo, "sendPhoto was called");
  assert.ok(photo.body instanceof FormData && photo.body.get("photo"));
});
globalThis.fetch = realFetch;
finish();
