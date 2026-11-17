// Load test of the public order endpoint on a PREVIEW deployment (never run it against production):
// places many COD orders with unique phones at rising concurrency and reports status codes and latency.
// Usage: node scripts/load-test-orders.mjs https://<preview>.pages.dev [phases]   e.g. "10x30,25x60,50x100"
// Test orders are named "LOADTEST <n>" so they can be deleted afterwards. Needs ORDER_RATE_MAX raised on that deployment.
const base = (process.argv[2] || "").replace(/\/+$/, "");
if (!/^https:\/\/[a-z0-9.-]+\.pages\.dev$/.test(base)) {
  console.error("Give a https://....pages.dev preview URL");
  process.exit(1);
}
if (/^https:\/\/(ecommerce-landing-platform|www\.rexrack)\.pages\.dev$/i.test(base) || base.includes("rexrack.com")) {
  console.error("Refusing to load-test production");
  process.exit(1);
}
const phases = (process.argv[3] || "10x30,25x60,50x100,100x150,150x200").split(",").map((p) => {
  const [c, n] = p.split("x").map(Number);
  return { c, n };
});

const products = (await (await fetch(base + "/api/products")).json()).products || [];
const product = products.find((p) => p.status === "active") || products[0];
if (!product) {
  console.error("No product on that deployment");
  process.exit(1);
}
// the landing page slug is the product slug for seeded products
const slug = product.slug;
console.log(`target ${base}\nproduct ${product.id} (${slug}) price ${product.base_price}\n`);

let counter = Number(process.env.LOAD_START || 1);
const orderBody = () => {
  const n = counter++;
  return {
    customer_name: `LOADTEST ${n}`,
    customer_phone: "0115" + String(n).padStart(7, "0"),
    governorate: "القاهرة",
    address: `عنوان اختبار الحمل رقم ${n} شارع الاختبار`,
    product_id: product.id,
    landing_page_slug: slug,
    quantity: 1,
    payment_method: "cod",
  };
};

const pct = (arr, p) => (arr.length ? arr[Math.min(arr.length - 1, Math.floor((p / 100) * arr.length))] : 0);

async function placeOne() {
  const t0 = performance.now();
  try {
    const res = await fetch(base + "/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(orderBody()) });
    const text = await res.text();
    return { status: res.status, ms: performance.now() - t0, ok: res.status === 200 && text.includes('"success":true'), sample: res.status === 200 ? "" : text.slice(0, 160).replace(/\s+/g, " ") };
  } catch (e) {
    return { status: 0, ms: performance.now() - t0, ok: false, sample: String(e.message).slice(0, 120) };
  }
}

const summary = [];
let total = 0;
let totalOk = 0;
for (const { c, n } of phases) {
  const results = [];
  let issued = 0;
  const started = performance.now();
  await Promise.all(
    Array.from({ length: c }, async () => {
      while (issued < n) {
        issued++;
        results.push(await placeOne());
      }
    })
  );
  const secs = (performance.now() - started) / 1000;
  const lat = results.map((r) => r.ms).sort((a, b) => a - b);
  const codes = {};
  for (const r of results) codes[r.status] = (codes[r.status] || 0) + 1;
  const ok = results.filter((r) => r.ok).length;
  const samples = [...new Set(results.filter((r) => !r.ok).map((r) => `${r.status}: ${r.sample}`))].slice(0, 3);
  total += results.length;
  totalOk += ok;
  const row = { concurrency: c, requests: results.length, ok, codes, seconds: +secs.toFixed(1), rps: +(results.length / secs).toFixed(1), p50: Math.round(pct(lat, 50)), p95: Math.round(pct(lat, 95)), p99: Math.round(pct(lat, 99)), max: Math.round(lat[lat.length - 1] || 0), samples };
  summary.push(row);
  console.log(JSON.stringify(row));
  if (ok / results.length < 0.8) {
    console.log("stopping: success rate below 80% in this phase");
    break;
  }
  await new Promise((r) => setTimeout(r, 3000));
}
console.log(`\nTOTAL sent ${total}, accepted ${totalOk}, last order number used ${counter - 1}`);
