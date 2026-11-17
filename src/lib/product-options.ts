import type { ProductOption } from "@/types";

/**
 * Product options the customer chooses when ordering (color, size, ...). Stored on the product (its JSON `extra`),
 * chosen in the checkout form, validated again on the server and written into the order's notes, so the merchant,
 * the Telegram alert and every export see them with no schema change.
 */
export const MAX_OPTIONS = 3;
export const MAX_VALUES = 12;
const NAME_MAX = 30;
const VALUE_MAX = 40;

const clean = (s: unknown, max: number) =>
  typeof s === "string" ? s.replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";

/** Whatever was saved / sent → a safe list: up to 3 options, 12 distinct values each, empty ones dropped. */
export function sanitizeProductOptions(input: unknown): ProductOption[] {
  if (!Array.isArray(input)) return [];
  const out: ProductOption[] = [];
  const names = new Set<string>();
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const name = clean((raw as any).name, NAME_MAX);
    const rv = (raw as any).values;
    const list: unknown[] = Array.isArray(rv) ? rv : typeof rv === "string" ? rv.split(/[,،\n]/) : [];
    const values: string[] = [];
    for (const v of list) {
      const s = clean(v, VALUE_MAX);
      if (s && !values.includes(s)) values.push(s);
      if (values.length >= MAX_VALUES) break;
    }
    if (!name || values.length === 0 || names.has(name)) continue;
    names.add(name);
    out.push({ name, values });
    if (out.length >= MAX_OPTIONS) break;
  }
  return out;
}

/** The customer's picks vs the product's options: every option is required and must be one of its values. */
export function formatOptionsNote(options: ProductOption[], picked: unknown): { note: string; error?: string } {
  if (options.length === 0) return { note: "" };
  const p = picked && typeof picked === "object" && !Array.isArray(picked) ? (picked as Record<string, unknown>) : {};
  const parts: string[] = [];
  for (const o of options) {
    const v = typeof p[o.name] === "string" ? (p[o.name] as string) : "";
    if (!v) return { note: "", error: `اختار ${o.name} الأول` };
    if (!o.values.includes(v)) return { note: "", error: `${o.name} المختار غير متاح، حدّث الصفحة وجرّب تاني` };
    parts.push(`${o.name}: ${v}`);
  }
  return { note: parts.join("، ") };
}
