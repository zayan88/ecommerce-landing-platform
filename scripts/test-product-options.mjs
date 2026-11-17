// Tests for product options (color / size) in the order flow, the safe product info for the chat assistant, and the per-product shipping text.
// Usage: node scripts/test-product-options.mjs
import assert from "node:assert/strict";
import { startTestKit } from "./lib/test-kit.mjs";

const { kvSeed, mod, call, test, finish } = await startTestKit({ env: { ORDERS_BACKEND: "d1" } });

const PRODUCT = {
  id: "prod-o1", title_ar: "تيشيرت", slug: "o-shirt", sku: "SECRET-SKU", base_price: 300, cost_price: 111, images: [], description_ar: "قطن ١٠٠٪",
  stock_quantity: 7, status: "active", created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z", offers: [],
  options: [{ name: "اللون", values: ["أحمر", "أزرق"] }, { name: "المقاس", values: ["M", "L"] }],
};
kvSeed("prod:prod-o1", PRODUCT);
kvSeed("custom_products_all", [PRODUCT]);

const opt = await mod("lib/product-options.ts");
const chat = await mod("lib/chat.ts");
const commerce = await mod("lib/commerce.ts");
const ordersRoute = await mod("app/api/orders/route.ts");
const { dbStore } = await mod("lib/db/store.ts");

let n = 0;
const place = (over = {}) =>
  call(ordersRoute.POST, "/api/orders", {
    method: "POST",
    headers: { "cf-connecting-ip": `10.9.0.${++n}` },
    body: { customer_name: "منى علي", customer_phone: "0115580" + String(1000 + n), governorate: "الجيزة", address: "٥ شارع الهرم بجوار المسجد", product_id: "prod-o1", landing_page_slug: "o-shirt", quantity: 1, payment_method: "cod", ...over },
  });

await test("sanitize: caps, dedupes and drops empty options; the picks are checked against the product", () => {
  const s = opt.sanitizeProductOptions([{ name: " اللون ", values: "أحمر، أزرق,أحمر" }, { name: "x", values: [] }, { name: "اللون", values: ["مكرر"] }, { name: "<b>م</b>", values: ["S"] }, null]);
  assert.equal(s.length, 2);
  assert.deepEqual(s[0], { name: "اللون", values: ["أحمر", "أزرق"] });
  assert.ok(!s[1].name.includes("<"));
  assert.equal(opt.sanitizeProductOptions([1, 2, 3, 4, 5].map((i) => ({ name: "n" + i, values: ["a"] }))).length, 3);
  const o = PRODUCT.options;
  assert.equal(opt.formatOptionsNote(o, { اللون: "أحمر", المقاس: "L" }).note, "اللون: أحمر، المقاس: L");
  assert.ok(opt.formatOptionsNote(o, { اللون: "أحمر" }).error, "a missing option");
  assert.ok(opt.formatOptionsNote(o, { اللون: "أخضر", المقاس: "L" }).error, "a value the product does not have");
  assert.equal(opt.formatOptionsNote([], undefined).note, "");
});

await test("order: options are required, validated, and written into the notes", async () => {
  const bad = await place({});
  assert.equal(bad.status, 400);
  const bad2 = await place({ options: { اللون: "أخضر", المقاس: "M" } });
  assert.equal(bad2.status, 400);
  const ok = await place({ options: { اللون: "أزرق", المقاس: "M" }, notes: "بعد العصر" });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  const orders = await dbStore.getOrders?.();
  const mine = (orders || []).find((o) => String(o.notes || "").includes("اللون: أزرق"));
  if (orders) assert.ok(mine && mine.notes.includes("المقاس: M") && mine.notes.includes("بعد العصر"), "notes carry the choices and the customer's own note");
});

await test("chat assistant info: public facts only (never cost / sku / stock), current page product first", () => {
  const other = { ...PRODUCT, id: "p2", slug: "other", title_ar: "بنطلون", options: [] };
  const info = chat.buildProductInfo([other, PRODUCT, { ...PRODUCT, id: "p3", status: "draft", title_ar: "مسودة" }], "/p/o-shirt");
  assert.ok(info.includes("تيشيرت") && info.includes("300") && info.includes("اللون: أحمر / أزرق") && info.includes("قطن"));
  assert.ok(info.indexOf("تيشيرت") < info.indexOf("بنطلون"), "the page's product first");
  assert.ok(!info.includes("111") && !info.includes("SECRET-SKU") && !info.includes("مسودة"), "no cost, sku or drafts");
  assert.ok(info.length <= 3600);
});

await test("shipping text follows the product's own fee (0 = free even when the store's default is paid)", () => {
  const cfg = commerce.sanitizeShipping({ default_fee: 60, product_fees: { a: 0, b: 25 } });
  assert.equal(commerce.shippingHint(cfg).free, false, "store-wide: paid");
  assert.deepEqual(commerce.shippingHint(cfg, "a"), { free: true, text: "شحن مجاني" });
  assert.equal(commerce.shippingHint(cfg, "b").free, false);
  assert.ok(commerce.shippingHint(cfg, "b").text.includes("25"));
  assert.equal(commerce.shippingHint(cfg, "zzz").free, false);
});

finish();
