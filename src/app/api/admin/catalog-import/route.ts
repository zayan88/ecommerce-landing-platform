import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/session";
import { D1UnavailableError } from "@/lib/db/d1";
import { importKvCatalogToD1, catalogStorageStatus, CatalogImportError } from "@/lib/db/catalog-import";

export const runtime = "edge";

/**
 * Admin-only (not in the public allow-list of src/middleware.ts; re-checked here as defence in depth).
 *   GET  → read-only totals of KV and D1 (compare before/after).
 *   POST → { offset?, limit?, dry_run?, include_orphans?, overwrite_settings? } copies one page of the KV
 *          catalog (products + offers, landing pages; settings on the first page) into D1.
 *          Idempotent; repeat with `next_offset` until `done` is true.
 * Responses carry counts and item ids only — never settings values, tokens or page content.
 */
const noStore = { "Cache-Control": "no-store" };
const unauthorized = () =>
  NextResponse.json({ success: false, error: "غير مصرح. يرجى تسجيل الدخول إلى لوحة التحكم." }, { status: 401, headers: noStore });

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  try {
    return NextResponse.json({ success: true, ...(await catalogStorageStatus()) }, { headers: noStore });
  } catch (err) {
    console.error("[catalog-import] status failed", (err as Error)?.message);
    return NextResponse.json({ success: false, error: "تعذر قراءة حالة التخزين" }, { status: 500, headers: noStore });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  try {
    const body: any = await req.json().catch(() => ({}));
    const report = await importKvCatalogToD1({
      offset: Number(body?.offset) || 0,
      limit: Number(body?.limit) || undefined,
      dryRun: body?.dry_run === true,
      includeOrphans: body?.include_orphans === true,
      overwriteSettings: body?.overwrite_settings === true,
    });
    return NextResponse.json({ success: true, report }, { headers: noStore });
  } catch (err) {
    if (err instanceof D1UnavailableError) {
      return NextResponse.json(
        { success: false, error: "D1 غير مُعد: لا يوجد ربط DB ولا D1_REST_BASE_URL" },
        { status: 503, headers: noStore }
      );
    }
    if (err instanceof CatalogImportError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 502, headers: noStore });
    }
    console.error("[catalog-import] failed", (err as Error)?.message);
    return NextResponse.json({ success: false, error: "تعذر استيراد الكتالوج" }, { status: 500, headers: noStore });
  }
}
