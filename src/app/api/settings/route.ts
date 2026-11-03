import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";

export async function GET() {
  try {
    const settings = await dbStore.getSettings();
    // Mask sensitive tokens for security
    const masked = {
      ...settings,
      safqa_api_secret_token: settings.safqa_api_secret_token
        ? `${settings.safqa_api_secret_token.slice(0, 4)}...${settings.safqa_api_secret_token.slice(-4)}`
        : "",
      default_meta_capi_token: settings.default_meta_capi_token
        ? `${settings.default_meta_capi_token.slice(0, 6)}...${settings.default_meta_capi_token.slice(-4)}`
        : "",
    };
    return NextResponse.json({ success: true, settings: masked });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = await dbStore.getSettings();

    // Do not overwrite secret if client sent masked string
    const toUpdate = { ...body };
    if (toUpdate.safqa_api_secret_token && toUpdate.safqa_api_secret_token.includes("...")) {
      delete toUpdate.safqa_api_secret_token;
    }
    if (toUpdate.default_meta_capi_token && toUpdate.default_meta_capi_token.includes("...")) {
      delete toUpdate.default_meta_capi_token;
    }

    const updated = await dbStore.updateSettings(toUpdate);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
