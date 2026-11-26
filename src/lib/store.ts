"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import { SAMPLE_BRANDS, defaultConfig } from "@/lib/defaults";
import { buildMotionPrompt } from "@/lib/prompt-builder";
import type {
  Brand,
  BrandPalette,
  ChatMessage,
  FeedbackItem,
  VideoConfig,
  VideoProject,
} from "@/lib/types";

interface EditorStore {
  brands: Brand[];
  videos: VideoProject[];
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  addBrand: (input: {
    name: string;
    driveUrl?: string;
    palette?: BrandPalette;
    typography?: string;
    notes?: string;
  }) => Brand;
  updateBrand: (id: string, patch: Partial<Brand>) => void;
  deleteBrand: (id: string) => void;
  createVideo: (input: {
    title: string;
    brandId: string;
    config?: Partial<VideoConfig>;
    motionIds?: string[];
  }) => VideoProject;
  updateVideo: (id: string, patch: Partial<VideoProject>) => void;
  deleteVideo: (id: string) => void;
  setVideoConfig: (id: string, config: VideoConfig) => void;
  setMotionIds: (id: string, motionIds: string[]) => void;
  rebuildPrompt: (id: string) => string;
  markGenerating: (id: string) => void;
  markRendered: (id: string) => void;
  addChat: (videoId: string, role: ChatMessage["role"], body: string) => void;
  addFeedback: (videoId: string, body: string, atSec?: number) => void;
  resolveFeedback: (videoId: string, feedbackId: string) => void;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      brands: SAMPLE_BRANDS,
      videos: [],
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),

      addBrand: (input) => {
        const now = new Date().toISOString();
        const brand: Brand = {
          id: `brand_${nanoid(8)}`,
          name: input.name,
          slug: slugify(input.name),
          driveUrl: input.driveUrl ?? "",
          palette: input.palette ?? {
            background: "#1F1D2B",
            text: "#F4F4F9",
            accent: "#FF7551",
            support: "#8B7CF6",
          },
          typography: input.typography ?? "Inter 800 nos títulos, Inter 500 no apoio",
          notes: input.notes ?? "",
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ brands: [brand, ...s.brands] }));
        return brand;
      },

      updateBrand: (id, patch) =>
        set((s) => ({
          brands: s.brands.map((b) =>
            b.id === id ? { ...b, ...patch, updatedAt: new Date().toISOString() } : b,
          ),
        })),

      deleteBrand: (id) =>
        set((s) => ({
          brands: s.brands.filter((b) => b.id !== id),
          videos: s.videos.filter((v) => v.brandId !== id),
        })),

      createVideo: ({ title, brandId, config, motionIds }) => {
        const brand = get().brands.find((b) => b.id === brandId) ?? SAMPLE_BRANDS[0];
        const fullConfig = { ...defaultConfig(brand), ...config };
        const ids = motionIds ?? [];
        const now = new Date().toISOString();
        const project: VideoProject = {
          id: `vid_${nanoid(8)}`,
          title,
          brandId: brand.id,
          status: "draft",
          config: fullConfig,
          motionIds: ids,
          prompt: buildMotionPrompt({ brand, config: fullConfig, motionIds: ids }),
          feedback: [],
          chat: [
            {
              id: `msg_${nanoid(6)}`,
              role: "system",
              body: "Chat is ready. After the first render, describe edits here — timing, copy, motion, brand fidelity.",
              createdAt: now,
            },
          ],
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ videos: [project, ...s.videos] }));
        return project;
      },

      updateVideo: (id, patch) =>
        set((s) => ({
          videos: s.videos.map((v) =>
            v.id === id ? { ...v, ...patch, updatedAt: new Date().toISOString() } : v,
          ),
        })),

      deleteVideo: (id) => set((s) => ({ videos: s.videos.filter((v) => v.id !== id) })),

      setVideoConfig: (id, config) => {
        const video = get().videos.find((v) => v.id === id);
        const brand = get().brands.find((b) => b.id === video?.brandId);
        if (!video || !brand) return;
        const prompt = buildMotionPrompt({
          brand,
          config,
          motionIds: video.motionIds,
        });
        set((s) => ({
          videos: s.videos.map((v) =>
            v.id === id
              ? { ...v, config, prompt, updatedAt: new Date().toISOString() }
              : v,
          ),
        }));
      },

      setMotionIds: (id, motionIds) => {
        const video = get().videos.find((v) => v.id === id);
        const brand = get().brands.find((b) => b.id === video?.brandId);
        if (!video || !brand) return;
        const prompt = buildMotionPrompt({
          brand,
          config: video.config,
          motionIds,
        });
        set((s) => ({
          videos: s.videos.map((v) =>
            v.id === id
              ? {
                  ...v,
                  motionIds,
                  prompt,
                  status: motionIds.length ? "ready" : "draft",
                  updatedAt: new Date().toISOString(),
                }
              : v,
          ),
        }));
      },

      rebuildPrompt: (id) => {
        const video = get().videos.find((v) => v.id === id);
        const brand = get().brands.find((b) => b.id === video?.brandId);
        if (!video || !brand) return "";
        const prompt = buildMotionPrompt({
          brand,
          config: video.config,
          motionIds: video.motionIds,
        });
        set((s) => ({
          videos: s.videos.map((v) =>
            v.id === id ? { ...v, prompt, updatedAt: new Date().toISOString() } : v,
          ),
        }));
        return prompt;
      },

      markGenerating: (id) =>
        set((s) => ({
          videos: s.videos.map((v) =>
            v.id === id
              ? { ...v, status: "generating", updatedAt: new Date().toISOString() }
              : v,
          ),
        })),

      markRendered: (id) =>
        set((s) => ({
          videos: s.videos.map((v) =>
            v.id === id
              ? {
                  ...v,
                  status: "rendered",
                  outputPath: `/api/videos/${id}/preview`,
                  updatedAt: new Date().toISOString(),
                }
              : v,
          ),
        })),

      addChat: (videoId, role, body) => {
        const msg: ChatMessage = {
          id: `msg_${nanoid(6)}`,
          role,
          body,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          videos: s.videos.map((v) =>
            v.id === videoId
              ? { ...v, chat: [...v.chat, msg], updatedAt: new Date().toISOString() }
              : v,
          ),
        }));
      },

      addFeedback: (videoId, body, atSec) => {
        const item: FeedbackItem = {
          id: `fb_${nanoid(6)}`,
          body,
          atSec,
          createdAt: new Date().toISOString(),
          status: "open",
        };
        set((s) => ({
          videos: s.videos.map((v) =>
            v.id === videoId
              ? {
                  ...v,
                  feedback: [item, ...v.feedback],
                  updatedAt: new Date().toISOString(),
                }
              : v,
          ),
        }));
      },

      resolveFeedback: (videoId, feedbackId) =>
        set((s) => ({
          videos: s.videos.map((v) =>
            v.id === videoId
              ? {
                  ...v,
                  feedback: v.feedback.map((f) =>
                    f.id === feedbackId ? { ...f, status: "addressed" } : f,
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : v,
          ),
        })),
    }),
    {
      name: "digitalist-video-editor",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
