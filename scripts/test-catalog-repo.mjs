// Tests for the catalog on D1 (src/lib/db/catalog-repo.ts + the dbStore product / landing page /
// settings code that uses it, the importer and its endpoint), behind CATALOG_BACKEND=d1.
// Harness: scripts/lib/test-kit.mjs (D1 emulator in memory + counting KV emulator, no new dependencies).
// Usage: node scripts/test-catalog-repo.mjs        (Node >= 22.15; exits 1 on any failure)
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { startTestKit, src } from "./lib/test-kit.mjs";

const { kv, kvReset, kvSeed, kvRead, d1, sql, run, mod, call, request, test, quiet, finish } = await startTestKit({
  env: { CATALOG_BACKEND: "d1", TELEGRAM_BOT_TOKEN: "env-telegram-token-123456" },
});

// Count the requests that reach the D1 emulator (one request = one D1 query or one batch).
const d1Calls = { query: 0, batch: 0 };
const d1Reset = () => { d1Calls.query = d1Calls.batch = 0; };
const guardedFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const u = String(typeof input === "string" || input instanceof URL ? input : input.url);
  if (u.startsWith(d1.url)) d1Calls[u.endsWith("/batch") ? "batch" : "query"]++;
  return guardedFetch(input, init);
};
const kvOps = () => ({ get: kv.get, put: kv.put, delete: kv.delete, list: kv.list });
const NO_KV = { get: 0, put: 0, delete: 0, list: 0 };

const { dbStore } = await mod("lib/db/store.ts");
const catalog = await mod("lib/db/catalog-repo.ts");
const d1Mod = await mod("lib/db/d1.ts");
const importer = await mod("lib/db/catalog-import.ts");
const productsRoute = await mod("app/api/products/route.ts");
const lpRoute = await mod("app/api/landing-pages/route.ts");
const settingsRoute = await mod("app/api/settings/route.ts");
const importRoute = await mod("app/api/admin/catalog-import/route.ts");
const repo = catalog.getCatalogRepo();
/** A repository that talks to D1 directly, like another isolate would (no cache invalidation here). */
const otherIsolate = () => catalog.createD1CatalogRepo(d1Mod.getD1Client());
/** A repository whose batch always fails after sending an extra bad statement (atomicity checks). */
const failingRepo = () => {
  const real = d1Mod.getD1Client();
  return catalog.createD1CatalogRepo({
    query: (...a) => real.query(...a),
    batch: (statements) => real.batch([...statements, { sql: "INSERT INTO table_that_does_not_exist VALUES (1)", params: [] }]),
  });
};
const count = (table, where = "1=1", ...params) => sql(`SELECT COUNT(*) AS n FROM ${table} WHERE ${where}`, ...params)[0].n;
const withEnv = async (vars, fn) => {
  const saved = Object.fromEntries(Object.keys(vars).map((k) => [k, process.env[k]]));
  Object.assign(process.env, vars);
  catalog.invalidateCatalogCache();
  try { return await fn(); } finally {
    for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
    catalog.invalidateCatalogCache();
  }
};
const OFFERS = [
  { id: "off-1", product_id: "", title_ar: "قطعة واحدة", quantity: 1, price: 599, original_price: 800, discount_label: "خصم", is_popular: false, free_shipping: true, sort_order: 1 },
  { id: "off-2", product_id: "", title_ar: "قطعتان ⭐", quantity: 2, price: 999, is_popular: true, sort_order: 2 },
  { id: "off-3", product_id: "", title_ar: "ثلاث قطع 🔥", quantity: 3, price: 1299, original_price: 1800, sort_order: 3 },
];
const productBody = (over = {}) => ({
  title_ar: "جهاز اختبار", title_en: "Test device", slug: "test-device", sku: "TD-1", base_price: 599, compare_at_price: 800, cost_price: 250,
  images: ["/api/media/img-1", "https://cdn.example/x.jpg"], description_ar: "وصف المنتج", stock_quantity: 20, status: "active", offers: OFFERS, ...over,
});
const admin = { admin: true };

// ───────────── tests ─────────────
await test("backend selection: default is kv, d1 only when CATALOG_BACKEND=d1; mirror flag needs d1", async () => {
  await withEnv({ CATALOG_BACKEND: "" }, async () => assert.equal(catalog.catalogBackend(), "kv"));
  await withEnv({ CATALOG_BACKEND: "KV" }, async () => assert.equal(catalog.catalogBackend(), "kv"));
  await withEnv({ CATALOG_BACKEND: " D1 " }, async () => assert.equal(catalog.catalogBackend(), "d1"));
  await withEnv({ CATALOG_BACKEND: "kv", CATALOG_KV_MIRROR: "1" }, async () => assert.equal(catalog.catalogKvMirrorEnabled(), false));
  await withEnv({ CATALOG_KV_MIRROR: "1" }, async () => assert.equal(catalog.catalogKvMirrorEnabled(), true));
  assert.equal(catalog.catalogCacheTtlMs(), 30000);
  await withEnv({ CATALOG_CACHE_TTL_SECONDS: "0" }, async () => assert.equal(catalog.catalogCacheTtlMs(), 0));
  await withEnv({ CATALOG_CACHE_TTL_SECONDS: "abc" }, async () => assert.equal(catalog.catalogCacheTtlMs(), 30000));
});

await test("migration 0004: tables exist, every table has store_id NOT NULL DEFAULT 'default', slug/status/product indexes", async () => {
  for (const t of ["products", "product_offers", "landing_pages", "settings"]) {
    const col = sql(`PRAGMA table_info(${t})`).find((c) => c.name === "store_id");
    assert.ok(col, `${t}.store_id missing`);
    assert.equal(col.notnull, 1);
    assert.equal(col.dflt_value, "'default'");
  }
  const idx = (t) => sql(`PRAGMA index_list(${t})`).map((i) => i.name);
  for (const n of ["products_slug_uq", "products_status_idx"]) assert.ok(idx("products").includes(n), n);
  for (const n of ["landing_pages_slug_uq", "landing_pages_product_idx", "landing_pages_status_idx"]) assert.ok(idx("landing_pages").includes(n), n);
});

let saved;
await test("product save + read: every field and the offers (order, booleans, optional fields) round-trip by id and by slug", async () => {
  saved = await dbStore.saveProduct(productBody());
  assert.match(saved.id, /^prod-\d+$/);
  const byId = await dbStore.getProduct(saved.id);
  const bySlug = await dbStore.getProduct("test-device");
  assert.deepEqual(byId, bySlug);
  const { offers, ...fields } = byId;
  const { offers: _o, ...expected } = saved;
  assert.deepEqual(fields, expected);
  assert.deepEqual(offers.map((o) => o.id), ["off-1", "off-2", "off-3"]);
  assert.deepEqual(offers[0], { ...OFFERS[0], product_id: saved.id });
  assert.deepEqual(offers[1], { id: "off-2", product_id: saved.id, title_ar: "قطعتان ⭐", quantity: 2, price: 999, is_popular: true, sort_order: 2 });
  assert.equal("free_shipping" in offers[1], false, "an unset optional field stays unset");
  const list = await dbStore.getProducts();
  assert.deepEqual(list.map((p) => p.id), [saved.id]);
  assert.equal(list[0].offers.length, 3);
  assert.equal(await dbStore.getProduct("missing-product"), null);
});

await test("offers are replaced as a set, atomically: a failed save leaves the previous product and offers intact", async () => {
  await dbStore.saveProduct({ ...saved, offers: [OFFERS[1]] });
  assert.equal(count("product_offers", "product_id = ?", saved.id), 1);
  await dbStore.saveProduct({ ...saved, offers: OFFERS });
  assert.equal(count("product_offers", "product_id = ?", saved.id), 3);
  await assert.rejects(failingRepo().saveProduct({ ...saved, title_ar: "لن يُحفظ", offers: [] }));
  assert.equal(count("product_offers", "product_id = ?", saved.id), 3, "offers survive the failed transaction");
  assert.equal(sql("SELECT title_ar FROM products WHERE id = ?", saved.id)[0].title_ar, "جهاز اختبار");
  // a save without `offers` clears them (same as the KV backend, which stores offers: [])
  await dbStore.saveProduct({ ...saved, offers: undefined });
  assert.equal(count("product_offers", "product_id = ?", saved.id), 0);
  await dbStore.saveProduct({ ...saved, offers: OFFERS });
});

await test("slug uniqueness: enforced by a UNIQUE index per store; a save that takes another product's slug replaces it (KV parity)", async () => {
  assert.throws(() => run(
    "INSERT INTO products (store_id, id, slug, created_at, updated_at, created_ms) VALUES ('default', 'raw-dup', 'test-device', 'x', 'x', 1)"
  ), /UNIQUE/);
  run("INSERT INTO products (store_id, id, slug, created_at, updated_at, created_ms) VALUES ('other-store', 'raw-dup', 'test-device', 'x', 'x', 1)");
  assert.equal(count("products", "slug = 'test-device'"), 2, "the same slug is allowed in another store");
  run("DELETE FROM products WHERE store_id = 'other-store'");

  const twin = await dbStore.saveProduct(productBody({ id: "prod-twin", title_ar: "بديل", offers: [OFFERS[0]] }));
  assert.equal(count("products", "store_id = 'default'"), 1, "the slug moved to the new product, the old one is gone");
  assert.equal(count("product_offers", "product_id = ?", saved.id), 0, "…with its offers");
  assert.equal((await dbStore.getProduct("test-device")).id, twin.id);
  await dbStore.deleteProduct(twin.id);
  saved = await dbStore.saveProduct(productBody());
});

await test("normalizeSlug + landing page rename: validation, reserved words, uniqueness against pages and products", async () => {
  assert.equal(dbStore.normalizeSlug("  My  Great Page!! "), "my-great-page");
  assert.equal(dbStore.normalizeSlug("جهاز الاستنشاق 2026"), "جهاز-الاستنشاق-2026");
  assert.equal(dbStore.normalizeSlug("a/../b?x=1;DROP"), "abx1drop");
  assert.equal(dbStore.normalizeSlug("--x--"), "x");
  assert.equal(dbStore.normalizeSlug("x".repeat(80)).length, 60);

  const a = await dbStore.saveLandingPage({ product_id: saved.id, title: "صفحة أ", slug: "page-a", content_config: { hero_title: "أ" } });
  const b = await dbStore.saveLandingPage({ product_id: saved.id, title: "صفحة ب", slug: "page-b" });
  const other = await dbStore.saveProduct(productBody({ slug: "other-product", sku: "OP", offers: [] }));
  const fail = async (patch, re) => { const r = await dbStore.updateLandingPageMeta(a.id, patch); assert.equal(r.ok, false); assert.match(r.error, re); };
  await fail({ slug: "admin" }, /محجوز/);
  await fail({ slug: "!!!" }, /غير صالح/);
  await fail({ slug: "page-b" }, /صفحة هبوط تانية/);
  await fail({ slug: "other-product" }, /منتج تاني/);
  await fail({ title: "   " }, /مطلوب/);
  const ok = await dbStore.updateLandingPageMeta(a.id, { title: " عنوان جديد ", slug: "Page A Renamed" });
  assert.equal(ok.ok, true);
  assert.deepEqual({ id: ok.landingPage.id, slug: ok.landingPage.slug, title: ok.landingPage.title, url: ok.landingPage.deployment_url },
    { id: a.id, slug: "page-a-renamed", title: "عنوان جديد", url: "/p/page-a-renamed" });
  assert.equal(await repo.getLandingPage("page-a"), null, "the old link no longer serves a copy");
  assert.equal((await dbStore.getLandingPage("page-a-renamed")).content_config.hero_title, "أ", "content survives the rename");
  assert.equal(count("landing_pages", "id = ?", a.id), 1);
  for (const id of [a.id, b.id]) await dbStore.deleteLandingPage(id);
  await dbStore.deleteProduct(other.id);
});

let createdLpId;
await test("POST /api/products: product + offers + landing page in ONE D1 batch, zero KV operations, same response shape", async () => {
  await dbStore.deleteProduct(saved.id);
  kvReset(); d1Reset();
  const res = await call(productsRoute.POST, "/api/products", { method: "POST", body: productBody(), ...admin });
  assert.equal(res.status, 200);
  assert.deepEqual(d1Calls, { query: 0, batch: 1 }, "one transaction");
  assert.deepEqual(kvOps(), NO_KV);
  assert.deepEqual(Object.keys(res.body).sort(), ["landing_page_id", "landing_page_url", "message", "product", "success"]);
  assert.equal(res.body.landing_page_url, "/p/test-device");
  saved = res.body.product;
  createdLpId = res.body.landing_page_id;
  const lp = sql("SELECT * FROM landing_pages WHERE slug = 'test-device'")[0];
  assert.deepEqual({ id: lp.id, product_id: lp.product_id, title: lp.title, status: lp.status, key: lp.component_key, url: lp.deployment_url },
    { id: createdLpId, product_id: saved.id, title: "جهاز اختبار", status: "active", key: "starter-template", url: "/p/test-device" });
  assert.equal((await call(productsRoute.POST, "/api/products", { method: "POST", body: { slug: "x" }, ...admin })).status, 400);
});

await test("product edit keeps the page: PUT /api/products refreshes title/status only; content, sections, component and id survive", async () => {
  await call(lpRoute.PATCH, "/api/landing-pages", { method: "PATCH", body: { id: createdLpId, content_config: { hero_title: "عنوان مخصص", faq_items: [{ q: "س", a: "ج" }] } }, ...admin });
  await call(lpRoute.PATCH, "/api/landing-pages", { method: "PATCH", body: { id: createdLpId, sections_config: [{ id: "hero", name_ar: "الرئيسي", enabled: false }] }, ...admin });
  run("UPDATE landing_pages SET component_key = 'mesh-nebulizer', meta_pixel_id = '1234567890' WHERE id = ?", createdLpId);
  kvReset(); d1Reset();
  const res = await call(productsRoute.PUT, "/api/products", { method: "PUT", body: { ...saved, title_ar: "جهاز اختبار محدث", status: "draft" }, ...admin });
  assert.equal(res.status, 200);
  assert.deepEqual(d1Calls, { query: 0, batch: 1 });
  assert.deepEqual(kvOps(), NO_KV);
  const lp = await dbStore.getLandingPage("test-device");
  assert.deepEqual({ id: lp.id, title: lp.title, status: lp.status, key: lp.component_key, pixel: lp.meta_pixel_id, hero: lp.content_config.hero_title, sections: lp.sections_config.length },
    { id: createdLpId, title: "جهاز اختبار محدث", status: "paused", key: "mesh-nebulizer", pixel: "1234567890", hero: "عنوان مخصص", sections: 1 });
  assert.equal(lp.product.title_ar, "جهاز اختبار محدث");
  // skip_lp_sync (used by the page editor) saves the product only
  d1Reset();
  await call(productsRoute.PUT, "/api/products", { method: "PUT", body: { ...saved, title_ar: "بدون مزامنة", status: "active", skip_lp_sync: true }, ...admin });
  assert.equal((await repo.getLandingPage("test-device")).title, "جهاز اختبار محدث");
  // a failed transaction saves neither the product nor the page
  await assert.rejects(failingRepo().saveProduct({ ...saved, id: "prod-atomic", slug: "atomic" }, { id: "lp-atomic", slug: "atomic", product_id: "prod-atomic", title: "x", component_key: "starter-template", status: "active", created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" }));
  assert.equal(count("products", "id = 'prod-atomic'") + count("landing_pages", "id = 'lp-atomic'"), 0);
  saved = (await call(productsRoute.PUT, "/api/products", { method: "PUT", body: { ...saved, title_ar: "جهاز اختبار", status: "active" }, ...admin })).body.product;
});

await test("landing page API: create, read by id and slug, content / sections / status patches, auto-page for a product, delete", async () => {
  const created = (await call(lpRoute.POST, "/api/landing-pages", { method: "POST", body: { product_id: saved.id, title: "صفحة ثانية", slug: "second-page", meta_capi_token: "EAAB-secret-capi-token" }, ...admin })).body.landingPage;
  assert.match(created.id, /^lp-\d+$/);
  assert.equal(created.sections_config.length > 3, true, "default sections are returned");
  const byId = (await call(lpRoute.GET, "/api/landing-pages?id=" + created.id, admin)).body;
  const bySlug = (await call(lpRoute.GET, "/api/landing-pages?id=second-page", admin)).body;
  assert.equal(byId.success, true);
  assert.deepEqual(byId.landingPage, bySlug.landingPage);
  assert.equal(byId.landingPage.product.id, saved.id);
  assert.equal(byId.landingPage.product.offers.length, 3);
  const patched = (await call(lpRoute.PATCH, "/api/landing-pages", { method: "PATCH", body: { id: "second-page", content_config: { hero_title: "ب" } }, ...admin })).body.landingPage;
  assert.equal(patched.content_config.hero_title, "ب");
  assert.equal((await call(lpRoute.PATCH, "/api/landing-pages", { method: "PATCH", body: { id: created.id, status: "paused" }, ...admin })).body.success, true);
  assert.equal((await dbStore.getLandingPage("second-page")).status, "paused");
  assert.equal((await call(lpRoute.PATCH, "/api/landing-pages", { method: "PATCH", body: { id: "no-such-page", content_config: { hero_title: "x" } }, ...admin })).body.landingPage, null);
  const list = (await call(lpRoute.GET, "/api/landing-pages", admin)).body.landingPages;
  assert.deepEqual(list.map((l) => l.slug).sort(), ["second-page", "test-device"]);
  assert.ok(list.every((l) => l.product?.id === saved.id && Array.isArray(l.sections_config)));
  // a product without a stored page still gets a synthesized one (same as the KV backend)
  const lonely = await dbStore.saveProduct(productBody({ slug: "lonely", sku: "L1", offers: [] }));
  const auto = await dbStore.getLandingPage("lonely");
  assert.deepEqual({ id: auto.id, slug: auto.slug, key: auto.component_key }, { id: "lp-auto-" + lonely.id, slug: "lonely", key: "starter-template" });
  await dbStore.deleteProduct(lonely.id);
  assert.equal((await call(lpRoute.DELETE, "/api/landing-pages?id=" + created.id, { method: "DELETE", ...admin })).body.success, true);
  assert.equal(count("landing_pages", "slug = 'second-page'"), 0);
});

await test("read cache: second read is served from memory; a write in this isolate invalidates at once; results are copies", async () => {
  catalog.invalidateCatalogCache();
  d1Reset();
  const first = await dbStore.getProduct("test-device");
  assert.deepEqual(d1Calls, { query: 1, batch: 0 }, "one indexed query for product + offers");
  first.title_ar = "تعديل محلي"; first.offers.pop();
  const second = await dbStore.getProduct("test-device");
  assert.deepEqual(d1Calls, { query: 1, batch: 0 }, "cache hit");
  assert.equal(second.title_ar, "جهاز اختبار");
  assert.equal(second.offers.length, 3, "a caller's mutation never reaches the cache");
  await dbStore.saveProduct({ ...saved, base_price: 649 });
  d1Reset();
  assert.equal((await dbStore.getProduct("test-device")).base_price, 649);
  assert.equal(d1Calls.query, 1, "the write cleared the cache");
  await dbStore.getProduct("nobody-home"); d1Reset();
  await dbStore.getProduct("nobody-home");
  assert.equal(d1Calls.query, 0, "misses are cached too (unknown slugs cannot hammer D1)");
  saved = await dbStore.saveProduct({ ...saved, base_price: 599 });
});

await test("read cache staleness: a write made by ANOTHER isolate shows up after the TTL (30 s default); TTL 0 disables the cache", async () => {
  await dbStore.getProduct("test-device");
  await otherIsolate().saveProduct({ ...saved, title_ar: "من عازل آخر" });
  assert.equal((await dbStore.getProduct("test-device")).title_ar, "جهاز اختبار", "still the cached copy");
  const realNow = Date.now;
  Date.now = () => realNow() + 31000;
  try {
    assert.equal((await dbStore.getProduct("test-device")).title_ar, "من عازل آخر", "fresh after the TTL");
  } finally { Date.now = realNow; }
  await withEnv({ CATALOG_CACHE_TTL_SECONDS: "0" }, async () => {
    await otherIsolate().saveProduct({ ...saved, title_ar: "بدون كاش" });
    assert.equal((await dbStore.getProduct("test-device")).title_ar, "بدون كاش");
    d1Reset();
    await dbStore.getProduct("test-device"); await dbStore.getProduct("test-device");
    assert.equal(d1Calls.query, 2);
  });
  // admin API reads bypass the cache: the editor always sees the latest save, whichever isolate made it
  await dbStore.getProducts(); await dbStore.getLandingPage("test-device"); await dbStore.getSettings();
  await otherIsolate().saveProduct({ ...saved, title_ar: "أحدث حفظ" });
  await otherIsolate().patchLandingPage("test-device", { content_config: { hero_title: "أحدث محتوى" } });
  await otherIsolate().setSettings({ store_tagline: "أحدث إعداد" });
  assert.equal((await call(productsRoute.GET, "/api/products")).body.products.find((p) => p.id === saved.id).title_ar !== "أحدث حفظ", true, "a visitor request may still be served the cached list");
  assert.equal((await call(productsRoute.GET, "/api/products", admin)).body.products.find((p) => p.id === saved.id).title_ar, "أحدث حفظ");
  await otherIsolate().patchLandingPage("test-device", { content_config: { hero_title: "أحدث محتوى 2" } });
  assert.equal((await call(lpRoute.GET, "/api/landing-pages?id=test-device", admin)).body.landingPage.content_config.hero_title, "أحدث محتوى 2");
  await otherIsolate().setSettings({ store_tagline: "أحدث إعداد 2" });
  assert.equal((await call(settingsRoute.GET, "/api/settings", admin)).body.settings.store_tagline, "أحدث إعداد 2");
  await repo.patchLandingPage("test-device", { content_config: { hero_title: "عنوان مخصص" } });
  run("DELETE FROM settings");
  saved = await dbStore.saveProduct({ ...saved });
});

await test("public page view on d1: ZERO KV operations; cold = 3 small indexed queries (page, product+offers, settings), warm = none", async () => {
  catalog.invalidateCatalogCache();
  kvReset(); d1Reset();
  const page = await dbStore.getLandingPage("test-device");
  const settings = await dbStore.getSettings();
  assert.equal(page.product.offers.length, 3);
  assert.equal(typeof settings.telegram_notifications_enabled, "boolean");
  assert.deepEqual(d1Calls, { query: 3, batch: 0 });
  assert.deepEqual(kvOps(), NO_KV);
  d1Reset();
  await dbStore.getLandingPage("test-device"); await dbStore.getSettings(); await dbStore.getProduct(saved.id);
  assert.deepEqual(d1Calls, { query: 0, batch: 0 }, "warm: served from the isolate cache, no D1 query at all");
  assert.deepEqual(kvOps(), NO_KV);
  const plan = (text, ...p) => sql("EXPLAIN QUERY PLAN " + text, ...p).map((r) => r.detail).join(" | ");
  const productPlan = plan(
    "SELECT p.*, o.id AS o_id FROM products p LEFT JOIN product_offers o ON o.store_id = p.store_id AND o.product_id = p.id WHERE p.store_id = ? AND p.id = (SELECT id FROM products WHERE store_id = ? AND (id = ? OR slug = ?) ORDER BY (id = ?) DESC LIMIT 1) ORDER BY o.position",
    "default", "default", "a", "a", "a");
  assert.doesNotMatch(productPlan, /SCAN (p|products|o|product_offers)(?! USING)/, productPlan);
  const lpPlan = plan("SELECT * FROM landing_pages WHERE store_id = ? AND (slug = ? OR id = ?) ORDER BY (slug = ?) DESC LIMIT 1", "default", "a", "a", "a");
  assert.match(lpPlan, /landing_pages_slug_uq/);
  assert.doesNotMatch(lpPlan, /SCAN landing_pages(?! USING)/, lpPlan);
});

await test("settings: saved per field (no read-modify-write), merged over built-in + env defaults, env fills empty secrets", async () => {
  catalog.invalidateCatalogCache();
  let s = await dbStore.getSettings();
  assert.equal(s.telegram_bot_token, "env-telegram-token-123456", "env secret is used while no override exists");
  assert.equal(s.safqa_auto_forward, true, "built-in default");
  kvReset(); d1Reset();
  s = await dbStore.updateSettings({ store_name: "متجر الاختبار", brand_primary: "emerald", meta_pixel_ids: ["1234567890123456"], home_config: { hero_title: "أهلاً" } });
  assert.deepEqual(kvOps(), NO_KV);
  assert.equal(d1Calls.batch, 1, "one transaction for the save");
  assert.equal(s.store_name, "متجر الاختبار");
  assert.deepEqual(s.meta_pixel_ids, ["1234567890123456"]);
  assert.equal(count("settings"), 4, "one row per changed field");
  await otherIsolate().setSettings({ support_phone: "01000000000" }); // a concurrent save of another field elsewhere
  await dbStore.updateSettings({ store_name: "اسم جديد", telegram_bot_token: "saved-telegram-token-abcdef" });
  s = await dbStore.getSettings();
  assert.deepEqual({ name: s.store_name, phone: s.support_phone, primary: s.brand_primary, hero: s.home_config.hero_title, token: s.telegram_bot_token },
    { name: "اسم جديد", phone: "01000000000", primary: "emerald", hero: "أهلاً", token: "saved-telegram-token-abcdef" });
  await dbStore.updateSettings({ telegram_bot_token: "" });
  assert.equal((await dbStore.getSettings()).telegram_bot_token, "env-telegram-token-123456", "an emptied secret falls back to env");
});

await test("settings API: secrets and Conversions API tokens are masked; a masked value sent back keeps the stored secret; zero KV writes", async () => {
  kvReset();
  const post = (body) => call(settingsRoute.POST, "/api/settings", { method: "POST", body, ...admin });
  const res = await post({
    telegram_bot_token: "1234567890:AAExampleTelegramBotToken", safqa_api_secret_token: "safqa-secret-token-000111",
    meta_capi_entries: [{ pixel_id: "1234567890123456", token: "EAABsecretConversionsApiToken0001", test_code: "TEST123" }],
    brand_primary: "not-a-palette", logo_url: "javascript:alert(1)", support_phone: "+20 100-000 0000<script>",
  });
  assert.equal(res.status, 200);
  const shown = res.body.settings;
  assert.equal(shown.telegram_bot_token, "1234...oken");
  assert.equal(shown.safqa_api_secret_token, "safq...0111");
  assert.deepEqual(shown.meta_capi_entries, [{ pixel_id: "1234567890123456", test_code: "TEST123", token: "EAAB...0001" }]);
  assert.equal(shown.brand_primary, "emerald", "the sanitizers still run: an unknown palette is dropped");
  assert.notEqual(shown.logo_url, "javascript:alert(1)");
  assert.equal(shown.support_phone, "+201000000000");
  const text = JSON.stringify((await call(settingsRoute.GET, "/api/settings", admin)).body);
  for (const secret of ["AAExampleTelegramBotToken", "safqa-secret-token-000111", "EAABsecretConversionsApiToken0001"]) assert.equal(text.includes(secret), false);
  await post({ telegram_bot_token: shown.telegram_bot_token, meta_capi_entries: shown.meta_capi_entries, store_tagline: "شعار" });
  const stored = await dbStore.getSettings();
  assert.equal(stored.telegram_bot_token, "1234567890:AAExampleTelegramBotToken");
  assert.equal(stored.meta_capi_entries[0].token, "EAABsecretConversionsApiToken0001");
  assert.equal(stored.store_tagline, "شعار");
  assert.equal((await post({ ga4_measurement_id: "<script>" })).status, 400);
  assert.equal(kv.put, 0);
  const { middleware } = await mod("middleware.ts");
  assert.equal(middleware(request("/api/settings")).status, 401, "settings stay admin-only");
});

await test("public vs admin shapes: visitors never get cost / supplier fields; pages and the page token stay behind the admin gate", async () => {
  const pub = (await call(productsRoute.GET, "/api/products")).body.products.find((p) => p.id === saved.id);
  const adm = (await call(productsRoute.GET, "/api/products", admin)).body.products.find((p) => p.id === saved.id);
  assert.equal("cost_price" in pub, false);
  assert.equal(adm.cost_price, 250);
  assert.deepEqual(Object.keys(pub).sort(), Object.keys(adm).filter((k) => k !== "cost_price").sort());
  await dbStore.saveLandingPage({ ...(await repo.getLandingPage("test-device")), meta_capi_token: "EAAB-page-level-secret" });
  assert.equal((await dbStore.getLandingPage("test-device")).meta_capi_token, "EAAB-page-level-secret", "server code can read it");
  const { middleware } = await mod("middleware.ts");
  for (const [url, method] of [["/api/landing-pages", "GET"], ["/api/landing-pages?id=test-device", "GET"], ["/api/products", "POST"], ["/api/products", "PUT"], ["/api/products?id=x", "DELETE"], ["/api/settings", "POST"], ["/api/admin/catalog-import", "POST"]]) {
    assert.equal(middleware(request(url, { method })).status, 401, `${method} ${url} must need an admin session`);
  }
  assert.equal(middleware(request("/api/products")).status, 200, "the public product list stays public");
  const pageSource = fs.readFileSync(path.join(src, "app/(landing)/p/[slug]/page.tsx"), "utf8");
  assert.equal((pageSource.match(/delete \w+\.meta_capi_token/g) || []).length >= 2, true, "the public page strips the token before rendering");
});

await test("same shapes on both backends: a product and its page saved on kv and on d1 read back identically", async () => {
  const body = productBody({ id: "prod-shape", slug: "shape-check", sku: "SH", created_at: "2026-02-01T00:00:00.000Z" });
  const lpBody = { id: "lp-shape", product_id: "prod-shape", title: "صفحة الشكل", slug: "shape-check", content_config: { hero_title: "ش" }, created_at: "2026-02-01T00:00:00.000Z" };
  const read = async () => {
    await dbStore.saveProduct(body);
    await dbStore.saveLandingPage(lpBody);
    const product = await dbStore.getProduct("shape-check");
    const page = await dbStore.getLandingPage("shape-check");
    const listed = (await dbStore.getProducts()).find((p) => p.id === "prod-shape");
    const strip = (o) => JSON.parse(JSON.stringify(o, (k, v) => (k === "updated_at" || k === "last_published_at" || (k === "product_id" && v === "") ? undefined : v)));
    return { product: strip(product), page: strip(page), listed: strip(listed) };
  };
  const onD1 = await read();
  const onKv = await withEnv({ CATALOG_BACKEND: "kv" }, read);
  // the only intended difference: D1 fills offer.product_id with the real product id (KV keeps the "" it was sent)
  for (const side of [onD1, onKv]) for (const p of [side.product, side.page.product, side.listed]) p.offers.forEach((o) => delete o.product_id);
  assert.deepEqual(onD1, onKv);
  await dbStore.deleteProduct("prod-shape");
  assert.equal(count("landing_pages", "id = 'lp-shape'"), 0, "deleting a product removes its pages");
});

await test("SQL injection attempts in ids / slugs / titles / settings keys / patches are inert; hostile text is stored literally", async () => {
  const before = { products: count("products"), pages: count("landing_pages") };
  const evil = "x'); DROP TABLE products; --";
  for (const key of [evil, "' OR '1'='1", "%", "_", "a\" OR 1=1 --"]) {
    assert.equal(await repo.getProduct(key), null);
    assert.equal(await repo.getLandingPage(key), null);
    assert.equal(await repo.deleteProduct(key), 0);
    assert.equal(await repo.deleteLandingPage(key), 0);
    assert.equal(await repo.patchLandingPage(key, { status: "paused" }), null);
  }
  assert.deepEqual({ products: count("products"), pages: count("landing_pages") }, before);
  const hostile = await dbStore.saveProduct(productBody({ id: "prod-evil", slug: "evil-slug", sku: evil, title_ar: evil, description_ar: "'; DELETE FROM settings; --", offers: [{ ...OFFERS[0], id: evil, title_ar: evil }] }));
  const back = await dbStore.getProduct(hostile.id);
  assert.deepEqual({ title: back.title_ar, sku: back.sku, offer: back.offers[0].id }, { title: evil, sku: evil, offer: evil });
  await repo.setSettings({ "store_name = 'x'; DROP TABLE settings; --": "x", "bad key": 1, good_key: evil });
  const overrides = await repo.getSettingsOverrides();
  assert.equal(overrides.good_key, evil);
  assert.equal(Object.keys(overrides).some((k) => /DROP|bad key/.test(k)), false, "malformed setting names are refused");
  // patch columns come from a constant whitelist: unknown keys are ignored
  await repo.patchLandingPage("test-device", { "title = 'pwned', slug": "x", meta_capi_token: "stolen", status: "active" });
  const lp = await repo.getLandingPage("test-device");
  assert.notEqual(lp.title, "pwned");
  assert.equal(lp.meta_capi_token, "EAAB-page-level-secret");
  for (const t of ["products", "product_offers", "landing_pages", "settings"]) assert.ok(count(t) >= 1, `${t} still exists`);
  await dbStore.deleteProduct(hostile.id);
  run("DELETE FROM settings WHERE key = 'good_key'");
  catalog.invalidateCatalogCache();
});

await test("write budget: product save, page content save and settings save on d1 cost ZERO KV writes (the kv backend costs 6 / 3 / 1)", async () => {
  kvReset();
  await call(productsRoute.PUT, "/api/products", { method: "PUT", body: { ...saved, base_price: 610 }, ...admin });
  await call(lpRoute.PATCH, "/api/landing-pages", { method: "PATCH", body: { id: "test-device", content_config: { hero_title: "بلا كتابة KV" } }, ...admin });
  await call(settingsRoute.POST, "/api/settings", { method: "POST", body: { store_tagline: "بلا كتابة KV" }, ...admin });
  await call(productsRoute.DELETE, "/api/products?id=does-not-exist", { method: "DELETE", ...admin });
  assert.deepEqual(kvOps(), NO_KV, "no KV read, write, delete or list at all");
  await withEnv({ CATALOG_BACKEND: "kv" }, async () => {
    kvReset();
    await call(productsRoute.PUT, "/api/products", { method: "PUT", body: { ...productBody({ id: "prod-kv-cost", slug: "kv-cost" }) }, ...admin });
    assert.equal(kv.put, 6, "kv backend: 3 writes for the product + 3 for its page");
    kvReset();
    await call(lpRoute.PATCH, "/api/landing-pages", { method: "PATCH", body: { id: "kv-cost", content_config: { hero_title: "x" } }, ...admin });
    assert.equal(kv.put, 3);
    kvReset();
    await call(settingsRoute.POST, "/api/settings", { method: "POST", body: { store_tagline: "kv" }, ...admin });
    assert.equal(kv.put, 1);
  });
  for (const k of [...kv.store.keys()]) kv.store.delete(k);
  saved = await dbStore.saveProduct({ ...saved, base_price: 599 });
});

await test("importer: dry run writes nothing; paged import copies products + offers, pages and settings; totals match the source", async () => {
  await withEnv({ STORE_ID: "import-test" }, async () => {
    const P = (n, over = {}) => ({ ...productBody({ id: "prod-kv-" + n, slug: "kv-product-" + n, sku: "KV" + n }), created_at: `2026-03-0${n}T00:00:00.000Z`, updated_at: `2026-03-0${n}T10:00:00.000Z`, safka_product_id: "sfk-" + n, ...over });
    const L = (n, over = {}) => ({ id: "lp-kv-" + n, product_id: "prod-kv-" + n, title: "صفحة " + n, slug: "kv-product-" + n, component_key: "starter-template", status: "active",
      content_config: { hero_title: "عنوان " + n }, sections_config: [{ id: "hero", name_ar: "الرئيسي", enabled: true }], meta_capi_token: "EAAB-kv-token-" + n,
      created_at: `2026-03-0${n}T00:00:00.000Z`, updated_at: `2026-03-0${n}T10:00:00.000Z`, product: { id: "relation-must-not-be-stored" }, ...over });
    const products = [P(1), P(2), P(3)];
    const pages = [L(1), L(2)];
    kvSeed("custom_products_all", [...products, { broken: true }]);
    kvSeed("custom_lps_all", pages);
    for (const p of products) { kvSeed("prod:" + p.id, p); kvSeed("prod:" + p.slug, p); }
    for (const l of pages) { kvSeed("lp:" + l.id, l); kvSeed("lp:" + l.slug, l); }
    // the per-key copy of page 2 is newer than its list entry (a lagging list write)
    kvSeed("lp:lp-kv-2", L(2, { updated_at: "2026-03-09T00:00:00.000Z", content_config: { hero_title: "أحدث نسخة" } }));
    // leftovers: an old-slug copy of product 1, and the slug key of a product that was deleted
    kvSeed("prod:old-slug-of-1", P(1, { slug: "old-slug-of-1" }));
    kvSeed("prod:deleted-product", P(9, { id: "prod-deleted", slug: "deleted-product" }));
    kvSeed("system_settings_overrides", { store_name: "متجر KV", telegram_bot_token: "kv-telegram-token-777777", meta_capi_entries: [{ pixel_id: "1", token: "kv-capi" }] });

    kvReset();
    const dry = await importer.importKvCatalogToD1({ dryRun: true });
    assert.deepEqual(dry.source, { products: 3, landing_pages: 2, settings_keys: 3, orphan_product_keys: 2, orphan_landing_page_keys: 0, total: 5 });
    assert.deepEqual(dry.d1, { products: 0, offers: 0, landing_pages: 0, settings: 0 }, "a dry run writes nothing");
    assert.equal(dry.settings, null);

    let offset = 0, report, calls = 0;
    const totals = { products: 0, pages: 0 };
    do {
      d1Reset();
      report = await importer.importKvCatalogToD1({ offset, limit: 2 });
      assert.ok(d1Calls.query + d1Calls.batch <= 12, `one page stays far below the 50-queries limit (used ${d1Calls.query + d1Calls.batch})`);
      totals.products += report.products.inserted; totals.pages += report.landing_pages.inserted;
      offset = report.next_offset; calls++;
    } while (!report.done);
    assert.equal(calls, 3);
    assert.deepEqual(totals, { products: 3, pages: 2 });
    assert.deepEqual(report.d1, { products: 3, offers: 9, landing_pages: 2, settings: 3 });
    assert.deepEqual(report.conflicts, []);
    assert.equal(kv.put + kv.delete, 0, "the import only reads KV");

    const p1 = await dbStore.getProduct("kv-product-1");
    assert.equal(p1.safka_product_id, "sfk-1", "fields without a column are kept (extra)");
    assert.equal(p1.offers.length, 3);
    const lp2 = await dbStore.getLandingPage("kv-product-2");
    assert.equal(lp2.content_config.hero_title, "أحدث نسخة", "the newer per-key record won");
    assert.equal(lp2.meta_capi_token, "EAAB-kv-token-2");
    assert.equal(lp2.product.id, "prod-kv-2", "the relation is re-attached on read, never stored");
    assert.equal(sql("SELECT extra FROM landing_pages WHERE id = 'lp-kv-2'")[0].extra, null);
    assert.equal(await catalog.getCatalogRepo().getProduct("deleted-product"), null, "a leftover key does not bring a deleted product back");
    const s = await dbStore.getSettings();
    assert.deepEqual({ name: s.store_name, token: s.telegram_bot_token }, { name: "متجر KV", token: "kv-telegram-token-777777" });
    assert.deepEqual((await catalog.getCatalogRepo().listProducts()).map((p) => p.id).sort(), ["prod-kv-1", "prod-kv-2", "prod-kv-3"], "only what KV listed is in D1 (no built-in demo products)");
  });
});

await test("importer is idempotent: a second run changes nothing; newer KV copies update; D1 edits and settings are not clobbered; orphans on request", async () => {
  await withEnv({ STORE_ID: "import-test" }, async () => {
    const again = await importer.importKvCatalogToD1({ limit: 100 });
    assert.deepEqual([again.products, again.landing_pages], [{ inserted: 0, updated: 0, unchanged: 3 }, { inserted: 0, updated: 0, unchanged: 2 }]);
    assert.deepEqual(again.settings, { written: 0, kept: 3 });
    assert.deepEqual(again.d1, { products: 3, offers: 9, landing_pages: 2, settings: 3 });

    // an edit made in D1 after the import (newer) survives a re-import; settings too
    await dbStore.saveProduct({ ...(await dbStore.getProduct("prod-kv-1")), title_ar: "عُدّل في D1" });
    await dbStore.updateSettings({ store_name: "عُدّل في D1" });
    // an edit made in KV after the import (newer than D1) is picked up
    const list = kvRead("custom_products_all");
    list[1] = { ...list[1], title_ar: "عُدّل في KV", updated_at: "2099-01-01T00:00:00.000Z", offers: [OFFERS[0]] };
    kvSeed("custom_products_all", list);
    // a page whose slug now belongs to another id in D1 is reported, not overwritten
    const lps = kvRead("custom_lps_all");
    kvSeed("custom_lps_all", [...lps, { id: "lp-kv-clash", product_id: "prod-kv-1", title: "تعارض", slug: "kv-product-1", created_at: "2026-03-01T00:00:00.000Z", updated_at: "2099-01-01T00:00:00.000Z" }]);
    const third = await importer.importKvCatalogToD1({ limit: 100 });
    assert.deepEqual(third.products, { inserted: 0, updated: 1, unchanged: 2 });
    assert.deepEqual(third.conflicts, ["lp-kv-clash"]);
    assert.equal((await dbStore.getProduct("prod-kv-1")).title_ar, "عُدّل في D1");
    const p2 = await dbStore.getProduct("prod-kv-2");
    assert.deepEqual({ title: p2.title_ar, offers: p2.offers.length }, { title: "عُدّل في KV", offers: 1 });
    assert.equal((await dbStore.getSettings()).store_name, "عُدّل في D1");
    assert.equal((await catalog.getCatalogRepo().getLandingPage("kv-product-1")).id, "lp-kv-1");
    assert.deepEqual((await importer.importKvCatalogToD1({ limit: 100, overwriteSettings: true })).settings, { written: 3, kept: 0 });
    assert.equal((await dbStore.getSettings()).store_name, "متجر KV");

    const orphans = await importer.importKvCatalogToD1({ limit: 100, includeOrphans: true });
    assert.equal(orphans.source.total, 8);
    assert.equal(orphans.skipped_stale, 1, "the old-slug copy of a listed product is skipped");
    assert.equal(orphans.products.inserted, 1, "the unlisted product is imported only on request");
    assert.equal((await catalog.getCatalogRepo().getProduct("prod-deleted")).slug, "deleted-product");
    run("DELETE FROM products WHERE store_id = 'import-test'"); run("DELETE FROM product_offers WHERE store_id = 'import-test'");
    run("DELETE FROM landing_pages WHERE store_id = 'import-test'"); run("DELETE FROM settings WHERE store_id = 'import-test'");
  });
});

await test("import endpoint is admin-only and reports totals without leaking settings values or tokens", async () => {
  assert.equal((await call(importRoute.POST, "/api/admin/catalog-import", { method: "POST", body: {} })).status, 401);
  assert.equal((await call(importRoute.GET, "/api/admin/catalog-import")).status, 401);
  const status = await call(importRoute.GET, "/api/admin/catalog-import", admin);
  assert.equal(status.status, 200);
  assert.deepEqual({ backend: status.body.backend, available: status.body.d1.available, kv: status.body.kv },
    { backend: "d1", available: true, kv: { available: true, products: 3, landing_pages: 3, settings_keys: 3 } });
  const dry = await call(importRoute.POST, "/api/admin/catalog-import", { method: "POST", body: { dry_run: true }, ...admin });
  assert.equal(dry.body.report.source.total, 6);
  const text = JSON.stringify(dry.body) + JSON.stringify(status.body);
  for (const secret of ["kv-telegram-token", "kv-capi", "EAAB-kv-token", "متجر KV"]) assert.equal(text.includes(secret), false);
  await withEnv({ D1_REST_BASE_URL: "" }, async () => {
    assert.equal((await call(importRoute.POST, "/api/admin/catalog-import", { method: "POST", body: {}, ...admin })).status, 503);
  });
  for (const k of [...kv.store.keys()]) kv.store.delete(k);
});

await test("CATALOG_KV_MIRROR=1 (verification period): every d1 write is also copied to KV, so a rollback to kv loses nothing", async () => {
  await withEnv({ CATALOG_KV_MIRROR: "1" }, async () => {
    kvReset();
    const res = await call(productsRoute.POST, "/api/products", { method: "POST", body: productBody({ slug: "mirrored", sku: "MR", title_ar: "منتج معكوس" }), ...admin });
    assert.equal(kv.put, 6, "the same 6 KV writes as the kv backend");
    const id = res.body.product.id;
    assert.equal(kvRead("prod:" + id).title_ar, "منتج معكوس");
    assert.equal(kvRead("custom_products_all")[0].id, id);
    assert.equal(kvRead("lp:mirrored").id, res.body.landing_page_id);
    await call(lpRoute.PATCH, "/api/landing-pages", { method: "PATCH", body: { id: "mirrored", content_config: { hero_title: "معكوس" } }, ...admin });
    assert.equal(kvRead("lp:mirrored").content_config.hero_title, "معكوس");
    assert.equal(kvRead("custom_lps_all")[0].content_config.hero_title, "معكوس");
    await dbStore.updateSettings({ store_tagline: "معكوس" });
    assert.equal(kvRead("system_settings_overrides").store_tagline, "معكوس");
    assert.equal(kvRead("system_settings_overrides").store_name, "اسم جديد", "the mirror holds the full overrides, not only the last change");
  });
  await withEnv({ CATALOG_BACKEND: "kv" }, async () => {
    d1Reset();
    const page = await dbStore.getLandingPage("mirrored");
    assert.deepEqual({ title: page.product.title_ar, hero: page.content_config.hero_title, offers: page.product.offers.length }, { title: "منتج معكوس", hero: "معكوس", offers: 3 });
    assert.equal((await dbStore.getSettings()).store_tagline, "معكوس");
    assert.deepEqual(d1Calls, { query: 0, batch: 0 });
  });
  await withEnv({ CATALOG_KV_MIRROR: "1" }, async () => {
    const id = kvRead("lp:mirrored").product_id;
    await dbStore.deleteLandingPage("mirrored");
    assert.equal(kvRead("lp:mirrored"), null);
    assert.equal(kvRead("custom_lps_all").length, 0);
    await dbStore.deleteProduct(id);
    assert.equal(kvRead("prod:" + id), null);
    assert.equal(kvRead("custom_products_all").length, 0);
  });
});

await test("rollback: CATALOG_BACKEND=kv (or unset) works unchanged through KV and never touches D1", async () => {
  for (const k of [...kv.store.keys()]) kv.store.delete(k);
  await withEnv({ CATALOG_BACKEND: "" }, async () => {
    const before = { products: count("products"), pages: count("landing_pages"), settings: count("settings") };
    kvReset(); d1Reset();
    const res = await call(productsRoute.POST, "/api/products", { method: "POST", body: productBody({ slug: "kv-only", sku: "KO" }), ...admin });
    assert.equal(res.status, 200);
    assert.equal(kv.put, 6);
    const page = await dbStore.getLandingPage("kv-only");
    assert.equal(page.product.id, res.body.product.id);
    await dbStore.updateSettings({ store_tagline: "على KV" });
    assert.equal((await dbStore.getSettings()).store_tagline, "على KV");
    assert.equal((await dbStore.getProducts()).some((p) => p.slug === "kv-only"), true);
    await dbStore.deleteLandingPage(page.id);
    await dbStore.deleteProduct(res.body.product.id);
    assert.deepEqual(d1Calls, { query: 0, batch: 0 });
    assert.deepEqual({ products: count("products"), pages: count("landing_pages"), settings: count("settings") }, before);
  });
});

await test("d1 selected but unavailable: saves fail loudly (500) and nothing is written to KV; settings fall back to defaults", async () => {
  await quiet(async () => {
    await withEnv({ D1_REST_BASE_URL: "" }, async () => {
      kvReset();
      const res = await call(productsRoute.POST, "/api/products", { method: "POST", body: productBody({ slug: "nowhere" }), ...admin });
      assert.equal(res.status, 500);
      assert.equal(res.body.success, false);
      assert.equal((await call(settingsRoute.POST, "/api/settings", { method: "POST", body: { store_tagline: "x" }, ...admin })).status, 500);
      assert.equal(kv.put, 0);
      const s = await dbStore.getSettings(); // does not throw: this isolate's memory + env defaults
      assert.equal(typeof s.telegram_bot_token, "string");
      assert.equal(s.safqa_auto_forward, true);
      await assert.rejects(dbStore.getProduct("test-device"));
    });
  });
});

await finish();
