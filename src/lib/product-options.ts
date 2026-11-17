import type { Product, ProductOption } from "@/types";

/**
 * Product options the customer chooses when ordering (color, size, ...). Stored on the product (its JSON `extra`),
 * chosen in the checkout form, validated again on the server and written into the order's notes, so the merchant,
 * the Telegram alert and every export see them with no schema change.
 *
 * - `options_enabled === false` switches the whole thing off without losing what was typed.
 * - `variants_off` lists the combinations that are sold out (key = the picked values joined by " / ", in option order).
 * - an option can carry color swatches (value -> #rrggbb) shown as a dot in the checkout.
 */
export const MAX_OPTIONS = 3;
export const MAX_VALUES = 12;
export const MAX_COMBOS_LISTED = 120;
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
    const option: ProductOption = { name, values };
    const sw = (raw as any).swatches;
    if (sw && typeof sw === "object" && !Array.isArray(sw)) {
      const swatches: Record<string, string> = {};
      for (const v of values) {
        const c = typeof sw[v] === "string" ? sw[v].trim() : "";
        if (/^#[0-9a-fA-F]{6}$/.test(c)) swatches[v] = c.toLowerCase();
      }
      if (Object.keys(swatches).length) option.swatches = swatches;
    }
    out.push(option);
    if (out.length >= MAX_OPTIONS) break;
  }
  return out;
}

export function sanitizeVariantsOff(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const k of input) {
    const s = typeof k === "string" ? clean(k, 200) : "";
    if (s && !out.includes(s)) out.push(s);
    if (out.length >= 1000) break;
  }
  return out;
}

/** The options the customer actually sees: none while the merchant switched them off. */
export function effectiveOptions(product: Partial<Product> | null | undefined): ProductOption[] {
  if (!product || (product as any).options_enabled === false) return [];
  return sanitizeProductOptions((product as any).options);
}

export const comboKey = (options: ProductOption[], picks: Record<string, string>) => options.map((o) => picks[o.name] ?? "").join(" / ");

/** Every combination of the options' values (capped), as pick maps. */
export function allCombos(options: ProductOption[], cap = 2000): Record<string, string>[] {
  let acc: Record<string, string>[] = [{}];
  for (const o of options) {
    const next: Record<string, string>[] = [];
    for (const a of acc) for (const v of o.values) next.push({ ...a, [o.name]: v });
    acc = next;
    if (acc.length > cap) return acc.slice(0, cap);
  }
  return options.length ? acc : [];
}

/** A full pick is available unless the merchant marked that combination sold out. */
export function comboAvailable(options: ProductOption[], off: string[], picks: Record<string, string>): boolean {
  return !off.includes(comboKey(options, picks));
}

/** For the checkout chips: is there still an available combination that has `value` for `optName` and matches the other picks made so far? */
export function valueHasStock(options: ProductOption[], off: string[], picks: Record<string, string>, optName: string, value: string): boolean {
  if (off.length === 0) return true;
  return allCombos(options).some((c) => {
    if (c[optName] !== value) return false;
    for (const o of options) if (o.name !== optName && picks[o.name] && c[o.name] !== picks[o.name]) return false;
    return comboAvailable(options, off, c);
  });
}

/** Picking a value: the picks of the other options that do not exist with it (e.g. a size this color does not come in) are dropped. */
export function pickValue(options: ProductOption[], off: string[], picks: Record<string, string>, name: string, value: string): Record<string, string> {
  const next: Record<string, string> = { ...picks, [name]: value };
  for (const o of options) {
    if (o.name === name || !next[o.name]) continue;
    const others = { ...next };
    delete others[o.name];
    if (!valueHasStock(options, off, others, o.name, next[o.name])) delete next[o.name];
  }
  return next;
}

/** The customer's picks vs the product's options: every option is required, must be one of its values, and the combination must not be sold out. */
export function formatOptionsNote(options: ProductOption[], picked: unknown, off: string[] = []): { note: string; error?: string } {
  if (options.length === 0) return { note: "" };
  const p = picked && typeof picked === "object" && !Array.isArray(picked) ? (picked as Record<string, unknown>) : {};
  const picks: Record<string, string> = {};
  const parts: string[] = [];
  for (const o of options) {
    const v = typeof p[o.name] === "string" ? (p[o.name] as string) : "";
    if (!v) return { note: "", error: `اختار ${o.name} الأول` };
    if (!o.values.includes(v)) return { note: "", error: `${o.name} المختار غير متاح، حدّث الصفحة وجرّب تاني` };
    picks[o.name] = v;
    parts.push(`${o.name}: ${v}`);
  }
  if (!comboAvailable(options, off, picks)) return { note: "", error: "الاختيار ده خلص من المخزون، اختار حاجة تانية" };
  return { note: parts.join("، ") };
}
