import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";
import { isThemeColor } from "@/lib/palettes";
import { sanitizeCoupons, sanitizeDownsell, sanitizePopup, sanitizeShipping } from "@/lib/commerce";
import { sanitizeChat, sanitizeChatProducts } from "@/lib/chat";
import { normalizeEgyptPhone } from "@/lib/db/abandoned-repo";
import { META_PIXEL_RE, TIKTOK_PIXEL_RE, SNAP_PIXEL_RE, GA4_RE, GTM_RE, META_TEST_CODE_RE, cleanIdList } from "@/lib/tracking/tag-ids";

export const runtime = "edge";

// Admin-only route (enforced by middleware). Secrets are never returned in clear.
const SECRET_FIELDS = [
  "safqa_api_secret_token",
  "safqa_webhook_secret",
  "default_meta_capi_token",
  "telegram_bot_token",
  "bosta_api_key",
  "bosta_webhook_key",
  "support_bot_token",
  "llm_api_key",
] as const;

function maskSecret(v: unknown): string {
  if (typeof v !== "string" || !v) return "";
  if (v.length <= 12) return "****...";
  return `${v.slice(0, 4)}...${v.slice(-4)}`;
}

function maskSettings(settings: any) {
  const masked: any = { ...settings };
  for (const f of SECRET_FIELDS) masked[f] = maskSecret(settings?.[f]);
  delete masked.support_webhook_secret;
  delete masked.mcp_token_hash; // never leaves the server (the MCP tab reads /api/admin/mcp)
  // Conversions API tokens inside the per-pixel entries are secrets too
  if (Array.isArray(settings?.meta_capi_entries)) {
    masked.meta_capi_entries = settings.meta_capi_entries.map((e: any) => ({
      pixel_id: e?.pixel_id,
      test_code: e?.test_code || "",
      token: maskSecret(e?.token),
    }));
  }
  return masked;
}

export async function GET() {
  try {
    dbStore.refreshCatalogCache(); // admin-only route: always the latest saved settings
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
    if ("brand_primary" in toUpdate && !isThemeColor(toUpdate.brand_primary)) delete toUpdate.brand_primary;
    if ("brand_accent" in toUpdate && !isThemeColor(toUpdate.brand_accent)) delete toUpdate.brand_accent;
    delete (toUpdate as Record<string, unknown>).store_mode;
    for (const f of ["logo_url", "favicon_url", "site_domain"] as const) {
      if (f in toUpdate) {
        const v = typeof toUpdate[f] === "string" ? toUpdate[f].trim() : "";
        // empty clears the field; otherwise http(s) URL (logo may also be a site-relative path)
        const okUrl = /^https?:\/\/[^\s]+$/i.test(v) || ((f === "logo_url" || f === "favicon_url") && /^\/[^\s]*$/.test(v));
        if (v === "" || okUrl) toUpdate[f] = v;
        else delete toUpdate[f];
      }
    }
    // Multi-pixel lists + per-pixel Conversions API entries (ids/tokens validated; masked tokens keep the stored one)
    for (const [f, re] of [
      ["meta_pixel_ids", META_PIXEL_RE],
      ["tiktok_pixel_ids", TIKTOK_PIXEL_RE],
      ["snap_pixel_ids", SNAP_PIXEL_RE],
    ] as const) {
      if (f in toUpdate) toUpdate[f] = cleanIdList(toUpdate[f], re);
    }
    if ("meta_pixel_ids" in toUpdate) toUpdate.default_meta_pixel_id = toUpdate.meta_pixel_ids[0] || ""; // legacy field follows the first pixel
    if ("tiktok_pixel_ids" in toUpdate) toUpdate.tiktok_pixel_id = toUpdate.tiktok_pixel_ids[0] || "";
    if ("meta_capi_entries" in toUpdate) {
      const existing: any[] = ((await dbStore.getSettings()) as any).meta_capi_entries || [];
      const list = Array.isArray(toUpdate.meta_capi_entries) ? toUpdate.meta_capi_entries : [];
      const clean: { pixel_id: string; token: string; test_code?: string }[] = [];
      for (const e of list.slice(0, 5)) {
        const pixel_id = typeof e?.pixel_id === "string" ? e.pixel_id.trim() : "";
        if (!META_PIXEL_RE.test(pixel_id) || clean.some((c) => c.pixel_id === pixel_id)) continue;
        let token = typeof e?.token === "string" ? e.token.trim().slice(0, 600) : "";
        if (token.includes("...") || token === "") token = existing.find((x) => x?.pixel_id === pixel_id)?.token || "";
        const test = typeof e?.test_code === "string" ? e.test_code.trim() : "";
        if (!token) continue;
        clean.push({ pixel_id, token, ...(META_TEST_CODE_RE.test(test) ? { test_code: test } : {}) });
      }
      toUpdate.meta_capi_entries = clean;
    }
    // Marketing tag ids: strict formats (they end up in inline scripts); empty clears the tag.
    for (const [f, re] of [
      ["default_meta_pixel_id", META_PIXEL_RE],
      ["tiktok_pixel_id", TIKTOK_PIXEL_RE],
      ["ga4_measurement_id", GA4_RE],
      ["gtm_container_id", GTM_RE],
      ["meta_test_event_code", META_TEST_CODE_RE],
    ] as const) {
      if (f in toUpdate) {
        const v = typeof toUpdate[f] === "string" ? toUpdate[f].trim() : "";
        if (v === "" || re.test(v)) toUpdate[f] = v;
        else {
          return NextResponse.json({ success: false, error: "صيغة معرّف التتبع غير صحيحة: " + f }, { status: 400 });
        }
      }
    }
    for (const f of ["support_phone", "support_whatsapp"] as const) {
      if (f in toUpdate) {
        const v = typeof toUpdate[f] === "string" ? toUpdate[f].replace(/[^\d+]/g, "") : "";
        toUpdate[f] = v.slice(0, 20);
      }
    }
    if ("support_email" in toUpdate) {
      const v = typeof toUpdate.support_email === "string" ? toUpdate.support_email.trim().slice(0, 120) : "";
      // empty clears it; otherwise a plain address (it ends up in a mailto: link)
      if (v === "" || /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v)) toUpdate.support_email = v;
      else return NextResponse.json({ success: false, error: "البريد الإلكتروني غير صحيح" }, { status: 400 });
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
    delete (toUpdate as Record<string, unknown>).coupon_usage;
    for (const f of ["mcp_enabled", "mcp_token_hash", "mcp_token_created_at", "support_webhook_secret"]) delete (toUpdate as Record<string, unknown>)[f];
    if ("chat" in toUpdate) toUpdate.chat = sanitizeChat(toUpdate.chat);
    if ("chat_products" in toUpdate) (toUpdate as Record<string, unknown>).chat_products = sanitizeChatProducts((toUpdate as Record<string, unknown>).chat_products);
    if ("support_chat_id" in toUpdate) {
      const v = typeof toUpdate.support_chat_id === "string" ? toUpdate.support_chat_id.trim() : "";
      if (v === "" || /^-?\d{5,20}$/.test(v)) toUpdate.support_chat_id = v;
      else return NextResponse.json({ success: false, error: "معرّف شات تليجرام غير صحيح (أرقام فقط)" }, { status: 400 });
    }
    if ("support_bot_token" in toUpdate) {
      const v = typeof toUpdate.support_bot_token === "string" ? toUpdate.support_bot_token.trim() : "";
      if (v === "" || v.includes("...") || /^\d{6,12}:[A-Za-z0-9_-]{30,50}$/.test(v)) toUpdate.support_bot_token = v;
      else return NextResponse.json({ success: false, error: "توكن بوت تليجرام غير صحيح" }, { status: 400 });
    }
    if ("llm_api_key" in toUpdate) {
      const v = typeof toUpdate.llm_api_key === "string" ? toUpdate.llm_api_key.trim() : "";
      if (v === "" || v.includes("...") || /^[\x21-\x7e]{8,300}$/.test(v)) toUpdate.llm_api_key = v;
      else return NextResponse.json({ success: false, error: "مفتاح الـ LLM غير صحيح" }, { status: 400 });
    }
    if ("shipping_config" in toUpdate) toUpdate.shipping_config = sanitizeShipping(toUpdate.shipping_config);
    if ("coupons" in toUpdate) toUpdate.coupons = sanitizeCoupons(toUpdate.coupons);
    if ("popup" in toUpdate) toUpdate.popup = sanitizePopup(toUpdate.popup);
    if ("downsell" in toUpdate) {
      const known = "coupons" in toUpdate ? toUpdate.coupons : (await dbStore.getSettings()).coupons || [];
      toUpdate.downsell = sanitizeDownsell(toUpdate.downsell, known);
    }
    if ("payment_methods" in toUpdate) {
      const pm = toUpdate.payment_methods && typeof toUpdate.payment_methods === "object" ? toUpdate.payment_methods : {};
      const clean: any = {};
      const holderOf = (v: unknown) => (typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 60) : "");
      if (pm.vodafone_cash && typeof pm.vodafone_cash === "object") {
        const num = normalizeEgyptPhone(pm.vodafone_cash.number);
        const enabled = Boolean(pm.vodafone_cash.enabled);
        if (enabled && !num) return NextResponse.json({ success: false, error: "رقم فودافون كاش غير صحيح (11 رقم يبدأ بـ 01)" }, { status: 400 });
        clean.vodafone_cash = { enabled, number: num || "", holder: holderOf(pm.vodafone_cash.holder) };
      }
      if (pm.instapay && typeof pm.instapay === "object") {
        const raw = typeof pm.instapay.address === "string" ? pm.instapay.address.trim() : "";
        // an InstaPay address (name@bank) or a mobile number linked to InstaPay
        const addr = /^[A-Za-z0-9._-]{2,40}@[A-Za-z]{2,20}$/.test(raw) ? raw : normalizeEgyptPhone(raw) || "";
        const enabled = Boolean(pm.instapay.enabled);
        if (enabled && !addr) return NextResponse.json({ success: false, error: "عنوان إنستاباي غير صحيح (مثال: name@instapay أو رقم موبايل)" }, { status: 400 });
        clean.instapay = { enabled, address: addr, holder: holderOf(pm.instapay.holder) };
      }
      toUpdate.payment_methods = clean;
    }
    if ("shipping_provider" in toUpdate && toUpdate.shipping_provider !== "none" && toUpdate.shipping_provider !== "bosta") {
      delete toUpdate.shipping_provider;
    }
    if ("bosta_location_id" in toUpdate) {
      const v = typeof toUpdate.bosta_location_id === "string" ? toUpdate.bosta_location_id.trim() : "";
      if (v === "" || /^[A-Za-z0-9_-]{4,64}$/.test(v)) toUpdate.bosta_location_id = v;
      else return NextResponse.json({ success: false, error: "معرّف فرع بوسطة غير صحيح" }, { status: 400 });
    }
    for (const f of ["bosta_api_key", "bosta_webhook_key"] as const) {
      if (f in toUpdate) {
        const v = typeof toUpdate[f] === "string" ? toUpdate[f].trim() : "";
        // keys go into HTTP headers: printable ASCII only, no spaces / line breaks
        if (v === "" || /^[\x21-\x7e]{8,200}$/.test(v)) toUpdate[f] = v;
        else return NextResponse.json({ success: false, error: "المفتاح غير صحيح (حروف وأرقام بدون مسافات)" }, { status: 400 });
      }
    }
    if ("home_reviews" in toUpdate) {
      const list = Array.isArray(toUpdate.home_reviews) ? toUpdate.home_reviews : [];
      const clean = [];
      for (const r of list.slice(0, 6)) {
        const name = typeof r?.name === "string" ? r.name.trim().slice(0, 60) : "";
        const comment = typeof r?.comment === "string" ? r.comment.trim().slice(0, 400) : "";
        if (!name || !comment) continue;
        const place = typeof r?.place === "string" ? r.place.trim().slice(0, 60) : "";
        const rating = Math.min(5, Math.max(1, Math.round(Number(r?.rating) || 5)));
        clean.push({ name, comment, rating, ...(place ? { place } : {}) });
      }
      toUpdate.home_reviews = clean;
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
