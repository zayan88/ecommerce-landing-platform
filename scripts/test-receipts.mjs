// Tests for payment receipts: a customer uploads the transfer screenshot, it rides with the order, only the admin can
// read it, and it is deleted as soon as the merchant decides the order (confirm / reject / delete).
// Usage: node scripts/test-receipts.mjs        (Node >= 22.15; exits 1 on any failure)
import assert from "node:assert/strict";
import { startTestKit } from "./lib/test-kit.mjs";

const { kvSeed, mod, call, request, test, finish } = await startTestKit({ env: { ORDERS_BACKEND: "d1" } });

const PRODUCT = {
  id: "prod-rc-1", title_ar: "منتج", slug: "rc-product", sku: "R1", base_price: 500, cost_price: 200, images: [], description_ar: "",
  stock_quantity: 10, status: "active", created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z", offers: [],
};
kvSeed("prod:prod-rc-1", PRODUCT);
kvSeed("custom_products_all", [PRODUCT]);

const { dbStore } = await mod("lib/db/store.ts");
const ordersRoute = await mod("app/api/orders/route.ts");
const settingsRoute = await mod("app/api/settings/route.ts");
const receiptsRoute = await mod("app/api/receipts/route.ts");
const receiptRoute = await mod("app/api/receipts/[id]/route.ts");
const { middleware } = await mod("middleware.ts");

const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x1a, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x4c, 1, 2, 3, 4]);
let ipSeq = 0;
const upload = async (bytes = WEBP, name = "r.webp", ip) => {
  const form = new FormData();
  if (bytes) form.set("file", new File([bytes], name, { type: "image/webp" }));
  const req = request("/api/receipts", { method: "POST", headers: { "cf-connecting-ip": ip || `10.5.0.${++ipSeq}` } });
  const res = await receiptsRoute.POST(new (req.constructor)(new Request(req.url, { method: "POST", body: form, headers: req.headers })));
  return { status: res.status, body: await res.json() };
};
const view = (id, admin = true) => receiptRoute.GET(request(`/api/receipts/${id}`, { admin }), { params: { id } });

let phoneSeq = 0;
const place = (over) =>
  call(ordersRoute.POST, "/api/orders", {
    method: "POST",
    headers: { "cf-connecting-ip": `10.6.0.${++ipSeq}` },
    body: {
      customer_name: "منى علي", customer_phone: "0115570" + String(1000 + ++phoneSeq), governorate: "الجيزة", address: "٥ شارع الهرم بجوار المسجد",
      product_id: "prod-rc-1", landing_page_slug: "rc-product", quantity: 1, payment_method: "vodafone_cash", ...over,
    },
  });
const patch = (id, body) => call(ordersRoute.PATCH, `/api/orders?id=${id}`, { method: "PATCH", admin: true, body });

for (const backend of ["d1", "kv"]) {
  process.env.ORDERS_BACKEND = backend;
  const tag = `[${backend}] `;
  await call(settingsRoute.POST, "/api/settings", { method: "POST", admin: true, body: { payment_methods: { vodafone_cash: { enabled: true, number: "01012345678" } } } });

  await test(tag + "upload: real images only, size capped, no file refused; the route is public but reading is admin-only", async () => {
    const ok = await upload();
    assert.equal(ok.status, 200);
    assert.match(ok.body.id, /^[a-f0-9]{20}$/);
    assert.equal((await upload(new TextEncoder().encode("<script>alert(1)</script> not an image"))).status, 415);
    assert.equal((await upload(new Uint8Array(900_000).fill(1))).status, 413);
    assert.equal((await upload(null)).status, 400);
    assert.notEqual(middleware(request("/api/receipts", { method: "POST" })).status, 401, "customers can upload");
    assert.equal(middleware(request(`/api/receipts/${ok.body.id}`)).status, 401, "anonymous cannot read");
    assert.equal((await view(ok.body.id, false)).status, 401);
    const got = await view(ok.body.id);
    assert.equal(got.status, 200);
    assert.equal(got.headers.get("content-type"), "image/webp");
    assert.match(got.headers.get("cache-control"), /no-store/);
  });

  await test(tag + "the order carries the receipt id; a made-up id, or a cash order, carries none", async () => {
    const up = await upload();
    const r = await place({ payment_receipt: up.body.id });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal((await dbStore.getOrder(r.body.order.id)).tracking.payment.receipt_id, up.body.id);
    const fake = await place({ payment_receipt: "0123456789abcdef0123" });
    assert.equal((await dbStore.getOrder(fake.body.order.id)).tracking.payment.receipt_id, undefined);
    const cod = await place({ payment_method: "cod", payment_receipt: up.body.id });
    assert.equal((await dbStore.getOrder(cod.body.order.id)).tracking?.payment, undefined);
    const bad = await place({ payment_receipt: "../../etc" });
    assert.equal(bad.status, 400);
  });

  await test(tag + "an undecided (pending) order keeps its image through unrelated edits", async () => {
    const up = await upload();
    const r = await place({ payment_receipt: up.body.id });
    await patch(r.body.order.id, { notes: "ملاحظة" });
    assert.equal((await view(up.body.id)).status, 200);
  });

  await test(tag + "confirming the order deletes the image for good (and says so on the order)", async () => {
    const up = await upload();
    const r = await place({ payment_receipt: up.body.id });
    assert.equal((await patch(r.body.order.id, { action: "confirm_payment" })).body.success, true);
    assert.equal((await view(up.body.id)).status, 404);
    const order = await dbStore.getOrder(r.body.order.id);
    assert.equal(order.tracking.payment.receipt_id, undefined);
    assert.ok(order.tracking.payment.receipt_deleted_at);
    assert.equal(order.tracking.payment.status, "paid", "the rest of the payment record is kept");
  });

  await test(tag + "reject_payment cancels the order, marks the payment rejected and deletes the image; a paid one cannot be rejected", async () => {
    const up = await upload();
    const r = await place({ payment_receipt: up.body.id });
    const rej = await patch(r.body.order.id, { action: "reject_payment" });
    assert.equal(rej.body.success, true);
    assert.equal((await view(up.body.id)).status, 404);
    const order = await dbStore.getOrder(r.body.order.id);
    assert.equal(order.status, "cancelled");
    assert.equal(order.tracking.payment.status, "rejected");
    const r2 = await place({});
    await patch(r2.body.order.id, { action: "confirm_payment" });
    assert.equal((await patch(r2.body.order.id, { action: "reject_payment" })).status, 400);
  });

  await test(tag + "rejecting (cancelling) or moving the order on deletes the image", async () => {
    const a = await upload();
    const ra = await place({ payment_receipt: a.body.id });
    await dbStore.updateOrderStatus(ra.body.order.id, "cancelled");
    assert.equal((await view(a.body.id)).status, 404);
    const b = await upload();
    const rb = await place({ payment_receipt: b.body.id });
    await dbStore.updateOrderStatus(rb.body.order.id, "confirmed");
    assert.equal((await view(b.body.id)).status, 404);
  });

  await test(tag + "deleting the order deletes its image", async () => {
    const up = await upload();
    const r = await place({ payment_receipt: up.body.id });
    await dbStore.deleteOrder(r.body.order.id);
    assert.equal((await view(up.body.id)).status, 404);
  });

  await test(tag + "uploads are rate limited per address", async () => {
    let last;
    for (let i = 0; i < 8; i++) last = await upload(WEBP, "r.webp", `10.77.${backend === "d1" ? 1 : 2}.1`);
    assert.equal(last.status, 429);
    assert.equal((await upload(WEBP, "r.webp", "10.77.9.9")).status, 200);
  });
}

await test("security: junk uploads that no order picked up are purged after 3 hours, attached ones stay", async () => {
  process.env.ORDERS_BACKEND = "d1";
  const repo = await mod("lib/db/receipts-repo.ts");
  const T0 = Date.now();
  const junk = await repo.saveReceipt(WEBP, "webp", T0);
  const attachedId = await repo.saveReceipt(WEBP, "webp", T0);
  const r = await place({ payment_receipt: attachedId });
  assert.equal(r.status, 200);
  // a later upload triggers the purge: 4 hours after the first two
  await repo.saveReceipt(WEBP, "webp", T0 + 4 * 60 * 60 * 1000);
  assert.equal(await repo.receiptExists(junk), false, "the unattached one is gone");
  assert.equal(await repo.receiptExists(attachedId), true, "the one an order carries is kept");
});

await finish();
