/**
 * Cloudflare KV Persistent Store Client
 * Supports both native Edge binding (STORE_KV) and REST API fallback.
 * All account/credential config comes from env vars — nothing is hardcoded.
 */

type KvRestConfig = { base: string; headers: Record<string, string> };
let warnedNoRest = false;

/** Read per call: on next-on-pages process.env is filled per request. */
function getKvRestConfig(): KvRestConfig | null {
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
