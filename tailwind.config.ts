import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

/** Full 50-950 scale driven by CSS variables (RGB triplets) so opacity modifiers like /30 keep working. */
function themed(role: "primary" | "accent") {
  const steps = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
  const scale: Record<string, string> = { DEFAULT: `rgb(var(--c-${role}-500) / <alpha-value>)` };
  for (const s of steps) scale[s] = `rgb(var(--c-${role}-${s}) / <alpha-value>)`;
  return scale;
}

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/landing-pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // White-label theme: the merchant picks the palettes in /admin/brand and the layout writes the
        // --c-primary-* / --c-accent-* variables (see src/lib/palettes.ts). Defaults = emerald / orange,
        // so existing class names (emerald-* trust color, orange-* buy button) are themed automatically.
        emerald: themed("primary"),
        orange: themed("accent"),
        safqa: {
          primary: "#0ea5e9",
          dark: "#0369a1",
        },
      },
      fontFamily: {
        sans: ["var(--font-cairo)", "Cairo", "Tajawal", "sans-serif"],
        heading: ["var(--font-tajawal)", "Tajawal", "Cairo", "sans-serif"],
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(16, 185, 129, 0.4)" },
          "50%": { transform: "scale(1.02)", boxShadow: "0 0 0 10px rgba(16, 185, 129, 0)" },
        },
      },
      animation: {
        "pulse-glow": "pulseGlow 2.5s infinite",
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
};
export default config;
