/**
 * Optional modules, all OFF by default so a merchant copy ships clean.
 * Static process.env reads only (required on Cloudflare / next-on-pages).
 */

/**
 * NEXT_PUBLIC_SAFKA_ENABLED=1 -> Safka (dropshipping/affiliate) module: admin tab and order forwarding.
 * Off by default: without it orders are never forwarded (no wasted KV writes) and the tab is hidden.
 * Also needs the merchant's own SAFKA_API_KEY and SAFKA_PAGE_ID.
 */
export const SAFKA_ENABLED = (process.env.NEXT_PUBLIC_SAFKA_ENABLED || "").trim() === "1";
