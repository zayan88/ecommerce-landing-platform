/**
 * Custom domain for the store, managed from the admin (no Cloudflare dashboard needed by the merchant).
 *
 * What the store can do: register the domain on the Cloudflare Pages project (SSL included) and report its status.
 * What it cannot do: point the domain at Cloudflare. That is one DNS record the merchant adds at whoever sold him the
 * domain (Spaceship, Hostinger, ...); the admin page shows the exact record.
 *
 * Needs a SCOPED Cloudflare API token (Account > Cloudflare Pages > Edit) in the env var CF_PAGES_API_TOKEN, plus
 * CF_ACCOUNT_ID and CF_PAGES_PROJECT. Never use the global API key here. The token is never returned to the browser.
 */

export interface DomainEnv {
  token: string;
  accountId: string;
  project: string;
  apiBase: string;
}

export type DomainState = "pending" | "active" | "failed";

export interface DomainInfo {
  name: string;
  state: DomainState;
  raw_status: string;
  error: string;
}

export interface DnsInstruction {
  type: "CNAME";
  /** Host/name to type at the registrar ("www", "shop", or "@" for the bare domain). */
  name: string;
  target: string;
  isApex: boolean;
}

const CF_API = "https://api.cloudflare.com/client/v4";
const MAX_DOMAINS = 3;

/** Reads the env (static `process.env.X` reads only: required on Cloudflare / next-on-pages). */
export function readDomainEnv(): DomainEnv | null {
  const token = (process.env.CF_PAGES_API_TOKEN || "").trim();
  const accountId = (process.env.CF_ACCOUNT_ID || "").trim();
  const project = (process.env.CF_PAGES_PROJECT || "").trim();
  if (!token || !/^[0-9a-f]{32}$/i.test(accountId) || !/^[a-z0-9-]{1,58}$/i.test(project)) return null;
  // Local testing only: a fake Cloudflare on 127.0.0.1 may replace the real API (any other value is ignored)
  const override = (process.env.CF_API_BASE || "").trim();
  const apiBase = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(override) ? override : CF_API;
  return { token, accountId, project, apiBase };
}

// ───────────────────────── hostname validation ─────────────────────────

const RESERVED_SUFFIXES = [".pages.dev", ".workers.dev", ".vercel.app", ".localhost", ".local", ".internal", ".test", ".invalid"];
// Second-level public suffixes people commonly use (a bare "name.com.eg" is an apex domain)
const SECOND_LEVEL = new Set(["com.eg", "net.eg", "org.eg", "edu.eg", "gov.eg", "co.uk", "org.uk", "com.sa", "com.au", "co.za", "com.tr"]);

export type HostnameResult = { ok: true; host: string } | { ok: false; error: string };

export function normalizeHostname(input: unknown): HostnameResult {
  if (typeof input !== "string") return { ok: false, error: "اكتب اسم الدومين" };
  let v = input.trim().toLowerCase();
  if (!v) return { ok: false, error: "اكتب اسم الدومين" };
  if (v.length > 253 || /[\s\u0000-\u001f]/.test(v)) return { ok: false, error: "اسم الدومين غير صحيح" };
  v = v.replace(/^[a-z][a-z0-9+.-]*:\/\//, ""); // https://
  v = v.split(/[/?#]/)[0]; // path / query
  if (v.includes("@")) return { ok: false, error: "اكتب اسم الدومين بس بدون @" };
  v = v.replace(/:\d+$/, "").replace(/\.$/, ""); // port / trailing dot
  if (v.startsWith("*.")) return { ok: false, error: "الدومين اللي بنجمة (*) مش مدعوم" };

  let host: string;
  try {
    host = new URL("http://" + v).hostname; // converts internationalised names to punycode
  } catch {
    return { ok: false, error: "اسم الدومين غير صحيح" };
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":")) return { ok: false, error: "اكتب اسم دومين مش عنوان IP" };
  if (RESERVED_SUFFIXES.some((s) => host.endsWith(s)) || host === "localhost") {
    return { ok: false, error: "الدومين ده مش مسموح، استخدم دومينك الخاص" };
  }
  if (!/^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$/.test(host) || !/[a-z]/.test(host.split(".").pop() || "")) {
    return { ok: false, error: "اسم الدومين غير صحيح، مثال: shop.mystore.com" };
  }
  return { ok: true, host };
}

export function isApexDomain(host: string): boolean {
  const labels = host.split(".");
  const lastTwo = labels.slice(-2).join(".");
  return SECOND_LEVEL.has(lastTwo) ? labels.length === 3 : labels.length === 2;
}

export function dnsInstruction(host: string, project: string): DnsInstruction {
  const apex = isApexDomain(host);
  const labels = host.split(".");
  const registrable = SECOND_LEVEL.has(labels.slice(-2).join(".")) ? 3 : 2;
  const name = apex ? "@" : labels.slice(0, labels.length - registrable).join(".");
  return { type: "CNAME", name, target: `${project}.pages.dev`, isApex: apex };
}

// ───────────────────────── Cloudflare calls ─────────────────────────

type FetchLike = typeof fetch;

export class DomainApiError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
  }
}

async function cf(env: DomainEnv, method: string, path: string, body?: unknown, f: FetchLike = fetch): Promise<any> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 12000);
  try {
    const res = await f(`${env.apiBase}/accounts/${env.accountId}/pages/projects/${env.project}${path}`, {
      method,
      headers: { Authorization: `Bearer ${env.token}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctl.signal,
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok || json?.success === false) {
      if (res.status === 401 || res.status === 403) throw new DomainApiError("صلاحية الربط مع Cloudflare غير صحيحة، راجع المسؤول", 502);
      const msg = String(json?.errors?.[0]?.message || "").slice(0, 160);
      throw new DomainApiError(msg ? `رفض Cloudflare الطلب: ${msg}` : "تعذر الاتصال بـ Cloudflare، حاول مرة أخرى", res.status === 409 ? 409 : 502);
    }
    return json?.result;
  } catch (e) {
    if (e instanceof DomainApiError) throw e;
    throw new DomainApiError("تعذر الاتصال بـ Cloudflare، حاول مرة أخرى");
  } finally {
    clearTimeout(timer);
  }
}

export function toInfo(d: any): DomainInfo {
  const raw = String(d?.status || "");
  const state: DomainState = raw === "active" ? "active" : raw === "pending" || raw === "initializing" ? "pending" : "failed";
  const err = String(d?.validation_data?.error_message || d?.verification_data?.error_message || "").slice(0, 200);
  return { name: String(d?.name || ""), state, raw_status: raw, error: state === "failed" ? err : "" };
}

export async function listDomains(env: DomainEnv, f?: FetchLike): Promise<DomainInfo[]> {
  const r = await cf(env, "GET", "/domains", undefined, f);
  return (Array.isArray(r) ? r : [])
    .map(toInfo)
    .filter((d) => d.name && !d.name.endsWith(".pages.dev"));
}

export async function addDomain(env: DomainEnv, host: string, f?: FetchLike): Promise<DomainInfo> {
  const existing = await listDomains(env, f);
  if (existing.some((d) => d.name === host)) return existing.find((d) => d.name === host)!;
  if (existing.length >= MAX_DOMAINS) throw new DomainApiError(`الحد الأقصى ${MAX_DOMAINS} دومينات للمتجر`, 400);
  return toInfo(await cf(env, "POST", "/domains", { name: host }, f));
}

/** Asks Cloudflare to re-check the DNS record now (it also re-checks by itself every few minutes). */
export async function recheckDomain(env: DomainEnv, host: string, f?: FetchLike): Promise<DomainInfo> {
  try {
    await cf(env, "PATCH", `/domains/${encodeURIComponent(host)}`, {}, f);
  } catch {
    /* a failed nudge must not hide the real status below */
  }
  return toInfo(await cf(env, "GET", `/domains/${encodeURIComponent(host)}`, undefined, f));
}

export async function removeDomain(env: DomainEnv, host: string, f?: FetchLike): Promise<void> {
  await cf(env, "DELETE", `/domains/${encodeURIComponent(host)}`, undefined, f);
}
