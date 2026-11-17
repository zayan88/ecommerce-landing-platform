// Tests for the editable home page content (defaults, sanitizing, merge).
// Usage: node scripts/test-home-content.mjs
import assert from "node:assert/strict";
import { startTestKit } from "./lib/test-kit.mjs";

const { mod, test, finish } = await startTestKit({});
const lib = await mod("lib/home-content.ts");

await test("defaults exist in both languages and mention the brand", () => {
  for (const l of ["ar", "en"]) {
    const d = lib.defaultHomeContent(l, "Nour");
    assert.ok(d.hero_title && d.hero_cta && d.faq.length >= 3 && d.trust.length === 4 && d.features.length === 3 && d.steps.length === 3, l);
    assert.ok(JSON.stringify(d).includes("Nour"), l + " uses the brand name");
  }
  assert.ok(!/[\u0600-\u06FF]/.test(JSON.stringify(lib.defaultHomeContent("en", "Nour"))), "English defaults have no Arabic");
});

await test("sanitize: missing = default, saved empty = deleted, clips lengths, drops junk and bad image urls", () => {
  const s = lib.sanitizeHomeContent({
    hero_title: "  عنوان جديد  ",
    hero_text: "x".repeat(2000),
    hero_cta: "",
    hero_image: "javascript:alert(1)",
    faq: [{ q: "سؤال", a: "جواب" }, { q: "", a: "ناقص" }, "bad"],
    trust: [{ title: "a", desc: "b" }, { title: "", desc: "" }],
    compare_old: ["نقطة", "", 5],
    steps: "not a list",
    hide: { faq: true, nonsense: true, reviews: "yes" },
    evil: "<script>",
  });
  assert.equal(s.hero_title, "عنوان جديد");
  assert.equal(s.hero_text.length, 500);
  assert.equal(s.hero_cta, "", "an empty saved field means the element was deleted");
  assert.equal(s.hero_image, undefined, "a bad image url is dropped (falls back)");
  assert.equal(s.hero_badge, undefined, "a missing field stays missing (default)");
  assert.deepEqual(s.faq, [{ q: "سؤال", a: "جواب" }]);
  assert.equal(s.trust.length, 1);
  assert.deepEqual(s.compare_old, ["نقطة"]);
  assert.equal(s.steps, undefined, "not a list: ignored");
  assert.deepEqual(lib.sanitizeHomeContent({ faq: [], compare_old: [], hero_image: "" }).faq, [], "an empty list stays empty");
  assert.deepEqual(lib.sanitizeHomeContent({ compare_old: [] }).compare_old, []);
  assert.equal(lib.sanitizeHomeContent({ hero_image: "" }).hero_image, "");
  assert.deepEqual(s.hide, { faq: true });
  assert.equal(s.evil, undefined);
  assert.equal(lib.sanitizeHomeContent({ hero_image: "/api/media/abc.webp" }).hero_image, "/api/media/abc.webp");
  assert.deepEqual(lib.sanitizeHomeContent(null), {}, "nothing saved = empty object (so 'customised' is false)");
});

await test("merge: saved fields override the defaults, the rest stays default", () => {
  const d = lib.defaultHomeContent("ar", "نور");
  const m = lib.mergeHomeContent(d, { hero_title: "عنواني", hide: { steps: true } });
  assert.equal(m.hero_title, "عنواني");
  assert.equal(m.hero_cta, d.hero_cta);
  assert.deepEqual(m.hide, { steps: true });
  assert.deepEqual(lib.mergeHomeContent(d, undefined).hide, {});
});

await finish();
