// Tests for the storefront dictionary (Arabic / English).
// Usage: node scripts/test-i18n.mjs
import assert from "node:assert/strict";
import { startTestKit } from "./lib/test-kit.mjs";

const { mod, test, finish } = await startTestKit({});
const lib = await mod("lib/i18n.ts");

await test("every key has Arabic and English text with the same {placeholders}", () => {
  const entries = lib.i18nEntries();
  assert.ok(entries.length > 100, "dictionary is populated");
  const vars = (s) => (s.match(/\{[a-z_]+\}/g) || []).sort().join(",");
  for (const [k, e] of entries) {
    assert.ok(e.ar && e.ar.trim(), k + " ar");
    assert.ok(e.en && e.en.trim(), k + " en");
    assert.equal(vars(e.ar), vars(e.en), k + " placeholders");
    // (the switcher button shows the OTHER language, so it is the one allowed exception)
    if (!k.startsWith("lang_switch")) assert.ok(!/[\u0600-\u06FF]/.test(e.en), k + " English text has no Arabic letters");
  }
});

await test("tr() replaces variables, falls back to the key, and normalizes the language", () => {
  assert.equal(lib.tr("en", "offers.n_pieces", { n: 3 }), "3 pieces");
  assert.equal(lib.tr("ar", "offers.n_pieces", { n: 3 }), "3 قطع");
  assert.equal(lib.tr("en", "no.such.key"), "no.such.key");
  assert.equal(lib.normalizeLang("en"), "en");
  assert.equal(lib.normalizeLang("fr"), "ar");
  assert.equal(lib.dirOf("en"), "ltr");
  assert.equal(lib.dirOf("ar"), "rtl");
});

await test("offer labels and currency symbols are written for English readers", () => {
  assert.equal(lib.offerLabel("en", "خصم خاص"), "Special discount");
  assert.equal(lib.offerLabel("en", "تخفيض خاص من التاجر"), "تخفيض خاص من التاجر", "the merchant's own label is untouched");
  assert.equal(lib.offerLabel("ar", "خصم خاص"), "خصم خاص");
  assert.equal(lib.currencyEn("ج.م"), "EGP");
  assert.equal(lib.currencyEn("$"), "$");
});

await finish();
