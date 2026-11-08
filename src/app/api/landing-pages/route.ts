import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";

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
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ success: false, error: "معرف الصفحة والحالة مطلوبان" }, { status: 400 });
    }
    const success = await dbStore.toggleLandingPageStatus(id, status);
    return NextResponse.json({ success });
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
