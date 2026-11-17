// The webhook secret is only readable by the admin (the admin page builds the Safka links from it).
// Usage: node scripts/test-safka-secret.mjs
import assert from "node:assert/strict";
import { startTestKit } from "./lib/test-kit.mjs";
const { mod, request, test, finish } = await startTestKit({ env: { SAFQA_WEBHOOK_SECRET: "s3cret-value-123" } });
const route = await mod("app/api/safqa/[[...action]]/route.ts");
const { middleware } = await mod("middleware.ts");
const get = (admin) => route.GET(request("/api/safqa/webhook-secret", { admin }), { params: { action: ["webhook-secret"] } });

await test("only the admin gets the secret", async () => {
  assert.equal((await get(false)).status, 401);
  const ok = await get(true);
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).secret, "s3cret-value-123");
});
await test("the middleware does not make it public", () => {
  assert.equal(middleware(request("/api/safqa/webhook-secret", { method: "GET" })).status, 401);
});
finish();
