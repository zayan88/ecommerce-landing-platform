import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";
import { isPaletteKey } from "@/lib/palettes";

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

    // Brand fields: whitelist + sanitize (never trust the client)
    if ("brand_primary" in toUpdate && !isPaletteKey(toUpdate.brand_primary)) delete toUpdate.brand_primary;
    if ("brand_accent" in toUpdate && !isPaletteKey(toUpdate.brand_accent)) delete toUpdate.brand_accent;
    if ("store_mode" in toUpdate && toUpdate.store_mode !== "landing" && toUpdate.store_mode !== "catalog") {
      delete toUpdate.store_mode;
    }
    for (const f of ["logo_url", "site_domain"] as const) {
      if (f in toUpdate) {
        const v = typeof toUpdate[f] === "string" ? toUpdate[f].trim() : "";
        // empty clears the field; otherwise http(s) URL (logo may also be a site-relative path)
        const okUrl = /^https?:\/\/[^\s]+$/i.test(v) || (f === "logo_url" && /^\/[^\s]*$/.test(v));
        if (v === "" || okUrl) toUpdate[f] = v;
        else delete toUpdate[f];
      }
    }
    for (const f of ["support_phone", "support_whatsapp"] as const) {
      if (f in toUpdate) {
        const v = typeof toUpdate[f] === "string" ? toUpdate[f].replace(/[^\d+]/g, "") : "";
        toUpdate[f] = v.slice(0, 20);
      }
    }
    for (const f of ["store_name", "store_tagline", "currency_symbol"] as const) {
      if (f in toUpdate) toUpdate[f] = typeof toUpdate[f] === "string" ? toUpdate[f].trim().slice(0, 80) : "";
    }
    if ("home_config" in toUpdate) {
      const h = toUpdate.home_config;
      if (!h || typeof h !== "object" || Array.isArray(h)) {
        delete toUpdate.home_config;
      } else {
        const clean: any = {};
        if (Array.isArray(h.announcements)) {
          clean.announcements = h.announcements
            .filter((a: unknown) => typeof a === "string")
            .map((a: string) => a.trim().slice(0, 120))
            .filter(Boolean)
            .slice(0, 8);
        }
        for (const [k, max] of [["hero_title", 120], ["hero_subtitle", 240], ["hero_cta", 30]] as const) {
          if (typeof h[k] === "string") clean[k] = h[k].trim().slice(0, max);
        }
        if (typeof h.hero_image === "string") {
          const v = h.hero_image.trim().slice(0, 500);
          if (v === "" || /^https?:\/\/[^\s]+$/i.test(v) || /^\/[^\s]*$/.test(v)) clean.hero_image = v;
        }
        toUpdate.home_config = clean;
      }
    }
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
