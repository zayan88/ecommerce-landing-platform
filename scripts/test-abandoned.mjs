// Tests for abandoned checkouts (src/lib/db/abandoned-repo.ts, /api/abandoned, /api/admin/abandoned).
// Harness: scripts/lib/test-kit.mjs (D1 emulator in memory, no new dependencies).
// Usage: node scripts/test-abandoned.mjs        (Node >= 22.15; exits 1 on any failure)
import assert from "node:assert/strict";
import { startTestKit } from "./lib/test-kit.mjs";

const { sql, mod, call, request, test, finish } = await startTestKit({ env: { ORDERS_BACKEND: "d1" } });

const repo = await mod("lib/db/abandoned-repo.ts");
const publicRoute = await mod("app/api/abandoned/route.ts");
const adminRoute = await mod("app/api/admin/abandoned/route.ts");
const { middleware } = await mod("middleware.ts");

const send = (body, headers = {}) => call(publicRoute.POST, "/api/abandoned", { method: "POST", body, headers });
const list = (q = "") => call(adminRoute.GET, "/api/admin/abandoned" + q, { admin: true });

await test("phone normalisation: Arabic digits, +20 prefix, spaces; rejects junk", () => {
  assert.equal(repo.normalizeEgyptPhone("٠١٠١١١١٢٢٢٢"), "01011112222");
  assert.equal(repo.normalizeEgyptPhone("+20 101 111 2222"), "01011112222");
  assert.equal(repo.normalizeEgyptPhone("0020 1011112222"), "01011112222");
  assert.equal(repo.normalizeEgyptPhone("12345"), null);
  assert.equal(repo.normalizeEgyptPhone("01311112222"), null);
  assert.equal(repo.normalizeEgyptPhone(null), null);
});

await test("middleware: capture is public POST only; admin API is closed", () => {
  assert.notEqual(middleware(request("/api/abandoned", { method: "POST" })).status, 401);
  assert.equal(middleware(request("/api/abandoned")).status, 401);
  assert.equal(middleware(request("/api/admin/abandoned")).status, 401);
});

await test("capture stores one row per phone+product and refreshes it (no duplicates)", async () => {
  await send({ phone: "01011112222", name: "أحمد", product_id: "p1", product_title: "منتج", amount: 399 });
  await send({ phone: "01011112222", name: "أحمد علي", product_id: "p1", product_title: "منتج", amount: 799 });
  const rows = sql("SELECT * FROM abandoned_checkouts");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, "أحمد علي");
  assert.equal(rows[0].amount, 799);
  assert.equal(rows[0].store_id, "default");
});

await test("invalid phone is ignored but still answers 200 (nothing to probe)", async () => {
  const res = await send({ phone: "123", name: "x" });
  assert.equal(res.status, 200);
  assert.equal(sql("SELECT COUNT(*) AS n FROM abandoned_checkouts")[0].n, 1);
});

await test("values are bound parameters: injection text is stored as text", async () => {
  await send({ phone: "01099998888", name: "x'); DROP TABLE abandoned_checkouts;--", product_id: "p2" });
  assert.equal(sql("SELECT COUNT(*) AS n FROM abandoned_checkouts")[0].n, 2);
});

await test("admin list + counts, status update, and auth", async () => {
  assert.equal((await call(adminRoute.GET, "/api/admin/abandoned", { admin: false })).status, 401);
  const res = await list("?status=open");
  const j = res.body;
  assert.equal(j.counts.open, 2);
  const id = j.items[0].id;
  const patch = await call(adminRoute.PATCH, "/api/admin/abandoned", { method: "PATCH", admin: true, body: { id, status: "contacted" } });
  assert.equal(patch.status, 200);
  assert.equal((await list()).body.counts.contacted, 1);
  const bad = await call(adminRoute.PATCH, "/api/admin/abandoned", { method: "PATCH", admin: true, body: { id, status: "hacked" } });
  assert.equal(bad.status, 400);
});

await test("placing an order for that phone closes its abandoned rows, and a later capture does not reopen them", async () => {
  await repo.markAbandonedConverted("01011112222");
  const row = sql("SELECT status FROM abandoned_checkouts WHERE phone = '01011112222'")[0];
  assert.equal(row.status, "converted");
  await send({ phone: "01011112222", name: "تاني", product_id: "p1" });
  assert.equal(sql("SELECT status, name FROM abandoned_checkouts WHERE phone = '01011112222'")[0].status, "converted");
});

await test("per-IP rate limit: more than 30 reports in 10 minutes are silently dropped", async () => {
  for (let i = 0; i < 40; i++) {
    const phone = "0105" + String(1000000 + i);
    await send({ phone, name: "n" + i, product_id: "rl" }, { "cf-connecting-ip": "9.9.9.9" });
  }
  const n = sql("SELECT COUNT(*) AS n FROM abandoned_checkouts WHERE product_id = 'rl'")[0].n;
  assert.ok(n <= 30 && n >= 28, "stored " + n);
});

await test("delete removes the row (admin only)", async () => {
  const id = (await list("?status=contacted")).body.items[0].id;
  const res = await call(adminRoute.DELETE, "/api/admin/abandoned", { method: "DELETE", admin: true, body: { ids: [id] } });
  assert.equal(res.body.deleted, 1);
});

await test("old rows are purged after 30 days", async () => {
  sql("UPDATE abandoned_checkouts SET updated_ms = 1 WHERE phone = '01099998888'");
  await send({ phone: "01077776666", name: "n", product_id: "p9" });
  assert.equal(sql("SELECT COUNT(*) AS n FROM abandoned_checkouts WHERE phone = '01099998888'")[0].n, 0);
});

await finish();
