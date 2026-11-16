// Tests for manual payment methods (Vodafone Cash / InstaPay): settings, brand exposure, checkout orders,
// and the merchant's "transfer received" confirmation, on the D1 and the KV order backends.
// Usage: node scripts/test-payments-manual.mjs        (Node >= 22.15; exits 1 on any failure)
import assert from "node:assert/strict";
import { startTestKit } from "./lib/test-kit.mjs";

const { kvSeed, mod, call, request, test, finish } = await startTestKit({ env: { ORDERS_BACKEND: "d1" } });

const PRODUCT = {
  id: "prod-pay-1", title_ar: "منتج دفع", slug: "pay-product", sku: "P1", base_price: 500, cost_price: 200, images: [], description_ar: "",
  stock_quantity: 10, status: "active", created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z", offers: [],
};
kvSeed("prod:prod-pay-1", PRODUCT);
kvSeed("custom_products_all", [PRODUCT]);

const { dbStore } = await mod("lib/db/store.ts");
const payMod = await mod("lib/payments.ts");
const ordersRoute = await mod("app/api/orders/route.ts");
const settingsRoute = await mod("app/api/settings/route.ts");
const { middleware } = await mod("middleware.ts");

let phoneSeq = 0;
const body = (over = {}) => ({
  customer_name: "منى علي", customer_phone: "0115560" + String(1000 + ++phoneSeq), governorate: "الجيزة", address: "٥ شارع الهرم بجوار المسجد",
  product_id: "prod-pay-1", landing_page_slug: "pay-product", quantity: 1, payment_method: "cod", ...over,
});
let ipSeq = 0;
const place = (over) =>
  call(ordersRoute.POST, "/api/orders", { method: "POST", body: body(over), headers: { "cf-connecting-ip": `10.0.0.${++ipSeq}` } });
const save = (b) => call(settingsRoute.POST, "/api/settings", { method: "POST", admin: true, body: b });
const confirm = (id, admin = true) => call(ordersRoute.PATCH, `/api/orders?id=${id}`, { method: "PATCH", admin, body: { action: "confirm_payment" } });

for (const backend of ["d1", "kv"]) {
  process.env.ORDERS_BACKEND = backend;
  const tag = `[${backend}] `;
  await save({ payment_methods: { vodafone_cash: { enabled: false, number: "" }, instapay: { enabled: false, address: "" } } });

  await test(tag + "transfer methods are refused until the merchant enables them", async () => {
    const r = await place({ payment_method: "vodafone_cash" });
    assert.equal(r.status, 400);
    assert.match(r.body.error, /مش متاحة/);
  });

  await test(tag + "settings: invalid number / address rejected when enabled; valid ones saved", async () => {
    assert.equal((await save({ payment_methods: { vodafone_cash: { enabled: true, number: "123" } } })).status, 400);
    assert.equal((await save({ payment_methods: { instapay: { enabled: true, address: "not valid!" } } })).status, 400);
    const ok = await save({
      payment_methods: {
        vodafone_cash: { enabled: true, number: "٠١٠١٢٣٤٥٦٧٨", holder: "محمد أحمد" },
        instapay: { enabled: true, address: "shop.name@instapay", holder: "<b>x</b>" },
      },
    });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.settings.payment_methods.vodafone_cash.number, "01012345678", "Arabic digits normalised");
    assert.equal(ok.body.settings.payment_methods.instapay.address, "shop.name@instapay");
  });

  await test(tag + "the public view exposes only enabled methods (number + holder), nothing else", async () => {
    const pub = payMod.publicPayments((await dbStore.getSettings()).payment_methods);
    assert.deepEqual(Object.keys(pub).sort(), ["instapay", "vodafone_cash"]);
    assert.equal(pub.vodafone_cash.number, "01012345678");
    assert.deepEqual(Object.keys(pub.vodafone_cash).sort(), ["holder", "number"]);
    assert.equal(payMod.publicPayments({ vodafone_cash: { enabled: false, number: "01012345678" } }).vodafone_cash, undefined);
    assert.deepEqual(payMod.publicPayments(undefined), {});
  });

  await test(tag + "an order paid by transfer is stored with its reference, awaiting confirmation; the amount comes from the server", async () => {
    const r = await place({ payment_method: "vodafone_cash", payment_reference: "ref-4821", total_amount: 1 });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    const order = await dbStore.getOrder(r.body.order.id);
    assert.equal(order.payment_method, "vodafone_cash");
    assert.equal(order.tracking.payment.status, "awaiting");
    assert.equal(order.tracking.payment.reference, "ref-4821");
    assert.equal(order.final_amount, 500, "client amount ignored");
  });

  await test(tag + "cash on delivery orders carry no payment record", async () => {
    const r = await place({});
    assert.equal(r.status, 200);
    assert.equal((await dbStore.getOrder(r.body.order.id)).tracking?.payment, undefined);
  });

  await test(tag + "confirming the transfer is admin-only, marks it paid and confirms a pending order", async () => {
    const r = await place({ payment_method: "instapay" });
    const id = r.body.order.id;
    assert.equal(middleware(request(`/api/orders?id=${id}`, { method: "PATCH" })).status, 401);
    const done = await confirm(id);
    assert.equal(done.body.success, true);
    const order = await dbStore.getOrder(id);
    assert.equal(order.tracking.payment.status, "paid");
    assert.ok(order.tracking.payment.confirmed_at);
    assert.equal(order.status, "confirmed");
  });

  await test(tag + "confirming a cash-on-delivery order is refused", async () => {
    const r = await place({});
    const res = await confirm(r.body.order.id);
    assert.equal(res.status, 400);
  });

  await test(tag + "an unknown payment method is rejected by validation", async () => {
    const r = await place({ payment_method: "bitcoin" });
    assert.equal(r.status, 400);
  });
}

await finish();
