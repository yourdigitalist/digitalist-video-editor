export type AspectRatio = "9:16" | "4:5" | "1:1" | "16:9" | "21:9";
export type Fps = 24 | 30 | 60;
export type Quality = "high" | "standard" | "light";
export type BackgroundMode = "solid" | "gradient" | "transparent";
export type VisualStyle =
  | "flat-minimal"
  | "geometric"
  | "editorial"
  | "tech-ui"
  | "organic";
export type EasingPersonality = "mechanical" | "expressive" | "elastic";
export type Intensity = "subtle" | "moderate" | "intense";
export type BaseMaterial = "script" | "audio" | "video" | "briefing";
export type VideoStatus = "draft" | "ready" | "generating" | "rendered" | "failed";

export interface BrandPalette {
  background: string;
  text: string;
  accent: string;
  support: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  driveUrl?: string;
  designSystemPath?: string;
  palette: BrandPalette;
  typography: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MotionItem {
  id: string;
  title: string;
  category: string;
  description: string;
  promptBlock: string;
}

export interface VideoConfig {
  base: BaseMaterial;
  stack: "html-svg-gsap";
  aspectRatio: AspectRatio;
  durationSec: number;
  fps: Fps;
  quality: Quality;
  background: BackgroundMode;
  visualStyle: VisualStyle;
  palette: BrandPalette;
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
  goal: string;
  mandatoryTexts: string;
  extraNotes: string;
  scriptText: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  brands: Brand[];
  videos: VideoProject[];
}
