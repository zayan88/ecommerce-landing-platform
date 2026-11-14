import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";

export const runtime = "edge";

export async function GET() {
  try {
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
    if (!id) {
      return NextResponse.json({ success: false, error: "معرف الصفحة مطلوب للحذف" }, { status: 400 });
    }
    const success = await dbStore.deleteLandingPage(id);
    return NextResponse.json({ success, message: "تم حذف صفحة الهبوط بنجاح" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
