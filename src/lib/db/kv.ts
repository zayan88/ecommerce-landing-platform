/**
 * Cloudflare KV Persistent Store Client
 * Supports both native Edge binding (STORE_KV) and REST API fallback.
 * All account/credential config comes from env vars — nothing is hardcoded.
 */

type KvRestConfig = { base: string; headers: Record<string, string> };
let warnedNoRest = false;

/** Read per call: on next-on-pages process.env is filled per request. */
function getKvRestConfig(): KvRestConfig | null {
  // Local development: point at the bundled KV emulator (scripts/dev-kv-server.mjs), never real Cloudflare.
  const local = (process.env.KV_REST_BASE_URL || "").trim().replace(/\/+$/, "");
  if (local) return { base: local + "/values/", headers: {} };
  const accountId = (process.env.CF_ACCOUNT_ID || "").trim();
  const namespaceId = (process.env.CF_KV_NAMESPACE_ID || "").trim();
  const token = (process.env.CF_API_TOKEN || "").trim();
  const key = (process.env.CF_API_KEY || "").trim();
  const email = (process.env.CF_EMAIL || "").trim();

  let headers: Record<string, string> | null = null;
  if (token) headers = { Authorization: `Bearer ${token}` }; // preferred: scoped API token
  else if (key && email) headers = { "X-Auth-Key": key, "X-Auth-Email": email }; // legacy global key

  if (!accountId || !namespaceId || !headers) {
    if (!warnedNoRest) {
      warnedNoRest = true;
      console.warn(
        "[KV] REST fallback not configured (CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID, CF_API_TOKEN or CF_API_KEY+CF_EMAIL)."
      );
    }
    return null;
  }
  return {
    base: `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/storage/kv/namespaces/${encodeURIComponent(namespaceId)}/values/`,
    headers,
  };
}

function getNativeKV(): any {
  try {
    const ctx = (globalThis as any)[Symbol.for("__cloudflare-request-context__")];
    return ctx?.env?.STORE_KV || (globalThis as any)?.STORE_KV || null;
  } catch {
    return null;
  }
}

export type KvReadResult<T> =
  | { status: "found"; value: T }
  | { status: "missing" | "error" | "unconfigured"; value: null };

export type KvListKey<M = any> = { name: string; metadata: M | null };
export type KvListPage<M = any> = { ok: boolean; keys: KvListKey<M>[]; cursor: string; complete: boolean };

export const kvStore = {
  async get<T = any>(key: string): Promise<T | null> {
    // 1. Try native worker binding
    const native = getNativeKV();
    if (native && typeof native.get === "function") {
      try {
        const val = await native.get(key);
        if (val) return JSON.parse(val) as T;
      } catch (err) {
        console.warn(`[KV Native Get Error] key: ${key}`, err);
      }
    }

    // 2. Fallback to Cloudflare KV REST API
    const cfg = getKvRestConfig();
    if (!cfg) return null;
    try {
      const res = await fetch(cfg.base + encodeURIComponent(key), {
        headers: { ...cfg.headers },
      });
      if (res.ok) {
        const text = await res.text();
        return JSON.parse(text) as T;
      }
    } catch (err) {
      console.warn(`[KV REST Get Error] key: ${key}`, err);
    }

    return null;
  },

  async put(key: string, value: any): Promise<boolean> {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);

    // 1. Try native worker binding
    const native = getNativeKV();
    if (native && typeof native.put === "function") {
      try {
        await native.put(key, serialized);
        return true;
      } catch (err) {
        console.warn(`[KV Native Put Error] key: ${key}`, err);
      }
    }

    // 2. Fallback to Cloudflare KV REST API
    const cfg = getKvRestConfig();
    if (!cfg) return false;
    try {
      const res = await fetch(cfg.base + encodeURIComponent(key), {
        method: "PUT",
        headers: { ...cfg.headers, "Content-Type": "text/plain" },
        body: serialized,
      });
      return res.ok;
    } catch (err) {
      console.error(`[KV REST Put Error] key: ${key}`, err);
      return false;
    }
  },

  /** True when a native binding or the REST fallback is available. */
  isAvailable(): boolean {
    return Boolean(getNativeKV() || getKvRestConfig());
  },

  /**
   * Like get(), but tells "key does not exist" apart from "could not read".
   * Callers that read-then-write MUST use this: on "error" nothing may be overwritten.
   */
  async read<T = any>(key: string): Promise<KvReadResult<T>> {
    const native = getNativeKV();
    if (native && typeof native.get === "function") {
      try {
        const val = await native.get(key);
        if (val === null || val === undefined) return { status: "missing", value: null };
        return { status: "found", value: JSON.parse(val) as T };
      } catch (err) {
        console.warn(`[KV Native Read Error] key: ${key}`, err);
        // fall through to REST (if configured)
      }
    }

    const cfg = getKvRestConfig();
    if (!cfg) return { status: native ? "error" : "unconfigured", value: null };
    try {
      const res = await fetch(cfg.base + encodeURIComponent(key), { headers: { ...cfg.headers } });
      if (res.status === 404) return { status: "missing", value: null };
      if (!res.ok) return { status: "error", value: null };
      return { status: "found", value: JSON.parse(await res.text()) as T };
    } catch (err) {
      console.warn(`[KV REST Read Error] key: ${key}`, err);
      return { status: "error", value: null };
    }
  },

  /**
   * put() with KV key metadata (returned by list(), so listings need no per-key read).
   * Cloudflare caps serialized metadata at 1024 bytes — the caller keeps it below that.
   */
  async putWithMetadata(key: string, value: any, metadata: Record<string, any>): Promise<boolean> {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);

    const native = getNativeKV();
    if (native && typeof native.put === "function") {
      try {
        await native.put(key, serialized, { metadata });
        return true;
      } catch (err) {
        console.warn(`[KV Native Put Error] key: ${key}`, err);
      }
    }

    const cfg = getKvRestConfig();
    if (!cfg) return false;
    try {
      // Documented multipart upload: fields `value` and `metadata` (JSON string).
      // No explicit Content-Type: fetch sets the multipart boundary itself.
      const form = new FormData();
      form.append("value", serialized);
      form.append("metadata", JSON.stringify(metadata));
      const res = await fetch(cfg.base + encodeURIComponent(key), {
        method: "PUT",
        headers: { ...cfg.headers },
        body: form,
      });
      if (res.ok) return true;
      console.error(`[KV REST Put+Metadata Error] key: ${key} status: ${res.status} — retrying without metadata`);
    } catch (err) {
      console.error(`[KV REST Put+Metadata Error] key: ${key} — retrying without metadata`, err);
    }

    // Safety net: never lose a write because of the metadata upload format.
    // Without metadata the key is still listed and simply read individually.
    try {
      const res = await fetch(cfg.base + encodeURIComponent(key), {
        method: "PUT",
        headers: { ...cfg.headers, "Content-Type": "text/plain" },
        body: serialized,
      });
      return res.ok;
    } catch (err) {
      console.error(`[KV REST Put Error] key: ${key}`, err);
      return false;
    }
  },

  /** One page (≤1000 keys) of key names + metadata under a prefix. `ok:false` = could not list. */
  async list<M = any>(prefix: string, cursor?: string): Promise<KvListPage<M>> {
    const failed: KvListPage<M> = { ok: false, keys: [], cursor: "", complete: false };

    const native = getNativeKV();
    if (native && typeof native.list === "function") {
      try {
        const res = await native.list({ prefix, cursor: cursor || undefined, limit: 1000 });
        const next = res?.list_complete ? "" : res?.cursor || "";
        return {
          ok: true,
          keys: (res?.keys || []).map((k: any) => ({ name: k.name, metadata: (k.metadata ?? null) as M | null })),
          cursor: next,
          complete: !next,
        };
      } catch (err) {
        console.warn(`[KV Native List Error] prefix: ${prefix}`, err);
      }
    }

    const cfg = getKvRestConfig();
    if (!cfg) return failed;
    try {
      const url =
        cfg.base.replace(/\/values\/$/, "/keys") +
        `?limit=1000&prefix=${encodeURIComponent(prefix)}` +
        (cursor ? `&cursor=${encodeURIComponent(cursor)}` : "");
      const res = await fetch(url, { headers: { ...cfg.headers } });
      if (!res.ok) return failed;
      const body: any = await res.json();
      if (!body || body.success === false || !Array.isArray(body.result)) return failed;
      const next: string = body.result_info?.cursor || "";
      return {
        ok: true,
        keys: body.result.map((k: any) => ({ name: k.name, metadata: (k.metadata ?? null) as M | null })),
        cursor: next,
        complete: !next,
      };
    } catch (err) {
      console.warn(`[KV REST List Error] prefix: ${prefix}`, err);
      return failed;
    }
  },

  /** Every key under a prefix (follows cursors). `ok:false` if any page failed — never a partial list. */
  async listAll<M = any>(prefix: string, maxPages = 100): Promise<{ ok: boolean; keys: KvListKey<M>[] }> {
    const keys: KvListKey<M>[] = [];
    let cursor = "";
    for (let page = 0; page < maxPages; page++) {
      const res = await this.list<M>(prefix, cursor);
      if (!res.ok) return { ok: false, keys: [] };
      keys.push(...res.keys);
      if (res.complete) return { ok: true, keys };
      cursor = res.cursor;
    }
    console.warn(`[KV listAll] prefix ${prefix} exceeded ${maxPages} pages`);
    return { ok: false, keys: [] };
  },

  async delete(key: string): Promise<boolean> {
    const native = getNativeKV();
    if (native && typeof native.delete === "function") {
      try {
        await native.delete(key);
        return true;
      } catch {}
    }

    const cfg = getKvRestConfig();
    if (!cfg) return false;
    try {
      const res = await fetch(cfg.base + encodeURIComponent(key), {
        method: "DELETE",
        headers: { ...cfg.headers },
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
