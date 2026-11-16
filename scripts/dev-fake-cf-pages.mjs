// Fake Cloudflare Pages "domains" API for local UI testing of the Domain tab (never use in production).
//   node scripts/dev-fake-cf-pages.mjs 3197
// A newly added domain is "pending" and turns "active" after 25 seconds (or "error" for names starting with "bad").
import http from "node:http";

const port = Number(process.argv[2] || 3197);
const ACC = "a".repeat(32);
const PROJECT = "my-store";
const base = `/accounts/${ACC}/pages/projects/${PROJECT}/domains`;
const domains = new Map(); // name -> { added: ms }

const statusOf = (name) => {
  const d = domains.get(name);
  if (!d) return null;
  if (name.startsWith("bad")) return { status: "error", validation_data: { error_message: "CNAME record not found for this hostname" } };
  return { status: Date.now() - d.added > 25000 ? "active" : "pending" };
};

http
  .createServer((req, res) => {
    const send = (code, obj) => {
      res.writeHead(code, { "Content-Type": "application/json" });
      res.end(JSON.stringify(obj));
    };
    if (!(req.headers.authorization || "").startsWith("Bearer ")) return send(403, { success: false, errors: [{ message: "Authentication error" }] });
    const url = req.url.split("?")[0];
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const b = body ? JSON.parse(body) : {};
      if (req.method === "GET" && url === base)
        return send(200, { success: true, result: [{ name: `${PROJECT}.pages.dev`, status: "active" }, ...[...domains.keys()].map((name) => ({ name, ...statusOf(name) }))] });
      if (req.method === "POST" && url === base) {
        domains.set(b.name, { added: Date.now() });
        return send(200, { success: true, result: { name: b.name, status: "pending" } });
      }
      const m = url.startsWith(base + "/") && decodeURIComponent(url.slice(base.length + 1));
      if (m && req.method === "GET") return domains.has(m) ? send(200, { success: true, result: { name: m, ...statusOf(m) } }) : send(404, { success: false, errors: [{ message: "not found" }] });
      if (m && req.method === "PATCH") return send(200, { success: true, result: { name: m } });
      if (m && req.method === "DELETE") {
        domains.delete(m);
        return send(200, { success: true, result: null });
      }
      send(404, { success: false, errors: [{ message: "unknown" }] });
    });
  })
  .listen(port, "127.0.0.1", () => console.log(`fake Cloudflare Pages API on http://127.0.0.1:${port}`));
