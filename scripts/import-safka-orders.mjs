// Imports a Safka (صفقة) orders export into the LOCAL D1 emulator, for testing the admin on realistic data.
// The export is parsed to JSON rows beforehand (header row first); customer data never enters the repo.
//
//   node scripts/dev-d1-server.mjs 3198            (in another terminal; keep it running)
//   node scripts/import-safka-orders.mjs <rows.json> [--dry-run]
//
// Refuses to run against anything but 127.0.0.1. Idempotent: order ids are derived from the Safka order code,
// so re-running updates the same rows instead of duplicating them.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { registerHooks, createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src");
const ts = createRequire(import.meta.url)("typescript");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const rowsPath = args.find((a) => !a.startsWith("--"));
if (!rowsPath) {
  console.error("usage: node scripts/import-safka-orders.mjs <rows.json> [--dry-run]");
  process.exit(1);
}

const D1_URL = process.env.D1_REST_BASE_URL || "http://127.0.0.1:3198";
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(D1_URL)) {
  console.error("Refusing: D1_REST_BASE_URL must be a local emulator (127.0.0.1).");
  process.exit(1);
}
process.env.D1_REST_BASE_URL = D1_URL;
process.env.ORDERS_BACKEND = "d1";

// ── minimal TypeScript loader (same idea as scripts/test-orders-repo.mjs) ──
const TS_EXT = [".ts", ".tsx", "/index.ts", "/index.tsx"];
const findTs = (base) => TS_EXT.map((e) => base + e).find((f) => fs.existsSync(f)) || (/\.tsx?$/.test(base) && fs.existsSync(base) ? base : null);
registerHooks({
  resolve(specifier, context, next) {
    const [spec] = specifier.split("?");
    let base = null;
    if (spec.startsWith("@/")) base = path.join(src, spec.slice(2));
    else if (spec.startsWith(".") && context.parentURL?.startsWith("file:") && /\.tsx?(\?|$)/.test(context.parentURL)) {
      base = path.resolve(path.dirname(fileURLToPath(context.parentURL.split("?")[0])), spec);
    }
    const file = base && findTs(base);
    if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (!/\.tsx?(\?|$)/.test(url)) return next(url, context);
    const fileName = fileURLToPath(url.split("?")[0]);
    const out = ts.transpileModule(fs.readFileSync(fileName, "utf8"), {
      fileName,
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    });
    return { format: "module", source: out.outputText, shortCircuit: true };
  },
});

// ── mapping ──
const STATUS = {
  "تم التحصيل": { status: "delivered", safqa: "paid" },
  "مرتجع": { status: "returned", safqa: "refunded" },
  "ملغي": { status: "cancelled", safqa: "not_synced" },
};
const rows = JSON.parse(fs.readFileSync(rowsPath, "utf8"));
const header = rows[0];
const col = (name) => header.indexOf(name);
const C = Object.fromEntries(
  ["كود الطلب", "اسم العميل", "هاتف العميل", "المنتجات", "الإجمالي", "تاريخ الإنشاء", "تاريخ أخر تحديث", "المحافظة", "المنطقة", "العنوان", "الحالة", "الملاحظة", "SKU", "Qty"].map((n) => [n, col(n)])
);
for (const [n, i] of Object.entries(C)) if (i < 0) throw new Error(`missing column: ${n}`);

/** "11/14/2026" (M/D/YYYY) -> ISO at 09:00Z (noon in Cairo), so the Cairo calendar day is stable. */
function parseDate(v) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(v || "").trim());
  if (!m) return null;
  const d = new Date(Date.UTC(+m[3], +m[1] - 1, +m[2], 9, 0, 0));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
const num = (v) => {
  const n = Number(String(v ?? "").replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
};
const qtyOf = (v) => String(v ?? "1").split(",").reduce((a, x) => a + (parseInt(x, 10) || 0), 0) || 1;

const orders = [];
const skipped = [];
for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  const code = String(r[C["كود الطلب"]] || "").trim();
  const created = parseDate(r[C["تاريخ الإنشاء"]]);
  const st = STATUS[String(r[C["الحالة"]] || "").trim()];
  if (!code || !created || !st) {
    skipped.push({ row: i + 1, reason: !code ? "no code" : !created ? "bad date" : "unknown status" });
    continue;
  }
  const hash = crypto.createHash("sha256").update(code).digest("hex").slice(0, 8);
  const ms = Date.parse(created);
  const total = num(r[C["الإجمالي"]]);
  const quantity = qtyOf(r[C["Qty"]]);
  const note = String(r[C["الملاحظة"]] || "");
  const slugMatch = /صفحة\s+([a-z0-9-]+)/i.exec(note);
  orders.push({
    id: `ord-${ms}-${hash}`,
    order_number: code,
    landing_page_slug: slugMatch ? slugMatch[1] : "direct",
    product_id: `safka-${String(r[C["SKU"]] || "unknown").toLowerCase()}`,
    customer_name: String(r[C["اسم العميل"]] || "").trim() || "—",
    customer_phone: String(r[C["هاتف العميل"]] || "").replace(/[^\d+]/g, ""),
    governorate: String(r[C["المحافظة"]] || "").trim(),
    city: String(r[C["المنطقة"]] || "").trim(),
    address: String(r[C["العنوان"]] || "").trim(),
    notes: note,
    quantity,
    unit_price: quantity ? Math.round((total / quantity) * 100) / 100 : total,
    total_amount: total,
    shipping_fee: 0,
    discount_amount: 0,
    final_amount: total,
    currency: "EGP",
    status: st.status,
    payment_method: "cod",
    safqa_status: st.safqa,
    safqa_invoice_id: code,
    created_at: created,
    updated_at: parseDate(r[C["تاريخ أخر تحديث"]]) || created,
    tracking: {},
  });
}

const summary = {};
for (const o of orders) summary[o.status] = (summary[o.status] || 0) + 1;
console.log(`rows: ${rows.length - 1}, to import: ${orders.length}, skipped: ${skipped.length}`, JSON.stringify(summary));
if (skipped.length) console.log("skipped:", JSON.stringify(skipped.slice(0, 10)));
if (dryRun) {
  console.log("dry run: nothing written");
  process.exit(0);
}

const { getOrdersRepo } = await import(pathToFileURL(path.join(src, "lib/db/orders-repo.ts")).href);
const repo = getOrdersRepo();
const outcomes = {};
for (let i = 0; i < orders.length; i += 25) {
  const res = await repo.importOrders(orders.slice(i, i + 25));
  for (const v of Object.values(res)) outcomes[v] = (outcomes[v] || 0) + 1;
}
console.log("import outcomes:", JSON.stringify(outcomes));
