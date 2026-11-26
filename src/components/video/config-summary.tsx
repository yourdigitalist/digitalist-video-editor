"use client";

import type { VideoConfig } from "@/lib/types";

const TABS = ["base", "visual", "motion", "delivery"] as const;
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
      label: "Brief",
      value: config.briefing.trim()
        ? `${config.briefing.trim().slice(0, 42)}${config.briefing.trim().length > 42 ? "…" : ""}`
        : "Add briefing + Drive folder",
    },
    {
      id: "visual",
      label: "Visual",
      value: (
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex gap-1">
            {config.palette.slice(0, 4).map((c) => (
              <span key={c.id} className="swatch shrink-0" style={{ background: c.hex }} />
            ))}
          </span>
          {config.palette.length} colors · {config.visualStyle.replace(/-/g, " ")}
        </span>
      ),
    },
    {
      id: "motion",
      label: "Motion",
      value: `${config.easing} · ${config.intensity}`,
    },
    { id: "delivery", label: "Delivery", value: "MP4 package" },
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
