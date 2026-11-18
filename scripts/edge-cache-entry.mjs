// Edge cache in front of the Next.js worker (free-plan CPU relief).
//
// scripts/wrap-worker.mjs copies this file over `.vercel/output/static/_worker.js/index.js` after
// `next-on-pages` and moves the generated worker to `next-app.js`. Cache HITS never import the heavy
// app (dynamic import below), so a repeat visit costs ~1ms of CPU instead of 30-200ms.
//
// Cached: public product pages (/p/<slug>) and uploaded images (/api/media/<id>), GET only, 200 only.
// Everything else (admin, /api/orders, tracking, thank-you page, ...) goes straight to the app.

const PAGE_TTL_SECONDS = 120; // page edits show up within this long

const DROP_PARAMS = /^(utm_|fbclid$|gclid$|ttclid$|igshid$|msclkid$|_ga$|_gl$)/i;

/** Which requests may be served from / stored in the cache. */
export function cacheKind(request) {
  if (request.method !== "GET") return null;
  const url = new URL(request.url);
  const p = url.pathname;
  if (/^\/p\/[^/]+\/?$/.test(p)) return "page";
  if (/^\/api\/media\/[^/]+$/.test(p)) return "media";
  return null;
}

/** Same page for every visitor: ad click-ids and utm tags must not split the cache. */
export function cacheKeyFor(request) {
  const url = new URL(request.url);
  const keep = new URLSearchParams();
  for (const [k, v] of url.searchParams) if (!DROP_PARAMS.test(k)) keep.append(k, v);
  keep.sort();
  url.search = keep.toString() ? `?${keep.toString()}` : "";
  url.hash = "";
  return new Request(url.toString(), { method: "GET" });
}

export function createHandler(loadApp, cacheStore) {
  return {
    async fetch(request, env, ctx) {
      const kind = cacheKind(request);
      const cache = cacheStore || (typeof caches !== "undefined" ? caches.default : null);
      if (!kind || !cache) {
        const app = await loadApp();
        return app.default.fetch(request, env, ctx);
      }

      const key = cacheKeyFor(request);
      try {
        const hit = await cache.match(key);
        if (hit) {
          const r = new Response(hit.body, hit);
          r.headers.set("X-Edge-Cache", "HIT");
          return r;
        }
      } catch {
        // a cache problem must never break the page
      }

      const app = await loadApp();
      const res = await app.default.fetch(request, env, ctx);
      if (res.status !== 200 || res.headers.has("set-cookie")) return res;

      const out = new Response(res.body, res);
      if (kind === "page") out.headers.set("Cache-Control", `public, max-age=0, s-maxage=${PAGE_TTL_SECONDS}`);
      out.headers.set("X-Edge-Cache", "MISS");
      try {
        const toStore = out.clone();
        const put = cache.put(key, toStore);
        if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(put);
        else await put;
      } catch {
        // storing is best-effort
      }
      return out;
    },
  };
}

export default createHandler(() => import("./next-app.js"));
