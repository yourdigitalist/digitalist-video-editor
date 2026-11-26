"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Plus, Search, Sparkles, X } from "lucide-react";
import { MOTION_CATEGORIES, MOTION_GALLERY } from "@/data/motion-gallery";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { ConfigSummary, type ConfigTab } from "@/components/video/config-summary";
import { SAMPLE_BRANDS, defaultConfig } from "@/lib/defaults";
import { buildMotionPrompt } from "@/lib/prompt-builder";
import { useEditorStore } from "@/lib/store";
import type { VideoConfig } from "@/lib/types";

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
    // Simulate generate kickoff; detail page runs the job UX
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

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
              1. Configure a base
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">vale para a peça inteira</p>
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
              onChange={(e) => {
                const next = availableBrands.find((b) => b.id === e.target.value);
                setBrandId(e.target.value);
                if (next) {
                  setConfig((c) => ({
                    ...c,
                    palette: next.palette,
                    typography: next.typography,
                    driveAssetsUrl: next.driveUrl ?? c.driveAssetsUrl,
                  }));
                }
              }}
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
              <p className="text-sm text-[var(--muted)]">
                Material that drives timing and emphasis for the whole piece.
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["script", "Roteiro anexado"],
                    ["audio", "Áudio anexado"],
                    ["video", "Vídeo anexado"],
                    ["briefing", "Só briefing"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className="chip"
                    data-active={config.base === id}
                    onClick={() => patchConfig({ base: id })}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="block space-y-2 text-sm">
                <span className="text-[var(--muted)]">Objetivo da peça</span>
                <Textarea
                  value={config.goal}
                  onChange={(e) => patchConfig({ goal: e.target.value })}
                  placeholder="What this piece must communicate"
                />
              </label>
              <label className="block space-y-2 text-sm">
                <span className="text-[var(--muted)]">Textos obrigatórios</span>
                <Textarea
                  value={config.mandatoryTexts}
                  onChange={(e) => patchConfig({ mandatoryTexts: e.target.value })}
                  placeholder="Exact lines that must appear on screen"
                />
              </label>
              <label className="block space-y-2 text-sm">
                <span className="text-[var(--muted)]">Roteiro / script</span>
                <Textarea
                  className="min-h-[140px]"
                  value={config.scriptText}
                  onChange={(e) => patchConfig({ scriptText: e.target.value })}
                  placeholder="Paste the script here when base is roteiro"
                />
              </label>
              <label className="block space-y-2 text-sm">
                <span className="text-[var(--muted)]">Marca e assets (Google Drive)</span>
                <Input
                  value={config.driveAssetsUrl}
                  onChange={(e) => patchConfig({ driveAssetsUrl: e.target.value })}
                  placeholder="https://drive.google.com/drive/folders/…"
                />
              </label>
            </>
          )}

          {tab === "stack" && (
            <div className="space-y-3 text-sm text-[var(--muted)]">
              <p>
                Stack locked to <strong className="text-[var(--text)]">HTML/SVG + GSAP</strong> —
                deterministic paused timeline, Playwright frame capture, FFmpeg MP4.
              </p>
              <p>Remotion / HyperFrames skills are installed for agents that prefer those engines.</p>
            </div>
          )}

          {tab === "format" && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <div className="mb-2 text-sm text-[var(--muted)]">Proporção</div>
                  <div className="flex flex-wrap gap-2">
                    {(["9:16", "4:5", "1:1", "16:9", "21:9"] as const).map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        className="chip"
                        data-active={config.aspectRatio === ratio}
                        onClick={() => patchConfig({ aspectRatio: ratio })}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-sm text-[var(--muted)]">FPS</div>
                  <div className="flex gap-2">
                    {([24, 30, 60] as const).map((fps) => (
                      <button
                        key={fps}
                        type="button"
                        className="chip"
                        data-active={config.fps === fps}
                        onClick={() => patchConfig({ fps })}
                      >
                        {fps}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-sm text-[var(--muted)]">Qualidade</div>
                  <div className="flex gap-2">
                    {(
                      [
                        ["high", "Alta"],
                        ["standard", "Padrão"],
                        ["light", "Leve"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        className="chip"
                        data-active={config.quality === id}
                        onClick={() => patchConfig({ quality: id })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <label className="block space-y-2 text-sm">
                  <span className="text-[var(--muted)]">
                    Duração aproximada — {config.durationSec}s
                  </span>
                  <input
                    type="range"
                    min={3}
                    max={60}
                    value={config.durationSec}
                    onChange={(e) => patchConfig({ durationSec: Number(e.target.value) })}
                    className="w-full accent-[var(--accent)]"
                  />
                </label>
                <div>
                  <div className="mb-2 text-sm text-[var(--muted)]">Fundo</div>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["solid", "Sólido"],
                        ["gradient", "Gradiente"],
                        ["transparent", "Transparente"],
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
            </div>
          )}

          {tab === "visual" && (
            <div className="space-y-5">
              <div>
                <div className="mb-2 text-sm text-[var(--muted)]">Paleta (ordem = fundo, texto, destaque, apoio)</div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {(
                    [
                      ["background", "Fundo"],
                      ["text", "Texto"],
                      ["accent", "Destaque"],
                      ["support", "Apoio"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="panel-inset space-y-2 p-3 text-sm">
                      <span className="text-[var(--muted)]">{label}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.palette[key]}
                          onChange={(e) =>
                            patchConfig({
                              palette: { ...config.palette, [key]: e.target.value },
                            })
                          }
                          className="h-9 w-10 cursor-pointer rounded border-0 bg-transparent"
                        />
                        <Input
                          value={config.palette[key]}
                          onChange={(e) =>
                            patchConfig({
                              palette: { ...config.palette, [key]: e.target.value },
                            })
                          }
                          className="mono"
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <label className="block space-y-2 text-sm">
                <span className="text-[var(--muted)]">Tipografia</span>
                <Input
                  value={config.typography}
                  onChange={(e) => patchConfig({ typography: e.target.value })}
                />
              </label>
              <div>
                <div className="mb-2 text-sm text-[var(--muted)]">Estilo</div>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["flat-minimal", "Flat minimalista"],
                      ["geometric", "Geométrico"],
                      ["editorial", "Editorial"],
                      ["tech-ui", "Tech / UI"],
                      ["organic", "Orgânico"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className="chip"
                      data-active={config.visualStyle === id}
                      onClick={() => patchConfig({ visualStyle: id })}
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
                <span className="text-[var(--muted)]">
                  Personalidade do easing — {config.easing}
                </span>
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
                  <span>mecânico</span>
                  <span>elástico</span>
                </div>
              </label>
              <label className="block space-y-2 text-sm">
                <span className="text-[var(--muted)]">Intensidade — {config.intensity}</span>
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
                  <span>sutil</span>
                  <span>intensa</span>
                </div>
              </label>
              <label className="block space-y-2 text-sm">
                <span className="text-[var(--muted)]">
                  Stagger entre elementos — {config.staggerMs} ms
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
              <p className="text-sm text-[var(--muted)]">Entregar também</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["contactSheet", "Contact sheet"],
                    ["previewGif", "GIF de prévia"],
                    ["commentedSource", "Código-fonte comentado"],
                    ["version169", "Versão 16:9"],
                    ["version11", "Versão 1:1"],
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
              <label className="block space-y-2 text-sm">
                <span className="text-[var(--muted)]">Observações extras</span>
                <Textarea
                  value={config.extraNotes}
                  onChange={(e) => patchConfig({ extraNotes: e.target.value })}
                  placeholder="Qualquer regra específica"
                />
              </label>
            </div>
          )}
        </div>

        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                2. Adicione da galeria
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Choose the motion blocks Cursor should use when generating.
              </p>
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <Input
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar animação…"
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
                      <div key={item.id} className="panel overflow-hidden">
                        <div
                          className="h-28 bg-[linear-gradient(135deg,rgba(255,117,81,0.25),rgba(139,124,246,0.2))]"
                          style={{
                            backgroundImage: `radial-gradient(circle at 30% 40%, ${config.palette.accent}55, transparent 50%), radial-gradient(circle at 70% 60%, ${config.palette.support}44, transparent 45%), linear-gradient(160deg, ${config.palette.background}, #2a2740)`,
                          }}
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
                                <Check className="h-3.5 w-3.5" /> Adicionado
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5" /> Adicionar
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
            {prompt.length.toLocaleString()} caracteres · ~{Math.round(prompt.length / 4)} tokens
          </p>
        </div>

        <div>
          <div className="mb-2 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
            Itens adicionados
          </div>
          <ul className="max-h-40 space-y-2 overflow-auto pr-1">
            {motionIds.length === 0 ? (
              <li className="text-sm text-[var(--muted)]">Nenhum item ainda.</li>
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
            Pré-visualização
          </div>
          <div className="panel-inset max-h-72 overflow-auto p-3 prompt-preview">{prompt}</div>
        </div>

        <Button className="w-full" size="lg" disabled={busy} onClick={generate}>
          <Sparkles className="h-4 w-4" />
          {busy ? "Starting…" : "Generate video"}
        </Button>
        <Button
          className="w-full"
          variant="secondary"
          onClick={() => {
            setMotionIds([]);
          }}
        >
          Limpar itens
        </Button>
      </aside>
    </div>
  );
}
