import { Suspense } from "react";
import { VideoDetailClient } from "./video-detail-client";

export default function VideoDetailPage() {
  return (
    <Suspense fallback={<div className="panel p-10 text-[var(--muted)]">Loading…</div>}>
      <VideoDetailClient />
    </Suspense>
  );
}
