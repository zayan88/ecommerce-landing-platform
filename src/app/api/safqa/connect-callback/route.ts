import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";

/**
 * Safka Connect Callback (GET)
 * If Safka redirects the user with query parameters
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("api-safka-key") || searchParams.get("key") || searchParams.get("token");

  if (key) {
    await dbStore.updateSettings({
      safqa_api_secret_token: key,
    });
  }

  // Redirect to admin safqa page with success flag
  return NextResponse.redirect(new URL("/admin/safqa?connected=true", req.url));
}

/**
 * Safka Connect Callback (POST)
 * Safka posts the generated `api-safka-key` upon authorization
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));
    console.log("[Safka Connect Callback POST]", JSON.stringify(payload));

    const apiKey =
      payload["api-safka-key"] ||
      payload.api_key ||
      payload.key ||
      payload.token ||
      payload.data?.key;

    if (apiKey) {
      await dbStore.updateSettings({
        safqa_api_secret_token: apiKey,
      });

      return NextResponse.json({
        success: true,
        message: "تم حفظ مفتاح API لمنصة صفقة بنجاح في الإعدادات",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Callback received without API key",
      payload,
    });
  } catch (err: any) {
    console.error("[Safka Callback Error]", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
