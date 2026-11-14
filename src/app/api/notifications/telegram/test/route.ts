import { NextRequest, NextResponse } from "next/server";
import { TelegramNotifier } from "@/lib/notifications/telegram";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, chatId } = body;

    const result = await TelegramNotifier.sendTestNotification(token, chatId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: `حدث خطأ غير متوقع: ${err.message}` },
      { status: 500 }
    );
  }
}
