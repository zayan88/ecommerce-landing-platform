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

await test("prompt asks for title + description + questions in a fixed format", () => {
  const p = lib.buildDescriptionPrompt({ title: "جهاز", notes: "x" });
  for (const part of ["العنوان:", "الوصف:", "الأسئلة:", "س:", "كلمات:", "ج:"]) assert.ok(p.includes(part), part);
});

await test("one pasted answer fills title, description and the chat Q&A", () => {
  const raw = [
    "**العنوان:** مساج رقبة كهربائي بحرارة",
    "الوصف:",
    "راحة لرقبتك في 15 دقيقة",
    "- حرارة مريحة",
    "✅ 3 سرعات",
    "استخدمه 15 دقيقة يومياً",
    "الأسئلة:",
    "1. س: بيشتغل بالبطارية؟",
    "كلمات: بطارية، شحن",
    "ج: بيشتغل بالشحن، ومعاه كابل USB.",
    "وبيدوم ساعات.",
    "س: ينفع للعربية؟",
    "ج: أيوه، حجمه صغير.",
    "س: سؤال من غير إجابة",
  ].join("\n");
  const r = lib.parseAiProduct(raw);
  assert.equal(r.title, "مساج رقبة كهربائي بحرارة");
  assert.ok(r.description.startsWith("راحة لرقبتك") && r.description.includes("✅ حرارة مريحة") && r.description.includes("استخدمه 15 دقيقة"));
  assert.ok(!r.description.includes("العنوان") && !r.description.includes("بيشتغل بالبطارية"));
  assert.equal(r.faq.length, 2, "an unanswered question is dropped");
  assert.deepEqual(r.faq[0], { q: "بيشتغل بالبطارية؟", keywords: "بطارية، شحن", answer: "بيشتغل بالشحن، ومعاه كابل USB. وبيدوم ساعات." });
  assert.equal(r.faq[1].keywords, "");
});

await test("a free-form answer (no markers) still becomes just the description; limits are enforced", () => {
  const r = lib.parseAiProduct(["جهاز ممتاز", "- ميزة أولى", "- ميزة تانية"].join("\n"));
  assert.equal(r.title, "");
  assert.deepEqual(r.faq, []);
  assert.ok(r.description.includes("✅ ميزة أولى"));
  const many = ["العنوان: " + "ع".repeat(300), "الأسئلة:", ...Array.from({ length: 30 }, (_, k) => "س: سؤال " + k + "\nج: " + "ا".repeat(900))].join("\n");
  const m = lib.parseAiProduct(many);
  assert.equal(m.title.length, 120);
  assert.equal(m.faq.length, 15);
  assert.equal(m.faq[0].answer.length, 600);
});

await finish();
