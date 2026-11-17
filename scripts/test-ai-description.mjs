// Tests for the copy/paste AI product description helpers.
// Usage: node scripts/test-ai-description.mjs
import assert from "node:assert/strict";
import { startTestKit } from "./lib/test-kit.mjs";

const { mod, test, finish } = await startTestKit({});
const lib = await mod("lib/ai-description.ts");

await test("prompt carries the title, price and the merchant's notes and forbids invented facts", () => {
  const p = lib.buildDescriptionPrompt({ title: "جهاز مساج", notes: "بطارية 8 ساعات، 3 سرعات", price: 599, brandName: "متجر النور" });
  for (const part of ["جهاز مساج", "599", "بطارية 8 ساعات", "متجر النور", "ممنوع تخترع", "✅"]) assert.ok(p.includes(part), part);
  assert.ok(lib.buildDescriptionPrompt({ title: "", notes: "" }).includes("اكتب اسم المنتج"));
  assert.ok(lib.buildDescriptionPrompt({ title: "x", notes: "y".repeat(9000) }).length < 4500, "notes are capped");
});

await test("the AI answer is cleaned to plain text for the description box", () => {
  const raw = "```\n# عنوان\n**جهاز** مساج قوي\n- بطارية 8 ساعات\n* ثلاث سرعات\n\n\n\n✅ ضمان 14 يوم\n```";
  const t = lib.cleanAiDescription(raw);
  assert.ok(!t.includes("```") && !t.includes("**") && !t.includes("#"));
  assert.ok(t.includes("جهاز مساج قوي"));
  assert.ok(t.includes("✅ بطارية 8 ساعات") && t.includes("✅ ثلاث سرعات"));
  assert.ok(!/\n{3,}/.test(t));
  assert.equal(lib.cleanAiDescription("x".repeat(9000)).length, 3000);
  assert.equal(lib.cleanAiDescription(""), "");
});

await finish();
