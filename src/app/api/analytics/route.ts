import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";
import { generateEventId } from "@/lib/tracking/utm";
import { recordStat } from "@/lib/stats";
import { allowPublic, clientIp } from "@/lib/public-rate-limit";

export const runtime = "edge";

export async function GET() {
  try {
    const summary = await dbStore.getAnalyticsSummary();
    return NextResponse.json({ success: true, summary });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // a normal visitor sends a handful of batches; 300 per minute per address is far above that
    if (!(await allowPublic("analytics", clientIp(req), 60 * 1000, 300, false))) {
      return NextResponse.json({ success: false }, { status: 429 });
    }
    let body: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json().catch(() => ({}));
    } else {
      const text = await req.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = {};
      }
    }

    // One request may carry several events (the page batches them to save Worker invocations).
    // At most 20 per request; a single event body still works.
    const list: any[] = (Array.isArray(body.events) ? body.events : [body])
      .filter((e: any) => e && typeof e === "object" && typeof e.event_name === "string" && e.event_name)
      .slice(0, 20);
    if (list.length === 0) {
      return NextResponse.json({ success: false, error: "اسم الحدث مطلوب" }, { status: 400 });
    }

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "";

    let lastId: string | undefined;
    for (const ev of list) {
      // Device fallback if not passed
      let deviceType = ev.device_type;
      if (!deviceType) {
        if (/tablet|ipad/i.test(userAgent)) deviceType = "tablet";
        else if (/mobile|android|iphone/i.test(userAgent)) deviceType = "mobile";
        else deviceType = "desktop";
      }

      const event = await dbStore.logAnalyticsEvent({
        visitor_id: ev.visitor_id || `v_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        session_id: ev.session_id || `s_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        event_name: ev.event_name,
        event_id: ev.event_id || generateEventId("trk"),
        page_url: ev.page_url || "/",
        page_title: ev.page_title || "",
        landing_page_slug: ev.landing_page_slug || "",
        product_id: ev.product_id || undefined,
        device_type: deviceType,
        utm_source: ev.utm_source || undefined,
        utm_medium: ev.utm_medium || undefined,
        utm_campaign: ev.utm_campaign || undefined,
        utm_content: ev.utm_content || undefined,
        referrer: ev.referrer || undefined,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: ev.metadata || {},
        created_at: ev.created_at || new Date().toISOString(),
      });
      lastId = event.id;

      // Durable counters (buffered, flushed to KV at most every 10 minutes)
      if (ev.event_name === "PageView") recordStat("visit", typeof ev.session_id === "string" ? ev.session_id : undefined);
      else if (ev.event_name === "InitiateCheckout") recordStat("checkout_start");
    }

    return NextResponse.json({ success: true, eventId: lastId, count: list.length });
  } catch (err: any) {
    console.error("[Log Analytics Event Error]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
