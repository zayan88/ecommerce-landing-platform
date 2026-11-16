// Tests for the product catalog feed (src/lib/feed/product-feed.ts). Pure functions: no network, no database.
// Usage: node scripts/test-feed.mjs   (Node >= 22.15)
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { registerHooks, createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src");
const ts = createRequire(import.meta.url)("typescript");
const TS_EXT = [".ts", ".tsx", "/index.ts", "/index.tsx"];
const findTs = (base) => TS_EXT.map((e) => base + e).find((f) => fs.existsSync(f)) || (/\.tsx?$/.test(base) && fs.existsSync(base) ? base : null);
registerHooks({
  resolve(specifier, context, next) {
    const [spec] = specifier.split("?");
    let base = null;
    if (spec.startsWith("@/")) base = path.join(src, spec.slice(2));
    const file = base && findTs(base);
    if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (!/\.tsx?(\?|$)/.test(url)) return next(url, context);
    const fileName = fileURLToPath(url.split("?")[0]);
    const out = ts.transpileModule(fs.readFileSync(fileName, "utf8"), {
      fileName,
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    });
    return { format: "module", source: out.outputText, shortCircuit: true };
  },
});

const { buildFeed, renderXml, renderCsv, absoluteImage, cleanText } = await import(pathToFileURL(path.join(src, "lib/feed/product-feed.ts")).href);

const base = "https://shop.example.store";
const P = (o = {}) => ({
  id: "p1", title_ar: "منتج", slug: "prod-1", sku: "SKU-1", base_price: 250, compare_at_price: 400, cost_price: 111,
  images: ["/api/media/abc", "https://cdn.example.com/b.jpg"], description_ar: "وصف", stock_quantity: 10, status: "active",
  created_at: "", updated_at: "", ...o,
});

let n = 0;
const test = (name, fn) => {
  fn();
  console.log(`ok ${++n} - ${name}`);
};

test("price: compare-at above the selling price becomes price + sale_price; otherwise a single price", () => {
  const { items } = buildFeed([P(), P({ id: "p2", sku: "SKU-2", compare_at_price: 0 }), P({ id: "p3", sku: "SKU-3", compare_at_price: 200 })], { base, brand: "B" });
  assert.equal(items[0].price, "400.00 EGP");
  assert.equal(items[0].salePrice, "250.00 EGP");
  assert.equal(items[1].price, "250.00 EGP");
  assert.equal(items[1].salePrice, undefined);
  assert.equal(items[2].price, "250.00 EGP"); // compare-at lower than selling price is ignored
  assert.equal(items[2].salePrice, undefined);
});

test("skips inactive, priceless and imageless products with the reason", () => {
  const { items, skipped } = buildFeed(
    [P({ id: "a", sku: "a", status: "paused" }), P({ id: "b", sku: "b", base_price: 0 }), P({ id: "c", sku: "c", images: [] }), P({ id: "d", sku: "d" })],
    { base, brand: "B" }
  );
  assert.deepEqual(items.map((i) => i.id), ["d"]);
  assert.deepEqual(skipped.map((s) => [s.id, s.reason]), [["a", "inactive"], ["b", "no_price"], ["c", "no_image"]]);
});

test("ids are unique inside the feed (a duplicate sku is dropped)", () => {
  const { items } = buildFeed([P({ id: "x1", sku: "SAME" }), P({ id: "x2", sku: "SAME" })], { base, brand: "B" });
  assert.equal(items.length, 1);
});

test("images become absolute (uploaded path, protocol-relative, full url); extra images capped at 10", () => {
  assert.equal(absoluteImage("/api/media/abc", base + "/"), base + "/api/media/abc");
  assert.equal(absoluteImage("//cdn.x/y.png", base), "https://cdn.x/y.png");
  assert.equal(absoluteImage("https://a/b.jpg", base), "https://a/b.jpg");
  const many = Array.from({ length: 15 }, (_, i) => `/i${i}.jpg`);
  const { items } = buildFeed([P({ images: many })], { base, brand: "B" });
  assert.equal(items[0].image, base + "/i0.jpg");
  assert.equal(items[0].extraImages.length, 10);
});

test("link uses the page slug, URL-encoded (Arabic slugs work)", () => {
  const { items } = buildFeed([P({ slug: "جهاز-تدليك" })], { base, brand: "B" });
  assert.equal(items[0].link, `${base}/p/${encodeURIComponent("جهاز-تدليك")}`);
});

test("availability: out of stock only when stock tracking is on and the quantity is zero", () => {
  const { items } = buildFeed(
    [P({ id: "t1", sku: "t1", stock_quantity: 0 }), P({ id: "t2", sku: "t2", stock_quantity: 0, track_stock: true }), P({ id: "t3", sku: "t3", stock_quantity: 5, track_stock: true })],
    { base, brand: "B" }
  );
  assert.deepEqual(items.map((i) => i.availability), ["in stock", "out of stock", "in stock"]);
});

test("XML: special characters and control characters are escaped / removed; output is well formed", () => {
  const { items } = buildFeed([P({ title_ar: `A & B <script>"x" 'y'\u0001`, description_ar: "<b>bold</b> text &amp; more" })], { base, brand: "Me & Co" });
  const xml = renderXml(items, { title: "Me & Co", link: base, description: "d" });
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(!xml.includes("<script>"));
  // markup in a title is stripped (not just escaped); the remaining specials are escaped
  assert.ok(xml.includes("A &amp; B &quot;x&quot; &apos;y&apos;"));
  assert.ok(!/[\u0000-\u0008]/.test(xml));
  assert.equal((xml.match(/<item>/g) || []).length, 1);
  assert.equal((xml.match(/<\/item>/g) || []).length, 1);
  assert.ok(xml.includes("<g:description>bold text &amp;amp; more</g:description>")); // tags stripped, ampersand kept as text
});

test("privacy: cost price, supplier data and stock numbers never appear in any output", () => {
  const { items } = buildFeed([P({ cost_price: 98765, safka_product_id: "SAFKA-SECRET", safka_commission: 4321, stock_quantity: 31337 })], { base, brand: "B" });
  const xml = renderXml(items, { title: "t", link: base, description: "d" });
  const csv = renderCsv(items);
  for (const out of [xml, csv]) {
    assert.ok(!out.includes("98765") && !out.includes("SAFKA-SECRET") && !out.includes("4321") && !out.includes("31337"));
  }
});

test("CSV: quoting, commas/newlines/quotes, and spreadsheet-formula protection; no BOM", () => {
  const { items } = buildFeed([P({ title_ar: '=HYPERLINK("http://evil")', description_ar: 'line1, "quoted"\nline2' })], { base, brand: "B" });
  const csv = renderCsv(items);
  assert.ok(!csv.startsWith("﻿"));
  assert.ok(csv.includes(`"'=HYPERLINK(""http://evil"")"`));
  assert.ok(csv.split("\r\n")[0].startsWith("id,title,description,availability,condition,price,sale_price,link,image_link"));
});

test("text limits: title <= 150, description <= 5000, cut on a word boundary", () => {
  const long = Array.from({ length: 400 }, () => "كلمة").join(" ");
  const { items } = buildFeed([P({ title_ar: long, description_ar: long + long + long + long })], { base, brand: "B" });
  assert.ok(items[0].title.length <= 150 && items[0].description.length <= 5000);
  assert.equal(cleanText("  a   b \n c ", 10), "a b c");
});

console.log(`\n${n}/${n} passed`);
