"use client";

import { useEffect, useState } from "react";
import { HardDrive, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/store";

export default function SettingsPage() {
  const hydrated = useEditorStore((s) => s.hydrated);
  const driveConnected = useEditorStore((s) => s.driveConnected);
  const setDriveConnected = useEditorStore((s) => s.setDriveConnected);
  const [status, setStatus] = useState<{
    configured: boolean;
    mode: string;
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/drive/status");
        const data = (await res.json()) as {
          configured?: boolean;
          mode?: string;
          message?: string;
        };
        const next = {
          configured: Boolean(data.configured),
          mode: data.mode ?? "folder-link-only",
          message: data.message ?? "",
        };
        setStatus(next);
        setDriveConnected(next.configured);
      } catch {
        setStatus({
          configured: false,
          mode: "folder-link-only",
          message: "Could not read Drive status.",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [hydrated, setDriveConnected]);

  if (!hydrated) {
    return <div className="panel p-10 text-[var(--muted)]">Loading settings…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Settings</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Storage and handoff. This dashboard builds prompt packages; Cursor agents do the AI work
          on your account.
        </p>
      </div>

      <section className="panel space-y-4 p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--panel-2)]">
            <HardDrive className="h-5 w-5 text-[var(--accent)]" />
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
              Google Drive
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Brands and video briefs point at Drive folders for logos, photos, and tokens.json.
              Packages stay in the app by default; with Drive connected, agents can read that folder
              and we surface it as the save location.
            </p>
            {loading ? (
              <p className="text-sm text-[var(--muted)]">Checking connection…</p>
            ) : (
              <div className="panel-inset space-y-2 p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip" data-active={driveConnected || status?.configured}>
                    {status?.configured ? "API key bound" : "Folder links only"}
                  </span>
                  <span className="text-[var(--muted)]">{status?.mode}</span>
                </div>
                <p className="text-[var(--muted)]">{status?.message}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild variant="secondary">
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Link2 className="h-4 w-4" />
                  Google Cloud credentials
                </a>
              </Button>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Bind secret <span className="mono">GOOGLE_DRIVE_API_KEY</span> in Cursor Publish
              Settings / Secrets. Share brand folders with the key or a service account for reads.
              Writes need OAuth/service account — until then, paste folder URLs and keep packages in
              the app.
            </p>
          </div>
        </div>
      </section>

      <section className="panel space-y-4 p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
          Cursor AI / credits
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Published apps cannot embed live Cursor Agent chats that spend your Cursor credits. This
          UI is a skin for packages: Generate saves a prompt, revision notes append instructions, and
          <strong className="text-[var(--text)]"> Open in Cursor</strong> copies everything for a
          Cloud Agent on your account.
        </p>
      </section>
    </div>
  );
}
