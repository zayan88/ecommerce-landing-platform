// Tests for the Bosta shipping integration (src/lib/shipping, /api/admin/shipping, /api/shipping/bosta-webhook)
// against a LOCAL mock of the Bosta API (no real network, no real key).
// Usage: node scripts/test-shipping-bosta.mjs        (Node >= 22.15; exits 1 on any failure)
import http from "node:http";
import assert from "node:assert/strict";
import { startTestKit } from "./lib/test-kit.mjs";

// ---- mock Bosta ----
const seen = []; // requests the mock received
let mode = "ok"; // ok | reject | slow-cities
const mock = http.createServer((req, res) => {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    const entry = { method: req.method, url: req.url, auth: req.headers.authorization, body: raw ? JSON.parse(raw) : null };
    seen.push(entry);
    res.setHeader("Content-Type", "application/json");
    if (req.method === "GET" && req.url.startsWith("/api/v2/cities")) {
      return res.end(JSON.stringify({ data: [{ _id: "c1", name: "Cairo", nameAr: "القاهرة", code: "EG-01" }, { _id: "c2", name: "Al Qalyubia", nameAr: "القليوبية" }] }));
    }
    if (req.method === "POST" && req.url.startsWith("/api/v2/deliveries")) {
      if (mode === "reject") {
        res.statusCode = 400;
        return res.end(JSON.stringify({ success: false, message: "City Not Found", errorCode: 3001, data: null }));
      }
      return res.end(JSON.stringify({ success: true, data: { _id: "bos-" + seen.length, trackingNumber: 70000 + seen.length } }));
    }
    res.statusCode = 404;
    res.end("{}");
  });
});
await new Promise((r) => mock.listen(0, "127.0.0.1", r));
process.env.BOSTA_API_BASE = `http://127.0.0.1:${mock.address().port}`;

const { sql, mod, call, request, test, finish } = await startTestKit({ env: { ORDERS_BACKEND: "d1" } });
const { dbStore } = await mod("lib/db/store.ts");
const bosta = await mod("lib/shipping/bosta.ts");
const shipRoute = await mod("app/api/admin/shipping/route.ts");
const hookRoute = await mod("app/api/shipping/bosta-webhook/route.ts");
const settingsRoute = await mod("app/api/settings/route.ts");
const { middleware } = await mod("middleware.ts");
const repoMod = await mod("lib/db/orders-repo.ts");
const repo = repoMod.getOrdersRepo();

const KEY = "bosta-test-key-0123456789";
const HOOK_KEY = "hook-secret-0123456789";
let n = 0;
const mkOrder = (over = {}) => {
  n++;
  const at = new Date(Date.UTC(2026, 10, 10, 12, 0, n)).toISOString();
  return {
    id: `ord-s-${n}`, order_number: `EG-261110-90${String(n).padStart(2, "0")}`, landing_page_slug: "p", product_id: "prod-x",
    customer_name: "أحمد محمد علي", customer_phone: "01011112222", governorate: "القاهرة", city: "مدينة نصر", address: "شارع التحرير عمارة 5",
    notes: "", quantity: 2, unit_price: 300, total_amount: 600, shipping_fee: 0, discount_amount: 0, final_amount: 600, currency: "EGP",
    status: "pending", payment_method: "cod", safqa_status: "not_synced", created_at: at, updated_at: at, ...over,
  };
};
const seed = async (...orders) => {
  const out = await repo.importOrders(orders);
  assert.ok(Object.values(out).every((v) => v === "inserted"));
  return orders;
};
const sendShip = (ids, admin = true) => call(shipRoute.POST, "/api/admin/shipping", { method: "POST", admin, body: { order_ids: ids } });
const hook = (body, auth) => call(hookRoute.POST, "/api/shipping/bosta-webhook", { method: "POST", body, headers: auth ? { authorization: auth } : {} });
const saveSettings = (body) => call(settingsRoute.POST, "/api/settings", { method: "POST", admin: true, body });

await test("pure helpers: governorate -> English name, city matching from Bosta's list, payload shape", () => {
  assert.equal(bosta.governorateEnglish("الدقهلية (المنصورة)"), "Dakahlia");
  assert.equal(bosta.governorateEnglish("القاهرة"), "Cairo");
  const list = [{ name: "Al Qalyubia", nameAr: "القليوبية" }, { name: "Cairo", nameAr: "القاهرة" }];
  assert.equal(bosta.matchCity(list, "القليوبية"), "Al Qalyubia");
  assert.equal(bosta.matchCity(list, "Cairo"), "Cairo");
  assert.equal(bosta.matchCity(list, "أسوان"), null);
  const p = bosta.buildBostaPayload(mkOrder({ id: "x", order_number: "EG-1" }), "Cairo", { locationId: "loc12345", webhookUrl: "https://s/h", webhookKey: "k" });
  assert.equal(p.type, 10);
  assert.equal(p.cod, 600);
  assert.equal(p.businessReference, "EG-1");
  assert.deepEqual(p.receiver, { firstName: "أحمد", lastName: "محمد علي", phone: "01011112222" });
  assert.equal(p.dropOffAddress.city, "Cairo");
  assert.equal(p.businessLocationId, "loc12345");
  assert.deepEqual(p.webhookCustomHeaders, { Authorization: "k" });
});

await test("admin-only: sending needs a session; the webhook is the only public shipping route", async () => {
  assert.equal((await sendShip(["x"], false)).status, 401);
  assert.equal(middleware(request("/api/admin/shipping", { method: "POST" })).status, 401);
  assert.notEqual(middleware(request("/api/shipping/bosta-webhook", { method: "POST" })).status, 401);
  assert.equal(middleware(request("/api/shipping/bosta-webhook")).status, 401, "GET stays closed");
});

await test("no courier connected: sending is refused with a clear message", async () => {
  const r = await sendShip(["whatever"]);
  assert.equal(r.status, 400);
  assert.match(r.body.error, /مفيش شركة شحن/);
});

await test("settings: provider enum, key format, and the keys are masked on read", async () => {
  assert.equal((await saveSettings({ bosta_api_key: "has space" })).status, 400);
  assert.equal((await saveSettings({ bosta_location_id: "bad id!" })).status, 400);
  const ok = await saveSettings({ shipping_provider: "bosta", bosta_api_key: KEY, bosta_webhook_key: HOOK_KEY, bosta_location_id: "loc12345" });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.settings.shipping_provider, "bosta");
  assert.ok(!JSON.stringify(ok.body).includes(KEY), "api key never returned");
  assert.ok(!JSON.stringify(ok.body).includes(HOOK_KEY), "webhook key never returned");
  assert.equal((await saveSettings({ shipping_provider: "hacked" })).body.settings.shipping_provider, "bosta", "invalid provider ignored");
});

await test("sending an order creates a Bosta delivery, stores the tracking number and confirms the order", async () => {
  const [o] = await seed(mkOrder());
  seen.length = 0;
  const r = await sendShip([o.id]);
  assert.equal(r.body.sent, 1);
  assert.equal(r.body.results[0].ok, true);
  const post = seen.find((s) => s.method === "POST");
  assert.equal(post.auth, KEY, "raw key in the Authorization header");
  assert.equal(post.body.cod, 600);
  assert.equal(post.body.dropOffAddress.city, "Cairo", "city matched from Bosta's list");
  assert.equal(post.body.businessLocationId, "loc12345");
  assert.equal(post.body.webhookUrl, undefined, "no per-delivery webhook on a non-https origin (couriers need a public https URL)");
  assert.ok(!JSON.stringify(r.body).includes(KEY));
  const saved = await dbStore.getOrder(o.id);
  assert.match(saved.tracking.shipping.tracking_number, /^700\d+$/);
  assert.equal(saved.tracking.shipping.provider, "bosta");
  assert.equal(saved.status, "confirmed");
});

await test("sending the same order twice does not create a second delivery", async () => {
  const [o] = await seed(mkOrder());
  await sendShip([o.id]);
  seen.length = 0;
  const again = await sendShip([o.id]);
  assert.equal(again.body.results[0].skipped, true);
  assert.equal(seen.filter((s) => s.method === "POST").length, 0);
});

await test("Bosta errors come back as readable text and the order is NOT marked shipped", async () => {
  const [o] = await seed(mkOrder({ governorate: "أسوان" }));
  mode = "reject";
  const r = await sendShip([o.id]);
  mode = "ok";
  assert.equal(r.body.results[0].ok, false);
  assert.match(r.body.results[0].error, /3001/);
  assert.match(r.body.results[0].error, /City Not Found/);
  assert.ok(!JSON.stringify(r.body).includes(KEY));
  const saved = await dbStore.getOrder(o.id);
  assert.equal(saved.tracking?.shipping, undefined);
  assert.equal(saved.status, "pending");
});

await test("amounts over Bosta's 30,000 EGP COD limit are refused before any call", async () => {
  const [o] = await seed(mkOrder({ final_amount: 31000 }));
  seen.length = 0;
  const r = await sendShip([o.id]);
  assert.equal(r.body.results[0].ok, false);
  assert.match(r.body.results[0].error, /30,000/);
  assert.equal(seen.length, 0);
});

await test("cancelled / delivered orders are not sent", async () => {
  const [o] = await seed(mkOrder({ status: "cancelled" }));
  const r = await sendShip([o.id]);
  assert.equal(r.body.results[0].ok, false);
});

await test("webhook: refused without the key, with a wrong key; accepted with the right one", async () => {
  assert.equal((await hook({ state: 45 })).status, 401);
  assert.equal((await hook({ state: 45 }, "wrong")).status, 401);
  assert.equal((await hook({ state: 45 }, HOOK_KEY)).status, 200);
});

await test("webhook updates the shipment state and moves the order forward only", async () => {
  const [o] = await seed(mkOrder());
  await sendShip([o.id]);
  const tn = (await dbStore.getOrder(o.id)).tracking.shipping.tracking_number;
  await hook({ _id: "b", trackingNumber: tn, state: 21, businessReference: o.order_number }, HOOK_KEY);
  let cur = await dbStore.getOrder(o.id);
  assert.equal(cur.status, "shipped");
  assert.equal(cur.tracking.shipping.state, 21);
  await hook({ trackingNumber: tn, state: 45, businessReference: o.order_number }, HOOK_KEY);
  cur = await dbStore.getOrder(o.id);
  assert.equal(cur.status, "delivered");
  await hook({ trackingNumber: tn, state: 20, businessReference: o.order_number }, HOOK_KEY); // late, out-of-order event
  cur = await dbStore.getOrder(o.id);
  assert.equal(cur.status, "delivered", "a late event never reopens a delivered order");
  assert.equal(cur.tracking.shipping.state, 20, "but the courier's latest state is still recorded");
});

await test("webhook: a guessed order reference with a wrong tracking number changes nothing; unknown orders still answer 200", async () => {
  const [o] = await seed(mkOrder());
  await sendShip([o.id]);
  const r = await hook({ trackingNumber: 999999999, state: 45, businessReference: o.order_number }, HOOK_KEY);
  assert.equal(r.status, 200);
  assert.equal((await dbStore.getOrder(o.id)).status, "confirmed");
  assert.equal((await hook({ trackingNumber: 1, state: 45, businessReference: "NOPE-1" }, HOOK_KEY)).status, 200);
});

await test("webhook refuses everything when no webhook key is configured", async () => {
  await saveSettings({ bosta_webhook_key: "" });
  assert.equal((await hook({ state: 45 }, HOOK_KEY)).status, 503);
  await saveSettings({ bosta_webhook_key: HOOK_KEY });
});

mock.close();
await finish();
