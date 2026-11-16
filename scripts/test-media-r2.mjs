// Tests for uploaded-image storage: KV by default, R2 when a MEDIA bucket is bound.
// Usage: node scripts/test-media-r2.mjs        (Node >= 22.15; exits 1 on any failure)
import assert from "node:assert/strict";
import { startTestKit } from "./lib/test-kit.mjs";

const { mod, request, test, finish } = await startTestKit({ env: {} });
const uploadRoute = await mod("app/api/media/route.ts");
const serveRoute = await mod("app/api/media/[id]/route.ts");

// 1x1 WebP header bytes (RIFF....WEBP + padding): enough for the signature sniffing
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x1a, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x4c, 1, 2, 3, 4]);

const upload = async (bytes = WEBP) => {
  const form = new FormData();
  form.set("file", new File([bytes], "a.webp", { type: "image/webp" }));
  const req = request("/api/media", { method: "POST", admin: true });
  const withForm = new Request(req.url, { method: "POST", body: form, headers: req.headers });
  const res = await uploadRoute.POST(new (req.constructor)(withForm));
  return { status: res.status, body: await res.json() };
};
const serve = (id) => serveRoute.GET(request(`/api/media/${id}`), { params: { id } });

const fakeBucket = () => {
  const store = new Map();
  return {
    store,
    put: async (k, v, o) => { store.set(k, { bytes: new Uint8Array(v), ct: o?.httpMetadata?.contentType }); },
    get: async (k) => {
      const r = store.get(k);
      return r ? { arrayBuffer: async () => r.bytes.buffer.slice(0), httpMetadata: { contentType: r.ct } } : null;
    },
  };
};
const setBucket = (b) => { globalThis[Symbol.for("__cloudflare-request-context__")] = b ? { env: { MEDIA: b } } : undefined; };

await test("no bucket bound: stored in KV and served from /api/media (unchanged behaviour)", async () => {
  setBucket(null);
  const up = await upload();
  assert.equal(up.status, 200);
  assert.match(up.body.url, /^\/api\/media\/[a-f0-9]{16}\.webp$/);
  assert.notEqual(up.body.storage, "r2");
  const res = await serve(up.body.id);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "image/webp");
});

await test("bucket bound, no public URL: stored in R2, still served through /api/media", async () => {
  const b = fakeBucket();
  setBucket(b);
  delete process.env.MEDIA_PUBLIC_URL;
  const up = await upload();
  assert.equal(up.body.storage, "r2");
  assert.match(up.body.url, /^\/api\/media\//);
  assert.equal(b.store.size, 1);
  const res = await serve(up.body.id);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "image/webp");
  assert.equal(new Uint8Array(await res.arrayBuffer()).length, WEBP.length);
});

await test("bucket bound + MEDIA_PUBLIC_URL: the returned url points straight at the bucket (no Function needed)", async () => {
  const b = fakeBucket();
  setBucket(b);
  process.env.MEDIA_PUBLIC_URL = "https://pub-abc123.r2.dev/";
  const up = await upload();
  assert.match(up.body.url, /^https:\/\/pub-abc123\.r2\.dev\/media\/[a-f0-9]{16}\.webp$/);
  assert.ok([...b.store.keys()][0].startsWith("media/"));
});

await test("a malformed MEDIA_PUBLIC_URL is ignored (never emitted into pages)", async () => {
  setBucket(fakeBucket());
  process.env.MEDIA_PUBLIC_URL = 'javascript:alert(1)"';
  const up = await upload();
  assert.match(up.body.url, /^\/api\/media\//);
  process.env.MEDIA_PUBLIC_URL = "http://insecure.example.com";
  assert.match((await upload()).body.url, /^\/api\/media\//);
});

await test("older images (in KV) are still served after a bucket is added", async () => {
  setBucket(null);
  const old = await upload();
  setBucket(fakeBucket());
  const res = await serve(old.body.id);
  assert.equal(res.status, 200);
});

await test("invalid ids and non-image content are rejected as before", async () => {
  setBucket(fakeBucket());
  assert.equal((await serve("../../etc/passwd")).status, 404);
  const bad = await upload(new Uint8Array(32).fill(7));
  assert.equal(bad.status, 415);
});

setBucket(null);
await finish();
