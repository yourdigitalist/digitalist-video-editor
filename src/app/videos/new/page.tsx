"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Plus, Search, Sparkles, X } from "lucide-react";
import { MOTION_CATEGORIES, MOTION_GALLERY } from "@/data/motion-gallery";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { ConfigSummary, type ConfigTab } from "@/components/video/config-summary";
import { MotionPreview } from "@/components/video/motion-preview";
import { SAMPLE_BRANDS, defaultConfig } from "@/lib/defaults";
import { MAX_BRAND_COLORS, colorByRole, normalizePalette } from "@/lib/palette";
import { buildMotionPrompt } from "@/lib/prompt-builder";
import { useEditorStore } from "@/lib/store";
import { VISUAL_STYLES, type BrandColor, type VideoConfig, type VisualStyle } from "@/lib/types";

export default function NewVideoPage() {
  const router = useRouter();
  const hydrated = useEditorStore((s) => s.hydrated);
  const brands = useEditorStore((s) => s.brands);
  const createVideo = useEditorStore((s) => s.createVideo);

  const availableBrands = brands.length ? brands : SAMPLE_BRANDS;
  const [title, setTitle] = useState("Untitled motion piece");
  const [brandId, setBrandId] = useState(availableBrands[0]?.id ?? "");
  const brand = availableBrands.find((b) => b.id === brandId) ?? availableBrands[0];
  const [config, setConfig] = useState<VideoConfig>(() => defaultConfig(availableBrands[0]));
  const [tab, setTab] = useState<ConfigTab>("base");
  const [motionIds, setMotionIds] = useState<string[]>([
    "orbit-loop",
    "icons-pop",
    "drawn-stroke",
    "logo-reveal",
  ]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [hoverMotion, setHoverMotion] = useState<string | null>(null);

  const seededFromHydration = useRef(false);
  useEffect(() => {
    if (!hydrated || seededFromHydration.current) return;
    seededFromHydration.current = true;
    const nextBrands = brands.length ? brands : SAMPLE_BRANDS;
    const next = nextBrands.find((b) => b.id === brandId) ?? nextBrands[0];
    if (!next) return;
    setBrandId(next.id);
    setConfig(defaultConfig(next));
  }, [hydrated, brands, brandId]);

  const prompt = useMemo(() => {
    if (!brand) return "";
    return buildMotionPrompt({ brand, config, motionIds });
  }, [brand, config, motionIds]);

  const filtered = MOTION_GALLERY.filter((m) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      m.title.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q)
    );
  });

  function patchConfig(patch: Partial<VideoConfig>) {
    setConfig((c) => ({ ...c, ...patch }));
  }

  function applyBrand(nextId: string) {
    const next = availableBrands.find((b) => b.id === nextId);
    setBrandId(nextId);
    if (!next) return;
    setConfig((c) => ({
      ...c,
      palette: normalizePalette(next.palette),
      typography: next.typography,
      driveAssetsUrl: next.driveUrl || c.driveAssetsUrl,
    }));
  }

  function updateColor(index: number, patch: Partial<BrandColor>) {
    setConfig((c) => {
      const palette = c.palette.map((color, i) => (i === index ? { ...color, ...patch } : color));
      return { ...c, palette };
    });
  }

  function addColor() {
    setConfig((c) => {
      if (c.palette.length >= MAX_BRAND_COLORS) return c;
      return {
        ...c,
        palette: [
          ...c.palette,
          {
            id: `c_custom_${c.palette.length + 1}`,
            role: `color-${c.palette.length + 1}`,
            hex: "#888888",
          },
        ],
      };
    });
  }

  function removeColor(index: number) {
    setConfig((c) => ({
      ...c,
      palette: c.palette.length <= 1 ? c.palette : c.palette.filter((_, i) => i !== index),
    }));
  }

  function toggleMotion(id: string) {
    setMotionIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  async function generate() {
    if (!brand) return;
    setBusy(true);
    const project = createVideo({
      title: title.trim() || "Untitled motion piece",
      brandId: brand.id,
      config,
      motionIds,
    });
    router.push(`/videos/${project.id}?generate=1`);
  }

  if (!hydrated) {
    return <div className="panel p-10 text-[var(--muted)]">Loading editor…</div>;
  }

  if (!brand) {
    return (
      <div className="panel space-y-4 p-10">
        <p>Add a brand before creating a video.</p>
        <Button asChild>
          <Link href="/brands">Go to Brands</Link>
        </Button>
      </div>
    );
  }

  const accent = colorByRole(config.palette, "accent");
  const support = colorByRole(config.palette, "support");

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
              1. Brief & brand
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Keep format, duration, and copy in the briefing. Colors come from the design system first.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              className="w-56"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Video title"
            />
            <select
              className="h-10 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 text-sm"
              value={brand.id}
              onChange={(e) => applyBrand(e.target.value)}
            >
              {availableBrands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ConfigSummary config={config} active={tab} onChange={setTab} />

        <div className="panel space-y-5 p-6">
          {tab === "base" && (
            <>
              <label className="block space-y-2 text-sm">
                <span className="text-[var(--muted)]">Briefing</span>
                <Textarea
                  className="min-h-[180px]"
                  value={config.briefing}
                  onChange={(e) => patchConfig({ briefing: e.target.value })}
                  placeholder="Paste the brief: goal, mandatory lines, format (9:16 / 16:9), duration, tone, CTA…"
                />
              </label>
              <label className="block space-y-2 text-sm">
                <span className="text-[var(--muted)]">Google Drive assets folder</span>
                <Input
                  value={config.driveAssetsUrl}
                  onChange={(e) => patchConfig({ driveAssetsUrl: e.target.value })}
                  placeholder="https://drive.google.com/drive/folders/…"
                />
                <p className="text-xs text-[var(--muted)]">
                  Logos, photos, and design-system files for this piece. Connect Drive in Settings for API sync.
                </p>
              </label>
              <label className="block space-y-2 text-sm">
                <span className="text-[var(--muted)]">Extra notes</span>
                <Textarea
                  value={config.extraNotes}
                  onChange={(e) => patchConfig({ extraNotes: e.target.value })}
                  placeholder="Anything the agent should not invent or must protect"
                />
              </label>
            </>
          )}

          {tab === "visual" && (
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="text-sm text-[var(--muted)]">
                    Colors from design system (up to {MAX_BRAND_COLORS})
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={config.palette.length >= MAX_BRAND_COLORS}
                    onClick={addColor}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add color
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {config.palette.map((color, index) => (
                    <div key={color.id} className="panel-inset space-y-2 p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={color.hex}
                          onChange={(e) => updateColor(index, { hex: e.target.value })}
                          className="h-9 w-10 cursor-pointer rounded border-0 bg-transparent"
                        />
                        <Input
                          value={color.role}
                          onChange={(e) => updateColor(index, { role: e.target.value })}
                          placeholder="role"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="Remove color"
                          onClick={() => removeColor(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        className="mono"
                        value={color.hex}
                        onChange={(e) => updateColor(index, { hex: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <label className="block space-y-2 text-sm">
                <span className="text-[var(--muted)]">Typography</span>
                <Input
                  value={config.typography}
                  onChange={(e) => patchConfig({ typography: e.target.value })}
                />
              </label>

              <div>
                <div className="mb-2 text-sm text-[var(--muted)]">Style (pick from brief)</div>
                <div className="flex flex-wrap gap-2">
                  {VISUAL_STYLES.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      className="chip"
                      title={style.hint}
                      data-active={config.visualStyle === style.id}
                      onClick={() => patchConfig({ visualStyle: style.id as VisualStyle })}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm text-[var(--muted)]">Background</div>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["solid", "Solid"],
                      ["gradient", "Gradient"],
                      ["transparent", "Transparent"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className="chip"
                      data-active={config.background === id}
                      onClick={() => patchConfig({ background: id })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "motion" && (
            <div className="space-y-6">
              <label className="block space-y-2 text-sm">
                <span className="text-[var(--muted)]">Easing personality — {config.easing}</span>
                <input
                  type="range"
                  min={0}
                  max={2}
                  value={config.easing === "mechanical" ? 0 : config.easing === "expressive" ? 1 : 2}
                  onChange={(e) =>
                    patchConfig({
                      easing: (["mechanical", "expressive", "elastic"] as const)[
                        Number(e.target.value)
                      ],
                    })
                  }
                  className="w-full accent-[var(--accent)]"
                />
                <div className="flex justify-between text-xs text-[var(--muted)]">
                  <span>mechanical</span>
                  <span>elastic</span>
                </div>
              </label>
              <label className="block space-y-2 text-sm">
                <span className="text-[var(--muted)]">Intensity — {config.intensity}</span>
                <input
                  type="range"
                  min={0}
                  max={2}
                  value={
                    config.intensity === "subtle" ? 0 : config.intensity === "moderate" ? 1 : 2
                  }
                  onChange={(e) =>
                    patchConfig({
                      intensity: (["subtle", "moderate", "intense"] as const)[
                        Number(e.target.value)
                      ],
                    })
                  }
                  className="w-full accent-[var(--accent)]"
                />
                <div className="flex justify-between text-xs text-[var(--muted)]">
                  <span>subtle</span>
                  <span>intense</span>
                </div>
              </label>
              <label className="block space-y-2 text-sm">
                <span className="text-[var(--muted)]">
                  Stagger between elements — {config.staggerMs} ms
                </span>
                <input
                  type="range"
                  min={0}
                  max={200}
                  step={10}
                  value={config.staggerMs}
                  onChange={(e) => patchConfig({ staggerMs: Number(e.target.value) })}
                  className="w-full accent-[var(--accent)]"
                />
              </label>
            </div>
          )}

          {tab === "delivery" && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--muted)]">Also deliver</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["contactSheet", "Contact sheet"],
                    ["previewGif", "Preview GIF"],
                    ["commentedSource", "Commented source"],
                    ["version169", "16:9 version"],
                    ["version11", "1:1 version"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className="chip"
                    data-active={config.deliverables[key]}
                    onClick={() =>
                      patchConfig({
                        deliverables: {
                          ...config.deliverables,
                          [key]: !config.deliverables[key],
                        },
                      })
                    }
                  >
                    {config.deliverables[key] ? (
                      <Check className="h-3.5 w-3.5 text-[var(--accent)]" />
                    ) : null}
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                2. Motion gallery
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Hover a card to preview the effect. Selected blocks go into the Cursor prompt.
              </p>
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <Input
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search motion…"
              />
            </div>
          </div>

          {MOTION_CATEGORIES.map((category) => {
            const items = filtered.filter((m) => m.category === category);
            if (!items.length) return null;
            return (
              <div key={category} className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  {category}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => {
                    const selected = motionIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className="panel overflow-hidden"
                        onMouseEnter={() => setHoverMotion(item.id)}
                        onMouseLeave={() => setHoverMotion((id) => (id === item.id ? null : id))}
                      >
                        <MotionPreview
                          demo={item.demo}
                          accent={accent}
                          support={support}
                          active={hoverMotion === item.id || selected}
                        />
                        <div className="space-y-3 p-4">
                          <div>
                            <div className="font-semibold">{item.title}</div>
                            <p className="mt-1 text-xs text-[var(--muted)]">{item.description}</p>
                          </div>
                          <Button
                            size="sm"
                            variant={selected ? "secondary" : "default"}
                            onClick={() => toggleMotion(item.id)}
                          >
                            {selected ? (
                              <>
                                <Check className="h-3.5 w-3.5" /> Added
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5" /> Add
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      </div>

      <aside className="panel sticky top-6 h-fit max-h-[calc(100vh-3rem)] space-y-4 overflow-hidden p-5">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">Prompt</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {prompt.length.toLocaleString()} characters · ~{Math.round(prompt.length / 4)} tokens
          </p>
        </div>

        <div>
          <div className="mb-2 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
            Selected motions
          </div>
          <ul className="max-h-40 space-y-2 overflow-auto pr-1">
            {motionIds.length === 0 ? (
              <li className="text-sm text-[var(--muted)]">None yet.</li>
            ) : (
              motionIds.map((id, index) => {
                const item = MOTION_GALLERY.find((m) => m.id === id);
                if (!item) return null;
                return (
                  <li
                    key={id}
                    className="panel-inset flex items-center justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <span>
                      <span className="mono text-[var(--muted)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>{" "}
                      {item.title}
                    </span>
                    <button
                      type="button"
                      className="text-[var(--muted)] hover:text-[var(--accent)]"
                      onClick={() => toggleMotion(id)}
                      aria-label={`Remove ${item.title}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <div>
          <div className="mb-2 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
            Preview
          </div>
          <div className="panel-inset max-h-72 overflow-auto p-3 prompt-preview">{prompt}</div>
        </div>

        <Button className="w-full" size="lg" disabled={busy} onClick={generate}>
          <Sparkles className="h-4 w-4" />
          {busy ? "Starting…" : "Generate video"}
        </Button>
        <Button className="w-full" variant="secondary" onClick={() => setMotionIds([])}>
          Clear motions
        </Button>
      </aside>
    </div>
  );
}
