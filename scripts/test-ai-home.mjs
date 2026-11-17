// Tests for the copy/paste AI helper of the home page editor.
// Usage: node scripts/test-ai-home.mjs
import assert from "node:assert/strict";
import { startTestKit } from "./lib/test-kit.mjs";

const { mod, test, finish } = await startTestKit({});
const lib = await mod("lib/ai-home.ts");

await test("the prompt carries the brand, the notes, the products and every field", () => {
  const p = lib.buildHomePrompt({ brandName: "متجر النور", about: "بنبيع أجهزة منزلية", productNames: ["مكنسة", "خلاط"], lang: "ar" });
  for (const part of ["متجر النور", "بنبيع أجهزة منزلية", "مكنسة", "hero_title", "faq", "trust", "ممنوع تخترع"]) assert.ok(p.includes(part), part);
  assert.ok(lib.buildHomePrompt({ brandName: "X", about: "", productNames: [], lang: "en" }).includes("English"));
});

await test("a pasted answer is whitelisted, sanitized and fenced JSON is accepted", () => {
  const raw = "كلام قبل\n```json\n" + JSON.stringify({
    hero_title: "  أجهزة بتريّحك  ",
    hero_text: "ن".repeat(900),
    trust: [{ title: "معاينة", desc: "قبل الدفع" }, { title: "", desc: "" }],
    faq: [{ q: "سؤال؟", a: "جواب" }, { q: "ناقص", a: "" }],
    compare_old: ["عيب 1", "", "عيب 2"],
    evil_field: "<script>alert(1)</script>",
    hero_image: "javascript:alert(1)",
    hide: { faq: true },
    reviews: [{ name: "مخترع" }],
  }) + "\n```\nشكراً";
  const r = lib.parseHomeAi(raw);
  assert.ok(!r.error, r.error);
  assert.equal(r.content.hero_title, "أجهزة بتريّحك");
  assert.equal(r.content.hero_text.length, 500, "clipped by the home sanitizer");
  assert.deepEqual(r.content.trust, [{ title: "معاينة", desc: "قبل الدفع" }]);
  assert.deepEqual(r.content.faq, [{ q: "سؤال؟", a: "جواب" }]);
  assert.deepEqual(r.content.compare_old, ["عيب 1", "عيب 2"]);
  assert.equal(r.content.evil_field, undefined);
  assert.equal(r.content.hero_image, undefined, "images are never taken from the AI");
  assert.equal(r.content.hide, undefined, "hidden sections are never changed by the AI");
  assert.equal(r.content.reviews, undefined);
});

await test("empty fields do not wipe the page, and bad answers give a clear error", () => {
  const r = lib.parseHomeAi('{"hero_title":"عنوان","hero_cta":"","faq":[],"trust":[]}');
  assert.deepEqual(Object.keys(r.content), ["hero_title"], "empty text / empty lists are dropped");
  assert.ok(lib.parseHomeAi("مفيش جيسون هنا").error);
  assert.ok(lib.parseHomeAi('{"unknown":"x"}').error);
  assert.ok(lib.parseHomeAi("[1,2]").error);
});

finish();
