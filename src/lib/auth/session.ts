import type { NextRequest } from "next/server";
import { hmacSha256, sha256, timingSafeEqual, toHex } from "@/lib/crypto/sha256";

/**
 * Admin session tokens. Safe to import from middleware (no next/headers).
 * Env is read inside functions only: on next-on-pages process.env is filled per request.
 */

export const AUTH_COOKIE_NAME = "sf_admin_auth";
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const TOKEN_VERSION = "v1";
const MIN_SECRET_LEN = 16;
const MAX_CLOCK_SKEW_SECONDS = 300;

let warnedDerived = false;

export function getAdminPin(): string {
  return (process.env.ADMIN_PIN || process.env.ADMIN_PASSWORD || "").trim();
}

/** Signing key, or null when auth cannot be safely enabled (fail closed). Includes the PIN so a PIN change revokes all sessions. */
export function getSigningKey(): string | null {
  const pin = getAdminPin();
  if (!pin) return null;
  const explicit = (process.env.AUTH_SECRET || "").trim();
  let base = explicit.length >= MIN_SECRET_LEN ? explicit : "";
  if (!base) {
    const candidates = [
      process.env.CF_API_TOKEN,
      process.env.CF_API_KEY,
      process.env.SAFKA_API_KEY,
      process.env.SAFQA_API_SECRET_TOKEN,
    ];
    for (const c of candidates) {
      const v = (c || "").trim();
      if (v.length >= MIN_SECRET_LEN) {
        base = v;
        break;
      }
    }
    if (base && !warnedDerived) {
      warnedDerived = true;
      console.warn(
        "[Admin Auth] AUTH_SECRET missing/short (<16 chars); using a key derived from a private env value. Set AUTH_SECRET."
      );
    }
  }
  if (!base) return null;
  return hmacSha256(base, `store-admin-session|${TOKEN_VERSION}|${pin}`);
}

export function isAuthEnabled(): boolean {
  return getSigningKey() !== null;
}

function randomHex(bytes: number): string {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return toHex(b);
}

/** Token: v1.<iatSec>.<expSec>.<nonce32hex>.<sig64hex>. Returns null when auth is disabled. */
export function createAdminAuthToken(nowMs: number = Date.now()): string | null {
  const key = getSigningKey();
  if (!key) return null;
  const iat = Math.floor(nowMs / 1000);
  const exp = iat + SESSION_TTL_SECONDS;
  const payload = `${TOKEN_VERSION}.${iat}.${exp}.${randomHex(16)}`;
  return `${payload}.${hmacSha256(key, payload)}`;
}

export function verifyAdminAuthToken(token?: string | null, nowMs: number = Date.now()): boolean {
  if (!token || token.length > 256) return false;
  const parts = token.split(".");
  if (parts.length !== 5) return false;
  const [ver, iatS, expS, nonce, sig] = parts;
  if (ver !== TOKEN_VERSION) return false;
  if (!/^\d{1,12}$/.test(iatS) || !/^\d{1,12}$/.test(expS)) return false;
  if (!/^[0-9a-f]{32}$/.test(nonce) || !/^[0-9a-f]{64}$/.test(sig)) return false;
  const key = getSigningKey();
  if (!key) return false;
  const expected = hmacSha256(key, `${ver}.${iatS}.${expS}.${nonce}`);
  if (!timingSafeEqual(sig, expected)) return false;
  const iat = Number(iatS);
  const exp = Number(expS);
  const now = Math.floor(nowMs / 1000);
  if (exp <= iat || exp - iat > SESSION_TTL_SECONDS) return false;
  if (iat > now + MAX_CLOCK_SKEW_SECONDS) return false;
  if (now >= exp) return false;
  return true;
}

export function validateAdminPin(entered: unknown): boolean {
  const pin = getAdminPin();
  if (!pin || typeof entered !== "string" || entered.length > 128) return false;
  // hash both sides so neither length nor content leaks through timing
  return timingSafeEqual(sha256(entered.trim()), sha256(pin));
}

export function isAdminRequest(req: NextRequest): boolean {
  return verifyAdminAuthToken(req.cookies.get(AUTH_COOKIE_NAME)?.value);
}
