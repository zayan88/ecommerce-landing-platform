// Shared harness for the node test scripts (same approach as scripts/test-orders-repo.mjs, factored
// out so new scripts do not copy it). No extra dependencies:
//   - D1 = scripts/dev-d1-server.mjs (node:sqlite, in-memory) with the real migrations applied;
//   - KV = an in-memory emulator that COUNTS every operation (budget checks);
//   - the app's TypeScript is loaded as-is through a small module hook that uses the installed
//     `typescript` package (transpile only, `@/` alias resolved to src/).
// Any outbound request that is not to 127.0.0.1 fails the run.
// Usage: const kit = await startTestKit({ env: { ORDERS_BACKEND: "d1" } });   (Node >= 22.15)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { registerHooks, createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { startDevD1Server } from "../dev-d1-server.mjs";

export const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const src = path.join(root, "src");
const ts = createRequire(import.meta.url)("typescript");

// ───────────── TypeScript loader (test only) ─────────────
const TS_EXT = [".ts", ".tsx", "/index.ts", "/index.tsx"];
const findTs = (base) => TS_EXT.map((e) => base + e).find((f) => fs.existsSync(f)) || (/\.tsx?$/.test(base) && fs.existsSync(base) ? base : null);
registerHooks({
  resolve(specifier, context, next) {
    let [spec, query = ""] = specifier.split("?");
    if (/^next\/[a-z]+$/.test(spec)) spec = spec + ".js"; // next/server → next/server.js
    let base = null;
    if (spec.startsWith("@/")) base = path.join(src, spec.slice(2));
    else if (spec.startsWith(".") && context.parentURL?.startsWith("file:") && /\.tsx?(\?|$)/.test(context.parentURL)) {
      base = path.resolve(path.dirname(fileURLToPath(context.parentURL.split("?")[0])), spec);
    } else if (spec.startsWith("file:") && /\.tsx?$/.test(spec)) base = fileURLToPath(spec);
    const file = base && findTs(base);
    if (file) return { url: pathToFileURL(file).href + (query ? "?" + query : ""), shortCircuit: true };
    return next(spec === specifier.split("?")[0] ? specifier : spec, context);
  },
  load(url, context, next) {
    if (!/\.tsx?(\?|$)/.test(url)) return next(url, context);
    const fileName = fileURLToPath(url.split("?")[0]);
    const source = fs.readFileSync(fileName, "utf8");
    const out = ts.transpileModule(source, {
      fileName,
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    });
    return { format: "module", source: out.outputText, shortCircuit: true };
  },
});

/** Starts both emulators, pins the environment and returns the helpers. */
export async function startTestKit({ env = {} } = {}) {
  // Counting KV emulator (same REST subset as scripts/dev-kv-server.mjs)
  const kv = { store: new Map(), get: 0, put: 0, delete: 0, list: 0 };
  const kvReset = () => { kv.get = kv.put = kv.delete = kv.list = 0; };
  const kvSeed = (key, value, metadata) => kv.store.set(key, { value: JSON.stringify(value), metadata });
  const kvRead = (key) => (kv.store.has(key) ? JSON.parse(kv.store.get(key).value) : null);
  const kvServer = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const json = (code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };
    if (url.pathname === "/keys") {
      kv.list++;
      const prefix = url.searchParams.get("prefix") || "";
      const result = [...kv.store.entries()].filter(([k]) => k.startsWith(prefix)).sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([name, v]) => ({ name, metadata: v.metadata ?? undefined }));
      return json(200, { success: true, result, result_info: { cursor: "" } });
    }
    const key = decodeURIComponent(url.pathname.replace(/^\/values\//, ""));
    if (req.method === "GET") {
      kv.get++;
      if (!kv.store.has(key)) { res.writeHead(404); return res.end("not found"); }
      res.writeHead(200); return res.end(kv.store.get(key).value);
    }
    if (req.method === "DELETE") { kv.delete++; kv.store.delete(key); return json(200, { success: true }); }
    if (req.method === "PUT") {
      kv.put++;
      const chunks = []; for await (const c of req) chunks.push(c);
      const ct = req.headers["content-type"] || "";
      if (ct.startsWith("multipart/form-data")) {
        const form = await new Request("http://x/", { method: "POST", headers: { "content-type": ct }, body: Buffer.concat(chunks) }).formData();
        let metadata; try { metadata = JSON.parse(String(form.get("metadata") || "null")); } catch {}
        kv.store.set(key, { value: String(form.get("value") ?? ""), metadata });
      } else kv.store.set(key, { value: Buffer.concat(chunks).toString("utf8") });
      return json(200, { success: true });
    }
    json(405, { success: false });
  });
  await new Promise((r) => kvServer.listen(0, "127.0.0.1", r));

  const d1 = await startDevD1Server({ port: 0, file: ":memory:", quiet: true });
  /** Direct DB access for assertions / time travel (never used by the code under test). */
  const sql = (text, ...params) => d1.db.prepare(text).all(...params);
  const run = (text, ...params) => d1.db.prepare(text).run(...params);

  // No outbound traffic except the two local emulators.
  const realFetch = globalThis.fetch;
  globalThis.fetch = (input, init) => {
    const u = String(typeof input === "string" || input instanceof URL ? input : input.url);
    if (!u.startsWith("http://127.0.0.1:")) throw new Error("unexpected outbound request to " + new URL(u).host);
    return realFetch(input, init);
  };

  for (const k of Object.keys(process.env)) {
    if (/^(CF_|NEXT_PUBLIC_SUPABASE|SUPABASE_|TELEGRAM_|META_|SAFKA_|SAFQA_|NEXT_PUBLIC_SAFKA|ORDERS_|CATALOG_|STORE_ID|DEMO_MODE|ADMIN_|AUTH_)/.test(k)) delete process.env[k];
  }
  process.env.KV_REST_BASE_URL = "http://127.0.0.1:" + kvServer.address().port;
  process.env.D1_REST_BASE_URL = d1.url;
  process.env.ADMIN_PIN = "test-pin-000000";
  process.env.AUTH_SECRET = "test-secret-0123456789abcdef0123456789";
  Object.assign(process.env, env);

  /** Imports a module of src/. A `query` (e.g. "?isolate=2") yields a separate instance = "another isolate". */
  const mod = (rel, query = "") => import(pathToFileURL(path.join(src, rel)).href + query);
  const { NextRequest } = await import("next/server.js");
  const session = await mod("lib/auth/session.ts");
  const adminCookie = () => `${session.AUTH_COOKIE_NAME}=${session.createAdminAuthToken()}`;
  /** NextRequest for a route handler. `admin: true` adds a valid admin session cookie. */
  const request = (url, { method = "GET", body, admin = false, headers = {} } = {}) =>
    new NextRequest("http://localhost" + url, {
      method,
      body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
      headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), ...(admin ? { cookie: adminCookie() } : {}), ...headers },
    });
  /** Calls a route handler and returns { status, body, headers }. */
  const call = async (handler, url, opts) => {
    const res = await handler(request(url, opts));
    return { status: res.status, body: await res.json().catch(() => null), headers: res.headers };
  };

  const results = [];
  async function test(name, fn) {
    try {
      await fn();
      results.push(true);
      console.log(`ok ${results.length} - ${name}`);
    } catch (e) {
      results.push(false);
      console.log(`not ok ${results.length} - ${name}\n    ${String(e?.stack || e).split("\n").slice(0, 6).join("\n    ")}`);
    }
  }
  /** Silences expected warnings from the code under test. */
  const quiet = async (fn) => {
    const saved = [console.warn, console.error, console.log];
    console.warn = console.error = console.log = () => {};
    try { return await fn(); } finally { [console.warn, console.error, console.log] = saved; }
  };
  /** Prints the summary, stops the emulators and exits (1 on any failure). */
  const finish = async () => {
    await d1.close();
    await new Promise((r) => kvServer.close(r));
    const failed = results.filter((ok) => !ok).length;
    console.log(`\n${results.length - failed}/${results.length} passed` + (failed ? `, ${failed} FAILED` : ""));
    process.exit(failed ? 1 : 0);
  };

  return { kv, kvReset, kvSeed, kvRead, d1, sql, run, mod, NextRequest, request, call, adminCookie, test, quiet, finish };
}
