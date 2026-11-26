import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  tone = "neutral",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "neutral" | "accent" | "success" | "warn";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        tone === "neutral" && "bg-[var(--panel-3)] text-[var(--muted)]",
        tone === "accent" && "bg-[color-mix(in_oklab,var(--accent)_22%,transparent)] text-[var(--accent)]",
        tone === "success" && "bg-[#1d3a2a] text-[#7dffb1]",
        tone === "warn" && "bg-[#3a321d] text-[#ffd37d]",
        className,
      )}
    >
      {children}
    </span>
  );
}
