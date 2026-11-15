import type { NextRequest } from "next/server";
import { sha256, timingSafeEqual } from "@/lib/crypto/sha256";

export type WebhookCheck = "ok" | "unconfigured" | "invalid";

/** Shared-secret check for Safka webhooks. Uses env SAFQA_WEBHOOK_SECRET only (never the settings default). */
export function checkSafqaWebhookSecret(req: NextRequest): WebhookCheck {
  const expected = (process.env.SAFQA_WEBHOOK_SECRET || "").trim();
  if (!expected) return "unconfigured";
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "";
  const provided = (
    req.headers.get("x-webhook-secret") ||
    bearer ||
    req.nextUrl.searchParams.get("secret") ||
    ""
  ).trim();
  if (!provided) return "invalid";
  return timingSafeEqual(sha256(provided), sha256(expected)) ? "ok" : "invalid";
}
