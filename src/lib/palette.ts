import type { BrandColor } from "@/lib/types";

export const MAX_BRAND_COLORS = 8;

export const DEFAULT_COLORS: BrandColor[] = [
  { id: "c_bg", role: "background", hex: "#1F1D2B" },
  { id: "c_text", role: "text", hex: "#F4F4F9" },
  { id: "c_accent", role: "accent", hex: "#FF7551" },
  { id: "c_support", role: "support", hex: "#8B7CF6" },
];

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const ROLE_PRIORITY = [
  "background",
  "bg",
  "surface",
  "text",
  "foreground",
  "fg",
  "accent",
  "primary",
  "brand",
  "support",
  "secondary",
  "muted",
];

export function colorByRole(palette: BrandColor[], role: string, fallback = "#888888") {
  return palette.find((c) => c.role.toLowerCase() === role.toLowerCase())?.hex ?? palette[0]?.hex ?? fallback;
}

function normalizeHex(raw: string): string | null {
  const value = raw.trim();
  if (HEX_RE.test(value)) {
    if (value.length === 4 || value.length === 5) {
      // #RGB / #RGBA → #RRGGBB
      const body = value.slice(1);
      return `#${body
        .slice(0, 3)
        .split("")
        .map((c) => c + c)
        .join("")}`.toUpperCase();
    }
    return value.toUpperCase();
  }
  return null;
}

function roleFromKey(key: string) {
  let role = key
    .replace(/^--/, "")
    .replace(/^(fd|rl|color|colour|clr|brand)[-_]/i, "")
    .replace(/[-_]+/g, "-")
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "");

  if (/^(bg|background)$/.test(role) || /(?:^|-)(bg|background)$/.test(role)) role = "background";
  else if (/^(fg|foreground|text)$/.test(role) || /(?:^|-)(fg|foreground|text)$/.test(role)) role = "text";
  else if (/^(primary|brand|accent)$/.test(role) || /(?:^|-)(primary|brand|accent)$/.test(role)) role = "accent";
  else if (/^(secondary|support)$/.test(role) || /(?:^|-)(secondary|support)$/.test(role)) role = "support";

  return role || "color";
}

function pushColor(out: BrandColor[], role: string, hex: string, seen: Set<string>) {
  const normalized = normalizeHex(hex);
  if (!normalized) return;
  const key = `${roleFromKey(role)}:${normalized}`;
  if (seen.has(key)) return;
  seen.add(key);
  if (out.length >= MAX_BRAND_COLORS) return;
  out.push({
    id: `c_${roleFromKey(role)}_${out.length}`,
    role: roleFromKey(role),
    hex: normalized,
  });
}

function extractFromUnknown(value: unknown, roleHint: string, out: BrandColor[], seen: Set<string>, depth = 0) {
  if (out.length >= MAX_BRAND_COLORS || depth > 6 || value == null) return;

  if (typeof value === "string") {
    pushColor(out, roleHint || `color-${out.length + 1}`, value, seen);
    return;
  }

  if (typeof value === "number") return;

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (typeof item === "string") {
        pushColor(out, roleHint || `color-${index + 1}`, item, seen);
        return;
      }
      if (item && typeof item === "object") {
        const row = item as Record<string, unknown>;
        const role = String(row.role ?? row.name ?? row.label ?? row.id ?? `${roleHint || "color"}-${index + 1}`);
        const hex =
          row.hex ?? row.value ?? row.$value ?? row.color ?? row.colour ?? row.DEFAULT ?? row.default;
        if (typeof hex === "string") pushColor(out, role, hex, seen);
        else extractFromUnknown(item, role, out, seen, depth + 1);
      }
    });
    return;
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    // Style-dictionary / Tokens Studio style
    const direct =
      obj.hex ?? obj.value ?? obj.$value ?? obj.color ?? obj.colour ?? obj.DEFAULT ?? obj.default;
    if (typeof direct === "string" && normalizeHex(direct)) {
      pushColor(out, roleHint || "color", direct, seen);
      return;
    }

    for (const [key, child] of Object.entries(obj)) {
      if (key.startsWith("$") && key !== "$value") continue;
      const nextRole = roleHint && !["palette", "colors", "colour", "color", "theme"].includes(roleHint)
        ? `${roleHint}-${key}`
        : key;
      extractFromUnknown(child, nextRole, out, seen, depth + 1);
    }
  }
}

/** Pull up to 8 hex colors from many common design-token shapes. */
export function extractPalette(input: unknown): BrandColor[] {
  const out: BrandColor[] = [];
  const seen = new Set<string>();
  if (input == null) return out;

  if (typeof input === "string") {
    // CSS / plaintext: harvest custom props and bare hexes
    const varMatches = input.matchAll(/--([a-zA-Z0-9_-]+)\s*:\s*(#[0-9a-fA-F]{3,8})/g);
    for (const match of varMatches) {
      pushColor(out, match[1], match[2], seen);
    }
    if (!out.length) {
      const hexMatches = input.matchAll(/#[0-9a-fA-F]{3,8}/g);
      let i = 0;
      for (const match of hexMatches) {
        pushColor(out, `color-${++i}`, match[0], seen);
      }
    }
    return out;
  }

  if (Array.isArray(input)) {
    extractFromUnknown(input, "color", out, seen);
    return sortPalette(out);
  }

  if (typeof input === "object") {
    const obj = input as Record<string, unknown>;
    const preferredKeys = ["palette", "colors", "colour", "color", "brandColors", "brand_colors"];
    for (const key of preferredKeys) {
      if (key in obj) extractFromUnknown(obj[key], key, out, seen);
    }
    if (!out.length && obj.theme && typeof obj.theme === "object") {
      extractFromUnknown((obj.theme as Record<string, unknown>).colors ?? obj.theme, "theme", out, seen);
    }
    if (!out.length) extractFromUnknown(obj, "color", out, seen);
    return sortPalette(out);
  }

  return out;
}

function sortPalette(palette: BrandColor[]): BrandColor[] {
  return [...palette].sort((a, b) => {
    const ai = ROLE_PRIORITY.indexOf(a.role);
    const bi = ROLE_PRIORITY.indexOf(b.role);
    const av = ai === -1 ? 999 : ai;
    const bv = bi === -1 ? 999 : bi;
    return av - bv;
  });
}

export function normalizePalette(input: unknown): BrandColor[] {
  const extracted = extractPalette(input);
  if (extracted.length) return extracted.slice(0, MAX_BRAND_COLORS);
  if (Array.isArray(input)) {
    return input
      .slice(0, MAX_BRAND_COLORS)
      .map((item, index) => {
        if (item && typeof item === "object" && "hex" in item) {
          const row = item as BrandColor;
          const hex = normalizeHex(String(row.hex || "")) ?? "#888888";
          return {
            id: row.id || `c_${index}`,
            role: String(row.role || `color-${index + 1}`),
            hex,
          };
        }
        const hex = normalizeHex(String(item)) ?? "#888888";
        return {
          id: `c_${index}`,
          role: `color-${index + 1}`,
          hex,
        };
      })
      .filter((c) => HEX_RE.test(c.hex));
  }
  return DEFAULT_COLORS.map((c) => ({ ...c }));
}

export function isDefaultPalette(palette: BrandColor[]): boolean {
  if (palette.length !== DEFAULT_COLORS.length) return false;
  return DEFAULT_COLORS.every((d, i) => {
    const row = palette[i];
    return row && row.role === d.role && row.hex.toUpperCase() === d.hex.toUpperCase();
  });
}

const DEFAULT_TYPOGRAPHY = "Inter 800 for titles, Inter 500 for support";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function unwrapTokenString(value: unknown, depth = 0): string | null {
  if (depth > 5 || value == null) return null;
  if (typeof value === "string" || typeof value === "number") return firstString(value);
  const obj = asRecord(value);
  if (!obj) return null;
  return unwrapTokenString(
    obj.family ??
      obj.fontFamily ??
      obj.font ??
      obj.name ??
      obj.label ??
      obj.value ??
      obj.$value ??
      obj.DEFAULT ??
      obj.default,
    depth + 1,
  );
}

function unwrapTokenWeight(value: unknown, depth = 0): string | null {
  if (depth > 5 || value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return String(Math.round(value));
  if (typeof value === "string" && value.trim()) {
    const match = value.trim().match(/\b([1-9]00)\b/);
    return match ? match[1] : null;
  }
  const obj = asRecord(value);
  if (!obj) return null;
  // Prefer explicit weight keys; do not treat a bare $value family string as a weight.
  if ("weight" in obj || "fontWeight" in obj) {
    return unwrapTokenWeight(obj.weight ?? obj.fontWeight, depth + 1);
  }
  return null;
}

function pickRoleNode(container: unknown, roles: string[]): unknown {
  const obj = asRecord(container);
  if (!obj) return null;
  for (const role of roles) {
    if (role in obj) return obj[role];
  }
  // nested fontFamily / families maps
  for (const nestKey of ["fontFamily", "fontFamilies", "families", "fonts", "font"]) {
    const nested = asRecord(obj[nestKey]);
    if (!nested) continue;
    for (const role of roles) {
      if (role in nested) return nested[role];
    }
  }
  return null;
}

function describeFace(node: unknown, fallbackWeight: number): string | null {
  if (node == null) return null;
  if (typeof node === "string") {
    const cleaned = node.replace(/\s+/g, " ").trim();
    if (!cleaned) return null;
    // Already a full sentence / stack description
    if (/ for (titles|support|body|headings?)/i.test(cleaned)) return cleaned;
    const weightMatch = cleaned.match(/\b([1-9]00)\b/);
    if (weightMatch) return cleaned;
    return `${cleaned} ${fallbackWeight}`;
  }

  const obj = asRecord(node);
  if (!obj) return null;

  const family = unwrapTokenString(
    obj.family ?? obj.fontFamily ?? obj.font ?? obj.name ?? obj.label ?? obj.value ?? obj.$value ?? node,
  );
  if (!family) return null;
  const weight =
    unwrapTokenWeight(obj.weight ?? obj.fontWeight ?? obj.value ?? obj.$value) ?? String(fallbackWeight);
  // If family string already contains a weight, don't duplicate
  if (/\b([1-9]00)\b/.test(family)) return family;
  return `${family.replace(/^["']|["']$/g, "")} ${weight}`;
}

/** Build "Family 700 for titles, Family 500 for support" from many token shapes. */
export function typographyFromTokens(tokens: unknown, cssText?: string): {
  typography: string;
  usedFallback: boolean;
} {
  const root = asRecord(tokens) ?? {};
  const typographyNode =
    root.typography ?? root.fonts ?? root.font ?? root.fontFamily ?? root.fontFamilies;

  if (typeof typographyNode === "string" && typographyNode.trim()) {
    return { typography: typographyNode.trim(), usedFallback: false };
  }

  const displayRoles = ["display", "heading", "title", "headline", "h1", "brand", "primary"];
  const bodyRoles = ["body", "text", "support", "paragraph", "copy", "secondary", "ui"];

  const displayNode =
    pickRoleNode(typographyNode, displayRoles) ??
    pickRoleNode(root.fontFamilies, displayRoles) ??
    pickRoleNode(root.fontFamily, displayRoles) ??
    pickRoleNode(root, displayRoles);
  const bodyNode =
    pickRoleNode(typographyNode, bodyRoles) ??
    pickRoleNode(root.fontFamilies, bodyRoles) ??
    pickRoleNode(root.fontFamily, bodyRoles) ??
    pickRoleNode(root, bodyRoles);

  const display = describeFace(displayNode, 700);
  const body = describeFace(bodyNode, 500);

  let typography = [display ? `${display} for titles` : null, body ? `${body} for support` : null]
    .filter(Boolean)
    .join(", ");

  // Single family at typography.fontFamily / fonts.sans etc.
  if (!typography) {
    const single =
      describeFace(pickRoleNode(typographyNode, ["sans", "sansSerif", "default", "base"]), 700) ??
      describeFace(typographyNode, 700);
    if (single && !asRecord(typographyNode)?.display && !asRecord(typographyNode)?.body) {
      // Only treat as single if it resolved a family string, not a dump of the whole object
      if (!single.includes("[object")) typography = `${single} for titles`;
    }
  }

  if (!typography && cssText) {
    typography = typographyFromCss(cssText);
  }

  if (!typography) {
    return { typography: DEFAULT_TYPOGRAPHY, usedFallback: true };
  }

  return { typography, usedFallback: false };
}

export function typographyFromCss(css: string): string {
  const families = new Map<string, string>();
  const weights = new Map<string, string>();

  for (const match of css.matchAll(/--([a-zA-Z0-9_-]+)\s*:\s*([^;}{]+)/g)) {
    const key = match[1].toLowerCase();
    const raw = match[2].trim().replace(/^["']|["']$/g, "");
    if (/font.*family|family.*font|^font-?(display|heading|title|body|text|sans)?$/.test(key)) {
      const role = /body|text|support|paragraph/.test(key)
        ? "body"
        : /display|heading|title|headline|brand/.test(key)
          ? "display"
          : key.includes("body")
            ? "body"
            : "display";
      if (raw && !raw.startsWith("#") && !/^\d/.test(raw)) families.set(role, raw.split(",")[0].trim());
    }
    if (/font.*weight|weight/.test(key) && /\d{2,3}/.test(raw)) {
      const role = /body|text|support/.test(key) ? "body" : "display";
      weights.set(role, raw.match(/\d{2,3}/)![0]);
    }
  }

  const display = families.get("display");
  const body = families.get("body");
  if (!display && !body) return "";
  return [
    display ? `${display} ${weights.get("display") ?? "700"} for titles` : null,
    body ? `${body} ${weights.get("body") ?? "500"} for support` : null,
  ]
    .filter(Boolean)
    .join(", ");
}

export function paletteFromTokensJson(tokens: {
  palette?: unknown;
  colors?: unknown;
  colour?: unknown;
  color?: unknown;
  theme?: unknown;
  typography?: unknown;
  fonts?: unknown;
  font?: unknown;
  fontFamily?: unknown;
  motion?: { style?: string };
  [key: string]: unknown;
}): {
  palette: BrandColor[];
  typography: string;
  visualStyle?: string;
  usedFallback: boolean;
  typographyFallback: boolean;
} {
  const palette = extractPalette(tokens);
  const type = typographyFromTokens(tokens);

  if (!palette.length) {
    return {
      palette: DEFAULT_COLORS.map((c) => ({ ...c })),
      typography: type.typography,
      visualStyle: tokens.motion?.style,
      usedFallback: true,
      typographyFallback: type.usedFallback,
    };
  }

  return {
    palette: palette.slice(0, MAX_BRAND_COLORS),
    typography: type.typography,
    visualStyle: tokens.motion?.style,
    usedFallback: false,
    typographyFallback: type.usedFallback,
  };
}

export function paletteFromTokensCss(css: string): BrandColor[] {
  return extractPalette(css);
}

export { DEFAULT_TYPOGRAPHY };
