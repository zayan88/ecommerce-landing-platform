import { cookies } from "next/headers";
import crypto from "crypto";

const ADMIN_PIN = process.env.ADMIN_PIN || process.env.ADMIN_PASSWORD || "8826";
const AUTH_COOKIE_NAME = "rexrack_admin_auth";
const AUTH_SECRET = process.env.AUTH_SECRET || "rexrack_secret_key_production_2026";

/**
 * Creates a signed auth token based on the admin PIN and a timestamp hash
 */
export function createAdminAuthToken(): string {
  const payload = `admin_${Date.now()}`;
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

/**
 * Verifies if an auth token is cryptographically valid
 */
export function verifyAdminAuthToken(token?: string): boolean {
  if (!token || !token.includes(".")) return false;
  const [payload, signature] = token.split(".");
  const expectedSig = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
  return signature === expectedSig;
}

/**
 * Checks if the submitted PIN matches the admin PIN
 */
export function validateAdminPin(enteredPin: string): boolean {
  return enteredPin.trim() === ADMIN_PIN.trim();
}

/**
 * Helper to check auth status in Server Components / Routes
 */
export function isAuthenticatedAdmin(): boolean {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    return verifyAdminAuthToken(token);
  } catch {
    return false;
  }
}

export { AUTH_COOKIE_NAME, ADMIN_PIN };
