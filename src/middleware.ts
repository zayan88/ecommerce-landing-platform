import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/auth/session";

/**
 * Single security gate:
 * - /admin pages (except /admin/login) need a valid signed admin cookie.
 * - /api is admin-only, except the explicit public allow-list below (visitor checkout, tracking, chat, Safka hooks).
 */

const SAFQA_HEALTH_GET = new Set(["", "webhook", "orders", "order-webhook", "products", "product-webhook"]);
// connect-callback POST is passed to the handler, which requires admin cookie OR valid webhook secret
const SAFQA_PUBLIC_POST = new Set([
  "",
  "webhook",
  "orders",
  "order-webhook",
  "products",
  "product-webhook",
  "connect-callback",
]);

function normalizePath(raw: string): string | null {
  let p: string;
  try {
    p = decodeURIComponent(raw);
  } catch {
    return null;
  }
  p = p.replace(/\/{2,}/g, "/");
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p.toLowerCase();
}

function isPublicApi(method: string, p: string): boolean {
  if (method === "OPTIONS") return true; // no OPTIONS handlers; same-origin app
  const m = method === "HEAD" ? "GET" : method; // Next runs GET for HEAD
  if (p === "/api/admin/auth") return m === "GET" || m === "POST" || m === "DELETE";
  if (p === "/api/orders") return m === "POST";
  if (p === "/api/products") return m === "GET";
  if (p === "/api/analytics") return m === "POST";
  if (p === "/api/support/chat") return m === "POST";
  if (p === "/api/safqa" || p.startsWith("/api/safqa/")) {
    const rest = p.slice("/api/safqa".length).replace(/^\//, "");
    if (rest.includes("/")) return false; // multi-segment -> admin only
    if (m === "GET") return SAFQA_HEALTH_GET.has(rest);
    if (m === "POST") return SAFQA_PUBLIC_POST.has(rest);
    return false;
  }
  return false;
}

function loginRedirect(request: NextRequest): NextResponse {
  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export function middleware(request: NextRequest) {
  const raw = request.nextUrl.pathname;
  const path = normalizePath(raw);
  const method = request.method.toUpperCase();
  const isApi =
    path === null ? raw.toLowerCase().startsWith("/api") : path === "/api" || path.startsWith("/api/");

  if (path !== null && isApi && isPublicApi(method, path)) return NextResponse.next();
  if (path === "/admin/login") return NextResponse.next();
  if (isAdminRequest(request)) return NextResponse.next();

  if (isApi) {
    if (path === "/api/safqa/connect-callback" && (method === "GET" || method === "HEAD")) {
      return loginRedirect(request); // browser redirect from Safka: log in, then come back with the key
    }
    return NextResponse.json(
      { success: false, error: "غير مصرح. يرجى تسجيل الدخول إلى لوحة التحكم." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }
  return loginRedirect(request);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/:path*"],
};
