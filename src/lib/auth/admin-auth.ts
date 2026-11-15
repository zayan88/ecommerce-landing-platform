import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifyAdminAuthToken } from "./session";

export {
  AUTH_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  createAdminAuthToken,
  verifyAdminAuthToken,
  validateAdminPin,
  isAuthEnabled,
  isAdminRequest,
} from "./session";

/** Server Components / Route Handlers helper. Do not import this file from middleware. */
export function isAuthenticatedAdmin(): boolean {
  try {
    return verifyAdminAuthToken(cookies().get(AUTH_COOKIE_NAME)?.value);
  } catch {
    return false;
  }
}
