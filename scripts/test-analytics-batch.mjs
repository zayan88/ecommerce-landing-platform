// Tests for the batched analytics endpoint (POST /api/analytics accepts { events: [...] }).
// Usage: node scripts/test-analytics-batch.mjs        (Node >= 22.15; exits 1 on any failure)
import assert from "node:assert/strict";
import { startTestKit } from "./lib/test-kit.mjs";

const { mod, call, test, finish } = await startTestKit({ env: {} });
const route = await mod("app/api/analytics/route.ts");

const post = (body) => call(route.POST, "/api/analytics", { method: "POST", body });
const ev = (name, extra = {}) => ({ event_name: name, visitor_id: "v1", session_id: "s1", page_url: "/p/x", landing_page_slug: "x", ...extra });

await test("a batch of events is accepted in one request", async () => {
  const res = await post({ events: [ev("PageView"), ev("ScrollDepth", { metadata: { depth: "50%" } }), ev("FormInteraction")] });
  assert.equal(res.status, 200);
  assert.equal(res.body.count, 3);
});

await test("a single event body still works (old clients / cached pages)", async () => {
  const res = await post(ev("PageView"));
  assert.equal(res.status, 200);
  assert.equal(res.body.count, 1);
});

await test("invalid entries are skipped; a batch with none valid is a 400", async () => {
  const mixed = await post({ events: [{ nothing: true }, ev("ClickCTA"), "junk", null] });
  assert.equal(mixed.body.count, 1);
  const none = await post({ events: [{}, 5] });
  assert.equal(none.status, 400);
});

await test("a batch is capped at 20 events", async () => {
  const res = await post({ events: Array.from({ length: 50 }, () => ev("ScrollDepth")) });
  assert.equal(res.body.count, 20);
});

await finish();
