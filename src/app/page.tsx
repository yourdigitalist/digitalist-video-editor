"use client";

import Link from "next/link";
import { ArrowRight, Clapperboard, FolderKanban, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/dashboard/status-pill";
import { useEditorStore } from "@/lib/store";
import { formatRelative } from "@/lib/utils";

export default function DashboardPage() {
  const hydrated = useEditorStore((s) => s.hydrated);
  const brands = useEditorStore((s) => s.brands);
  const videos = useEditorStore((s) => s.videos);

  if (!hydrated) {
    return (
      <div className="panel p-10 text-[var(--muted)] animate-pulse-soft">Loading workspace…</div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="panel relative overflow-hidden p-8 sm:p-10">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_40%,rgba(255,117,81,0.18),transparent_55%)]" />
        <div className="relative max-w-2xl space-y-4">
          <div className="chip w-fit">
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
            Cursor-native motion pipeline
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight sm:text-5xl">
            Edit videos with Cursor
          </h1>
          <p className="max-w-xl text-[var(--muted)]">
            Attach a brand design system from Google Drive, pick motion blocks, save a prompt
            package, then open it in Cursor to render and revise with your account.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg">
              <Link href="/videos/new">
                <Plus className="h-4 w-4" />
                Create new video
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/brands">
                <FolderKanban className="h-4 w-4" />
                Manage brands
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Brands", value: brands.length, href: "/brands" },
          { label: "Videos", value: videos.length, href: "/videos" },
          {
            label: "Rendered",
            value: videos.filter((v) => v.status === "rendered").length,
            href: "/videos",
          },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href} className="panel p-5 transition hover:border-[var(--accent)]">
            <div className="text-sm text-[var(--muted)]">{stat.label}</div>
            <div className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold">
              {stat.value}
            </div>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="panel p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
              Recent videos
            </h2>
            <Link href="/videos" className="text-sm text-[var(--accent)] hover:underline">
              View all
            </Link>
          </div>
          {videos.length === 0 ? (
            <div className="panel-inset flex flex-col items-start gap-3 p-6">
              <Clapperboard className="h-5 w-5 text-[var(--muted)]" />
              <p className="text-sm text-[var(--muted)]">
                No videos yet. Create one, choose motion graphics, then generate.
              </p>
              <Button asChild size="sm">
                <Link href="/videos/new">
                  Create new video <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {videos.slice(0, 6).map((video) => {
                const brand = brands.find((b) => b.id === video.brandId);
                return (
                  <li key={video.id}>
                    <Link
                      href={`/videos/${video.id}`}
                      className="panel-inset flex items-center justify-between gap-4 p-4 transition hover:border-[var(--accent)]"
                    >
                      <div>
                        <div className="font-medium">{video.title}</div>
                        <div className="mt-1 text-xs text-[var(--muted)]">
                          {brand?.name ?? "Brand"} · {video.motionIds.length} motions ·{" "}
                          {formatRelative(video.updatedAt)}
                        </div>
                      </div>
                      <StatusPill status={video.status} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="panel p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">Brands</h2>
            <Link href="/brands" className="text-sm text-[var(--accent)] hover:underline">
              Manage
            </Link>
          </div>
          <ul className="space-y-3">
            {brands.map((brand) => (
              <li key={brand.id} className="panel-inset p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{brand.name}</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">{brand.typography}</div>
                  </div>
                  <div className="flex gap-1.5">
                    {brand.palette.slice(0, 4).map((color) => (
                      <span key={color.id} className="swatch" style={{ background: color.hex }} />
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
