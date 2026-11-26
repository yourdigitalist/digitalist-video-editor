"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/dashboard/status-pill";
import { useEditorStore } from "@/lib/store";
import { formatRelative } from "@/lib/utils";

export default function VideosPage() {
  const hydrated = useEditorStore((s) => s.hydrated);
  const videos = useEditorStore((s) => s.videos);
  const brands = useEditorStore((s) => s.brands);
  const deleteVideo = useEditorStore((s) => s.deleteVideo);

  if (!hydrated) {
    return <div className="panel p-10 text-[var(--muted)]">Loading videos…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Videos</h1>
          <p className="mt-2 text-[var(--muted)]">
            Saved projects, prompts and feedback threads live here.
          </p>
        </div>
        <Button asChild>
          <Link href="/videos/new">
            <Plus className="h-4 w-4" />
            Create new video
          </Link>
        </Button>
      </div>

      {videos.length === 0 ? (
        <div className="panel p-10 text-center text-[var(--muted)]">
          No videos yet. Start with a brand and a motion selection.
        </div>
      ) : (
        <div className="grid gap-4">
          {videos.map((video) => {
            const brand = brands.find((b) => b.id === video.brandId);
            return (
              <div key={video.id} className="panel flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <Link
                    href={`/videos/${video.id}`}
                    className="font-[family-name:var(--font-display)] text-lg font-semibold hover:text-[var(--accent)]"
                  >
                    {video.title}
                  </Link>
                  <div className="mt-1 text-sm text-[var(--muted)]">
                    {brand?.name} · {video.config.aspectRatio} · {video.motionIds.length} motions ·{" "}
                    {formatRelative(video.updatedAt)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={video.status} />
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/videos/${video.id}`}>Open</Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteVideo(video.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
