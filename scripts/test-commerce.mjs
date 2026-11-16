// Tests for shipping fee / minimum order / coupons / popup / downsell (src/lib/commerce.ts, /api/orders,
// /api/coupons/check, /api/settings) on the D1 and the KV order backends.
// Usage: node scripts/test-commerce.mjs        (Node >= 22.15; exits 1 on any failure)
import assert from "node:assert/strict";
import { startTestKit } from "./lib/test-kit.mjs";

const { kvSeed, mod, call, request, test, finish } = await startTestKit({ env: { ORDERS_BACKEND: "d1" } });

const OFFER_FREE = { id: "off-free", product_id: "prod-c1", title_ar: "قطعتين", quantity: 2, price: 900, original_price: 1000, free_shipping: true, sort_order: 2 };
const OFFER_PAID = { id: "off-paid", product_id: "prod-c1", title_ar: "قطعة", quantity: 1, price: 500, free_shipping: false, sort_order: 1 };
const PRODUCT = {
  id: "prod-c1", title_ar: "منتج", slug: "c-product", sku: "C1", base_price: 500, cost_price: 200, images: [], description_ar: "",
  stock_quantity: 10, status: "active", created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z", offers: [OFFER_FREE, OFFER_PAID],
};
const PRODUCT2 = { ...PRODUCT, id: "prod-c2", slug: "c-product-2", sku: "C2", offers: [] };
kvSeed("prod:prod-c1", PRODUCT);
kvSeed("prod:prod-c2", PRODUCT2);
kvSeed("custom_products_all", [PRODUCT, PRODUCT2]);

const { dbStore } = await mod("lib/db/store.ts");
const lib = await mod("lib/commerce.ts");
const ordersRoute = await mod("app/api/orders/route.ts");
const settingsRoute = await mod("app/api/settings/route.ts");
const checkRoute = await mod("app/api/coupons/check/route.ts");
const { middleware } = await mod("middleware.ts");

let phoneSeq = 0;
let ipSeq = 0;
const place = (over = {}) =>
  call(ordersRoute.POST, "/api/orders", {
    method: "POST",
    headers: { "cf-connecting-ip": `10.1.0.${++ipSeq}` },
    body: {
      customer_name: "منى علي", customer_phone: "0115570" + String(1000 + ++phoneSeq), governorate: "الجيزة", address: "٥ شارع الهرم بجوار المسجد",
      product_id: "prod-c1", landing_page_slug: "c-product", quantity: 1, payment_method: "cod", ...over,
    },
  });
const save = (b) => call(settingsRoute.POST, "/api/settings", { method: "POST", admin: true, body: b });
const check = (b) => call(checkRoute.POST, "/api/coupons/check", { method: "POST", body: b });
const reset = () => save({ shipping_config: {}, coupons: [] });

await test("pure rules: shipping order of precedence, coupon math and limits", () => {
  const cfg = { default_fee: 60, free_over: 1000, min_order: 0, product_fees: { p1: 20, p0: 0 } };
  assert.equal(lib.computeShipping(cfg, { total: 500, productId: "x" }), 60);
  assert.equal(lib.computeShipping(cfg, { total: 500, productId: "p1" }), 20, "product override");
  assert.equal(lib.computeShipping(cfg, { total: 500, productId: "p0" }), 0, "override 0 = free");
  assert.equal(lib.computeShipping(cfg, { total: 1000, productId: "p1" }), 0, "free over");
  assert.equal(lib.computeShipping(cfg, { total: 500, productId: "x", offerFree: true }), 0, "free offer");
  const coupons = lib.sanitizeCoupons([{ code: "a50", type: "fixed", value: 50 }, { code: "P10", type: "percent", value: 10, min_order: 200 }]);
  assert.equal(lib.applyCoupon(coupons, "A50", 500).discount, 50);
  assert.equal(lib.applyCoupon(coupons, " p10 ", 500).discount, 50, "case/space-insensitive");
  assert.equal(lib.applyCoupon(coupons, "P10", 100).ok, false, "below the coupon minimum");
  assert.equal(lib.applyCoupon(coupons, "A50", 30).discount, 30, "never more than the subtotal");
  assert.equal(lib.applyCoupon(coupons, "NOPE", 500).ok, false);
});

await test("sanitizers drop invalid input", () => {
  const c = lib.sanitizeCoupons([{ code: "bad code!", value: 5 }, { code: "OK1", type: "percent", value: 500 }, { code: "ok1", value: 5 }, { code: "ZERO", value: 0 }]);
  assert.deepEqual(c.map((x) => [x.code, x.value]), [["OK1", 100]], "percent capped at 100, duplicates and zero dropped");
  const s = lib.sanitizeShipping({ default_fee: -5, free_over: "abc", product_fees: { "ok-id": 10, "bad id": 5, x: "" } });
  assert.deepEqual(s, { default_fee: 0, free_over: 0, min_order: 0, product_fees: { "ok-id": 10 } });
  const p = lib.sanitizePopup({ enabled: true, image_url: "javascript:alert(1)", title: "<b>x</b>", delay_seconds: 9999 });
  assert.equal(p.image_url, "");
  assert.equal(p.delay_seconds, 300);
  assert.equal(lib.sanitizeDownsell({ coupon_code: "ghost" }, c).coupon_code, "", "downsell coupon must exist");
});

await test("the public view never contains the coupon list, only the downsell code", () => {
  const settings = {
    coupons: [{ code: "SECRET10", type: "percent", value: 10, min_order: 0, enabled: true }, { code: "SHOWN50", type: "fixed", value: 50, min_order: 0, enabled: true }],
    downsell: { on_exit: true, auto: false, delay_seconds: 30, coupon_code: "SHOWN50", message: "خد خصم" },
    popup: { enabled: true, title: "عرض", body: "", button_text: "ok", button_target: "checkout", delay_seconds: 3, image_url: "", frequency: "session" },
  };
  const pub = lib.publicCommerce(settings);
  const json = JSON.stringify(pub);
  assert.ok(!json.includes("SECRET10"));
  assert.equal(pub.downsell.code, "SHOWN50");
  assert.ok(pub.popup);
  assert.equal(lib.publicCommerce({ ...settings, coupons: [{ ...settings.coupons[1], enabled: false }] }).downsell, undefined, "a disabled coupon is not offered");
  assert.deepEqual(lib.publicCommerce(undefined).shipping, lib.DEFAULT_SHIPPING);
});

for (const backend of ["d1", "kv"]) {
  process.env.ORDERS_BACKEND = backend;
  const tag = `[${backend}] `;
  await reset();

  await test(tag + "defaults keep today's behaviour: free shipping, amount = price", async () => {
    const r = await place();
    assert.equal(r.status, 200, JSON.stringify(r.body));
    const o = await dbStore.getOrder(r.body.order.id);
    assert.equal(o.shipping_fee, 0);
    assert.equal(o.final_amount, 500);
  });

  await test(tag + "a shipping fee is added by the server; a free-shipping offer and the free-over threshold remove it", async () => {
    assert.equal((await save({ shipping_config: { default_fee: 60, free_over: 800 } })).status, 200);
    let o = await dbStore.getOrder((await place({ offer_id: "off-paid" })).body.order.id);
    assert.equal(o.shipping_fee, 60);
    assert.equal(o.final_amount, 560);
    o = await dbStore.getOrder((await place({ offer_id: "off-free" })).body.order.id);
    assert.equal(o.shipping_fee, 0, "offer flagged free shipping");
    assert.equal(o.final_amount, 900);
    o = await dbStore.getOrder((await place({ product_id: "prod-c2" })).body.order.id);
    assert.equal(o.shipping_fee, 60, "no offer: base price 500 is under the free-over threshold");
  });

  await test(tag + "per-product fee overrides the store fee", async () => {
    await save({ shipping_config: { default_fee: 60, product_fees: { "prod-c2": 25 } } });
    const o = await dbStore.getOrder((await place({ product_id: "prod-c2" })).body.order.id);
    assert.equal(o.shipping_fee, 25);
    assert.equal(o.final_amount, 525);
  });

  await test(tag + "minimum order is enforced server-side", async () => {
    await save({ shipping_config: { min_order: 600 } });
    const r = await place({ offer_id: "off-paid" });
    assert.equal(r.status, 400);
    assert.match(r.body.error, /600/);
    assert.equal((await place({ offer_id: "off-free" })).status, 200);
  });

  await test(tag + "coupons: applied by the server, recorded on the order, client amounts ignored", async () => {
    await save({ shipping_config: { default_fee: 40 }, coupons: [{ code: "SAVE50", type: "fixed", value: 50, min_order: 300 }, { code: "OFF", type: "percent", value: 10, enabled: false }] });
    const r = await place({ offer_id: "off-paid", coupon_code: "save50", total_amount: 1, final_amount: 1 });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    const o = await dbStore.getOrder(r.body.order.id);
    assert.equal(o.final_amount, 500 - 50 + 40);
    assert.equal(o.tracking.coupon.code, "SAVE50");
    assert.equal(o.tracking.coupon.amount, 50);
    assert.equal((await place({ coupon_code: "OFF" })).status, 400, "disabled coupon");
    assert.equal((await place({ coupon_code: "GHOST" })).status, 400, "unknown coupon");
  });

  await test(tag + "free-over uses the total after the coupon", async () => {
    await save({ shipping_config: { default_fee: 40, free_over: 500 }, coupons: [{ code: "SAVE50", type: "fixed", value: 50 }] });
    const o = await dbStore.getOrder((await place({ offer_id: "off-paid", coupon_code: "SAVE50" })).body.order.id);
    assert.equal(o.shipping_fee, 40, "500 - 50 = 450 is under the 500 threshold");
    assert.equal(o.final_amount, 490);
  });
}

await test("coupon conditions: products, quantity, dates, usage limit, free-shipping kind", () => {
  const day = (d) => Date.parse(d + "T12:00:00+02:00");
  const cs = lib.sanitizeCoupons([
    { code: "ONLYP1", kind: "discount", type: "fixed", value: 30, product_ids: ["p1"] },
    { code: "QTY2", kind: "discount", type: "percent", value: 10, min_qty: 2 },
    { code: "WINDOW", kind: "discount", type: "fixed", value: 20, starts_at: "2026-06-10", ends_at: "2026-06-20" },
    { code: "LIMIT1", kind: "discount", type: "fixed", value: 10, max_uses: 1 },
    { code: "SHIPFREE", kind: "free_shipping" },
  ]);
  assert.equal(cs.length, 5, "a free-shipping coupon needs no value");
  assert.equal(lib.applyCoupon(cs, "ONLYP1", { subtotal: 500, productId: "p1" }).discount, 30);
  assert.equal(lib.applyCoupon(cs, "ONLYP1", { subtotal: 500, productId: "p2" }).ok, false);
  assert.equal(lib.applyCoupon(cs, "QTY2", { subtotal: 500, quantity: 1 }).ok, false);
  assert.equal(lib.applyCoupon(cs, "QTY2", { subtotal: 500, quantity: 2 }).discount, 50);
  assert.equal(lib.applyCoupon(cs, "WINDOW", { subtotal: 500, now: day("2026-06-09") }).ok, false, "before the start day");
  assert.equal(lib.applyCoupon(cs, "WINDOW", { subtotal: 500, now: day("2026-06-20") }).ok, true, "the end day is included");
  assert.equal(lib.applyCoupon(cs, "WINDOW", { subtotal: 500, now: day("2026-06-21") }).ok, false, "after the end day");
  assert.equal(lib.applyCoupon(cs, "LIMIT1", { subtotal: 500, usage: { LIMIT1: 1 } }).ok, false, "used up");
  assert.equal(lib.applyCoupon(cs, "LIMIT1", { subtotal: 500, usage: {} }).ok, true);
  const sf = lib.applyCoupon(cs, "SHIPFREE", { subtotal: 500 });
  assert.equal(sf.ok, true);
  assert.equal(sf.free_shipping, true);
  assert.equal(sf.discount, 0);
});

await test("automatic discounts: the best one wins; a public flag tells the page to ask the server", () => {
  const cs = lib.sanitizeCoupons([
    { code: "AUTO10", kind: "discount", type: "percent", value: 10, auto: true, min_order: 400 },
    { code: "AUTO50", kind: "discount", type: "fixed", value: 50, auto: true, min_order: 400 },
    { code: "TYPED", kind: "discount", type: "fixed", value: 99 },
  ]);
  assert.equal(lib.bestAutoCoupon(cs, { subtotal: 600 }).code, "AUTO10", "10% of 600 = 60 beats a flat 50");
  assert.equal(lib.bestAutoCoupon(cs, { subtotal: 450 }).code, "AUTO50", "10% of 450 = 45 loses to a flat 50");
  assert.equal(lib.bestAutoCoupon(cs, { subtotal: 300 }).ok, false, "below the minimum");
  assert.equal(lib.bestAutoCoupon([cs[2]], { subtotal: 600 }).ok, false, "a coupon that needs a code is never automatic");
  assert.equal(lib.publicCommerce({ coupons: cs }).has_auto, true);
  assert.equal(lib.publicCommerce({ coupons: [cs[2]] }).has_auto, undefined);
});

await test("orders: automatic discount, free-shipping coupon, usage count and limit work end to end", async () => {
  process.env.ORDERS_BACKEND = "d1";
  await save({
    shipping_config: { default_fee: 60 },
    coupons: [
      { code: "AUTO10", kind: "discount", type: "percent", value: 10, auto: true, min_order: 400 },
      { code: "FREESHIP", kind: "free_shipping" },
      { code: "LIM1", kind: "discount", type: "fixed", value: 25, max_uses: 1 },
    ],
  });
  // no code typed: the automatic 10% applies by itself (500 -> 450), shipping 60 still charged
  let o = await dbStore.getOrder((await place({ offer_id: "off-paid" })).body.order.id);
  assert.equal(o.final_amount, 450 + 60);
  assert.equal(o.tracking.coupon.auto, true);
  // a typed coupon replaces the automatic one: free shipping, no discount
  o = await dbStore.getOrder((await place({ offer_id: "off-paid", coupon_code: "freeship" })).body.order.id);
  assert.equal(o.shipping_fee, 0);
  assert.equal(o.final_amount, 500);
  // usage limit: the second use is refused and the count is recorded
  assert.equal((await place({ offer_id: "off-paid", coupon_code: "LIM1" })).status, 200);
  const again = await place({ offer_id: "off-paid", coupon_code: "LIM1" });
  assert.equal(again.status, 400);
  assert.match(again.body.error, /خلص/);
  assert.equal((await dbStore.getSettings()).coupon_usage.LIM1, 1);
  // the browser can never write the counter
  await save({ coupon_usage: { LIM1: 0 } });
  assert.equal((await dbStore.getSettings()).coupon_usage.LIM1, 1);
  // the check endpoint with no code reports the automatic discount
  const c = await check({ product_id: "prod-c1", offer_id: "off-paid" });
  assert.equal(c.body.valid, true);
  assert.equal(c.body.auto, true);
  assert.equal(c.body.final, 450 + 60);
});

await test("coupon check endpoint: public, answers only for the code sent, and mirrors the order rules", async () => {
  assert.notEqual(middleware(request("/api/coupons/check", { method: "POST" })).status, 401);
  await save({ shipping_config: { default_fee: 40 }, coupons: [{ code: "SAVE50", type: "fixed", value: 50 }, { code: "SECRET", type: "fixed", value: 99 }] });
  const ok = await check({ code: "save50", product_id: "prod-c1", offer_id: "off-paid" });
  assert.equal(ok.body.valid, true);
  assert.equal(ok.body.discount, 50);
  assert.equal(ok.body.shipping, 40);
  assert.equal(ok.body.final, 490);
  assert.ok(!JSON.stringify(ok.body).includes("SECRET"));
  const bad = await check({ code: "NOPE", product_id: "prod-c1" });
  assert.equal(bad.body.valid, false);
  assert.equal(bad.body.final, 540, "the total without a coupon still includes shipping");
  assert.equal((await check({ code: "A" })).status, 400);
  assert.equal((await check({ code: "A", product_id: "ghost" })).status, 404);
});

await test("settings API: downsell must point at an existing coupon; the popup image must be a safe URL", async () => {
  const r = await save({ coupons: [{ code: "REAL", type: "fixed", value: 10 }], downsell: { auto: true, coupon_code: "FAKE", delay_seconds: 5 }, popup: { enabled: true, image_url: "javascript:x" } });
  assert.equal(r.status, 200);
  assert.equal(r.body.settings.downsell.coupon_code, "");
  assert.equal(r.body.settings.popup.image_url, "");
  const r2 = await save({ downsell: { auto: true, coupon_code: "real", delay_seconds: 5 } });
  assert.equal(r2.body.settings.downsell.coupon_code, "REAL");
});

await finish();
