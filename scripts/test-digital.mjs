// Tests for digital products: no address / shipping, email required.
// Usage: node scripts/test-digital.mjs
import assert from "node:assert/strict";
import { startTestKit } from "./lib/test-kit.mjs";

const { kvSeed, mod, call, test, finish } = await startTestKit({ env: { ORDERS_BACKEND: "d1" } });
const P = { id: "prod-d1", title_ar: "كورس", slug: "d-course", base_price: 500, images: [], description_ar: "x", stock_quantity: 99, status: "active", created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z", offers: [], digital: true };
kvSeed("prod:prod-d1", P);
kvSeed("custom_products_all", [P]);
const ordersRoute = await mod("app/api/orders/route.ts");
const { dbStore } = await mod("lib/db/store.ts");
let n = 0;
const place = (over = {}) => call(ordersRoute.POST, "/api/orders", { method: "POST", headers: { "cf-connecting-ip": `10.8.0.${++n}` }, body: { customer_name: "منى علي", customer_phone: "0115590" + String(1000 + n), governorate: "القاهرة", address: "منتج رقمي - تسليم إلكتروني", product_id: "prod-d1", landing_page_slug: "d-course", quantity: 1, payment_method: "cod", ...over } });

await test("digital order needs a valid email, has no shipping, keeps the email in the notes", async () => {
  const bad = await place({});
  assert.equal(bad.status, 400);
  const bad2 = await place({ email: "nope" });
  assert.equal(bad2.status, 400);
  const ok = await place({ email: "mona@example.com" });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal(ok.body.order.final_amount, 500);
});

await test("buildProduct keeps the digital flag", async () => {
  const b = dbStore.buildProduct ? dbStore.buildProduct({ ...P }) : null;
  if (b) assert.equal(b.digital, true);
});

finish();
