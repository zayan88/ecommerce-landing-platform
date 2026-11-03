import { NextRequest, NextResponse } from "next/server";
import {
  validateAdminPin,
  createAdminAuthToken,
  verifyAdminAuthToken,
  AUTH_COOKIE_NAME,
} from "@/lib/auth/admin-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json({ success: false, error: "يرجى إدخال رمز الدخول" }, { status: 400 });
    }

    if (!validateAdminPin(pin)) {
      return NextResponse.json(
        { success: false, error: "رمز الدخول غير صحيح، يرجى المحاولة مرة أخرى" },
        { status: 401 }
      );
    }

    const token = createAdminAuthToken();
    const response = NextResponse.json({
      success: true,
      message: "تم تسجيل الدخول بنجاح",
    });

    // Set secure HTTP-only cookie valid for 30 days
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
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
