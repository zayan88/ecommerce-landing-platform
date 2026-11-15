import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";

export const runtime = "edge";

// Admin-only route (enforced by middleware). Secrets are never returned in clear.
const SECRET_FIELDS = [
  "safqa_api_secret_token",
  "safqa_webhook_secret",
  "default_meta_capi_token",
  "telegram_bot_token",
] as const;

function maskSecret(v: unknown): string {
  if (typeof v !== "string" || !v) return "";
  if (v.length <= 12) return "****...";
  return `${v.slice(0, 4)}...${v.slice(-4)}`;
}

function maskSettings(settings: any) {
  const masked: any = { ...settings };
  for (const f of SECRET_FIELDS) masked[f] = maskSecret(settings?.[f]);
  return masked;
}

export async function GET() {
  try {
    const settings = await dbStore.getSettings();
    return NextResponse.json({ success: true, settings: maskSettings(settings) });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: "بيانات غير صالحة" }, { status: 400 });
    }

    // Do not overwrite a secret if the client sent back its masked value
    const toUpdate: any = { ...body };
    for (const f of SECRET_FIELDS) {
      if (typeof toUpdate[f] === "string" && toUpdate[f].includes("...")) {
        delete toUpdate[f];
      }
    }

    const updated = await dbStore.updateSettings(toUpdate);
    return NextResponse.json({ success: true, settings: maskSettings(updated) });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
