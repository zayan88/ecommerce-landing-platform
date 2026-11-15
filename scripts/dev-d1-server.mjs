// Local Cloudflare-D1 emulator for development and tests ONLY (the minimal API src/lib/db/d1.ts needs),
// backed by Node's built-in node:sqlite. It mirrors scripts/dev-kv-server.mjs: `next dev` cannot see
// Cloudflare bindings, so the app talks to this over HTTP when D1_REST_BASE_URL is set.
//
//   POST /query  { sql, params }                 -> { success, results: [...rows], meta: { changes } }
//   POST /batch  { statements: [{sql, params}] } -> { success, results: [{ results, meta }, ...] }   (one transaction)
//   GET  /health                                  -> { success, migrations: [...] }
//
// Every statement is prepared and its parameters are bound; this server never builds SQL itself.
// On start it applies migrations/*.sql in order (tracked in table d1_migrations, like wrangler does).
// Data persists in .dev-d1.sqlite next to this repo.
// Usage: node scripts/dev-d1-server.mjs [port]         (default 3198; binds 127.0.0.1 only)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";

const here = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(here, "..", "migrations");

export function applyMigrations(db, dir = MIGRATIONS_DIR) {
  db.exec(
    "CREATE TABLE IF NOT EXISTS d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)"
  );
  const done = new Set(db.prepare("SELECT name FROM d1_migrations").all().map((r) => r.name));
  const files = fs.readdirSync(dir).filter((f) => /^\d+.*\.sql$/.test(f)).sort();
  const applied = [];
  for (const name of files) {
    if (done.has(name)) continue;
    db.exec("BEGIN");
    try {
      db.exec(fs.readFileSync(path.join(dir, name), "utf8"));
      db.prepare("INSERT INTO d1_migrations (name) VALUES (?)").run(name);
      db.exec("COMMIT");
      applied.push(name);
    } catch (e) {
      db.exec("ROLLBACK");
      throw new Error(`migration ${name} failed: ${e.message}`);
    }
  }
  return applied;
}

function checkParams(params) {
  if (!Array.isArray(params)) throw new Error("params must be an array");
  for (const p of params) {
    if (p !== null && typeof p !== "string" && typeof p !== "number") throw new Error("unsupported parameter type");
  }
  return params;
}

function execute(db, sql, params) {
  if (typeof sql !== "string" || !sql.trim()) throw new Error("sql must be a non-empty string");
  const stmt = db.prepare(sql);
  const bound = checkParams(params || []);
  if (stmt.columns().length > 0) {
    const results = stmt.all(...bound);
    return { results, meta: { changes: 0 } };
  }
  const info = stmt.run(...bound);
  return { results: [], meta: { changes: Number(info.changes) || 0 } };
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > 8 * 1024 * 1024) throw new Error("body too large");
    chunks.push(c);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

/** Starts the emulator. `file` may be ":memory:" (tests). Resolves with { server, db, port, url, close }. */
export function startDevD1Server({ port = 3198, file = path.join(here, "..", ".dev-d1.sqlite"), quiet = false } = {}) {
  const db = new DatabaseSync(file);
  if (file !== ":memory:") db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  const applied = applyMigrations(db);
  const json = (res, code, obj) => {
    res.writeHead(code, { "Content-Type": "application/json" });
    res.end(JSON.stringify(obj));
  };

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      if (req.method === "GET" && url.pathname === "/health") {
        const migrations = db.prepare("SELECT name FROM d1_migrations ORDER BY id").all().map((r) => r.name);
        return json(res, 200, { success: true, migrations });
      }
      if (req.method !== "POST") return json(res, 405, { success: false, error: "method not allowed" });
      const body = await readJson(req);
      if (url.pathname === "/query") {
        return json(res, 200, { success: true, ...execute(db, body.sql, body.params) });
      }
      if (url.pathname === "/batch") {
        if (!Array.isArray(body.statements)) throw new Error("statements must be an array");
        db.exec("BEGIN IMMEDIATE");
        try {
          const results = body.statements.map((s) => execute(db, s.sql, s.params));
          db.exec("COMMIT");
          return json(res, 200, { success: true, results });
        } catch (e) {
          db.exec("ROLLBACK");
          throw e;
        }
      }
      return json(res, 404, { success: false, error: "not found" });
    } catch (e) {
      // SQLite messages name tables/constraints only; parameters are never echoed or logged.
      json(res, 400, { success: false, error: String(e?.message || e).slice(0, 300) });
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      const actual = server.address().port;
      const url = "http://127.0.0.1:" + actual;
      if (!quiet) {
        console.log(`dev D1 emulator on ${url} (db: ${file})` + (applied.length ? ` — applied: ${applied.join(", ")}` : ""));
      }
      resolve({
        server,
        db,
        port: actual,
        url,
        close: () => new Promise((r) => server.close(() => { try { db.close(); } catch {} r(); })),
      });
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startDevD1Server({ port: Number(process.argv[2] || 3198) }).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
