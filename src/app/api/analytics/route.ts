import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";
import { generateEventId } from "@/lib/tracking/utm";

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

    if (!body.event_name) {
      return NextResponse.json({ success: false, error: "اسم الحدث مطلوب" }, { status: 400 });
    }

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "";

    // Device fallback if not passed
    let deviceType = body.device_type;
    if (!deviceType) {
      if (/tablet|ipad/i.test(userAgent)) deviceType = "tablet";
      else if (/mobile|android|iphone/i.test(userAgent)) deviceType = "mobile";
      else deviceType = "desktop";
    }

    const event = await dbStore.logAnalyticsEvent({
      visitor_id: body.visitor_id || `v_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      session_id: body.session_id || `s_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      event_name: body.event_name,
      event_id: body.event_id || generateEventId("trk"),
      page_url: body.page_url || "/",
      page_title: body.page_title || "",
      landing_page_slug: body.landing_page_slug || "",
      product_id: body.product_id || undefined,
      device_type: deviceType,
      utm_source: body.utm_source || undefined,
      utm_medium: body.utm_medium || undefined,
      utm_campaign: body.utm_campaign || undefined,
      utm_content: body.utm_content || undefined,
      referrer: body.referrer || undefined,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: body.metadata || {},
      created_at: body.created_at || new Date().toISOString(),
    });

    return NextResponse.json({ success: true, eventId: event.id });
  } catch (err: any) {
    console.error("[Log Analytics Event Error]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
