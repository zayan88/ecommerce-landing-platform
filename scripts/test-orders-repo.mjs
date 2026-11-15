// Tests for the D1 order data path (src/lib/db/orders-repo.ts + the dbStore / guard / stats / import
// code that uses it). No extra dependencies:
//   - D1  = scripts/dev-d1-server.mjs (node:sqlite, in-memory) with the real migrations applied;
//   - KV  = a small in-memory emulator in this file that COUNTS every operation (write-budget checks);
//   - the app's TypeScript is loaded as-is through a ~30-line module hook using the already installed
//     `typescript` package (transpile only, `@/` alias resolved to src/).
// Any outbound request that is not to 127.0.0.1 fails the run (no Telegram / Meta / Cloudflare calls).
// Usage: node scripts/test-orders-repo.mjs        (Node >= 22.15; exits 1 on any failure)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { registerHooks, createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { startDevD1Server } from "./dev-d1-server.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src");
const ts = createRequire(import.meta.url)("typescript");

// ───────────── TypeScript loader (test only) ─────────────
const TS_EXT = [".ts", ".tsx", "/index.ts", "/index.tsx"];
const findTs = (base) => TS_EXT.map((e) => base + e).find((f) => fs.existsSync(f)) || (/\.tsx?$/.test(base) && fs.existsSync(base) ? base : null);
registerHooks({
  resolve(specifier, context, next) {
    let [spec, query = ""] = specifier.split("?");
    if (/^next\/[a-z]+$/.test(spec)) spec = spec + ".js"; // next/server → next/server.js (bundler-style specifier)
    let base = null;
    if (spec.startsWith("@/")) base = path.join(src, spec.slice(2));
    else if (spec.startsWith(".") && context.parentURL?.startsWith("file:") && /\.tsx?(\?|$)/.test(context.parentURL)) {
      base = path.resolve(path.dirname(fileURLToPath(context.parentURL.split("?")[0])), spec);
    } else if (spec.startsWith("file:") && /\.tsx?$/.test(spec)) base = fileURLToPath(spec);
    const file = base && findTs(base);
    if (file) return { url: pathToFileURL(file).href + (query ? "?" + query : ""), shortCircuit: true };
    return next(spec === specifier.split("?")[0] ? specifier : spec, context);
  },
  load(url, context, next) {
    if (!/\.tsx?(\?|$)/.test(url)) return next(url, context);
    const fileName = fileURLToPath(url.split("?")[0]);
    const source = fs.readFileSync(fileName, "utf8");
    const out = ts.transpileModule(source, {
      fileName,
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    });
    return { format: "module", source: out.outputText, shortCircuit: true };
  },
});

// ───────────── Counting KV emulator (same REST subset as scripts/dev-kv-server.mjs) ─────────────
const kv = { store: new Map(), get: 0, put: 0, delete: 0, list: 0 };
const kvReset = () => { kv.get = kv.put = kv.delete = kv.list = 0; };
const kvSeed = (key, value, metadata) => kv.store.set(key, { value: JSON.stringify(value), metadata });
const kvServer = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const json = (code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };
  if (url.pathname === "/keys") {
    kv.list++;
    const prefix = url.searchParams.get("prefix") || "";
    const result = [...kv.store.entries()].filter(([k]) => k.startsWith(prefix)).sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([name, v]) => ({ name, metadata: v.metadata ?? undefined }));
    return json(200, { success: true, result, result_info: { cursor: "" } });
  }
  const key = decodeURIComponent(url.pathname.replace(/^\/values\//, ""));
  if (req.method === "GET") {
    kv.get++;
    if (!kv.store.has(key)) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200); return res.end(kv.store.get(key).value);
  }
  if (req.method === "DELETE") { kv.delete++; kv.store.delete(key); return json(200, { success: true }); }
  if (req.method === "PUT") {
    kv.put++;
    const chunks = []; for await (const c of req) chunks.push(c);
    const ct = req.headers["content-type"] || "";
    if (ct.startsWith("multipart/form-data")) {
      const form = await new Request("http://x/", { method: "POST", headers: { "content-type": ct }, body: Buffer.concat(chunks) }).formData();
      let metadata; try { metadata = JSON.parse(String(form.get("metadata") || "null")); } catch {}
      kv.store.set(key, { value: String(form.get("value") ?? ""), metadata });
    } else kv.store.set(key, { value: Buffer.concat(chunks).toString("utf8") });
    return json(200, { success: true });
  }
  json(405, { success: false });
});
await new Promise((r) => kvServer.listen(0, "127.0.0.1", r));

const d1 = await startDevD1Server({ port: 0, file: ":memory:", quiet: true });
const sql = (text, ...params) => d1.db.prepare(text).all(...params); // direct DB access for assertions / time travel
const countOrders = () => sql("SELECT COUNT(*) AS n FROM orders")[0].n;

// No outbound traffic except the two local emulators.
const realFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const u = String(typeof input === "string" || input instanceof URL ? input : input.url);
  if (!u.startsWith("http://127.0.0.1:")) throw new Error("unexpected outbound request to " + new URL(u).host);
  return realFetch(input, init);
};

for (const k of Object.keys(process.env)) {
  if (/^(CF_|NEXT_PUBLIC_SUPABASE|SUPABASE_|TELEGRAM_|META_|SAFKA_|SAFQA_|NEXT_PUBLIC_SAFKA|ORDERS_|STORE_ID|DEMO_MODE)/.test(k)) delete process.env[k];
}
process.env.KV_REST_BASE_URL = "http://127.0.0.1:" + kvServer.address().port;
process.env.D1_REST_BASE_URL = d1.url;
process.env.ORDERS_BACKEND = "d1";
process.env.ADMIN_PIN = "test-pin-000000";
process.env.AUTH_SECRET = "test-secret-0123456789abcdef0123456789";

const mod = (rel, query = "") => import(pathToFileURL(path.join(src, rel)).href + query);
const { dbStore } = await mod("lib/db/store.ts");
const repoMod = await mod("lib/db/orders-repo.ts");
const guard = await mod("lib/orders/guard.ts");
const guardIsolate2 = await mod("lib/orders/guard.ts", "?isolate=2"); // separate module instance = "another isolate"
const stats = await mod("lib/stats.ts");
const importer = await mod("lib/db/orders-import.ts");
const orderKv = await mod("lib/db/order-kv.ts");
const ordersRoute = await mod("app/api/orders/route.ts");
const importRoute = await mod("app/api/admin/orders-import/route.ts");
const { NextRequest } = await import("next/server.js");
const repo = repoMod.getOrdersRepo();

// ───────────── helpers ─────────────
const PRODUCT = {
  id: "prod-test-1", title_ar: "منتج اختبار", slug: "test-product", sku: "T1", base_price: 500, cost_price: 200,
  images: [], description_ar: "", stock_quantity: 10, status: "active", created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z",
  offers: [{ id: "off-2", product_id: "prod-test-1", title_ar: "قطعتان", quantity: 2, price: 900, original_price: 1000, sort_order: 2 }],
};
kvSeed("prod:prod-test-1", PRODUCT);
const PRODUCT2 = { ...PRODUCT, id: "prod-test-2", slug: "test-product-2", offers: [] };
kvSeed("prod:prod-test-2", PRODUCT2);
kvSeed("custom_products_all", [PRODUCT, PRODUCT2]);

let phoneSeq = 10000000;
const nextPhone = () => "010" + String(phoneSeq++);
const baseOrder = (over = {}) => ({
  landing_page_slug: "test-product", product_id: "prod-test-1", customer_name: "أحمد محمد", customer_phone: nextPhone(),
  governorate: "القاهرة", city: "مدينة نصر", address: "١٢ شارع الاختبار", notes: "", quantity: 1, unit_price: 500,
  total_amount: 500, shipping_fee: 0, discount_amount: 0, final_amount: 500, payment_method: "cod",
  tracking: { utm_source: "fb", event_id: "evt-" + phoneSeq, ip_address: "203.0.113.9" }, ...over,
});
/** The order flow of POST /api/orders (guard → rate limit → create → settle) against one guard instance. */
async function placeOrder(g, input, ip) {
  const slot = await g.beginOrder(g.orderDedupeKey(input.customer_phone, input.product_id));
  if (slot.existing) return { duplicate: true, order: slot.existing };
  const rate = await g.consumeOrderRateLimit(ip);
  if (!rate.allowed) { await slot.settle(null); return { limited: true }; }
  const created = await dbStore.createOrder(input);
  const snapshot = {
    id: created.id, order_number: created.order_number, customer_name: created.customer_name, customer_phone: created.customer_phone,
    final_amount: created.final_amount, shipping_fee: created.shipping_fee, governorate: created.governorate, address: created.address,
    landing_page_slug: created.landing_page_slug, event_id: input.tracking?.event_id || "",
  };
  await slot.settle(snapshot);
  return { duplicate: false, order: snapshot };
}
const postOrder = (body, ip) =>
  ordersRoute.POST(new NextRequest("http://localhost/api/orders", {
    method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", "cf-connecting-ip": ip },
  })).then(async (r) => ({ status: r.status, body: await r.json(), headers: r.headers }));
const formBody = (over = {}) => ({
  customer_name: "منى علي", customer_phone: nextPhone(), governorate: "الجيزة", address: "٥ شارع الهرم بجوار المسجد",
  product_id: "prod-test-1", landing_page_slug: "test-product", quantity: 1, payment_method: "cod", ...over,
});

const results = [];
async function test(name, fn) {
  try {
    await fn();
    results.push(true);
    console.log(`ok ${results.length} - ${name}`);
  } catch (e) {
    results.push(false);
    console.log(`not ok ${results.length} - ${name}\n    ${String(e?.stack || e).split("\n").slice(0, 6).join("\n    ")}`);
  }
}
const quiet = async (fn) => { // silence expected warnings from the code under test
  const saved = [console.warn, console.error, console.log];
  console.warn = console.error = console.log = () => {};
  try { return await fn(); } finally { [console.warn, console.error, console.log] = saved; }
};

// ───────────── tests ─────────────
await test("backend selection: default is kv, d1 only when ORDERS_BACKEND=d1", async () => {
  process.env.ORDERS_BACKEND = "";
  assert.equal(repoMod.ordersBackend(), "kv");
  process.env.ORDERS_BACKEND = "anything";
  assert.equal(repoMod.ordersBackend(), "kv");
  process.env.ORDERS_BACKEND = "D1";
  assert.equal(repoMod.ordersBackend(), "d1");
  process.env.ORDERS_BACKEND = "d1";
});

await test("migrations applied: all tables exist and every table has store_id NOT NULL DEFAULT 'default'", async () => {
  for (const t of ["orders", "order_status_history", "deleted_orders", "stats_daily", "order_dedupe", "rate_limits"]) {
    const col = sql(`PRAGMA table_info(${t})`).find((c) => c.name === "store_id");
    assert.ok(col, `${t}.store_id missing`);
    assert.equal(col.notnull, 1);
    assert.equal(col.dflt_value, "'default'");
  }
  const idx = sql("PRAGMA index_list(orders)").map((i) => i.name);
  for (const n of ["orders_number_uq", "orders_created_idx", "orders_status_idx", "orders_phone_idx", "orders_product_idx"]) assert.ok(idx.includes(n), n);
});

let first;
await test("create + get: every field round-trips, lookup by id and by order number, creation history row", async () => {
  const input = baseOrder({ customer_phone2: "01112223334", offer_id: "off-2", notes: "اتصل قبل التوصيل", quantity: 2, unit_price: 450, total_amount: 900, discount_amount: 100, final_amount: 900 });
  first = await dbStore.createOrder(input);
  assert.match(first.id, /^ord-\d{13}-[0-9a-f]{8}$/);
  assert.match(first.order_number, /^EG-\d{6}-\d{4}$/);
  const byId = await dbStore.getOrder(first.id);
  const byNumber = await dbStore.getOrder(first.order_number);
  assert.equal(byNumber.id, first.id);
  for (const k of ["customer_name", "customer_phone", "customer_phone2", "governorate", "city", "address", "notes", "offer_id", "landing_page_slug", "product_id"]) assert.equal(byId[k], input[k], k);
  for (const k of ["quantity", "unit_price", "total_amount", "discount_amount", "final_amount", "shipping_fee"]) assert.strictEqual(byId[k], input[k], k);
  assert.equal(byId.status, "pending");
  assert.equal(byId.currency, "EGP");
  assert.equal(byId.safqa_status, "not_synced");
  assert.equal(byId.created_at, first.created_at);
  assert.deepEqual(byId.tracking, input.tracking);
  assert.equal(byId.product?.id, "prod-test-1"); // relation re-attached for display, never stored
  assert.equal(sql("SELECT extra FROM orders WHERE id = ?", first.id)[0].extra, null);
  assert.deepEqual(await repo.getStatusHistory(first.id), [{ from_status: null, to_status: "pending", source: "create", changed_at: first.created_at }]);
  assert.equal(await dbStore.getOrder("ord-does-not-exist"), null);
});

await test("unique order number: a collision is rejected by the UNIQUE index and retried with a new number", async () => {
  const before = countOrders();
  const clash = { ...first, id: "ord-1700000000000-aaaaaaaa", product: undefined, landing_page: undefined };
  assert.equal(await repo.insertOrder(clash), false, "same order number must not insert");
  assert.equal(countOrders(), before);
  assert.equal(sql("SELECT COUNT(*) AS n FROM order_status_history WHERE order_id = ?", clash.id)[0].n, 0);
  const numbers = [first.order_number, first.order_number, "EG-991231-0001"];
  let calls = 0;
  const stored = await repo.insertOrderWithUniqueNumber(clash, () => numbers[calls++]);
  assert.equal(calls, 3);
  assert.equal(stored.order_number, "EG-991231-0001");
  assert.equal((await repo.getOrder(clash.id)).order_number, "EG-991231-0001");
  assert.equal(countOrders(), before + 1);
  const never = await repo.insertOrderWithUniqueNumber({ ...clash, id: "ord-1700000000001-bbbbbbbb" }, () => first.order_number, 4);
  assert.equal(never, null);
  assert.equal(countOrders(), before + 1);
});

await test("duplicate guard: same phone + product within 15 min returns the existing order; another product creates a new one", async () => {
  const input = baseOrder();
  const a = await placeOrder(guard, input, "198.51.100.1");
  assert.equal(a.duplicate, false);
  const before = countOrders();
  const again = await placeOrder(guardIsolate2, { ...input, customer_name: "اسم مختلف" }, "198.51.100.2"); // other isolate: D1 only
  assert.equal(again.duplicate, true);
  assert.deepEqual(again.order, a.order);
  assert.equal(countOrders(), before);
  const sameIsolate = await placeOrder(guard, input, "198.51.100.1");
  assert.deepEqual(sameIsolate.order, a.order);
  const other = await placeOrder(guardIsolate2, { ...input, product_id: "prod-test-2" }, "198.51.100.2");
  assert.equal(other.duplicate, false);
  assert.notEqual(other.order.id, a.order.id);
  assert.equal(countOrders(), before + 1);
  // 16 minutes later the same phone + product is a new order again
  sql("UPDATE order_dedupe SET created_ms = created_ms - ? WHERE order_id = ? RETURNING order_id", 16 * 60 * 1000, a.order.id);
  const freshIsolate = await mod("lib/orders/guard.ts", "?isolate=3"); // holds no in-memory copy of the old entry
  const later = await placeOrder(freshIsolate, input, "198.51.100.2");
  assert.equal(later.duplicate, false);
  assert.equal(countOrders(), before + 2);
  // no raw phone number in the guard tables
  assert.equal(sql("SELECT COUNT(*) AS n FROM order_dedupe WHERE instr(dedupe_key, ?) > 0", input.customer_phone)[0].n, 0);
});

await test("two parallel identical creates (two isolates) produce ONE order and both get it", async () => {
  const input = baseOrder();
  const before = countOrders();
  const [r1, r2] = await Promise.all([placeOrder(guard, input, "198.51.100.3"), placeOrder(guardIsolate2, input, "198.51.100.4")]);
  assert.equal(countOrders(), before + 1);
  assert.equal(r1.order.id, r2.order.id);
  assert.equal(r1.order.order_number, r2.order.order_number);
  assert.equal([r1, r2].filter((r) => r.duplicate).length, 1);
});

await test("atomic claim: of 8 concurrent claims exactly one wins; an abandoned claim is released / expires", async () => {
  const key = "order_dedupe:test-claim";
  const now = Date.now();
  const outcomes = await Promise.all(Array.from({ length: 8 }, (_, i) => repo.claimDedupe(key, "claim-" + i, now, 900000, 20000)));
  assert.equal(outcomes.filter((o) => o.state === "claimed").length, 1);
  assert.equal(outcomes.filter((o) => o.state === "pending").length, 7);
  const winner = "claim-" + outcomes.findIndex((o) => o.state === "claimed");
  await repo.releaseDedupe(key, "claim-not-the-owner");
  assert.equal((await repo.claimDedupe(key, "x1", now, 900000, 20000)).state, "pending", "only the owner can release");
  await repo.releaseDedupe(key, winner);
  assert.equal((await repo.claimDedupe(key, "x2", now, 900000, 20000)).state, "claimed");
  assert.equal((await repo.claimDedupe(key, "x3", now + 19000, 900000, 20000)).state, "pending");
  assert.equal((await repo.claimDedupe(key, "x4", now + 21000, 900000, 20000)).state, "claimed", "crashed owner: claim expires after 20s");
});

await test("rate limit: 5 orders / 10 min per IP, 6th is refused with Retry-After, window expiry resets, other IPs unaffected", async () => {
  const ip = "192.0.2.50";
  for (let i = 0; i < 5; i++) assert.equal((await guard.consumeOrderRateLimit(ip)).allowed, true, `attempt ${i + 1}`);
  const sixth = await guardIsolate2.consumeOrderRateLimit(ip); // counted across isolates
  assert.equal(sixth.allowed, false);
  assert.ok(sixth.retryAfterSec >= 590 && sixth.retryAfterSec <= 600, "retry-after " + sixth.retryAfterSec);
  assert.equal((await guard.consumeOrderRateLimit(ip)).allowed, false);
  assert.equal((await guard.consumeOrderRateLimit("192.0.2.51")).allowed, true);
  assert.equal((await guard.consumeOrderRateLimit("")).allowed, true); // unknown IP: allowed, as before
  const key = guard.orderRateKey(ip);
  assert.ok(!key.includes(ip), "IP is hashed");
  sql("UPDATE rate_limits SET window_start = window_start - ? WHERE ip_key = ? RETURNING ip_key", 10 * 60 * 1000 + 1000, key);
  assert.equal((await guard.consumeOrderRateLimit(ip)).allowed, true);
  assert.equal(sql("SELECT count FROM rate_limits WHERE ip_key = ?", key)[0].count, 1);
});

await test("status update writes one history row per real change; field edits; Safka info", async () => {
  const o = await dbStore.createOrder(baseOrder());
  assert.equal(await dbStore.updateOrderStatus(o.id, "confirmed"), true);
  assert.equal(await dbStore.updateOrderStatus(o.id, "confirmed"), true); // no change → no new history row
  const edited = await dbStore.updateOrder(o.order_number, { status: "shipped", address: "عنوان جديد", quantity: 3, final_amount: 1200 });
  assert.equal(edited.id, o.id);
  assert.equal(edited.address, "عنوان جديد");
  assert.strictEqual(edited.quantity, 3);
  assert.equal(edited.order_number, o.order_number);
  assert.ok(edited.updated_at >= o.updated_at);
  const history = await repo.getStatusHistory(o.id);
  assert.deepEqual(history.map((h) => [h.from_status, h.to_status, h.source]), [[null, "pending", "create"], ["pending", "confirmed", "status"], ["confirmed", "shipped", "admin"]]);
  assert.equal(await dbStore.updateSafqaInfo(o.id, { safqa_invoice_id: "SFK-777", safqa_status: "paid", safqa_response: { ok: true, n: 1 } }), true);
  const after = await dbStore.getOrder(o.id);
  assert.equal(after.safqa_invoice_id, "SFK-777");
  assert.deepEqual(after.safqa_response, { ok: true, n: 1 });
  assert.ok(after.safqa_synced_at);
  assert.equal(after.status, "shipped");
  assert.equal(await dbStore.updateOrder("ord-missing", { status: "cancelled" }), null);
  assert.equal(await dbStore.updateOrderStatus("ord-missing", "cancelled"), false);
});

await test("list: status / landing page / product / governorate / date / search filters, ordering and pagination", async () => {
  const day = (d) => `2025-03-${String(d).padStart(2, "0")}T10:00:00.000Z`;
  const seeded = [];
  for (let i = 1; i <= 12; i++) {
    seeded.push({
      id: `ord-seed-${String(i).padStart(2, "0")}`, order_number: `EG-250301-${String(i).padStart(4, "0")}`,
      landing_page_slug: i % 2 ? "lp-a" : "lp-b", product_id: i % 3 ? "prod-test-1" : "prod-test-2",
      customer_name: i === 7 ? "Sara Hassan" : "عميل " + i, customer_phone: "0125550" + String(1000 + i), governorate: i <= 4 ? "أسوان" : "الإسكندرية",
      address: "عنوان", quantity: 1, unit_price: 100, total_amount: 100, shipping_fee: 0, discount_amount: 0, final_amount: 100 + i,
      currency: "EGP", status: i % 4 === 0 ? "cancelled" : "delivered", payment_method: "cod", safqa_status: "not_synced",
      created_at: day(i), updated_at: day(i),
    });
  }
  for (const o of seeded) assert.equal(await repo.insertOrder(o), true);
  const inRange = { created_from: Date.parse(day(1)), created_to: Date.parse(day(12)) };
  const ids = (list) => list.map((o) => o.id);
  const all = await dbStore.getOrders(inRange);
  assert.equal(all.length, 12);
  assert.deepEqual(ids(all), ids(seeded).reverse(), "newest first");
  assert.equal((await dbStore.getOrders({ ...inRange, status: "cancelled" })).length, 3);
  assert.equal((await dbStore.getOrders({ ...inRange, landing_page_slug: "lp-a" })).length, 6);
  assert.equal((await dbStore.getOrders({ ...inRange, product_id: "prod-test-2" })).length, 4);
  assert.equal((await dbStore.getOrders({ ...inRange, governorate: "أسوان" })).length, 4);
  assert.equal((await dbStore.getOrders({ ...inRange, governorate: "أسوان", status: "cancelled" })).length, 1);
  assert.deepEqual(ids(await dbStore.getOrders({ created_from: Date.parse(day(3)), created_to: Date.parse(day(5)) })), ["ord-seed-05", "ord-seed-04", "ord-seed-03"]);
  assert.deepEqual(ids(await dbStore.getOrders({ ...inRange, search: "sara" })), ["ord-seed-07"]); // case-insensitive
  assert.deepEqual(ids(await dbStore.getOrders({ ...inRange, search: "01255501003" })), ["ord-seed-03"]);
  assert.deepEqual(ids(await dbStore.getOrders({ ...inRange, search: "eg-250301-0009" })), ["ord-seed-09"]);
  assert.equal((await dbStore.getOrders({ ...inRange, search: "الإسكندرية" })).length, 8);
  assert.equal((await dbStore.getOrders({ ...inRange, search: "عميل 1" })).length, 4); // 1, 10, 11, 12
  const p1 = await dbStore.getOrders({ ...inRange, limit: 5, offset: 0 });
  const p2 = await dbStore.getOrders({ ...inRange, limit: 5, offset: 5 });
  const p3 = await dbStore.getOrders({ ...inRange, limit: 5, offset: 10 });
  assert.deepEqual([p1.length, p2.length, p3.length], [5, 5, 2]);
  assert.deepEqual([...ids(p1), ...ids(p2), ...ids(p3)], ids(all), "pages are disjoint and complete");
  assert.equal(await repo.countOrders({ ...inRange, status: "delivered" }), 9);
  assert.deepEqual(ids(await repo.listOrders({ ...inRange, sort: "final_amount", dir: "asc", limit: 2 })), ["ord-seed-01", "ord-seed-02"]);
  assert.equal(all[0].product?.id, "prod-test-2"); // relations attached on lists too
});

await test("SQL injection attempts in search / filters / sort / ids / patch keys are inert; hostile text is stored literally", async () => {
  const before = countOrders();
  const attacks = ["' OR 1=1 --", "'; DROP TABLE orders; --", "%", "_", "\\", "\" OR \"\"=\"", "x') OR 1=1 --", "' UNION SELECT * FROM rate_limits --", "\u0000'"];
  for (const a of attacks) {
    assert.equal((await dbStore.getOrders({ search: a })).length, 0, "search: " + a);
    assert.equal((await dbStore.getOrders({ status: a })).length, 0, "status: " + a);
    assert.equal((await dbStore.getOrders({ governorate: a, landing_page_slug: a, product_id: a })).length, 0, "filters: " + a);
    assert.equal(await dbStore.getOrder(a), null, "getOrder: " + a);
    assert.equal(await dbStore.updateOrder(a, { status: "cancelled" }), null, "update: " + a);
    assert.equal((await repo.consumeRateLimit(a, Date.now(), 600000, 5)).count, 1);
  }
  const sorted = await repo.listOrders({ sort: "created_at; DROP TABLE orders", dir: "desc; DELETE FROM orders", limit: 3 });
  assert.equal(sorted.length, 3);
  const weird = await repo.listOrders({ limit: "5; DROP TABLE orders", offset: "1 OR 1=1" });
  assert.ok(weird.length <= 50);
  const target = await dbStore.createOrder(baseOrder({ customer_name: "Robert'); DROP TABLE orders;--", address: "' OR '1'='1", governorate: "100% _real_ \\ \"quoted\"" }));
  const stored = await dbStore.getOrder(target.id);
  assert.equal(stored.customer_name, "Robert'); DROP TABLE orders;--");
  assert.equal(stored.address, "' OR '1'='1");
  assert.equal(stored.governorate, "100% _real_ \\ \"quoted\"");
  assert.deepEqual((await dbStore.getOrders({ search: "DROP TABLE orders" })).map((o) => o.id), [target.id]);
  assert.equal((await dbStore.getOrders({ search: "100% _real_" })).length, 1); // % and _ are literal, not wildcards
  assert.equal((await dbStore.getOrders({ search: "100_ _real_" })).length, 0);
  // hostile column names in a patch are ignored (whitelist); identity columns cannot be changed
  const patched = await repo.updateOrder(target.id, { "status = 'cancelled' --": "x", "notes = (SELECT 1); --": "y", id: "hacked", order_number: "EG-000000-0000", store_id: "other", notes: "ok" });
  assert.equal(patched.id, target.id);
  assert.equal(patched.order_number, target.order_number);
  assert.equal(patched.status, "pending");
  assert.equal(patched.notes, "ok");
  assert.equal(sql("SELECT COUNT(*) AS n FROM orders WHERE store_id <> 'default'")[0].n, 0);
  await dbStore.deleteOrder("x' OR '1'='1");
  assert.equal(countOrders(), before + 1, "no row was lost");
  assert.ok(sql("SELECT name FROM sqlite_master WHERE name = 'orders'").length === 1);
});

await test("stats: counters are upserted per Cairo calendar day", async () => {
  assert.equal(stats.cairoDate("2026-11-15T21:59:00Z"), "2026-11-15");
  assert.equal(stats.cairoDate("2026-11-15T22:30:00Z"), "2026-11-16"); // 00:30 in Cairo (UTC+2)
  await repo.addDayStats("2026-01-10", 3, 1);
  await repo.addDayStats("2026-01-10", 4, 2);
  await repo.addDayStats("2026-01-11", 1, 0);
  assert.deepEqual(await stats.readDayStats(["2026-01-09", "2026-01-10", "2026-01-11"]), {
    "2026-01-09": { visits: 0, checkout_starts: 0 }, "2026-01-10": { visits: 7, checkout_starts: 3 }, "2026-01-11": { visits: 1, checkout_starts: 0 },
  });
  assert.equal(sql("SELECT COUNT(*) AS n FROM stats_daily WHERE day = '2026-01-10'")[0].n, 1);
  const today = stats.cairoDate();
  kvReset();
  stats.recordStat("visit", "session-1");
  stats.recordStat("visit", "session-1"); // same session counted once
  stats.recordStat("visit", "session-2");
  stats.recordStat("checkout_start");
  assert.deepEqual((await stats.readDayStats([today]))[today], { visits: 2, checkout_starts: 1 }, "unflushed buffer is included");
  await stats.flushBuffer();
  assert.deepEqual(sql("SELECT visits, checkout_starts FROM stats_daily WHERE day = ?", today).map((r) => ({ ...r })), [{ visits: 2, checkout_starts: 1 }]);
  assert.deepEqual((await stats.readDayStats([today]))[today], { visits: 2, checkout_starts: 1 }, "not double counted after the flush");
  assert.deepEqual([kv.put, kv.list, kv.get], [0, 0, 0], "stats never touch KV on the d1 backend");
});

let deletedInD1;
await test("delete: order + history removed, tombstones for id / number / Safka serial, bulk delete in one transaction", async () => {
  const o = await dbStore.createOrder(baseOrder());
  await dbStore.updateSafqaInfo(o.id, { safqa_invoice_id: "SFK-DEL-1", safqa_status: "paid" });
  assert.equal(await dbStore.deleteOrder(o.order_number), true); // by order number
  assert.equal(await dbStore.getOrder(o.id), null);
  assert.equal(sql("SELECT COUNT(*) AS n FROM order_status_history WHERE order_id = ?", o.id)[0].n, 0);
  const tokens = await repo.listDeletedTokens();
  for (const t of [o.id, o.order_number, "SFK-DEL-1"]) assert.ok(tokens.has(t), "tombstone " + t);
  await dbStore.refreshDeletedOrderIds();
  assert.equal(dbStore.isOrderDeleted("SFK-DEL-1"), true);
  const a = await dbStore.createOrder(baseOrder());
  const b = await dbStore.createOrder(baseOrder());
  const before = countOrders();
  const res = await dbStore.deleteOrders([a.id, b.id, "sfk-900123"]); // third one is a virtual Safka order
  assert.equal(res.count, 3);
  assert.equal(countOrders(), before - 2);
  assert.equal(dbStore.isOrderDeleted("900123"), true);
  assert.equal(dbStore.isOrderDeleted(a.order_number), true);
  deletedInD1 = a;
});

await test("import KV → D1: per-key + legacy orders, tombstones respected, paged, idempotent, totals reported", async () => {
  const mk = (n, over = {}) => ({
    id: `ord-kv-${n}`, order_number: `EG-240101-${String(n).padStart(4, "0")}`, landing_page_slug: "lp-old", product_id: "prod-test-1",
    customer_name: "عميل قديم " + n, customer_phone: "0115550" + String(1000 + n), governorate: "المنيا", address: "عنوان قديم", quantity: 1,
    unit_price: 300, total_amount: 300, shipping_fee: 0, discount_amount: 0, final_amount: 300, currency: "EGP", status: "delivered",
    payment_method: "cod", safqa_status: "not_synced", created_at: `2024-01-0${n}T08:00:00.000Z`, updated_at: `2024-01-0${n}T08:00:00.000Z`,
    tracking: { utm_source: "tiktok" }, ...over,
  });
  const put = (o) => kvSeed("order:" + o.id, o, orderKv.buildOrderMeta(o));
  [1, 2, 3, 4].forEach((n) => put(mk(n)));
  put(mk(5, { legacy_field: "kept" }));                                   // unknown field → `extra`
  put(mk(6));                                                             // deleted in KV (tombstone below)
  kvSeed("order_deleted:ord-kv-6", { id: "ord-kv-6" }, { k: ["ord-kv-6", "EG-240101-0006"] });
  put({ ...mk(7), id: deletedInD1.id, order_number: deletedInD1.order_number }); // deleted in D1: must not come back
  put(mk(8, { order_number: first.order_number }));                        // number already used by another order → conflict
  kvSeed("orders_all", [mk(1, { customer_name: "stale legacy copy" }), mk(9), { order_number: "EG-240101-0010", customer_name: "no id" }, null]);
  kvSeed("stats:day:2024-01-05", { visits: 40, checkout_starts: 6 });
  const snapshotKv = JSON.stringify([...kv.store.entries()]);
  const d1Before = countOrders();
  kvReset();

  const dry = await importer.importKvOrdersToD1({ dryRun: true });
  assert.equal(dry.source.total, 10);
  assert.equal(countOrders(), d1Before, "dry run writes nothing");
  assert.equal((await repo.listDeletedTokens()).has("ord-kv-6"), false);

  // paged run: 4 + 4 + 2
  const pages = [];
  let offset = 0;
  for (;;) {
    const r = await importer.importKvOrdersToD1({ offset, limit: 4 });
    pages.push(r);
    if (r.done) break;
    offset = r.next_offset;
  }
  assert.equal(pages.length, 3);
  const sum = (k) => pages.reduce((n, r) => n + r[k], 0);
  assert.deepEqual(pages[0].source, { kv_order_keys: 8, legacy_orders: 3, legacy_only: 2, total: 10 });
  assert.equal(sum("inserted"), 7); // kv 1-5, legacy 9, legacy without id (falls back to its order number)
  assert.equal(sum("skipped_deleted"), 2);
  assert.deepEqual(pages.flatMap((r) => r.conflicts), ["ord-kv-8"]);
  assert.equal(sum("updated") + sum("unchanged"), 0);
  assert.deepEqual(pages.flatMap((r) => r.failed_reads), []);
  assert.equal(pages[2].d1_orders_total, d1Before + 7);
  assert.equal(countOrders(), d1Before + 7);
  assert.equal(pages[0].stats_days, 1);
  assert.deepEqual((await stats.readDayStats(["2024-01-05"]))["2024-01-05"], { visits: 40, checkout_starts: 6 });

  const five = await dbStore.getOrder("ord-kv-5");
  assert.equal(five.legacy_field, "kept");
  assert.deepEqual(five.tracking, { utm_source: "tiktok" });
  assert.equal((await dbStore.getOrder("ord-kv-1")).customer_name, "عميل قديم 1", "per-key record wins over the legacy copy");
  assert.equal((await dbStore.getOrder("ord-kv-9")).order_number, "EG-240101-0009");
  assert.equal(await dbStore.getOrder("ord-kv-6"), null, "KV tombstone respected");
  assert.equal(await dbStore.getOrder(deletedInD1.id), null, "order deleted in D1 is not resurrected");
  assert.equal(await dbStore.getOrder("ord-kv-8"), null);
  assert.ok((await repo.listDeletedTokens()).has("EG-240101-0006"), "KV tombstones copied");
  assert.equal((await repo.getStatusHistory("ord-kv-2"))[0].source, "import");

  // idempotent: a second full run changes nothing
  const again = await importer.importKvOrdersToD1({ limit: 300 });
  assert.equal(again.done, true);
  assert.deepEqual([again.inserted, again.updated, again.unchanged, again.skipped_deleted], [0, 0, 7, 2]);
  assert.equal(countOrders(), d1Before + 7);
  assert.equal(sql("SELECT COUNT(*) AS n FROM order_status_history WHERE order_id = 'ord-kv-2'")[0].n, 1);
  assert.deepEqual((await stats.readDayStats(["2024-01-05"]))["2024-01-05"], { visits: 40, checkout_starts: 6 });

  // an order edited in D1 after the import is not overwritten by the older KV copy; a newer KV copy does update
  await dbStore.updateOrderStatus("ord-kv-3", "returned");
  put(mk(4, { status: "cancelled", updated_at: "2024-02-01T00:00:00.000Z" }));
  const third = await importer.importKvOrdersToD1({ limit: 300 });
  assert.deepEqual([third.inserted, third.updated, third.unchanged], [0, 1, 6]);
  assert.equal((await dbStore.getOrder("ord-kv-3")).status, "returned");
  assert.equal((await dbStore.getOrder("ord-kv-4")).status, "cancelled");

  // deleting an imported order, then importing again: stays deleted
  await dbStore.deleteOrder("ord-kv-2");
  const fourth = await importer.importKvOrdersToD1({ limit: 300 });
  assert.equal(fourth.skipped_deleted, 3);
  assert.equal(await dbStore.getOrder("ord-kv-2"), null);
  assert.equal(fourth.d1_orders_total, d1Before + 6);

  put(mk(4)); // restore the seeded copy before comparing
  assert.equal(JSON.stringify([...kv.store.entries()]), snapshotKv, "the import never modifies KV");
  assert.deepEqual([kv.put, kv.delete], [0, 0]);
});

await test("import endpoint is admin-only and reports totals", async () => {
  const anon = await importRoute.POST(new NextRequest("http://localhost/api/admin/orders-import", { method: "POST", body: "{}" }));
  assert.equal(anon.status, 401);
  assert.equal((await importRoute.GET(new NextRequest("http://localhost/api/admin/orders-import"))).status, 401);
  const session = await mod("lib/auth/session.ts");
  const cookie = `${session.AUTH_COOKIE_NAME}=${session.createAdminAuthToken()}`;
  const status = await importRoute.GET(new NextRequest("http://localhost/api/admin/orders-import", { headers: { cookie } }));
  const body = await status.json();
  assert.equal(status.status, 200);
  assert.equal(body.backend, "d1");
  assert.equal(body.d1.orders, countOrders());
  assert.equal(body.kv.order_keys, 8);
  const run = await importRoute.POST(new NextRequest("http://localhost/api/admin/orders-import", { method: "POST", body: JSON.stringify({ dry_run: true }), headers: { cookie } }));
  assert.equal((await run.json()).report.source.total, 10);
  const { middleware } = await mod("middleware.ts");
  const blocked = middleware(new NextRequest("http://localhost/api/admin/orders-import", { method: "POST" }));
  assert.equal(blocked.status, 401, "middleware allow-list does not expose the endpoint");
});

await test("POST /api/orders on d1: server-side pricing, double submit → same order, honeypot, 429 after 5 orders", async () => {
  await quiet(async () => {
    const before = countOrders();
    const body = formBody({ offer_id: "off-2", quantity: 1, final_amount: 1, total_amount: 1, unit_price: 1 });
    const [a, b] = await Promise.all([postOrder(body, "192.0.2.80"), postOrder(body, "192.0.2.80")]);
    assert.equal(a.status, 200);
    assert.equal(b.status, 200);
    assert.equal(a.body.order.order_number, b.body.order.order_number, "double click returns the same order");
    assert.equal(countOrders(), before + 1);
    assert.deepEqual(Object.keys(a.body.order).sort(), ["address", "customer_name", "customer_phone", "event_id", "final_amount", "governorate", "id", "landing_page_slug", "order_number", "shipping_fee"]);
    const stored = await dbStore.getOrder(a.body.order.id);
    assert.deepEqual([stored.quantity, stored.total_amount, stored.final_amount, stored.unit_price, stored.discount_amount], [2, 900, 900, 450, 100], "price comes from the offer, not the client");
    assert.equal(stored.tracking.ip_address, "192.0.2.80");
    const third = await postOrder(body, "192.0.2.81"); // again later, other IP → still the existing order
    assert.equal(third.body.order.id, a.body.order.id);

    const bot = await postOrder(formBody({ website: "http://spam.example" }), "192.0.2.82");
    assert.equal(bot.status, 200);
    assert.equal(bot.body.success, true);
    assert.equal(await dbStore.getOrder(bot.body.order.id), null, "honeypot order is not stored");
    assert.equal(countOrders(), before + 1);

    assert.equal((await postOrder(formBody({ product_id: "prod-nope" }), "192.0.2.83")).status, 404);
    assert.equal((await postOrder(formBody({ customer_phone: "123" }), "192.0.2.83")).status, 400);

    const ip = "192.0.2.90";
    for (let i = 0; i < 5; i++) assert.equal((await postOrder(formBody(), ip)).status, 200, "order " + (i + 1));
    const limitedBody = formBody();
    const limited = await postOrder(limitedBody, ip);
    assert.equal(limited.status, 429);
    assert.ok(Number(limited.headers.get("retry-after")) > 0);
    assert.equal(countOrders(), before + 6);
    // the refused request released its claim: the same customer can order from another connection
    assert.equal((await postOrder(limitedBody, "192.0.2.91")).status, 200);
  });
});

await test("write budget: a normal order on d1 costs ZERO KV writes and ZERO KV list operations", async () => {
  await quiet(async () => {
    kvReset();
    const res = await postOrder(formBody(), "192.0.2.100");
    assert.equal(res.status, 200);
    assert.deepEqual({ put: kv.put, delete: kv.delete, list: kv.list }, { put: 0, delete: 0, list: 0 }, "order creation");
    await dbStore.updateOrderStatus(res.body.order.id, "confirmed");
    await dbStore.updateOrder(res.body.order.id, { status: "shipped", notes: "تم الشحن" });
    await dbStore.getOrders({ status: "shipped" });
    await dbStore.getOrder(res.body.order.id);
    await dbStore.deleteOrder(res.body.order.id);
    assert.deepEqual({ put: kv.put, delete: kv.delete, list: kv.list }, { put: 0, delete: 0, list: 0 }, "status changes, listing, delete");
  });
});

await test("ORDERS_KV_MIRROR=1 (verification period): exactly one extra KV write per order, readable after rollback", async () => {
  await quiet(async () => {
    process.env.ORDERS_KV_MIRROR = "1";
    kvReset();
    const res = await postOrder(formBody(), "192.0.2.110");
    assert.deepEqual({ put: kv.put, list: kv.list }, { put: 1, list: 0 });
    process.env.ORDERS_KV_MIRROR = "";
    process.env.ORDERS_BACKEND = "kv";
    assert.equal((await dbStore.getOrder(res.body.order.id))?.order_number, res.body.order.order_number, "visible on the kv backend");
    process.env.ORDERS_BACKEND = "d1";
  });
});

await test("rollback: ORDERS_BACKEND=kv still works unchanged (3 KV writes per order) and never touches D1", async () => {
  await quiet(async () => {
    process.env.ORDERS_BACKEND = "kv";
    const d1Before = countOrders();
    const d1Guards = sql("SELECT (SELECT COUNT(*) FROM order_dedupe) + (SELECT COUNT(*) FROM rate_limits) AS n")[0].n;
    kvReset();
    const body = formBody();
    const res = await postOrder(body, "192.0.2.120");
    assert.equal(res.status, 200);
    assert.equal(kv.put, 3, "rate-limit key + order record + dedupe entry");
    assert.ok(kv.list >= 1, "order number collision check lists KV");
    assert.equal((await postOrder(body, "192.0.2.121")).body.order.id, res.body.order.id, "KV duplicate guard");
    assert.equal((await dbStore.getOrder(res.body.order.id)).customer_phone, body.customer_phone);
    assert.ok((await dbStore.getOrders({ search: body.customer_phone })).some((o) => o.id === res.body.order.id));
    assert.equal(await dbStore.updateOrderStatus(res.body.order.id, "confirmed"), true);
    assert.equal(await dbStore.deleteOrder(res.body.order.id), true);
    assert.equal(countOrders(), d1Before);
    assert.equal(sql("SELECT (SELECT COUNT(*) FROM order_dedupe) + (SELECT COUNT(*) FROM rate_limits) AS n")[0].n, d1Guards);
    process.env.ORDERS_BACKEND = "d1";
  });
});

await test("d1 selected but unavailable: the order is refused (500), never silently written elsewhere", async () => {
  await quiet(async () => {
    const saved = process.env.D1_REST_BASE_URL;
    process.env.D1_REST_BASE_URL = "";
    kvReset();
    const res = await postOrder(formBody(), "192.0.2.130");
    assert.equal(res.status, 500);
    assert.equal(res.body.success, false);
    assert.equal(kv.put, 0);
    process.env.D1_REST_BASE_URL = saved;
  });
});

// ───────────── summary ─────────────
await d1.close();
await new Promise((r) => kvServer.close(r));
const failed = results.filter((ok) => !ok).length;
console.log(`\n${results.length - failed}/${results.length} passed` + (failed ? `, ${failed} FAILED` : ""));
process.exit(failed ? 1 : 0);
