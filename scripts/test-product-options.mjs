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

await test("order: a one-price product can be ordered in several pieces (price x pieces, capped at 10)", async () => {
  const P = { ...PRODUCT, id: "prod-o2", slug: "o-two", sku: "O2", options: [], offers: [{ id: "o2-one", product_id: "prod-o2", title_ar: "قطعة", quantity: 1, price: 200, original_price: 250, sort_order: 1 }] };
  kvSeed("prod:prod-o2", P);
  kvSeed("custom_products_all", [PRODUCT, P]);
  const three = await place({ product_id: "prod-o2", landing_page_slug: "o-two", offer_id: "o2-one", quantity: 3 });
  assert.equal(three.status, 200, JSON.stringify(three.body));
  assert.equal(three.body.order.final_amount, 600, "3 pieces x 200, shipping free");
  const noOffer = await place({ product_id: "prod-o2", landing_page_slug: "o-two", quantity: 2 });
  assert.equal(noOffer.status, 200);
  assert.equal(noOffer.body.order.final_amount, 600, "no offer id: base price (300) x 2 pieces");
  const many = await place({ product_id: "prod-o2", landing_page_slug: "o-two", offer_id: "o2-one", quantity: 11 });
  assert.equal(many.status, 400);
});

await test("swatches, the on/off switch and sold-out combinations", async () => {
  const o = opt.sanitizeProductOptions([{ name: "اللون", values: ["أحمر", "أزرق"], swatches: { "أحمر": "#FF0000", "أزرق": "javascript:x", "غريب": "#00ff00" } }]);
  assert.deepEqual(o[0].swatches, { "أحمر": "#ff0000" }, "only valid hex colors of existing values");
  assert.equal(opt.effectiveOptions({ options: PRODUCT.options, options_enabled: false }).length, 0);
  assert.equal(opt.effectiveOptions({ options: PRODUCT.options }).length, 2);
  const off = ["أحمر / M"];
  assert.ok(opt.formatOptionsNote(PRODUCT.options, { اللون: "أحمر", المقاس: "M" }, off).error, "a sold-out combination");
  assert.ok(!opt.formatOptionsNote(PRODUCT.options, { اللون: "أحمر", المقاس: "L" }, off).error);
  assert.equal(opt.valueHasStock(PRODUCT.options, off, { اللون: "أحمر" }, "المقاس", "M"), false);
  assert.equal(opt.valueHasStock(PRODUCT.options, off, { اللون: "أزرق" }, "المقاس", "M"), true);
  assert.equal(opt.allCombos(PRODUCT.options).length, 4);
  // through the order route
  const P = { ...PRODUCT, id: "prod-o3", slug: "o-three", sku: "O3", variants_off: ["أحمر / M"] };
  kvSeed("prod:prod-o3", P);
  kvSeed("custom_products_all", [PRODUCT, P]);
  const soldOut = await place({ product_id: "prod-o3", landing_page_slug: "o-three", options: { اللون: "أحمر", المقاس: "M" } });
  assert.equal(soldOut.status, 400);
  const fine = await place({ product_id: "prod-o3", landing_page_slug: "o-three", options: { اللون: "أحمر", المقاس: "L" } });
  assert.equal(fine.status, 200);
  const P2 = { ...PRODUCT, id: "prod-o4", slug: "o-four", sku: "O4", options_enabled: false };
  kvSeed("prod:prod-o4", P2);
  kvSeed("custom_products_all", [PRODUCT, P, P2]);
  const off2 = await place({ product_id: "prod-o4", landing_page_slug: "o-four" });
  assert.equal(off2.status, 200, "options switched off: the order needs no picks");
});

await test("a color only comes in its own sizes: picking a color drops a size it does not have", () => {
  const o = [{ name: "اللون", values: ["أحمر", "أزرق"] }, { name: "المقاس", values: ["S", "M", "L"] }];
  const off = ["أحمر / S", "أزرق / L"]; // red: M, L   blue: S, M
  assert.equal(opt.valueHasStock(o, off, { اللون: "أحمر" }, "المقاس", "S"), false);
  assert.equal(opt.valueHasStock(o, off, { اللون: "أزرق" }, "المقاس", "S"), true);
  let picks = opt.pickValue(o, off, {}, "المقاس", "L");
  picks = opt.pickValue(o, off, picks, "اللون", "أزرق");
  assert.deepEqual(picks, { اللون: "أزرق" }, "blue has no L: the size pick is dropped");
  picks = opt.pickValue(o, off, picks, "المقاس", "S");
  assert.deepEqual(picks, { اللون: "أزرق", المقاس: "S" });
});

finish();
