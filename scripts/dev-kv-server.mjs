// Local Cloudflare-KV emulator for development ONLY (REST subset used by src/lib/db/kv.ts):
//   GET/PUT/DELETE /values/:key   (PUT accepts plain text or multipart value+metadata)
//   GET /keys?prefix=&cursor=&limit=
// Data persists in .dev-kv.json next to this repo so a restart keeps your uploads and settings.
// Usage: node scripts/dev-kv-server.mjs [port]
import http from "node:http";
import fs from "node:fs";
import { Readable } from "node:stream";

const port = Number(process.argv[2] || 3199);
const file = new URL("../.dev-kv.json", import.meta.url);
let store = {};
try { store = JSON.parse(fs.readFileSync(file, "utf8")); } catch {}
let dirty = false;
setInterval(() => { if (dirty) { fs.writeFileSync(file, JSON.stringify(store)); dirty = false; } }, 1000).unref?.();

const json = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/keys" && req.method === "GET") {
      const prefix = url.searchParams.get("prefix") || "";
      const result = Object.entries(store)
        .filter(([k]) => k.startsWith(prefix)).sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([name, v]) => ({ name, metadata: v.metadata ?? undefined }));
      return json(res, 200, { success: true, result, result_info: { count: result.length, cursor: "" } });
    }
    const m = url.pathname.match(/^\/values\/(.+)$/);
    if (!m) return json(res, 404, { success: false, errors: [{ message: "not found" }] });
    const key = decodeURIComponent(m[1]);
    if (req.method === "GET") {
      if (!(key in store)) { res.writeHead(404); return res.end("not found"); }
      res.writeHead(200, { "Content-Type": "text/plain" }); return res.end(store[key].value);
    }
    if (req.method === "DELETE") { delete store[key]; dirty = true; return json(res, 200, { success: true }); }
    if (req.method === "PUT") {
      const ct = req.headers["content-type"] || "";
      if (ct.startsWith("multipart/form-data")) {
        const form = await new Request("http://x/", { method: "POST", headers: { "content-type": ct }, body: Readable.toWeb(req), duplex: "half" }).formData();
        let metadata; try { metadata = JSON.parse(String(form.get("metadata") || "null")) } catch {}
        store[key] = { value: String(form.get("value") ?? ""), metadata };
      } else {
        const chunks = []; for await (const c of req) chunks.push(c);
        store[key] = { value: Buffer.concat(chunks).toString("utf8") };
      }
      dirty = true; return json(res, 200, { success: true });
    }
    json(res, 405, { success: false });
  } catch (e) { console.error(e); json(res, 500, { success: false }); }
}).listen(port, "127.0.0.1", () => console.log("dev KV emulator on http://127.0.0.1:" + port));
