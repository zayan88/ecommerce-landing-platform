import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/session";
import { dbStore } from "@/lib/db/store";
import { sha256, toHex } from "@/lib/crypto/sha256";
import { mcpToolList } from "@/lib/mcp/tools";

export const runtime = "edge";

/**
 * Settings > MCP. Admin only (session cookie). The token is shown ONCE when it is created; only its hash is
 * stored, so it can be replaced or revoked but never read back.
 */
const noStore = { "Cache-Control": "no-store" };
const deny = () => NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401, headers: noStore });

async function status() {
  const s: any = await dbStore.getSettings();
  return {
    enabled: Boolean(s.mcp_enabled),
    has_token: typeof s.mcp_token_hash === "string" && s.mcp_token_hash.length > 0,
    created_at: s.mcp_token_created_at || null,
    tools: mcpToolList().map((t) => ({ name: t.name, description: t.description })),
  };
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return deny();
  return NextResponse.json({ success: true, ...(await status()) }, { headers: noStore });
}

/** Creates (or replaces) the token and switches MCP on. Returns the token once. */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return deny();
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = "mcp_" + toHex(bytes);
  await dbStore.updateSettings({ mcp_token_hash: sha256(token), mcp_enabled: true, mcp_token_created_at: new Date().toISOString() } as any);
  return NextResponse.json({ success: true, token, ...(await status()) }, { headers: noStore });
}

/** { enabled: boolean }: pause / resume without changing the token. */
export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return deny();
  const body = await req.json().catch(() => null);
  if (typeof body?.enabled !== "boolean") return NextResponse.json({ success: false, error: "بيانات غير صحيحة" }, { status: 400, headers: noStore });
  const s: any = await dbStore.getSettings();
  if (body.enabled && !s.mcp_token_hash) {
    return NextResponse.json({ success: false, error: "اعمل توكن الأول" }, { status: 400, headers: noStore });
  }
  await dbStore.updateSettings({ mcp_enabled: body.enabled } as any);
  return NextResponse.json({ success: true, ...(await status()) }, { headers: noStore });
}

/** Revokes the token: every connected assistant stops working at once. */
export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) return deny();
  await dbStore.updateSettings({ mcp_token_hash: "", mcp_enabled: false, mcp_token_created_at: "" } as any);
  return NextResponse.json({ success: true, ...(await status()) }, { headers: noStore });
}
