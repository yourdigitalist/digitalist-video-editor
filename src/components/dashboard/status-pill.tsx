import { Badge } from "@/components/ui/badge";
import type { VideoStatus } from "@/lib/types";

const MAP: Record<VideoStatus, { label: string; tone: "neutral" | "accent" | "success" | "warn" }> =
  {
    draft: { label: "Draft", tone: "neutral" },
    ready: { label: "Ready", tone: "accent" },
    generating: { label: "Generating", tone: "warn" },
    rendered: { label: "Saved", tone: "success" },
    failed: { label: "Failed", tone: "warn" },
  };

export function StatusPill({ status }: { status: VideoStatus }) {
  const item = MAP[status];
  return <Badge tone={item.tone}>{item.label}</Badge>;
}
