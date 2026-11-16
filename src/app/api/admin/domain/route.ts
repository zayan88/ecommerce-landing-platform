import { NextRequest, NextResponse } from "next/server";
import {
  DomainApiError,
  addDomain,
  dnsInstruction,
  listDomains,
  normalizeHostname,
  readDomainEnv,
  recheckDomain,
  removeDomain,
} from "@/lib/domains/cf-domains";

export const runtime = "edge";

// Admin-only (the /api default in middleware). The Cloudflare token never leaves the server.
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

function view(env: NonNullable<ReturnType<typeof readDomainEnv>>, domains: Awaited<ReturnType<typeof listDomains>>) {
  return {
    success: true,
    configured: true,
    target: `${env.project}.pages.dev`,
    domains: domains.map((d) => ({ ...d, dns: dnsInstruction(d.name, env.project) })),
  };
}

export async function GET() {
  const env = readDomainEnv();
  if (!env) return json({ success: true, configured: false, domains: [] });
  try {
    return json(view(env, await listDomains(env)));
  } catch (e) {
    return json({ success: false, error: e instanceof DomainApiError ? e.message : "تعذر تحميل الدومينات" }, 502);
  }
}

export async function POST(req: NextRequest) {
  const env = readDomainEnv();
  if (!env) return json({ success: false, error: "ربط الدومين غير مفعّل على المتجر ده، تواصل مع الدعم" }, 400);
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return json({ success: false, error: "بيانات غير صالحة" }, 400);

  const host = normalizeHostname((body as any).domain);
  if (!host.ok) return json({ success: false, error: host.error }, 400);

  try {
    if ((body as any).action === "check") await recheckDomain(env, host.host);
    else await addDomain(env, host.host);
    return json(view(env, await listDomains(env)));
  } catch (e) {
    const status = e instanceof DomainApiError ? e.status : 502;
    return json({ success: false, error: e instanceof DomainApiError ? e.message : "تعذر تنفيذ الطلب" }, status);
  }
}

export async function DELETE(req: NextRequest) {
  const env = readDomainEnv();
  if (!env) return json({ success: false, error: "ربط الدومين غير مفعّل" }, 400);
  const host = normalizeHostname(new URL(req.url).searchParams.get("domain"));
  if (!host.ok) return json({ success: false, error: host.error }, 400);
  try {
    await removeDomain(env, host.host);
    return json(view(env, await listDomains(env)));
  } catch (e) {
    return json({ success: false, error: e instanceof DomainApiError ? e.message : "تعذر حذف الدومين" }, e instanceof DomainApiError ? e.status : 502);
  }
}
