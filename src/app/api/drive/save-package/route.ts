import { NextResponse } from "next/server";
import { driveConfigured, extractDriveFolderId } from "@/lib/drive";
import { requireCaller } from "@/lib/require-caller";

export const runtime = "nodejs";

/**
 * Saves a prompt package metadata stub into the brand Drive folder when an API key is bound.
 * Without credentials, returns a local/mock receipt so the UI can still explain storage.
 */
export async function POST(request: Request) {
  const caller = await requireCaller(request);
  if (!caller.ok) return caller.response;

  try {
    const body = (await request.json()) as {
      driveUrl?: string;
      title?: string;
      projectId?: string;
      prompt?: string;
    };
    const folderId = extractDriveFolderId(String(body.driveUrl ?? ""));
    const title = String(body.title ?? "motion-package").replace(/[^\w.-]+/g, "-").slice(0, 64);
    const projectId = String(body.projectId ?? "project");

    if (!folderId) {
      return NextResponse.json(
        { ok: false, error: "Add a Google Drive folder URL first." },
        { status: 400 },
      );
    }

    if (!driveConfigured()) {
      return NextResponse.json({
        ok: true,
        mocked: true,
        folderId,
        url: `https://drive.google.com/drive/folders/${folderId}`,
        message:
          "Package kept in this app for now. Bind GOOGLE_DRIVE_API_KEY (and share the folder) to write prompt.md into Drive.",
      });
    }

    // Metadata-only create via Drive API requires OAuth/service account for writes.
    // API keys are typically read-only — return a clear next step rather than a fake write.
    return NextResponse.json({
      ok: true,
      mocked: false,
      writable: false,
      folderId,
      url: `https://drive.google.com/drive/folders/${folderId}`,
      suggestedName: `${title}-${projectId}-prompt.md`,
      message:
        "Drive API key is present for reads. Writing files needs a service account / OAuth client — folder link is ready for agents to use.",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Save failed" },
      { status: 500 },
    );
  }
}
