/**
 * Cloudflare KV Persistent Store Client
 * Supports both native Edge getRequestContext binding and REST API fallback.
 */

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || "29840259dea50eb6e54fc804e1d3f11b";
const CF_KV_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID || "c051d16cb4f44bc196304ef9f6709fb2";
const CF_API_KEY = process.env.CF_API_KEY || "";
const CF_EMAIL = process.env.CF_EMAIL || "Zayanuiux@gmail.com";

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
    try {
      const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/${encodeURIComponent(key)}`;
      const res = await fetch(url, {
        headers: {
          "X-Auth-Key": CF_API_KEY,
          "X-Auth-Email": CF_EMAIL,
        },
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
    try {
      const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/${encodeURIComponent(key)}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "X-Auth-Key": CF_API_KEY,
          "X-Auth-Email": CF_EMAIL,
          "Content-Type": "text/plain",
        },
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

    try {
      const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/${encodeURIComponent(key)}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          "X-Auth-Key": CF_API_KEY,
          "X-Auth-Email": CF_EMAIL,
        },
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
