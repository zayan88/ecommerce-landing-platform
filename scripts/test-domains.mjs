// Tests for the custom-domain library (src/lib/domains/cf-domains.ts) against a fake Cloudflare Pages API.
// No network: the fake server listens on 127.0.0.1. Usage: node scripts/test-domains.mjs   (Node >= 22.15)
import fs from "node:fs";
import http from "node:http";
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
    const file = spec.startsWith("@/") && findTs(path.join(src, spec.slice(2)));
    return file ? { url: pathToFileURL(file).href, shortCircuit: true } : next(specifier, context);
  },
  load(url, context, next) {
    if (!/\.tsx?(\?|$)/.test(url)) return next(url, context);
    const fileName = fileURLToPath(url.split("?")[0]);
    const out = ts.transpileModule(fs.readFileSync(fileName, "utf8"), { fileName, compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, esModuleInterop: true } });
    return { format: "module", source: out.outputText, shortCircuit: true };
  },
});

const lib = await import(pathToFileURL(path.join(src, "lib/domains/cf-domains.ts")).href);

// ── fake Cloudflare Pages API ──
const ACC = "a".repeat(32);
const PROJECT = "my-store";
const TOKEN = "SECRET-TOKEN-VALUE-123";
const domains = new Map(); // name -> {status, error}
let forceAuthFail = false;
const server = http.createServer((req, res) => {
  const send = (code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };
  if (forceAuthFail || req.headers.authorization !== `Bearer ${TOKEN}`) return send(403, { success: false, errors: [{ code: 10000, message: `Authentication error ${TOKEN}` }] });
  const base = `/accounts/${ACC}/pages/projects/${PROJECT}/domains`;
  const url = req.url.split("?")[0];
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const b = body ? JSON.parse(body) : {};
    if (req.method === "GET" && url === base) {
      return send(200, { success: true, result: [{ name: `${PROJECT}.pages.dev`, status: "active" }, ...[...domains].map(([name, d]) => ({ name, status: d.status, validation_data: { error_message: d.error } }))] });
    }
    if (req.method === "POST" && url === base) {
      domains.set(b.name, { status: "pending", error: "" });
      return send(200, { success: true, result: { name: b.name, status: "pending" } });
    }
    const m = url.startsWith(base + "/") && decodeURIComponent(url.slice(base.length + 1));
    if (m && req.method === "GET") return domains.has(m) ? send(200, { success: true, result: { name: m, status: domains.get(m).status, validation_data: { error_message: domains.get(m).error } } }) : send(404, { success: false, errors: [{ message: "not found" }] });
    if (m && req.method === "PATCH") return send(200, { success: true, result: { name: m } });
    if (m && req.method === "DELETE") { domains.delete(m); return send(200, { success: true, result: null }); }
    send(404, { success: false, errors: [{ message: "unknown" }] });
  });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const env = { token: TOKEN, accountId: ACC, project: PROJECT, apiBase: `http://127.0.0.1:${server.address().port}` };

let n = 0;
const test = async (name, fn) => { await fn(); console.log(`ok ${++n} - ${name}`); };

await test("hostname validation: accepts real domains (URL, port, uppercase, trailing dot, punycode)", () => {
  for (const [input, want] of [
    ["shop.mystore.com", "shop.mystore.com"],
    ["  HTTPS://WWW.MyStore.com/path?x=1  ", "www.mystore.com"],
    ["mystore.store:443", "mystore.store"],
    ["mystore.com.eg.", "mystore.com.eg"],
    ["متجري.com", new URL("http://متجري.com").hostname], // internationalised names are stored as punycode (xn--...)
  ]) {
    const r = lib.normalizeHostname(input);
    assert.ok(r.ok, `${input} should be valid: ${JSON.stringify(r)}`);
    assert.equal(r.host, want);
  }
});

await test("hostname validation: rejects IPs, localhost, pages.dev, wildcards, junk and injection attempts", () => {
  for (const bad of ["", "   ", "localhost", "127.0.0.1", "10.0.0.1", "mystore", "my store.com", "*.mystore.com", "evil.pages.dev", "x.workers.dev", "a@b.com", "http://", "foo..com", "-bad.com", "a.com;rm -rf", "<script>.com", 12345, null, undefined, { a: 1 }]) {
    assert.equal(lib.normalizeHostname(bad).ok, false, `should reject ${JSON.stringify(bad)}`);
  }
});

await test("DNS instruction: subdomain, www, bare domain and .com.eg style domains", () => {
  assert.deepEqual(lib.dnsInstruction("www.mystore.com", "my-store"), { type: "CNAME", name: "www", target: "my-store.pages.dev", isApex: false });
  assert.deepEqual(lib.dnsInstruction("shop.mystore.com", "my-store"), { type: "CNAME", name: "shop", target: "my-store.pages.dev", isApex: false });
  assert.equal(lib.dnsInstruction("mystore.com", "my-store").isApex, true);
  assert.equal(lib.dnsInstruction("mystore.com", "my-store").name, "@");
  assert.equal(lib.dnsInstruction("mystore.com.eg", "my-store").isApex, true);
  assert.equal(lib.dnsInstruction("www.mystore.com.eg", "my-store").name, "www");
  assert.equal(lib.dnsInstruction("a.b.mystore.com", "my-store").name, "a.b");
});

await test("env: missing token / bad account id / bad project means the feature is off", () => {
  const saved = { ...process.env };
  for (const k of ["CF_PAGES_API_TOKEN", "CF_ACCOUNT_ID", "CF_PAGES_PROJECT"]) delete process.env[k];
  assert.equal(lib.readDomainEnv(), null);
  process.env.CF_PAGES_API_TOKEN = "t"; process.env.CF_ACCOUNT_ID = "short"; process.env.CF_PAGES_PROJECT = "p";
  assert.equal(lib.readDomainEnv(), null);
  process.env.CF_ACCOUNT_ID = ACC;
  assert.equal(lib.readDomainEnv().project, "p");
  process.env.CF_PAGES_PROJECT = "bad/project";
  assert.equal(lib.readDomainEnv(), null);
  Object.assign(process.env, saved);
});

await test("add: new domain starts pending; adding it again is idempotent; the pages.dev host is hidden from the list", async () => {
  const d = await lib.addDomain(env, "shop.mystore.com");
  assert.equal(d.state, "pending");
  await lib.addDomain(env, "shop.mystore.com");
  const list = await lib.listDomains(env);
  assert.deepEqual(list.map((x) => x.name), ["shop.mystore.com"]);
});

await test("check: state follows Cloudflare (pending -> active), and a failed validation exposes its message", async () => {
  domains.get("shop.mystore.com").status = "active";
  assert.equal((await lib.recheckDomain(env, "shop.mystore.com")).state, "active");
  domains.get("shop.mystore.com").status = "error";
  domains.get("shop.mystore.com").error = "CNAME record not found";
  const f = await lib.recheckDomain(env, "shop.mystore.com");
  assert.equal(f.state, "failed");
  assert.equal(f.error, "CNAME record not found");
});

await test("limit: at most 3 custom domains per store", async () => {
  await lib.addDomain(env, "a.mystore.com");
  await lib.addDomain(env, "b.mystore.com");
  await assert.rejects(() => lib.addDomain(env, "c.mystore.com"), /الحد الأقصى 3/);
  assert.equal((await lib.listDomains(env)).length, 3);
});

await test("remove: the domain disappears from the list", async () => {
  await lib.removeDomain(env, "a.mystore.com");
  await lib.removeDomain(env, "b.mystore.com");
  assert.deepEqual((await lib.listDomains(env)).map((x) => x.name), ["shop.mystore.com"]);
});

await test("auth failure: friendly Arabic error and the token never appears in the message", async () => {
  const bad = { ...env, token: "WRONG-TOKEN" };
  await assert.rejects(
    () => lib.listDomains(bad),
    (e) => e instanceof lib.DomainApiError && /صلاحية الربط/.test(e.message) && !e.message.includes(TOKEN) && !e.message.includes("WRONG-TOKEN")
  );
  forceAuthFail = true;
  await assert.rejects(() => lib.listDomains(env), (e) => !e.message.includes(TOKEN));
  forceAuthFail = false;
});

await test("unreachable Cloudflare: clean error, no crash", async () => {
  await assert.rejects(() => lib.listDomains({ ...env, apiBase: "http://127.0.0.1:1" }), /تعذر الاتصال/);
});

await test("api base override works only for a local fake (a remote host is ignored, so the token can never be sent elsewhere)", () => {
  const saved = { ...process.env };
  process.env.CF_PAGES_API_TOKEN = "t"; process.env.CF_ACCOUNT_ID = ACC; process.env.CF_PAGES_PROJECT = "p";
  process.env.CF_API_BASE = "http://127.0.0.1:3197";
  assert.equal(lib.readDomainEnv().apiBase, "http://127.0.0.1:3197");
  for (const evil of ["https://evil.example.com", "http://evil.com", "http://127.0.0.1.evil.com", "http://localhost@evil.com", "ftp://127.0.0.1"]) {
    process.env.CF_API_BASE = evil;
    assert.equal(lib.readDomainEnv().apiBase, "https://api.cloudflare.com/client/v4", `must ignore ${evil}`);
  }
  Object.assign(process.env, saved);
});

server.close();
console.log(`\n${n}/${n} passed`);
