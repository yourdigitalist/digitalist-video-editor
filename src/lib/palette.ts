import type { BrandColor } from "@/lib/types";

export const MAX_BRAND_COLORS = 8;

export const DEFAULT_COLORS: BrandColor[] = [
  { id: "c_bg", role: "background", hex: "#1F1D2B" },
  { id: "c_text", role: "text", hex: "#F4F4F9" },
  { id: "c_accent", role: "accent", hex: "#FF7551" },
  { id: "c_support", role: "support", hex: "#8B7CF6" },
];

export function colorByRole(palette: BrandColor[], role: string, fallback = "#888888") {
  return palette.find((c) => c.role.toLowerCase() === role.toLowerCase())?.hex ?? palette[0]?.hex ?? fallback;
}

export function normalizePalette(input: unknown): BrandColor[] {
  if (Array.isArray(input)) {
    return input
      .slice(0, MAX_BRAND_COLORS)
      .map((item, index) => {
        if (item && typeof item === "object" && "hex" in item) {
          const row = item as BrandColor;
          return {
            id: row.id || `c_${index}`,
            role: String(row.role || `color-${index + 1}`),
            hex: String(row.hex || "#888888"),
          };
        }
        return {
          id: `c_${index}`,
          role: `color-${index + 1}`,
          hex: String(item),
        };
      })
      .filter((c) => /^#[0-9a-fA-F]{3,8}$/.test(c.hex));
  }

  if (input && typeof input === "object") {
    const entries = Object.entries(input as Record<string, string>).slice(0, MAX_BRAND_COLORS);
    return entries.map(([role, hex], index) => ({
      id: `c_${role}`,
      role,
      hex,
    }));
  }

  return DEFAULT_COLORS.map((c) => ({ ...c }));
}

export function paletteFromTokensJson(tokens: {
  palette?: Record<string, string>;
  typography?: { display?: { family?: string; weight?: number }; body?: { family?: string; weight?: number } };
  motion?: { style?: string };
}): { palette: BrandColor[]; typography: string; visualStyle?: string } {
  const palette = normalizePalette(tokens.palette ?? {});
  const display = tokens.typography?.display;
  const body = tokens.typography?.body;
  const typography =
    display || body
      ? [
          display ? `${display.family ?? "Sans"} ${display.weight ?? 700} for titles` : null,
          body ? `${body.family ?? "Sans"} ${body.weight ?? 500} for support` : null,
        ]
          .filter(Boolean)
          .join(", ")
      : "Inter 800 for titles, Inter 500 for support";

  return {
    palette: palette.length ? palette : DEFAULT_COLORS.map((c) => ({ ...c })),
    typography,
    visualStyle: tokens.motion?.style,
  };
}
