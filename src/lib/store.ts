"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import { SAMPLE_BRANDS, defaultConfig } from "@/lib/defaults";
import { DEFAULT_COLORS, normalizePalette } from "@/lib/palette";
import { buildMotionPrompt } from "@/lib/prompt-builder";
import type {
  Brand,
  BrandColor,
  ChatMessage,
  FeedbackItem,
  VideoConfig,
  VideoProject,
} from "@/lib/types";

/** Block persist writes until rehydrate finishes so SSR defaults can't overwrite saved brands. */
let canPersist = false;

interface EditorStore {
  brands: Brand[];
  videos: VideoProject[];
  /** Once true, sample brands are never auto-restored (even if the list is empty). */
  brandsSeeded: boolean;
  hydrated: boolean;
  driveConnected: boolean;
  setHydrated: (v: boolean) => void;
  setDriveConnected: (v: boolean) => void;
  seedBrandsIfNeeded: () => void;
  addBrand: (input: {
    name: string;
    driveUrl?: string;
    palette?: BrandColor[];
    typography?: string;
    notes?: string;
    designSystemPath?: string;
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
  markRendered: (id: string, drivePackageUrl?: string) => void;
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

function migrateBrand(raw: Brand): Brand {
  return {
    ...raw,
    palette: normalizePalette(raw.palette),
    typography: raw.typography || "Inter 800 for titles, Inter 500 for support",
  };
}

function migrateConfig(raw: Partial<VideoConfig> & Record<string, unknown>, brand?: Brand): VideoConfig {
  const base = defaultConfig(brand);
  const briefing =
    typeof raw.briefing === "string" && raw.briefing
      ? raw.briefing
      : [raw.goal, raw.mandatoryTexts, raw.scriptText].filter((v) => typeof v === "string" && v.trim()).join("\n\n");
  return {
    ...base,
    ...raw,
    briefing,
    palette: normalizePalette(raw.palette ?? brand?.palette ?? DEFAULT_COLORS),
    stack: "html-svg-gsap",
  } as VideoConfig;
}

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      brands: [],
      videos: [],
      brandsSeeded: false,
      hydrated: false,
      driveConnected: false,
      setHydrated: (v) => set({ hydrated: v }),
      setDriveConnected: (v) => set({ driveConnected: v }),
      seedBrandsIfNeeded: () => {
        const state = get();
        if (state.brandsSeeded) return;
        set({
          brands: SAMPLE_BRANDS.map((b) => ({
            ...b,
            palette: b.palette.map((c) => ({ ...c })),
          })),
          brandsSeeded: true,
        });
      },

      addBrand: (input) => {
        const now = new Date().toISOString();
        const brand: Brand = {
          id: `brand_${nanoid(8)}`,
          name: input.name,
          slug: slugify(input.name),
          driveUrl: input.driveUrl ?? "",
          designSystemPath: input.designSystemPath,
          palette: input.palette?.length
            ? normalizePalette(input.palette)
            : DEFAULT_COLORS.map((c) => ({ ...c })),
          typography: input.typography ?? "Inter 800 for titles, Inter 500 for support",
          notes: input.notes ?? "",
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ brands: [brand, ...s.brands], brandsSeeded: true }));
        return brand;
      },

      updateBrand: (id, patch) =>
        set((s) => ({
          brands: s.brands.map((b) =>
            b.id === id
              ? {
                  ...b,
                  ...patch,
                  palette: patch.palette ? normalizePalette(patch.palette) : b.palette,
                  updatedAt: new Date().toISOString(),
                }
              : b,
          ),
          brandsSeeded: true,
        })),

      deleteBrand: (id) =>
        set((s) => ({
          brands: s.brands.filter((b) => b.id !== id),
          videos: s.videos.filter((v) => v.brandId !== id),
          brandsSeeded: true,
        })),

      createVideo: ({ title, brandId, config, motionIds }) => {
        const brand = get().brands.find((b) => b.id === brandId) ?? SAMPLE_BRANDS[0];
        const fullConfig = migrateConfig({ ...defaultConfig(brand), ...config }, brand);
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
              body: "Revision notes live here. They do not call Cursor AI by themselves — use Open in Cursor to run the package with your Cursor account / credits.",
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
        const revisions = video.chat
          .filter((m) => m.role === "user")
          .map((m) => m.body);
        const prompt = buildMotionPrompt({
          brand,
          config: video.config,
          motionIds: video.motionIds,
          revisions,
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

      markRendered: (id, drivePackageUrl) =>
        set((s) => ({
          videos: s.videos.map((v) =>
            v.id === id
              ? {
                  ...v,
                  status: "rendered",
                  outputPath: `/api/videos/${id}/preview`,
                  drivePackageUrl: drivePackageUrl ?? v.drivePackageUrl,
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
            videoId === v.id
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
      skipHydration: true,
      version: 3,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          };
        }
        return {
          getItem: (name) => localStorage.getItem(name),
          setItem: (name, value) => {
            // Avoid writing default empty/sample state over real data before rehydrate.
            if (!canPersist) return;
            localStorage.setItem(name, value);
          },
          removeItem: (name) => localStorage.removeItem(name),
        };
      }),
      partialize: (s) => ({
        brands: s.brands,
        videos: s.videos,
        brandsSeeded: s.brandsSeeded,
        driveConnected: s.driveConnected,
      }),
      migrate: (persisted) => {
        const state = (persisted ?? {}) as {
          brands?: Brand[];
          videos?: VideoProject[];
          driveConnected?: boolean;
          brandsSeeded?: boolean;
        };
        const brands = Array.isArray(state.brands)
          ? state.brands.map(migrateBrand)
          : SAMPLE_BRANDS.map((b) => ({ ...b, palette: b.palette.map((c) => ({ ...c })) }));
        return {
          brands,
          // Any prior persisted brands list (including empty after deletes) means we already seeded.
          brandsSeeded: state.brandsSeeded ?? Array.isArray(state.brands),
          videos: (state.videos ?? []).map((v) => {
            const brand = brands.find((b) => b.id === v.brandId);
            return {
              ...v,
              config: migrateConfig(v.config as VideoConfig & Record<string, unknown>, brand),
            };
          }),
          driveConnected: Boolean(state.driveConnected),
        };
      },
      onRehydrateStorage: () => (state) => {
        canPersist = true;
        state?.seedBrandsIfNeeded();
        state?.setHydrated(true);
      },
    },
  ),
);
