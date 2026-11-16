// Tests for bulk admin actions: delete many products / landing pages, hide-show many products, pause-activate pages.
// Usage: node scripts/test-bulk-admin.mjs        (Node >= 22.15; exits 1 on any failure)
import assert from "node:assert/strict";
import { startTestKit } from "./lib/test-kit.mjs";

const { mod, call, request, test, finish } = await startTestKit({ env: { CATALOG_BACKEND: "d1" } });

const { dbStore } = await mod("lib/db/store.ts");
const productsRoute = await mod("app/api/products/route.ts");
const pagesRoute = await mod("app/api/landing-pages/route.ts");
const { middleware } = await mod("middleware.ts");

let n = 0;
const mk = async () => {
  n++;
  const { product, landingPage } = await dbStore.saveProductWithLandingPage(
    { id: `prod-b${n}`, title_ar: `منتج ${n}`, slug: `bulk-${n}`, sku: `B${n}`, base_price: 100 + n, stock_quantity: 5, status: "active", images: [], description_ar: "" },
    true
  );
  return { product, landingPage };
};
const listProducts = async () => (await call(productsRoute.GET, "/api/products", { admin: true })).body.products.map((p) => p.id);
const listPages = async () => (await call(pagesRoute.GET, "/api/landing-pages", { admin: true })).body.landingPages.map((p) => p.id);

await test("bulk routes are admin-only (the middleware keeps DELETE/PATCH closed)", () => {
  assert.equal(middleware(request("/api/products", { method: "DELETE" })).status, 401);
  assert.equal(middleware(request("/api/products", { method: "PATCH" })).status, 401);
  assert.equal(middleware(request("/api/landing-pages", { method: "DELETE" })).status, 401);
  assert.equal(middleware(request("/api/landing-pages", { method: "PATCH" })).status, 401);
});

await test("bulk delete removes only the selected products (and their pages) in one request", async () => {
  const a = await mk();
  const b = await mk();
  const c = await mk();
  const r = await call(productsRoute.DELETE, "/api/products", { method: "DELETE", admin: true, body: { ids: [a.product.id, b.product.id] } });
  assert.equal(r.body.deleted, 2);
  const left = await listProducts();
  assert.ok(!left.includes(a.product.id) && !left.includes(b.product.id));
  assert.ok(left.includes(c.product.id), "an unselected product stays");
  const pages = await listPages();
  assert.ok(!pages.includes(a.landingPage.id), "its landing page went too");
});

await test("bulk hide / show changes the status of the selected products only", async () => {
  const a = await mk();
  const b = await mk();
  const hide = await call(productsRoute.PATCH, "/api/products", { method: "PATCH", admin: true, body: { ids: [a.product.id], status: "draft" } });
  assert.equal(hide.body.updated, 1);
  assert.equal((await dbStore.getProduct(a.product.id)).status, "draft");
  assert.equal((await dbStore.getProduct(b.product.id)).status, "active");
  await call(productsRoute.PATCH, "/api/products", { method: "PATCH", admin: true, body: { ids: [a.product.id], status: "active" } });
  assert.equal((await dbStore.getProduct(a.product.id)).status, "active");
});

await test("invalid input is refused: empty ids, bad status, non-string ids", async () => {
  assert.equal((await call(productsRoute.DELETE, "/api/products", { method: "DELETE", admin: true, body: { ids: [] } })).status, 400);
  assert.equal((await call(productsRoute.PATCH, "/api/products", { method: "PATCH", admin: true, body: { ids: ["x"], status: "hacked" } })).status, 400);
  assert.equal((await call(productsRoute.DELETE, "/api/products", { method: "DELETE", admin: true, body: { ids: [1, null, {}] } })).status, 400);
});

await test("bulk delete and pause/activate for landing pages", async () => {
  const a = await mk();
  const b = await mk();
  const c = await mk();
  const pause = await call(pagesRoute.PATCH, "/api/landing-pages", { method: "PATCH", admin: true, body: { ids: [a.landingPage.id, b.landingPage.id], status: "paused" } });
  assert.equal(pause.body.updated, 2);
  const pages = (await call(pagesRoute.GET, "/api/landing-pages", { admin: true })).body.landingPages;
  assert.equal(pages.find((p) => p.id === a.landingPage.id).status, "paused");
  assert.equal(pages.find((p) => p.id === c.landingPage.id).status, "active");
  assert.equal((await call(pagesRoute.PATCH, "/api/landing-pages", { method: "PATCH", admin: true, body: { ids: [a.landingPage.id], status: "nope" } })).status, 400);
  const del = await call(pagesRoute.DELETE, "/api/landing-pages", { method: "DELETE", admin: true, body: { ids: [a.landingPage.id, b.landingPage.id] } });
  assert.equal(del.body.deleted, 2);
  const left = await listPages();
  assert.ok(!left.includes(a.landingPage.id) && !left.includes(b.landingPage.id));
  assert.ok(left.includes(c.landingPage.id));
});

await test("at most 100 ids are processed per request", async () => {
  const ids = Array.from({ length: 150 }, (_, i) => `ghost-${i}`);
  const r = await call(productsRoute.DELETE, "/api/products", { method: "DELETE", admin: true, body: { ids } });
  assert.equal(r.body.requested, 100);
});

await finish();
