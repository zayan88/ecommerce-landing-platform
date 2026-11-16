import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";
import { sha256, timingSafeEqual } from "@/lib/crypto/sha256";
import { MCP_TOOLS, mcpToolList } from "@/lib/mcp/tools";

export const runtime = "edge";

/**
 * MCP endpoint (Streamable HTTP, request/response only). An AI assistant the merchant connected calls it
 * with `Authorization: Bearer <token>`. The token is created in Settings > MCP; only its SHA-256 hash is
 * stored. Disabled unless the merchant switched MCP on; every other case answers 401 with no detail.
 * No sessions, no server-initiated streams (GET answers 405).
 */
const PROTOCOL = "2025-03-26";
const noStore = { "Cache-Control": "no-store" };

const rpcError = (id: unknown, code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });
const rpcResult = (id: unknown, result: unknown) => ({ jsonrpc: "2.0", id, result });

async function authorized(req: NextRequest): Promise<boolean> {
  const settings: any = await dbStore.getSettings();
  const hash = typeof settings.mcp_token_hash === "string" ? settings.mcp_token_hash : "";
  if (!settings.mcp_enabled || !hash) return false;
  const header = req.headers.get("authorization") || "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token || token.length > 200) return false;
  return timingSafeEqual(sha256(token), hash);
}

async function handle(msg: any): Promise<unknown | null> {
  if (!msg || typeof msg !== "object" || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return rpcError(msg?.id, -32600, "Invalid Request");
  }
  const { id, method } = msg;
  const isNotification = id === undefined;
  if (method === "initialize") {
    return rpcResult(id, {
      protocolVersion: PROTOCOL,
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "store-admin", version: "1.0.0" },
      instructions: "Manage the store's orders, products and coupons. Amounts are in EGP.",
    });
  }
  if (method === "ping") return rpcResult(id, {});
  if (method.startsWith("notifications/")) return null;
  if (isNotification) return null;
  if (method === "tools/list") return rpcResult(id, { tools: mcpToolList() });
  if (method === "tools/call") {
    const name = msg.params?.name;
    const tool = MCP_TOOLS.find((t) => t.name === name);
    if (!tool) return rpcError(id, -32602, "Unknown tool");
    const args = msg.params?.arguments && typeof msg.params.arguments === "object" && !Array.isArray(msg.params.arguments) ? msg.params.arguments : {};
    try {
      const out = await tool.run(args);
      return rpcResult(id, { content: [{ type: "text", text: JSON.stringify(out) }], isError: false });
    } catch (err) {
      // tool errors are reported to the model, not as protocol errors; the message is ours, never a stack or a secret
      return rpcResult(id, { content: [{ type: "text", text: String((err as Error)?.message || "error").slice(0, 300) }], isError: true });
    }
  }
  return rpcError(id, -32601, "Method not found");
}

export async function POST(req: NextRequest) {
  if (!(await authorized(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { ...noStore, "WWW-Authenticate": "Bearer" } });
  }
  const body = await req.json().catch(() => null);
  if (body === null || typeof body !== "object") return NextResponse.json(rpcError(null, -32700, "Parse error"), { status: 400, headers: noStore });
  if (Array.isArray(body)) {
    if (body.length === 0 || body.length > 20) return NextResponse.json(rpcError(null, -32600, "Invalid Request"), { status: 400, headers: noStore });
    const out = (await Promise.all(body.map(handle))).filter((x) => x !== null);
    return out.length ? NextResponse.json(out, { headers: noStore }) : new NextResponse(null, { status: 202, headers: noStore });
  }
  const out = await handle(body);
  return out === null ? new NextResponse(null, { status: 202, headers: noStore }) : NextResponse.json(out, { headers: noStore });
}

export async function GET() {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST", ...noStore } });
}
