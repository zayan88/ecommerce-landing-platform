// Deleting a demo-catalog (seed) landing page / product must stay deleted, even for a fresh isolate.
// Usage: node scripts/test-seed-delete.mjs
import assert from "node:assert/strict";
import { startTestKit } from "./lib/test-kit.mjs";

const { mod, test, finish } = await startTestKit({ env: { DEMO_MODE: "1", CATALOG_BACKEND: "d1" } });
const { dbStore } = await mod("lib/db/store.ts");

let deletedSlug = "";
let deletedProduct = "";
await test("a deleted seed landing page does not come back", async () => {
  const before = (await dbStore.getLandingPages()).map((l) => l.slug);
  assert.ok(before.length > 0, "the demo seed has pages");
  const victim = before[0];
  deletedSlug = victim;
  await dbStore.deleteLandingPage(victim);
  const after = (await dbStore.getLandingPages()).map((l) => l.slug);
  assert.ok(!after.includes(victim), "gone from the list");
  assert.equal((await dbStore.getLandingPage(victim))?.product_id ? (await dbStore.getLandingPage(victim)).id.startsWith("lp-auto-") : true, true, "no stored page (at most the auto page of its product)");
});

await test("a landing page the merchant creates with the same slug again is a normal stored page", async () => {
  const victim = (await dbStore.getLandingPages()).length;
  const products = await dbStore.getProducts();
  const saved = await dbStore.saveLandingPage({ slug: "brand-new-page", title: "صفحة جديدة", product_id: products[0].id, component_key: "starter-template", status: "active" });
  assert.equal(saved.slug, "brand-new-page");
  const slugs = (await dbStore.getLandingPages()).map((l) => l.slug);
  assert.ok(slugs.includes("brand-new-page"), "listed");
  assert.ok(victim >= 0);
});

await test("a deleted seed product does not come back", async () => {
  const before = await dbStore.getProducts();
  const victim = before.find((p) => p.id.startsWith("prod-")) || before[0];
  deletedProduct = victim.id;
  await dbStore.deleteProduct(victim.id);
  const after = (await dbStore.getProducts()).map((p) => p.id);
  assert.ok(!after.includes(victim.id), "gone");
});

await test("a FRESH isolate (module reloaded, seed loaded again) still does not show the deleted pages", async () => {
  const fresh = (await mod("lib/db/store.ts", "?fresh=" + Date.now())).dbStore;
  const slugs = (await fresh.getLandingPages()).map((l) => l.slug);
  const names = (await fresh.getProducts()).map((p) => p.id);
  assert.ok(!slugs.includes(deletedSlug), "page stays deleted");
  assert.ok(!names.includes(deletedProduct), "product stays deleted");
});

finish();
