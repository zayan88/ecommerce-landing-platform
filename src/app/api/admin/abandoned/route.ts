import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/session";
import { ABANDONED_STATUSES, deleteAbandoned, listAbandoned, setAbandonedStatus, type AbandonedStatus } from "@/lib/db/abandoned-repo";

export const runtime = "edge";

const noStore = { "Cache-Control": "no-store" };
const deny = () =>
  NextResponse.json({ success: false, error: "غير مصرح. يرجى تسجيل الدخول إلى لوحة التحكم." }, { status: 401, headers: noStore });

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return deny();
  try {
    const q = req.nextUrl.searchParams;
    const num = (k: string) => (/^\d{1,6}$/.test(q.get(k) || "") ? Number(q.get(k)) : undefined);
    const res = await listAbandoned({ status: q.get("status") || undefined, limit: num("limit"), offset: num("offset") });
    return NextResponse.json({ success: true, ...res }, { headers: noStore });
  } catch (err) {
    console.error("[admin/abandoned] list", (err as Error)?.message);
    return NextResponse.json({ success: false, error: "تعذر تحميل الطلبات المتروكة" }, { status: 500, headers: noStore });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return deny();
  const body = await req.json().catch(() => null);
  const status = body?.status as AbandonedStatus;
  if (typeof body?.id !== "string" || !ABANDONED_STATUSES.includes(status)) {
    return NextResponse.json({ success: false, error: "بيانات غير صحيحة" }, { status: 400, headers: noStore });
  }
  const done = await setAbandonedStatus(body.id, status).catch(() => false);
  return NextResponse.json({ success: done }, { status: done ? 200 : 404, headers: noStore });
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) return deny();
  const body = await req.json().catch(() => null);
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : typeof body?.id === "string" ? [body.id] : [];
  const deleted = await deleteAbandoned(ids).catch(() => 0);
  return NextResponse.json({ success: true, deleted }, { headers: noStore });
}
