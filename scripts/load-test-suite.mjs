// Full load-test suite for a PREVIEW deployment (refuses production): page views, home page, analytics,
// sustained orders, an ad-spike with mixed visitors, and a double-click (duplicate) test.
// Usage: node scripts/load-test-suite.mjs https://<preview>.pages.dev [scenario,scenario]
//   scenarios: pages, home, analytics, sustained, spike, dedupe   (default: all)
// Test orders are named "LOADTEST n" (delete them afterwards). Needs ORDER_RATE_MAX raised on that deployment.
const base = (process.argv[2] || "").replace(/\/+$/, "");
if (!/^https:\/\/[a-z0-9]+\.ecommerce-landing-platform\.pages\.dev$/.test(base) && !/^https:\/\/[a-z0-9-]+\.pages\.dev$/.test(base)) {
  console.error("Give a https://<id>.<project>.pages.dev PREVIEW url");
  process.exit(1);
}
if (/^https:\/\/ecommerce-landing-platform\.pages\.dev$/.test(base) || base.includes("rexrack.com")) {
  console.error("Refusing to load-test production");
  process.exit(1);
}
const only = (process.argv[4] || process.argv[3] || "").split(",").filter((x) => x && !x.startsWith("http"));
const want = (name) => only.length === 0 || only.includes(name);

const products = (await (await fetch(base + "/api/products")).json()).products || [];
const product = products.find((p) => p.slug === "book") || products.find((p) => p.status === "active");
if (!product) throw new Error("no product on the preview");
const slug = product.slug;
console.log(`target ${base}\nproduct ${product.id} (/p/${slug})\n`);

const pct = (sorted, p) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] : 0);
const summarize = (label, results, seconds, extra = {}) => {
  const lat = results.map((r) => r.ms).sort((a, b) => a - b);
  const codes = {};
  for (const r of results) codes[r.status] = (codes[r.status] || 0) + 1;
  const ok = results.filter((r) => r.ok).length;
  const row = { label, requests: results.length, ok_pct: +((ok / Math.max(1, results.length)) * 100).toFixed(1), codes, seconds: +seconds.toFixed(1), rps: +(results.length / seconds).toFixed(1), p50: Math.round(pct(lat, 50)), p95: Math.round(pct(lat, 95)), p99: Math.round(pct(lat, 99)), max: Math.round(lat[lat.length - 1] || 0), ...extra };
  console.log(JSON.stringify(row));
  return row;
};
const timed = async (fn) => {
  const t0 = performance.now();
  try {
    const r = await fn();
    return { ...r, ms: performance.now() - t0 };
  } catch (e) {
    return { status: 0, ok: false, ms: performance.now() - t0, err: String(e.message).slice(0, 80) };
  }
};
const closed = async (label, total, conc, fn) => {
  const results = [];
  let issued = 0;
  const t0 = performance.now();
  await Promise.all(Array.from({ length: conc }, async () => { while (issued < total) { issued++; results.push(await timed(fn)); } }));
  return summarize(label, results, (performance.now() - t0) / 1000);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let counter = Number(process.env.LOAD_START || 20000);
const orderBody = () => {
  const n = counter++;
  return { customer_name: `LOADTEST ${n}`, customer_phone: "0115" + String(n).padStart(7, "0"), governorate: "القاهرة", address: `عنوان اختبار الحمل رقم ${n} شارع الاختبار`, product_id: product.id, landing_page_slug: slug, quantity: 1, payment_method: "cod" };
};
const placeOrder = async (body = orderBody()) => {
  const res = await fetch(base + "/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const text = await res.text();
  return { status: res.status, ok: res.status === 200 && text.includes('"success":true'), text };
};
const getPage = (path) => async () => {
  const res = await fetch(base + path, { headers: { Accept: "text/html" } });
  const text = await res.text();
  return { status: res.status, ok: res.status === 200 && text.length > 5000 };
};
const postAnalytics = async () => {
  const sid = "s_" + Math.random().toString(36).slice(2, 9);
  const res = await fetch(base + "/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ events: [{ event_name: "PageView", visitor_id: "v_" + sid, session_id: sid }, { event_name: "ViewContent", visitor_id: "v_" + sid, session_id: sid }] }) });
  await res.text();
  return { status: res.status, ok: res.status === 200 };
};

const out = [];

if (want("pages")) {
  console.log("== product page views (server-rendered HTML)");
  for (const [conc, total] of [[25, 300], [50, 500], [100, 800], [200, 1200]]) {
    out.push(await closed(`page c=${conc}`, total, conc, getPage(`/p/${slug}`)));
    await sleep(2000);
  }
}
if (want("home")) {
  console.log("\n== home page views");
  for (const [conc, total] of [[25, 200], [100, 500]]) {
    out.push(await closed(`home c=${conc}`, total, conc, getPage("/")));
    await sleep(2000);
  }
}
if (want("analytics")) {
  console.log("\n== analytics batches (the per-address brake allows 300 / minute)");
  out.push(await closed("analytics c=20", 250, 20, postAnalytics));
}
if (want("sustained")) {
  console.log("\n== sustained orders: 5 per second for 90 seconds");
  const results = [];
  const t0 = performance.now();
  const pending = [];
  for (let i = 0; i < 450; i++) {
    pending.push(timed(() => placeOrder()).then((r) => results.push(r)));
    await sleep(200);
  }
  await Promise.all(pending);
  out.push(summarize("sustained 5/s x 90s", results, (performance.now() - t0) / 1000));
}
if (want("spike")) {
  console.log("\n== ad spike: 1000 visitors in 60 seconds (page + analytics each, 3% order)");
  const per = { page: [], analytics: [], order: [] };
  const t0 = performance.now();
  const jobs = [];
  for (let i = 0; i < 1000; i++) {
    const delay = (i / 1000) * 60000;
    jobs.push(
      (async () => {
        await sleep(delay);
        per.page.push(await timed(getPage(`/p/${slug}`)));
        per.analytics.push(await timed(postAnalytics));
        if (Math.random() < 0.03) {
          await sleep(2000 + Math.random() * 8000);
          per.order.push(await timed(() => placeOrder()));
        }
      })()
    );
  }
  await Promise.all(jobs);
  const secs = (performance.now() - t0) / 1000;
  for (const k of Object.keys(per)) out.push(summarize(`spike ${k}`, per[k], secs));
}
if (want("dedupe")) {
  console.log("\n== double-click: the same order sent 20 times at once");
  const body = orderBody();
  const results = await Promise.all(Array.from({ length: 20 }, () => timed(() => placeOrder(body))));
  const ids = new Set(results.map((r) => { try { return JSON.parse(r.text).order?.id; } catch { return ""; } }).filter(Boolean));
  console.log(JSON.stringify({ label: "dedupe x20", statuses: results.map((r) => r.status).join(","), distinct_order_ids: ids.size, phone: body.customer_phone }));
}
console.log(`\nlast test order number used: ${counter - 1}`);
