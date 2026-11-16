import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    // Single page, read from the same source the public page uses (always the latest saved content)
    const id = new URL(req.url).searchParams.get("id");
    dbStore.refreshCatalogCache(); // admin-only route: never serve the editor a cached copy
    if (id) {
      const landingPage = await dbStore.getLandingPage(id);
      return NextResponse.json({ success: !!landingPage, landingPage });
    }
    const landingPages = await dbStore.getLandingPages();
    return NextResponse.json({ success: true, landingPages });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const landingPage = await dbStore.saveLandingPage(body);
    return NextResponse.json({ success: true, landingPage });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, sections_config, content_config } = body;
    // Bulk: { ids: [...], status: "active" | "paused" }
    if (!id && Array.isArray(body.ids)) {
      if (status !== "active" && status !== "paused") {
        return NextResponse.json({ success: false, error: "الحالة غير صحيحة" }, { status: 400 });
      }
      const ids: string[] = body.ids.filter((x: unknown) => typeof x === "string" && x.length <= 120).slice(0, 100);
      let updated = 0;
      for (const pid of ids) {
        if (await dbStore.toggleLandingPageStatus(pid, status).catch(() => false)) updated++;
      }
      return NextResponse.json({ success: true, updated });
    }
    if (id && (typeof body.title === "string" || typeof body.slug === "string")) {
      const result = await dbStore.updateLandingPageMeta(id, { title: body.title, slug: body.slug });
      if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      return NextResponse.json({ success: true, landingPage: result.landingPage });
    }
    if (!id) {
      return NextResponse.json({ success: false, error: "معرف الصفحة مطلوب" }, { status: 400 });
    }
    if (content_config) {
      const updated = await dbStore.updateLandingPageContent(id, content_config);
      return NextResponse.json({ success: true, landingPage: updated });
    }
    if (sections_config) {
      const updated = await dbStore.updateLandingPageSections(id, sections_config);
      return NextResponse.json({ success: true, landingPage: updated });
    }
    if (status) {
      const success = await dbStore.toggleLandingPageStatus(id, status);
      return NextResponse.json({ success });
    }
    return NextResponse.json({ success: false, error: "بيانات غير صالحة للتحديث" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    // Bulk: { ids: [...] } deletes up to 100 pages in one request
    if (!id) {
      const body = await req.json().catch(() => null);
      if (Array.isArray(body?.ids)) {
        const ids: string[] = body.ids.filter((x: unknown) => typeof x === "string" && x.length > 0 && x.length <= 120).slice(0, 100);
        if (ids.length === 0) return NextResponse.json({ success: false, error: "اختار صفحة واحدة على الأقل" }, { status: 400 });
        let deleted = 0;
        for (const pid of ids) {
          if (await dbStore.deleteLandingPage(pid).catch(() => false)) deleted++;
        }
        return NextResponse.json({ success: true, deleted, requested: ids.length });
      }
      return NextResponse.json({ success: false, error: "معرف الصفحة مطلوب للحذف" }, { status: 400 });
    }
    const success = await dbStore.deleteLandingPage(id);
    return NextResponse.json({ success, message: "تم حذف صفحة الهبوط بنجاح" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
