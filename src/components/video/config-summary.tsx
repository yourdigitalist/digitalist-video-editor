"use client";

import type { VideoConfig } from "@/lib/types";

const TABS = ["base", "stack", "format", "visual", "motion", "delivery"] as const;
export type ConfigTab = (typeof TABS)[number];

export function ConfigSummary({
  config,
  active,
  onChange,
}: {
  config: VideoConfig;
  active: ConfigTab;
  onChange: (tab: ConfigTab) => void;
}) {
  const items: { id: ConfigTab; label: string; value: React.ReactNode }[] = [
    {
      id: "base",
      label: "Base",
      value:
        config.base === "script"
          ? "Roteiro anexado"
          : config.base === "audio"
            ? "Áudio anexado"
            : config.base === "video"
              ? "Vídeo anexado"
              : "Só briefing",
    },
    { id: "stack", label: "Stack", value: "HTML/SVG + GSAP" },
    {
      id: "format",
      label: "Formato",
      value: `${config.aspectRatio} · ${config.durationSec} s · ${config.fps} fps`,
    },
    {
      id: "visual",
      label: "Visual",
      value: (
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex gap-1">
            {Object.values(config.palette).map((hex) => (
              <span key={hex} className="swatch" style={{ background: hex }} />
            ))}
          </span>
          4 cores · {config.visualStyle.replace("-", " ")}
        </span>
      ),
    },
    {
      id: "motion",
      label: "Movimento",
      value: `${config.easing} · ${config.intensity}`,
    },
    { id: "delivery", label: "Entrega", value: "MP4" },
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className="panel-inset px-3 py-3 text-left transition"
          data-active={active === item.id}
          style={
            active === item.id
              ? { borderColor: "var(--accent)", boxShadow: "inset 0 -2px 0 var(--accent)" }
              : undefined
          }
        >
          <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
            {item.label}
          </div>
          <div className="mt-1 text-sm font-medium capitalize">{item.value}</div>
        </button>
      ))}
    </div>
  );
}
