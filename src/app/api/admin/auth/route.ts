import { NextRequest, NextResponse } from "next/server";
import {
  validateAdminPin,
  createAdminAuthToken,
  verifyAdminAuthToken,
  isAuthEnabled,
  AUTH_COOKIE_NAME,
  SESSION_TTL_SECONDS,
} from "@/lib/auth/session";
import {
  getClientIp,
  getLoginBlock,
  recordLoginFailure,
  clearLoginFailures,
} from "@/lib/auth/rate-limit";

export const runtime = "edge";

const AUTH_DISABLED_MESSAGE =
  "تسجيل الدخول غير مُفعّل على الخادم: يجب ضبط ADMIN_PIN و AUTH_SECRET (16 حرفاً على الأقل) في متغيرات البيئة.";

export async function POST(req: NextRequest) {
  try {
    if (!isAuthEnabled()) {
      return NextResponse.json({ success: false, error: AUTH_DISABLED_MESSAGE }, { status: 500 });
    }

    const ip = getClientIp(req);
    const block = await getLoginBlock(ip);
    if (block.blocked) {
      return NextResponse.json(
        {
          success: false,
          error: `محاولات خاطئة كثيرة. يرجى المحاولة بعد ${Math.ceil(block.retryAfterSec / 60)} دقيقة.`,
        },
        { status: 429, headers: { "Retry-After": String(block.retryAfterSec) } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const pin = typeof body?.pin === "string" ? body.pin : "";

    if (!pin.trim()) {
      return NextResponse.json({ success: false, error: "يرجى إدخال رمز الدخول" }, { status: 400 });
    }

    if (!validateAdminPin(pin)) {
      await recordLoginFailure(ip);
      return NextResponse.json(
        { success: false, error: "رمز الدخول غير صحيح، يرجى المحاولة مرة أخرى" },
        { status: 401 }
      );
    }

    await clearLoginFailures(ip);
    const token = createAdminAuthToken();
    if (!token) {
      return NextResponse.json({ success: false, error: AUTH_DISABLED_MESSAGE }, { status: 500 });
    }

    const response = NextResponse.json(
      { success: true, message: "تم تسجيل الدخول بنجاح" },
      { headers: { "Cache-Control": "no-store" } }
    );

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: req.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_TTL_SECONDS,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ success: false, error: "حدث خطأ أثناء تسجيل الدخول" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuth = verifyAdminAuthToken(token);
  return NextResponse.json({ authenticated: isAuth });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "تم تسجيل الخروج" });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
