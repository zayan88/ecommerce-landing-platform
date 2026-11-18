import { createHandler, cacheKind, cacheKeyFor } from "./edge-cache-entry.mjs";
let fails = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };

const store = new Map();
const cache = {
  async match(req) { const v = store.get(req.url); return v ? v.clone() : undefined; },
  async put(req, res) { store.set(req.url, res.clone()); },
};
let appLoads = 0, appCalls = 0;
const app = { default: { async fetch(req) { appCalls++; return new Response("<html>page</html>", { status: 200, headers: { "content-type": "text/html" } }); } } };
const h = createHandler(async () => { appLoads++; return app; }, cache);
const ctx = { waitUntil: (p) => p };
const req = (u, init) => new Request("https://x.pages.dev" + u, init);

ok(cacheKind(req("/p/k8")) === "page", "page is cacheable");
ok(cacheKind(req("/p/k8/thank-you")) === null, "thank-you is not cached");
ok(cacheKind(req("/api/orders", { method: "POST" })) === null, "orders POST bypasses");
ok(cacheKind(req("/api/media/ab12.webp")) === "media", "media is cacheable");
ok(cacheKind(req("/admin")) === null, "admin bypasses");
ok(cacheKeyFor(req("/p/k8?fbclid=abc&utm_source=fb&style=premium")).url === "https://x.pages.dev/p/k8?style=premium", "click ids stripped, style kept");

const r1 = await h.fetch(req("/p/k8?fbclid=1"), {}, ctx);
ok(r1.headers.get("X-Edge-Cache") === "MISS" && appLoads === 1, "first visit = MISS, app loaded");
ok(/s-maxage=120/.test(r1.headers.get("Cache-Control")), "page gets s-maxage");
const r2 = await h.fetch(req("/p/k8?fbclid=2&utm_campaign=z"), {}, ctx);
ok(r2.headers.get("X-Edge-Cache") === "HIT" && appLoads === 1 && appCalls === 1, "second visit (other click id) = HIT, app NOT loaded");
ok((await r2.text()) === "<html>page</html>", "hit body intact");
await h.fetch(req("/admin"), {}, ctx);
ok(appCalls === 2, "admin goes to app");
const nf = createHandler(async () => ({ default: { async fetch() { return new Response("no", { status: 404 }); } } }), cache);
await nf.fetch(req("/p/missing"), {}, ctx);
ok(!store.has("https://x.pages.dev/p/missing"), "404 not cached");
const ck = createHandler(async () => ({ default: { async fetch() { return new Response("x", { status: 200, headers: { "set-cookie": "a=b" } }); } } }), cache);
await ck.fetch(req("/p/withcookie"), {}, ctx);
ok(!store.has("https://x.pages.dev/p/withcookie"), "responses with set-cookie not cached");
console.log(fails ? `${fails} FAILED` : "ALL PASSED");
process.exit(fails ? 1 : 0);
