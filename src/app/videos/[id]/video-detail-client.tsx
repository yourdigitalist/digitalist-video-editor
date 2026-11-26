"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  Flag,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { getMotionById } from "@/data/motion-gallery";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { StatusPill } from "@/components/dashboard/status-pill";
import { colorByRole } from "@/lib/palette";
import { useEditorStore } from "@/lib/store";
import { formatRelative } from "@/lib/utils";

export function VideoDetailClient() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const hydrated = useEditorStore((s) => s.hydrated);
  const video = useEditorStore((s) => s.videos.find((v) => v.id === params.id));
  const brand = useEditorStore((s) => s.brands.find((b) => b.id === video?.brandId));
  const markGenerating = useEditorStore((s) => s.markGenerating);
  const markRendered = useEditorStore((s) => s.markRendered);
  const addChat = useEditorStore((s) => s.addChat);
  const addFeedback = useEditorStore((s) => s.addFeedback);
  const resolveFeedback = useEditorStore((s) => s.resolveFeedback);
  const rebuildPrompt = useEditorStore((s) => s.rebuildPrompt);

  const [tab, setTab] = useState<"prompt" | "chat" | "feedback">("prompt");
  const [chatDraft, setChatDraft] = useState("");
  const [feedbackDraft, setFeedbackDraft] = useState("");
  const [feedbackAt, setFeedbackAt] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const motions = useMemo(
    () => (video?.motionIds ?? []).map((id) => getMotionById(id)).filter(Boolean),
    [video?.motionIds],
  );

  useEffect(() => {
    if (!hydrated || !video) return;
    if (search.get("generate") === "1" && video.status !== "rendered" && !generating) {
      void runGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, video?.id]);

  async function runGenerate() {
    if (!video) return;
    setGenerating(true);
    setTab("prompt");
    markGenerating(video.id);
    const prompt = rebuildPrompt(video.id);
    setLogs([]);
    const steps = [
      "Building deterministic GSAP prompt from brand + motion repertoire…",
      "Writing storyboard outline from the briefing…",
      "Preparing HTML/SVG stage defaults…",
      "Saving project package (prompt + deliverables flags)…",
      "Ready to hand off to a Cursor agent for the real render…",
    ];
    for (const step of steps) {
      setLogs((prev) => [...prev, step]);
      await new Promise((r) => setTimeout(r, 450));
    }
    let drivePackageUrl: string | undefined;
    try {
      await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: video.id,
          title: video.title,
          prompt: prompt || video.prompt,
          brandName: brand?.name,
          config: video.config,
          motionIds: video.motionIds,
        }),
      });
      const driveRes = await fetch("/api/drive/save-package", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          driveUrl: video.config.driveAssetsUrl || brand?.driveUrl,
          title: video.title,
          projectId: video.id,
          prompt: prompt || video.prompt,
        }),
      });
      const driveJson = (await driveRes.json()) as { url?: string; message?: string };
      drivePackageUrl = driveJson.url;
      if (driveJson.message) setLogs((prev) => [...prev, driveJson.message!]);
    } catch {
      // local persistence still succeeds in the UI store
    }
    markRendered(video.id, drivePackageUrl);
    addChat(
      video.id,
      "assistant",
      "Prompt package saved. This dashboard does not render the MP4 itself — open the package in Cursor (your account / credits) to generate and revise the piece.",
    );
    setGenerating(false);
  }

  function sendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!video || !chatDraft.trim()) return;
    const body = chatDraft.trim();
    addChat(video.id, "user", body);
    setChatDraft("");
    rebuildPrompt(video.id);
    addChat(
      video.id,
      "assistant",
      "Revision noted and folded into the prompt package. Use Open in Cursor to run it with your Cursor account — this panel does not call Cursor AI directly.",
    );
  }

  function sendFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!video || !feedbackDraft.trim()) return;
    const at = feedbackAt.trim() ? Number(feedbackAt) : undefined;
    addFeedback(video.id, feedbackDraft.trim(), Number.isFinite(at) ? at : undefined);
    setFeedbackDraft("");
    setFeedbackAt("");
  }

  async function openInCursor() {
    if (!video) return;
    const prompt = rebuildPrompt(video.id);
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may be blocked
    }
    window.open("https://cursor.com/agents", "_blank", "noopener,noreferrer");
  }

  if (!hydrated) {
    return <div className="panel p-10 text-[var(--muted)]">Loading…</div>;
  }

  if (!video || !brand) {
    return (
      <div className="panel space-y-4 p-10">
        <p>Video not found.</p>
        <Button asChild variant="secondary">
          <Link href="/videos">Back to videos</Link>
        </Button>
      </div>
    );
  }

  const accent = colorByRole(brand.palette, "accent");
  const background = colorByRole(brand.palette, "background");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/videos"
            className="mb-3 inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--text)]"
          >
            <ArrowLeft className="h-4 w-4" /> Videos
          </Link>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
            {video.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
            <StatusPill status={generating ? "generating" : video.status} />
            <span>{brand.name}</span>
            <span>Updated {formatRelative(video.updatedAt)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={openInCursor}>
            <ExternalLink className="h-4 w-4" />
            {copied ? "Copied — open Cursor" : "Open in Cursor"}
          </Button>
          <Button disabled={generating} onClick={runGenerate}>
            <Sparkles className="h-4 w-4" />
            {generating ? "Packaging…" : "Save package"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="panel overflow-hidden">
          <div
            className="relative aspect-[9/16] max-h-[640px] w-full bg-[#0b0a10] sm:mx-auto sm:max-w-sm"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 30%, ${accent}33, transparent 45%), linear-gradient(180deg, ${background}, #09080d)`,
            }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="chip">
                {generating
                  ? "Building package"
                  : video.status === "rendered"
                    ? "Package ready"
                    : "Preview"}
              </div>
              <div className="font-[family-name:var(--font-display)] text-3xl font-bold">
                {brand.name}
              </div>
              <p className="max-w-xs text-sm text-[var(--muted)]">
                {video.config.briefing.trim().slice(0, 140) ||
                  "Preview stage — Cursor agents use the saved prompt to produce motion.mp4 via GSAP + Playwright + FFmpeg."}
              </p>
              {video.status === "rendered" ? (
                <div className="flex items-center gap-2 text-sm text-[#7dffb1]">
                  <CheckCircle2 className="h-4 w-4" />
                  Prompt package saved — open in Cursor to render & edit
                </div>
              ) : null}
              {video.drivePackageUrl ? (
                <a
                  className="text-xs text-[var(--accent)] hover:underline"
                  href={video.drivePackageUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Drive folder
                </a>
              ) : null}
            </div>
          </div>
          {logs.length > 0 ? (
            <div className="border-t border-[var(--border)] p-4">
              <div className="mb-2 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                Package log
              </div>
              <ul className="space-y-1 text-sm text-[var(--muted)]">
                {logs.map((line) => (
                  <li key={line} className="mono">
                    → {line}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="panel flex max-h-[760px] flex-col overflow-hidden">
          <div className="flex border-b border-[var(--border)]">
            {(
              [
                ["prompt", "Prompt"],
                ["chat", "Revisions"],
                ["feedback", "Feedback"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className="flex-1 px-4 py-3 text-sm font-medium"
                style={
                  tab === id
                    ? { boxShadow: "inset 0 -2px 0 var(--accent)", color: "var(--text)" }
                    : { color: "var(--muted)" }
                }
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "prompt" && (
            <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
                <span>
                  {video.prompt.length.toLocaleString()} characters · {motions.length} motions
                </span>
                <Button type="button" size="sm" variant="ghost" onClick={openInCursor}>
                  <Copy className="h-3.5 w-3.5" />
                  Copy & open Cursor
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {motions.map((m) => (
                  <span key={m!.id} className="chip">
                    {m!.title}
                  </span>
                ))}
              </div>
              <div className="panel-inset min-h-0 flex-1 overflow-auto p-3 prompt-preview">
                {video.prompt}
              </div>
            </div>
          )}

          {tab === "chat" && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="border-b border-[var(--border)] px-4 py-3 text-xs text-[var(--muted)]">
                Revision notes only — not a live Cursor chat. They update the package; Open in Cursor
                runs them with your Cursor credits.
              </div>
              <div className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
                {video.chat.map((msg) => (
                  <div
                    key={msg.id}
                    className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "ml-auto bg-[color-mix(in_oklab,var(--accent)_22%,transparent)]"
                        : msg.role === "assistant"
                          ? "bg-[var(--panel-2)]"
                          : "bg-transparent text-[var(--muted)]"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                      <MessageSquare className="h-3 w-3" />
                      {msg.role}
                    </div>
                    {msg.body}
                  </div>
                ))}
              </div>
              <form onSubmit={sendChat} className="border-t border-[var(--border)] p-4">
                <Textarea
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                  placeholder="Revision note: timing, copy, motion, brand fidelity…"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={openInCursor}>
                    Open in Cursor
                  </Button>
                  <Button type="submit" size="sm">
                    Add revision
                  </Button>
                </div>
              </form>
            </div>
          )}

          {tab === "feedback" && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
                {video.feedback.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">
                    Pin notes to a second mark (e.g. 2.4s) after the first cut.
                  </p>
                ) : (
                  video.feedback.map((item) => (
                    <div key={item.id} className="panel-inset space-y-2 p-3">
                      <div className="flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
                        <span className="inline-flex items-center gap-1">
                          <Flag className="h-3.5 w-3.5" />
                          {item.atSec != null ? `${item.atSec.toFixed(1)}s` : "general"} ·{" "}
                          {item.status}
                        </span>
                        {item.status === "open" ? (
                          <button
                            type="button"
                            className="text-[var(--accent)]"
                            onClick={() => resolveFeedback(video.id, item.id)}
                          >
                            Mark addressed
                          </button>
                        ) : null}
                      </div>
                      <p className="text-sm">{item.body}</p>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={sendFeedback} className="space-y-2 border-t border-[var(--border)] p-4">
                <div className="flex gap-2">
                  <Input
                    className="w-28"
                    value={feedbackAt}
                    onChange={(e) => setFeedbackAt(e.target.value)}
                    placeholder="sec"
                    inputMode="decimal"
                  />
                  <Input
                    value={feedbackDraft}
                    onChange={(e) => setFeedbackDraft(e.target.value)}
                    placeholder="Feedback note"
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" size="sm">
                    Add feedback
                  </Button>
                </div>
              </form>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
