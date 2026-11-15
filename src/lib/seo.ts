/** Shared SEO helpers (edge-safe, no Node APIs). */

// Neutral fallback; every deployment sets NEXT_PUBLIC_APP_URL (or SITE_URL) to its own domain.
export const DEFAULT_SITE_URL = (process.env.SITE_URL || "").trim() || "http://localhost:3000";

export function getSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/+$/, "");
  // Ignore localhost values that sometimes leak from .env into production builds
  if (!raw || /localhost|127\.0\.0\.1/.test(raw)) return DEFAULT_SITE_URL;
  return raw;
}

/** Collapses whitespace and cuts to `max` chars on a word boundary (Arabic-safe). */
export function shortText(input: string | undefined | null, max = 160): string {
  const s = (input || "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/** Makes a relative image path absolute so social crawlers can fetch it. */
export function absoluteUrl(path: string | undefined | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${getSiteUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
}
