// Tests for the MCP endpoint (/api/mcp), its admin token management (/api/admin/mcp) and the tools.
// Usage: node scripts/test-mcp.mjs        (Node >= 22.15; exits 1 on any failure)
import assert from "node:assert/strict";
import { startTestKit } from "./lib/test-kit.mjs";

const { mod, call, request, test, finish } = await startTestKit({ env: { ORDERS_BACKEND: "d1" } });
const { dbStore } = await mod("lib/db/store.ts");
const mcpRoute = await mod("app/api/mcp/route.ts");
const adminMcp = await mod("app/api/admin/mcp/route.ts");
const settingsRoute = await mod("app/api/settings/route.ts");
const { middleware } = await mod("middleware.ts");
const repo = (await mod("lib/db/orders-repo.ts")).getOrdersRepo();

const order = {
  id: "ord-m-1", order_number: "EG-261117-0001", landing_page_slug: "p", product_id: "prod-m1", customer_name: "منى علي", customer_phone: "01011112222",
  governorate: "الجيزة", city: "x", address: "شارع الهرم", notes: "", quantity: 1, unit_price: 500, total_amount: 500, shipping_fee: 0, discount_amount: 0,
  final_amount: 500, currency: "EGP", status: "pending", payment_method: "cod", safqa_status: "not_synced",
  created_at: "2026-11-17T10:00:00.000Z", updated_at: "2026-11-17T10:00:00.000Z",
  tracking: { ip_address: "9.9.9.9", user_agent: "SECRET-UA", utm_source: "facebook" },
};
await repo.importOrders([order]);
await dbStore.saveProductWithLandingPage({ id: "prod-m1", title_ar: "منتج", slug: "m-product", sku: "M1", base_price: 500, cost_price: 200, stock_quantity: 10, status: "active", images: [], description_ar: "" }, true);

const rpc = (body, token) =>
  call(mcpRoute.POST, "/api/mcp", { method: "POST", body, headers: token ? { authorization: `Bearer ${token}` } : {} });
const tool = async (name, args, token) => {
  const r = await rpc({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }, token);
  return { raw: r, out: r.body?.result ? JSON.parse(r.body.result.content[0].text.startsWith("{") || r.body.result.content[0].text.startsWith("[") ? r.body.result.content[0].text : "null") : null, text: r.body?.result?.content?.[0]?.text, isError: r.body?.result?.isError };
};

let TOKEN = "";

await test("MCP is closed until the merchant creates a token", async () => {
  assert.equal((await rpc({ jsonrpc: "2.0", id: 1, method: "ping" })).status, 401);
  assert.equal((await rpc({ jsonrpc: "2.0", id: 1, method: "ping" }, "anything")).status, 401);
});

await test("the middleware lets /api/mcp through (it checks its own bearer token) and keeps the admin route closed", () => {
  assert.notEqual(middleware(request("/api/mcp", { method: "POST" })).status, 401);
  assert.equal(middleware(request("/api/admin/mcp", { method: "POST" })).status, 401);
  assert.equal((adminMcp.POST, true), true);
});

await test("creating a token is admin-only, shows it once, and stores only a hash", async () => {
  assert.equal((await call(adminMcp.POST, "/api/admin/mcp", { method: "POST", admin: false })).status, 401);
  const made = await call(adminMcp.POST, "/api/admin/mcp", { method: "POST", admin: true });
  assert.equal(made.status, 200);
  TOKEN = made.body.token;
  assert.match(TOKEN, /^mcp_[0-9a-f]{64}$/);
  const settings = await dbStore.getSettings();
  assert.ok(settings.mcp_token_hash && !JSON.stringify(settings).includes(TOKEN), "the token itself is never stored");
  const read = await call(settingsRoute.GET, "/api/settings", { admin: true });
  assert.ok(!JSON.stringify(read.body).includes("mcp_token_hash"), "the hash is not exposed by the settings API");
  const again = await call(adminMcp.GET, "/api/admin/mcp", { admin: true });
  assert.ok(!JSON.stringify(again.body).includes(TOKEN), "the token cannot be read back");
  assert.equal(again.body.has_token, true);
});

await test("the generic settings API cannot touch the MCP fields", async () => {
  await call(settingsRoute.POST, "/api/settings", { method: "POST", admin: true, body: { mcp_enabled: false, mcp_token_hash: "evil", mcp_token_created_at: "x" } });
  const s = await dbStore.getSettings();
  assert.equal(s.mcp_enabled, true);
  assert.notEqual(s.mcp_token_hash, "evil");
});

await test("wrong or missing token is refused; the right one works (initialize, tools/list)", async () => {
  assert.equal((await rpc({ jsonrpc: "2.0", id: 1, method: "ping" }, "mcp_wrong")).status, 401);
  const init = await rpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "t", version: "1" } } }, TOKEN);
  assert.equal(init.status, 200);
  assert.equal(init.body.result.protocolVersion, "2025-03-26");
  assert.ok(init.body.result.capabilities.tools);
  const list = await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list" }, TOKEN);
  const names = list.body.result.tools.map((t) => t.name);
  assert.ok(names.includes("list_orders") && names.includes("update_order_status"));
  assert.ok(!names.some((n) => /delete|remove|drop/i.test(n)), "no destructive tool is exposed");
});

await test("notifications get 202, a batch is answered together, unknown methods are JSON-RPC errors", async () => {
  assert.equal((await rpc({ jsonrpc: "2.0", method: "notifications/initialized" }, TOKEN)).status, 202);
  const batch = await rpc([{ jsonrpc: "2.0", id: 1, method: "ping" }, { jsonrpc: "2.0", id: 2, method: "tools/list" }], TOKEN);
  assert.equal(batch.body.length, 2);
  const bad = await rpc({ jsonrpc: "2.0", id: 3, method: "nope" }, TOKEN);
  assert.equal(bad.body.error.code, -32601);
});

await test("list_orders / get_order return compact orders without IP or user agent", async () => {
  const l = await tool("list_orders", { status: "pending", limit: 5 }, TOKEN);
  assert.equal(l.out.orders.length >= 1, true);
  assert.ok(!l.text.includes("9.9.9.9") && !l.text.includes("SECRET-UA"));
  const g = await tool("get_order", { order: "EG-261117-0001" }, TOKEN);
  assert.equal(g.out.customer_name, "منى علي");
  assert.equal(g.out.source, "facebook");
  assert.equal((await tool("get_order", { order: "nope" }, TOKEN)).isError, true);
});

await test("update_order_status changes the order; invalid input is a tool error", async () => {
  const ok = await tool("update_order_status", { order: "EG-261117-0001", status: "confirmed" }, TOKEN);
  assert.deepEqual([ok.out.from, ok.out.to], ["pending", "confirmed"]);
  assert.equal((await dbStore.getOrder("ord-m-1")).status, "confirmed");
  assert.equal((await tool("update_order_status", { order: "EG-261117-0001", status: "exploded" }, TOKEN)).isError, true);
  assert.equal((await tool("update_order_status", { order: "", status: "shipped" }, TOKEN)).isError, true);
});

await test("update_product validates price / stock / status and leaves other fields alone", async () => {
  const r = await tool("update_product", { id: "prod-m1", base_price: 450, stock_quantity: 7, status: "draft" }, TOKEN);
  assert.deepEqual([r.out.price, r.out.stock, r.out.status], [450, 7, "draft"]);
  const p = await dbStore.getProduct("prod-m1");
  assert.equal(p.title_ar, "منتج");
  assert.equal(p.cost_price, 200);
  for (const bad of [{ base_price: -5 }, { base_price: "abc" }, { stock_quantity: -1 }, { status: "deleted" }]) {
    assert.equal((await tool("update_product", { id: "prod-m1", ...bad }, TOKEN)).isError, true, JSON.stringify(bad));
  }
  assert.equal((await tool("update_product", { id: "ghost", base_price: 5 }, TOKEN)).isError, true);
  assert.equal((await tool("nope", {}, TOKEN)).raw.body.error.code, -32602);
});

await test("store_overview, list_products and list_coupons answer", async () => {
  const o = await tool("store_overview", {}, TOKEN);
  assert.ok(o.out.orders_total >= 1);
  assert.ok((await tool("list_products", {}, TOKEN)).out.length >= 1);
  assert.ok(Array.isArray((await tool("list_coupons", {}, TOKEN)).out));
});

await test("pausing MCP blocks the token; resuming restores it; revoking kills it for good", async () => {
  await call(adminMcp.PATCH, "/api/admin/mcp", { method: "PATCH", admin: true, body: { enabled: false } });
  assert.equal((await rpc({ jsonrpc: "2.0", id: 1, method: "ping" }, TOKEN)).status, 401);
  await call(adminMcp.PATCH, "/api/admin/mcp", { method: "PATCH", admin: true, body: { enabled: true } });
  assert.equal((await rpc({ jsonrpc: "2.0", id: 1, method: "ping" }, TOKEN)).status, 200);
  const fresh = (await call(adminMcp.POST, "/api/admin/mcp", { method: "POST", admin: true })).body.token;
  assert.equal((await rpc({ jsonrpc: "2.0", id: 1, method: "ping" }, TOKEN)).status, 401, "regenerating invalidates the old token");
  assert.equal((await rpc({ jsonrpc: "2.0", id: 1, method: "ping" }, fresh)).status, 200);
  await call(adminMcp.DELETE, "/api/admin/mcp", { method: "DELETE", admin: true });
  assert.equal((await rpc({ jsonrpc: "2.0", id: 1, method: "ping" }, fresh)).status, 401);
  assert.equal((await call(adminMcp.PATCH, "/api/admin/mcp", { method: "PATCH", admin: true, body: { enabled: true } })).status, 400, "cannot enable without a token");
});

await finish();
