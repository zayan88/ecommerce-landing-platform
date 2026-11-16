/**
 * Theme palettes for white-label branding. GENERATED from Tailwind default colors (RGB triplets,
 * required by the `rgb(var(--x) / <alpha-value>)` pattern). The merchant picks from this fixed whitelist,
 * so class names stay static and Tailwind purge/JIT is unaffected.
 */
export const PALETTE_KEYS = ["emerald","teal","cyan","blue","indigo","violet","rose","orange","amber","slate"] as const;
export type PaletteKey = (typeof PALETTE_KEYS)[number];

export const PALETTE_STEPS = ["50","100","200","300","400","500","600","700","800","900","950"] as const;

export const PALETTES: Record<PaletteKey, Record<(typeof PALETTE_STEPS)[number], string>> = {
  emerald: {
    "50": "236 253 245",
    "100": "209 250 229",
    "200": "167 243 208",
    "300": "110 231 183",
    "400": "52 211 153",
    "500": "16 185 129",
    "600": "5 150 105",
    "700": "4 120 87",
    "800": "6 95 70",
    "900": "6 78 59",
    "950": "2 44 34",
  },
  teal: {
    "50": "240 253 250",
    "100": "204 251 241",
    "200": "153 246 228",
    "300": "94 234 212",
    "400": "45 212 191",
    "500": "20 184 166",
    "600": "13 148 136",
    "700": "15 118 110",
    "800": "17 94 89",
    "900": "19 78 74",
    "950": "4 47 46",
  },
  cyan: {
    "50": "236 254 255",
    "100": "207 250 254",
    "200": "165 243 252",
    "300": "103 232 249",
    "400": "34 211 238",
    "500": "6 182 212",
    "600": "8 145 178",
    "700": "14 116 144",
    "800": "21 94 117",
    "900": "22 78 99",
    "950": "8 51 68",
  },
  blue: {
    "50": "239 246 255",
    "100": "219 234 254",
    "200": "191 219 254",
    "300": "147 197 253",
    "400": "96 165 250",
    "500": "59 130 246",
    "600": "37 99 235",
    "700": "29 78 216",
    "800": "30 64 175",
    "900": "30 58 138",
    "950": "23 37 84",
  },
  indigo: {
    "50": "238 242 255",
    "100": "224 231 255",
    "200": "199 210 254",
    "300": "165 180 252",
    "400": "129 140 248",
    "500": "99 102 241",
    "600": "79 70 229",
    "700": "67 56 202",
    "800": "55 48 163",
    "900": "49 46 129",
    "950": "30 27 75",
  },
  violet: {
    "50": "245 243 255",
    "100": "237 233 254",
    "200": "221 214 254",
    "300": "196 181 253",
    "400": "167 139 250",
    "500": "139 92 246",
    "600": "124 58 237",
    "700": "109 40 217",
    "800": "91 33 182",
    "900": "76 29 149",
    "950": "46 16 101",
  },
  rose: {
    "50": "255 241 242",
    "100": "255 228 230",
    "200": "254 205 211",
    "300": "253 164 175",
    "400": "251 113 133",
    "500": "244 63 94",
    "600": "225 29 72",
    "700": "190 18 60",
    "800": "159 18 57",
    "900": "136 19 55",
    "950": "76 5 25",
  },
  orange: {
    "50": "255 247 237",
    "100": "255 237 213",
    "200": "254 215 170",
    "300": "253 186 116",
    "400": "251 146 60",
    "500": "249 115 22",
    "600": "234 88 12",
    "700": "194 65 12",
    "800": "154 52 18",
    "900": "124 45 18",
    "950": "67 20 7",
  },
  amber: {
    "50": "255 251 235",
    "100": "254 243 199",
    "200": "253 230 138",
    "300": "252 211 77",
    "400": "251 191 36",
    "500": "245 158 11",
    "600": "217 119 6",
    "700": "180 83 9",
    "800": "146 64 14",
    "900": "120 53 15",
    "950": "69 26 3",
  },
  slate: {
    "50": "248 250 252",
    "100": "241 245 249",
    "200": "226 232 240",
    "300": "203 213 225",
    "400": "148 163 184",
    "500": "100 116 139",
    "600": "71 85 105",
    "700": "51 65 85",
    "800": "30 41 59",
    "900": "15 23 42",
    "950": "2 6 23",
  },
};

export const PALETTE_LABELS_AR: Record<PaletteKey, string> = {
  emerald: "أخضر زمردي", teal: "تركواز", cyan: "سماوي", blue: "أزرق", indigo: "نيلي",
  violet: "بنفسجي", rose: "وردي", orange: "برتقالي", amber: "كهرماني", slate: "رمادي",
};

export function isPaletteKey(v: unknown): v is PaletteKey {
  return typeof v === "string" && (PALETTE_KEYS as readonly string[]).includes(v);
}

/** Any color the merchant picked: "#rrggbb" (strictly validated, it ends up in a style attribute). */
export function isHexColor(v: unknown): v is string {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
}

/** A palette key or a custom hex color. */
export function isThemeColor(v: unknown): v is string {
  return isPaletteKey(v) || isHexColor(v);
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l * 100];
  const sat = d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [(h * 60 + 360) % 360, sat * 100, l * 100];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sat = s / 100;
  const lig = l / 100;
  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lig - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/** Builds the 11-step scale from one picked color; the picked color itself is the 600 step (buttons, icons). */
export function scaleFromHex(hex: string): Record<(typeof PALETTE_STEPS)[number], string> {
  const [h, s, l] = hexToHsl(hex);
  const light = (t: number) => hslToRgb(h, s, l + (97 - l) * t).join(" ");
  const dark = (u: number) => hslToRgb(h, s, l * (1 - u)).join(" ");
  return {
    "50": light(1),
    "100": light(0.9),
    "200": light(0.78),
    "300": light(0.55),
    "400": light(0.35),
    "500": light(0.15),
    "600": hslToRgb(h, s, l).join(" "),
    "700": dark(0.18),
    "800": dark(0.34),
    "900": dark(0.5),
    "950": dark(0.65),
  };
}

/** RGB triplet of the "main" shade, for swatches and previews. */
export function themeSwatchRgb(v: string): string {
  return isHexColor(v) ? scaleFromHex(v)["600"] : PALETTES[(isPaletteKey(v) ? v : "emerald") as PaletteKey]["500"];
}

/** CSS variables for one theme role, e.g. cssVarsFor("primary", "emerald") or cssVarsFor("accent", "#d4145a"). */
export function cssVarsFor(role: "primary" | "accent", key: string): Record<string, string> {
  const scale = isHexColor(key) ? scaleFromHex(key) : PALETTES[(isPaletteKey(key) ? key : "emerald") as PaletteKey];
  const vars: Record<string, string> = {};
  for (const s of PALETTE_STEPS) vars[`--c-${role}-${s}`] = scale[s];
  return vars;
}
