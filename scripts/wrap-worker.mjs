// Run AFTER `npx @cloudflare/next-on-pages` (see package.json "pages:build:cached").
// Moves the generated worker to next-app.js and puts the edge-cache entry in front of it.
// Safe by design: if anything looks off it leaves the generated worker untouched and exits 0.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(here, "..", ".vercel", "output", "static", "_worker.js");
const index = path.join(dir, "index.js");
const app = path.join(dir, "next-app.js");

try {
  if (!fs.existsSync(index)) {
    console.log("[wrap-worker] no _worker.js/index.js, nothing to do");
    process.exit(0);
  }
  if (fs.existsSync(app)) {
    console.log("[wrap-worker] already wrapped");
    process.exit(0);
  }
  fs.renameSync(index, app);
  try {
    fs.copyFileSync(path.join(here, "edge-cache-entry.mjs"), index);
  } catch (e) {
    fs.renameSync(app, index); // restore
    throw e;
  }
  console.log("[wrap-worker] edge cache entry installed");
} catch (e) {
  console.log("[wrap-worker] skipped:", e && e.message);
}
process.exit(0);
