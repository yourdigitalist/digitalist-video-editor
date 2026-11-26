export type AspectRatio = "9:16" | "4:5" | "1:1" | "16:9" | "21:9";
export type Fps = 24 | 30 | 60;
export type Quality = "high" | "standard" | "light";
export type BackgroundMode = "solid" | "gradient" | "transparent";
export type VisualStyle =
  | "flat-minimal"
  | "geometric"
  | "editorial"
  | "tech-ui"
  | "organic"
  | "bold-pop"
  | "luxury"
  | "playful"
  | "documentary";
export type EasingPersonality = "mechanical" | "expressive" | "elastic";
export type Intensity = "subtle" | "moderate" | "intense";
export type VideoStatus = "draft" | "ready" | "generating" | "rendered" | "failed";

/** Ordered brand colors from the design system (max 8). */
export interface BrandColor {
  id: string;
  /** Semantic role when known: background, text, accent, support, or free label. */
  role: string;
  hex: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  driveUrl?: string;
  designSystemPath?: string;
  palette: BrandColor[];
  typography: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type MotionDemoKind =
  | "orbit"
  | "pop"
  | "stroke"
  | "morph"
  | "cursor"
  | "stack"
  | "cards"
  | "browser"
  | "logo"
  | "sticker"
  | "lower-third"
  | "cta"
  | "kinetic"
  | "mask"
  | "typewriter"
  | "cascade"
  | "highlighter"
  | "counter"
  | "bars"
  | "timeline"
  | "ranking"
  | "blob"
  | "particles"
  | "gradient"
  | "camera"
  | "blur";

export interface MotionItem {
  id: string;
  title: string;
  category: string;
  description: string;
  promptBlock: string;
  demo: MotionDemoKind;
}

export interface VideoConfig {
  stack: "html-svg-gsap";
  aspectRatio: AspectRatio;
  durationSec: number;
  fps: Fps;
  quality: Quality;
  background: BackgroundMode;
  visualStyle: VisualStyle;
  palette: BrandColor[];
  typography: string;
  easing: EasingPersonality;
  intensity: Intensity;
  staggerMs: number;
  deliverables: {
    contactSheet: boolean;
    previewGif: boolean;
    commentedSource: boolean;
    version169: boolean;
    version11: boolean;
  };
  /** Full creative brief (format, duration, copy, etc. live here). */
  briefing: string;
  extraNotes: string;
  driveAssetsUrl: string;
}

export interface FeedbackItem {
  id: string;
  atSec?: number;
  body: string;
  createdAt: string;
  status: "open" | "addressed";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  body: string;
  createdAt: string;
}

export interface VideoProject {
  id: string;
  title: string;
  brandId: string;
  status: VideoStatus;
  config: VideoConfig;
  motionIds: string[];
  prompt: string;
  feedback: FeedbackItem[];
  chat: ChatMessage[];
  thumbnail?: string;
  outputPath?: string;
  drivePackageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  brands: Brand[];
  videos: VideoProject[];
}

export const VISUAL_STYLES: { id: VisualStyle; label: string; hint: string }[] = [
  { id: "flat-minimal", label: "Flat minimal", hint: "Clean shapes, little decoration" },
  { id: "geometric", label: "Geometric", hint: "Hard edges, grids, construction" },
  { id: "editorial", label: "Editorial", hint: "Magazine type, crop drama" },
  { id: "tech-ui", label: "Tech / UI", hint: "Product screens, interface motion" },
  { id: "organic", label: "Organic", hint: "Soft blobs, botanical curves" },
  { id: "bold-pop", label: "Bold pop", hint: "High contrast, loud accents" },
  { id: "luxury", label: "Luxury", hint: "Slow reveals, sparse composition" },
  { id: "playful", label: "Playful", hint: "Bounce, stickers, friendly pace" },
  { id: "documentary", label: "Documentary", hint: "Straightforward, evidence-led" },
];
