// Tests for the cheap admin orders UI: the "pulse" endpoint, server-side pagination of GET /api/orders,
// the CSV export paging helper and the targeted order lookups that replaced full-list loads.
// Harness: scripts/lib/test-kit.mjs (D1 emulator in memory + counting KV emulator, no new dependencies).
// Usage: node scripts/test-orders-admin.mjs        (Node >= 22.15; exits 1 on any failure)
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { startTestKit, src } from "./lib/test-kit.mjs";

const { kv, kvReset, kvSeed, sql, run, mod, call, request, test, quiet, finish } = await startTestKit({ env: { ORDERS_BACKEND: "d1" } });

const { dbStore, ORDERS_TOTAL_CAP } = await mod("lib/db/store.ts");
const repoMod = await mod("lib/db/orders-repo.ts");
const client = await mod("lib/admin/orders-client.ts");
const ordersRoute = await mod("app/api/orders/route.ts");
const pulseRoute = await mod("app/api/admin/orders-pulse/route.ts");
const repo = repoMod.getOrdersRepo();

const PRODUCT = {
  id: "prod-test-1", title_ar: "منتج اختبار", slug: "test-product", sku: "T1", base_price: 500, cost_price: 200,
  images: [], description_ar: "", stock_quantity: 10, status: "active", created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z", offers: [],
};
kvSeed("prod:prod-test-1", PRODUCT);
kvSeed("custom_products_all", [PRODUCT]);

let seq = 0;
/** A stored order, created `minutesAgo` minutes ago (deterministic ordering). */
const makeOrder = (over = {}, minutesAgo = 0) => {
  const n = ++seq;
  const at = new Date(Date.UTC(2026, 10, 10, 12, 0, 0) - minutesAgo * 60000 + n).toISOString();
  return {
    id: `ord-t-${String(n).padStart(5, "0")}`, order_number: `EG-261110-${String(n).padStart(4, "0")}`, landing_page_slug: "test-product",
    product_id: "prod-test-1", customer_name: `عميل ${n}`, customer_phone: "0101" + String(1000000 + n), governorate: "القاهرة", city: "مدينة نصر",
    address: "شارع الاختبار", notes: "", quantity: 1, unit_price: 500, total_amount: 500, shipping_fee: 0, discount_amount: 0, final_amount: 500,
    currency: "EGP", status: "pending", payment_method: "cod", safqa_status: "not_synced", created_at: at, updated_at: at, ...over,
  };
};
const seed = async (count, over = () => ({}), minutesAgo = (i) => i) => {
  const orders = Array.from({ length: count }, (_, i) => makeOrder(over(i), minutesAgo(i)));
  const outcome = await repo.importOrders(orders);
  assert.equal(Object.values(outcome).filter((o) => o === "inserted").length, count);
  return orders;
};
const plan = (text, ...params) => sql("EXPLAIN QUERY PLAN " + text, ...params).map((r) => r.detail).join(" | ");
const getOrders = (query) => call(ordersRoute.GET, "/api/orders" + query, { admin: true });
const getPulse = (query = "", admin = true) => call(pulseRoute.GET, "/api/admin/orders-pulse" + query, { admin });

// ───────────── pulse ─────────────
await test("pulse is admin-only: 401 without a session, and the middleware allow-list does not expose it", async () => {
  const anon = await getPulse("", false);
  assert.equal(anon.status, 401);
  assert.equal(anon.body.success, false);
  const { middleware } = await mod("middleware.ts");
  assert.equal(middleware(request("/api/admin/orders-pulse")).status, 401);
  assert.equal((await getPulse()).status, 200);
});

await test("pulse on an empty store: no latest order, zero counts, 60 s interval", async () => {
  const { body } = await getPulse();
  assert.deepEqual(
    { supported: body.supported, backend: body.backend, latest: body.latest_created_at, count: body.count, pending: body.pending_count, interval: body.poll_interval_sec },
    { supported: true, backend: "d1", latest: null, count: 0, pending: 0, interval: 60 }
  );
});

let seeded;
await test("pulse: first call returns count / latest / pending; with ?since only the orders created after it are counted", async () => {
  seeded = await seed(60, (i) => ({ status: i % 3 === 0 ? "confirmed" : "pending", governorate: i % 2 ? "الجيزة" : "القاهرة" }));
  const newest = seeded[0];
  const first = (await getPulse()).body;
  assert.equal(first.count, 60);
  assert.equal(first.count_capped, false);
  assert.equal(first.latest_created_at, newest.created_at);
  assert.equal(first.latest_created_ms, Date.parse(newest.created_at));
  assert.equal(first.pending_count, 40);
  assert.equal(first.new_count, 0);

  const idle = (await getPulse("?since=" + first.latest_created_ms)).body;
  assert.equal(idle.new_count, 0, "nothing new since the latest order");
  assert.equal(idle.count, null, "the total is not recounted on later pulses");

  const created = await dbStore.createOrder({
    landing_page_slug: "test-product", product_id: "prod-test-1", customer_name: "طلب جديد", customer_phone: "01099990001", governorate: "القاهرة",
    address: "عنوان", quantity: 1, unit_price: 500, total_amount: 500, shipping_fee: 0, discount_amount: 0, final_amount: 500, payment_method: "cod",
  });
  const after = (await getPulse("?since=" + first.latest_created_ms)).body;
  assert.equal(after.new_count, 1);
  assert.equal(after.latest_created_at, created.created_at);
  assert.equal(after.pending_count, 41);
  await dbStore.updateOrderStatus(created.id, "confirmed");
  assert.equal((await getPulse("?since=" + after.latest_created_ms)).body.pending_count, 40);
  // hostile / malformed `since` is ignored, never reaches SQL text
  const weird = await getPulse("?since=" + encodeURIComponent("1; DROP TABLE orders"));
  assert.equal(weird.status, 200);
  assert.equal(weird.body.count, 61);
});

await test("pulse cost: ONE D1 batch, zero KV operations, and every statement is answered from an index", async () => {
  const d1Mod = await mod("lib/db/d1.ts");
  const calls = { query: 0, batch: 0, statements: 0 };
  const real = d1Mod.getD1Client();
  const counting = repoMod.createD1OrdersRepo({
    query: (...a) => { calls.query++; return real.query(...a); },
    batch: (s) => { calls.batch++; calls.statements += s.length; return real.batch(s); },
  });
  await counting.pulse(Date.now() - 1000);
  assert.deepEqual(calls, { query: 0, batch: 1, statements: 3 });
  kvReset();
  await getPulse("?since=1");
  assert.deepEqual({ get: kv.get, put: kv.put, list: kv.list, delete: kv.delete }, { get: 0, put: 0, list: 0, delete: 0 });

  const latest = plan("SELECT created_at, created_ms FROM orders WHERE store_id = ? ORDER BY created_ms DESC LIMIT 1", "default");
  assert.match(latest, /USING INDEX orders_created_idx/);
  assert.doesNotMatch(latest, /TEMP B-TREE/);
  assert.match(plan("SELECT COUNT(*) AS n FROM (SELECT 1 FROM orders WHERE store_id = ? AND status = 'pending' LIMIT ?)", "default", 201), /COVERING INDEX orders_status_idx/);
  assert.match(plan("SELECT COUNT(*) AS n FROM (SELECT 1 FROM orders WHERE store_id = ? AND created_ms > ? LIMIT ?)", "default", 1, 500), /COVERING INDEX orders_created_idx/);
});

await test("pulse bounds: the pending count stops at 200 (capped flag), so a big backlog cannot inflate the rows read", async () => {
  await seed(230, () => ({ status: "pending" }), (i) => 1000 + i);
  const body = (await getPulse()).body;
  assert.equal(body.pending_count, repoMod.PULSE_PENDING_CAP);
  assert.equal(body.pending_capped, true);
  assert.equal(body.count, 291);
  run("DELETE FROM orders WHERE created_ms < ?", Date.parse(seeded[59].created_at));
  assert.equal((await getPulse()).body.pending_capped, false);
});

await test("pulse on the KV backend: reports unsupported with a 5-minute interval and performs NO KV operation", async () => {
  process.env.ORDERS_BACKEND = "kv";
  try {
    kvReset();
    const { status, body } = await getPulse();
    assert.equal(status, 200);
    assert.deepEqual({ supported: body.supported, backend: body.backend, interval: body.poll_interval_sec }, { supported: false, backend: "kv", interval: 300 });
    assert.deepEqual({ get: kv.get, put: kv.put, list: kv.list }, { get: 0, put: 0, list: 0 });
  } finally {
    process.env.ORDERS_BACKEND = "d1";
  }
});

// ───────────── pagination ─────────────
await test("pagination: limit/offset pages are disjoint, ordered newest first, with total and has_more", async () => {
  const p1 = (await getOrders("?limit=25&offset=0")).body;
  assert.equal(p1.orders.length, 25);
  assert.deepEqual({ total: p1.total, capped: p1.total_capped, more: p1.has_more, limit: p1.limit, offset: p1.offset }, { total: 61, capped: false, more: true, limit: 25, offset: 0 });
  const p2 = (await getOrders("?limit=25&offset=25")).body;
  const p3 = (await getOrders("?limit=25&offset=50")).body;
  assert.equal(p3.orders.length, 11);
  assert.equal(p3.has_more, false);
  assert.equal(p3.total, 61);
  const ids = [...p1.orders, ...p2.orders, ...p3.orders].map((o) => o.id);
  assert.equal(new Set(ids).size, 61, "no order appears on two pages");
  const times = [...p1.orders, ...p2.orders, ...p3.orders].map((o) => Date.parse(o.created_at));
  assert.deepEqual(times, [...times].sort((a, b) => b - a));
  assert.ok(p1.orders[0].product?.title_ar, "list pages carry the product relation for display");
  const beyond = (await getOrders("?limit=25&offset=500")).body;
  assert.deepEqual({ n: beyond.orders.length, more: beyond.has_more }, { n: 0, more: false });
});

await test("pagination: total=0 skips the COUNT on page flips; a text search never counts", async () => {
  const flip = (await getOrders("?limit=25&offset=25&total=0")).body;
  assert.equal(flip.total, null);
  assert.equal(flip.has_more, true);
  const last = (await getOrders("?limit=25&offset=50&total=0")).body;
  assert.equal(last.total, 61, "the last page knows the total without counting");
  const search = (await getOrders("?limit=5&q=" + encodeURIComponent("عميل"))).body;
  assert.equal(search.orders.length, 5);
  assert.equal(search.total, null);
  assert.equal(search.has_more, true);
});

await test("pagination: filters (status, governorate, date range) are applied by the API and reflected in the total", async () => {
  const confirmed = (await getOrders("?limit=50&status=confirmed")).body;
  assert.equal(confirmed.total, 21);
  assert.ok(confirmed.orders.every((o) => o.status === "confirmed"));
  const giza = (await getOrders("?limit=10&gov=" + encodeURIComponent("الجيزة"))).body;
  assert.equal(giza.total, 30);
  assert.equal(giza.orders.length, 10);
  assert.ok(giza.orders.every((o) => o.governorate === "الجيزة"));
  const both = (await getOrders("?limit=50&status=pending&gov=" + encodeURIComponent("الجيزة"))).body;
  assert.equal(both.total, sql("SELECT COUNT(*) AS n FROM orders WHERE status = 'pending' AND governorate = 'الجيزة'")[0].n);
  assert.equal((await getOrders("?limit=50&from=2026-11-10&to=2026-11-10")).body.total, 60);
  assert.equal((await getOrders("?limit=50&from=2026-11-11&to=2026-11-11")).body.total, 0);
  // the client helper builds exactly these URLs
  assert.equal(
    client.ordersPageUrl({ status: "pending", search: " x ", governorate: "الجيزة", from: "2026-11-10", to: "bad" }, { page: 2, pageSize: 25, withTotal: false }),
    "/api/orders?status=pending&q=x&gov=" + encodeURIComponent("الجيزة") + "&from=2026-11-10&limit=25&offset=50&total=0"
  );
  assert.equal(client.ordersPageUrl({ status: "all" }, { page: 0, pageSize: 50 }), "/api/orders?limit=50&offset=0");
});

await test("pagination: the page size is clamped (100, or 1000 with export=1) and the capped COUNT stops early", async () => {
  await seed(120, () => ({ status: "shipped" }), (i) => 5000 + i);
  assert.equal((await getOrders("?limit=5000")).body.orders.length, 100);
  const exp = (await getOrders("?limit=5000&export=1&total=0")).body;
  assert.equal(exp.orders.length, 181);
  assert.equal(exp.orders[0].product, undefined, "export pages do not carry relations");
  assert.deepEqual(await repo.countOrdersCapped({}, 50), { count: 50, capped: true });
  assert.deepEqual(await repo.countOrdersCapped({ status: "shipped" }, 500), { count: 120, capped: false });
  assert.equal(ORDERS_TOTAL_CAP, 5000);
  // hostile paging values never reach SQL text
  const hostile = await getOrders("?limit=" + encodeURIComponent("5; DROP TABLE orders") + "&offset=-1");
  assert.equal(hostile.status, 200);
  assert.equal(sql("SELECT COUNT(*) AS n FROM orders")[0].n, 181);
});

await test("pagination cost on d1: a page costs zero KV writes / lists; a full list (no limit) still works for compatibility", async () => {
  kvReset();
  await getOrders("?limit=25");
  assert.deepEqual({ put: kv.put, list: kv.list }, { put: 0, list: 0 });
  const full = (await getOrders("")).body;
  assert.equal(full.orders.length, 181);
  assert.equal(full.total, undefined);
});

await test("export: every order of the current filter is fetched page by page, sequentially; a cap is reported", async () => {
  const urls = [];
  let inFlight = 0, maxInFlight = 0;
  const fetchFn = async (url) => {
    urls.push(url);
    maxInFlight = Math.max(maxInFlight, ++inFlight);
    const res = await ordersRoute.GET(request(url, { admin: true }));
    inFlight--;
    return res;
  };
  const all = await client.fetchOrdersForExport(fetchFn, {}, { pageSize: 50 });
  assert.equal(all.orders.length, 181);
  assert.equal(new Set(all.orders.map((o) => o.id)).size, 181);
  assert.deepEqual({ capped: all.capped, requests: all.requests, maxInFlight }, { capped: false, requests: 4, maxInFlight: 1 });
  assert.ok(urls.every((u) => u.includes("export=1") && u.includes("total=0")));
  const filtered = await client.fetchOrdersForExport(fetchFn, { status: "shipped" }, { pageSize: 50 });
  assert.equal(filtered.orders.length, 120);
  assert.ok(filtered.orders.every((o) => o.status === "shipped"));
  const capped = await client.fetchOrdersForExport(fetchFn, {}, { pageSize: 50, maxRows: 120 });
  assert.deepEqual({ n: capped.orders.length, capped: capped.capped, requests: capped.requests }, { n: 120, capped: true, requests: 3 });
  const exact = await client.fetchOrdersForExport(fetchFn, { status: "shipped" }, { pageSize: 60, maxRows: 120 });
  assert.deepEqual({ n: exact.orders.length, capped: exact.capped }, { n: 120, capped: false });
  await assert.rejects(client.fetchOrdersForExport(async () => ({ ok: false, json: async () => ({ success: false, error: "x" }) }), {}));
  assert.equal(client.EXPORT_MAX_ROWS, 5000);
});

await test("pulse timing helper: base interval, exponential back-off on failures, 15-minute ceiling", async () => {
  assert.equal(client.nextPulseDelayMs(60000, 0), 60000);
  assert.equal(client.nextPulseDelayMs(60000, 1), 120000);
  assert.equal(client.nextPulseDelayMs(60000, 3), 480000);
  assert.equal(client.nextPulseDelayMs(60000, 10), 900000);
  assert.equal(client.nextPulseDelayMs(1000, 0), 30000, "never faster than 30 s whatever the server says");
});

await test("orders page: no 15 s full-list polling; polls the pulse only while the tab is visible", async () => {
  const page = fs.readFileSync(path.join(src, "app/(admin)/admin/orders/page.tsx"), "utf8");
  assert.doesNotMatch(page, /setInterval/);
  assert.doesNotMatch(page, /15000/);
  assert.match(page, /\/api\/admin\/orders-pulse/);
  assert.match(page, /visibilityState/);
  assert.match(page, /visibilitychange/);
  assert.match(page, /fetchOrdersForExport/);
});

// ───────────── targeted lookups (public chat, Safka webhook, Safka sync) ─────────────
await test("lookups: by order number / id / Safka serial / exact phone use indexes and return only the matches", async () => {
  const target = seeded[5];
  await dbStore.updateSafqaInfo(target.id, { safqa_invoice_id: "SFK-777", safqa_status: "pending" });
  const byNumber = await dbStore.findOrdersForLookup({ keys: [target.order_number.toLowerCase()] });
  assert.deepEqual(byNumber.map((o) => o.id), [target.id]);
  assert.deepEqual((await dbStore.findOrdersForLookup({ keys: ["SFK-777"] })).map((o) => o.id), [target.id]);
  assert.deepEqual((await dbStore.findOrdersForLookup({ phone: "+2" + target.customer_phone })).map((o) => o.id), [target.id]);
  assert.deepEqual(await dbStore.findOrdersForLookup({ keys: [], phone: null }), []);
  assert.deepEqual(await dbStore.findOrdersForLookup({ keys: ["' OR 1=1 --"], phone: "x' OR '1'='1" }), []);
  const known = await dbStore.findKnownOrderTokens(["SFK-777", seeded[7].order_number, "SFK-unknown"]);
  assert.deepEqual([...known].sort(), ["SFK-777", seeded[7].order_number].sort());

  const p = plan(
    "SELECT order_number AS t FROM orders WHERE store_id = ? AND order_number IN (?) UNION ALL SELECT safqa_invoice_id AS t FROM orders WHERE store_id = ? AND safqa_invoice_id IN (?)",
    "default", "a", "default", "a"
  );
  assert.match(p, /orders_number_uq/);
  assert.match(p, /orders_safqa_idx/);
  assert.doesNotMatch(p, /SCAN orders(?! USING)/);
  assert.match(plan("SELECT * FROM orders WHERE store_id = ? AND customer_phone IN (?, ?)", "default", "a", "b"), /orders_phone_idx/);
});

await test("KV backend (default) keeps working: paginated list with total from one listing; lookups fall back to the list", async () => {
  process.env.ORDERS_BACKEND = "kv";
  try {
    await quiet(async () => {
      const made = [];
      for (let i = 0; i < 7; i++) {
        made.push(await dbStore.createOrder({
          landing_page_slug: "test-product", product_id: "prod-test-1", customer_name: "عميل KV " + i, customer_phone: "0122000000" + i, governorate: "القاهرة",
          address: "عنوان", quantity: 1, unit_price: 500, total_amount: 500, shipping_fee: 0, discount_amount: 0, final_amount: 500, payment_method: "cod",
        }));
      }
      await getOrders("?limit=3"); // first listing in an isolate may run its one-time legacy-store bookkeeping
      kvReset();
      const page = (await getOrders("?limit=3&offset=3")).body;
      assert.deepEqual({ n: page.orders.length, total: page.total, more: page.has_more }, { n: 3, total: 7, more: true });
      assert.equal(kv.put, 0);
      assert.ok(kv.list <= 2, `one page costs at most the listing itself (got ${kv.list} list ops)`);
      const found = await dbStore.findOrdersForLookup({ keys: [made[2].order_number] });
      assert.deepEqual(found.map((o) => o.id), [made[2].id]);
    });
  } finally {
    process.env.ORDERS_BACKEND = "d1";
  }
});

await finish();
