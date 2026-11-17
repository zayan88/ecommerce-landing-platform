import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/session";
import { getReceipt } from "@/lib/db/receipts-repo";

export const runtime = "edge";

/** GET /api/receipts/<id> — ADMIN ONLY: the customer's transfer screenshot (private, never cached). */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminRequest(req)) return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
  const r = await getReceipt(params.id);
  if (!r || !r.ct) return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  return new NextResponse(r.bytes as unknown as BodyInit, {
    headers: { "Content-Type": r.ct, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Disposition": "inline" },
  });
}
