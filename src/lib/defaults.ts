import type { Brand, VideoConfig } from "@/lib/types";

export const DEFAULT_PALETTE = {
  background: "#1F1D2B",
  text: "#F4F4F9",
  accent: "#FF7551",
  support: "#8B7CF6",
};

export function defaultConfig(brand?: Brand): VideoConfig {
  return {
    base: "briefing",
    stack: "html-svg-gsap",
    aspectRatio: "9:16",
    durationSec: 8,
    fps: 30,
    quality: "standard",
    background: "solid",
    visualStyle: "flat-minimal",
    palette: brand?.palette ?? { ...DEFAULT_PALETTE },
    typography: brand?.typography ?? "Inter 800 nos títulos, Inter 500 no apoio",
    easing: "expressive",
    intensity: "moderate",
    staggerMs: 60,
    deliverables: {
      contactSheet: true,
      previewGif: false,
      commentedSource: true,
      version169: false,
      version11: false,
    },
    goal: "",
    mandatoryTexts: "",
    extraNotes: "",
    scriptText: "",
    driveAssetsUrl: brand?.driveUrl ?? "",
  };
}

export const SAMPLE_BRANDS: Brand[] = [
  {
    id: "brand_fungal",
    name: "Fungal Dreams",
    slug: "fungal-dreams",
    driveUrl: "https://drive.google.com/drive/folders/example-fungal-dreams",
    designSystemPath: "examples/brands/fungal-dreams",
    palette: {
      background: "#1F1D2B",
      text: "#F4F4F9",
      accent: "#FF7551",
      support: "#8B7CF6",
    },
    typography: "Inter 800 nos títulos, Inter 500 no apoio",
    notes:
      "Lab + cultivation brand. Mint line icons, botanical mushroom ink plates, liquid color blobs on navy.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "brand_digitalist",
    name: "Digitalist",
    slug: "digitalist",
    driveUrl: "",
    palette: {
      background: "#0E1116",
      text: "#F5F1EA",
      accent: "#E85D04",
      support: "#4CC9F0",
    },
    typography: "Space Grotesk 700 nos títulos, Inter 500 no apoio",
    notes: "Agency brand — websites, branding and systems.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
