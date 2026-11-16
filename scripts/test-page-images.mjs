// Tests for the landing page image budget (src/lib/page-images.ts).
// Usage: node scripts/test-page-images.mjs        (Node >= 22.15; exits 1 on any failure)
import assert from "node:assert/strict";
import { startTestKit } from "./lib/test-kit.mjs";

const { mod, test, finish } = await startTestKit({ env: {} });
const m = await mod("lib/page-images.ts");

const G = ["/a", "/b", "/c", "/d", "/e", "/f"];

await test("only the first 4 gallery pictures count (the rest are never shown)", () => {
  assert.equal(m.pageImageCount(G, {}), 4);
});

await test("page images that reuse a gallery picture count once", () => {
  assert.equal(m.pageImageCount(G, { comparison_image: "/b", box_image: "/c" }), 4);
});

await test("new page images add up; the 5th is allowed, the 6th is blocked", () => {
  assert.equal(m.pageImageCount(G, { hero_image: "/x" }), 5);
  assert.equal(m.wouldExceedImageLimit(G, { hero_image: "/x" }, "comparison_image", "/y"), true);
  assert.equal(m.wouldExceedImageLimit(G, {}, "hero_image", "/x"), false);
});

await test("replacing a picture or reusing an existing one is never blocked, even at the limit", () => {
  const c = { hero_image: "/x" };
  assert.equal(m.wouldExceedImageLimit(G, c, "hero_image", "/z"), false);
  assert.equal(m.wouldExceedImageLimit(G, c, "comparison_image", "/a"), false);
  assert.equal(m.wouldExceedImageLimit(G, c, "box_image", ""), false);
});

await finish();
