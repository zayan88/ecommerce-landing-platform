import { cookies } from "next/headers";
import { getBrand } from "@/lib/brand";
import { LANG_COOKIE, normalizeLang, type Lang } from "@/lib/i18n";

/**
 * The storefront language (server components): the merchant's default, or the visitor's cookie when the merchant
 * lets visitors switch. Arabic-only / English-only stores ignore the cookie.
 */
export async function getLang(): Promise<Lang> {
  const brand = await getBrand();
  const dflt: Lang = brand.lang_default === "en" ? "en" : "ar";
  if (brand.lang_switch === false) return dflt;
  try {
    const c = cookies().get(LANG_COOKIE)?.value;
    return c === "en" || c === "ar" ? normalizeLang(c) : dflt;
  } catch {
    return dflt;
  }
}
