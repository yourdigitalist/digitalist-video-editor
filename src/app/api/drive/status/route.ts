import { NextResponse } from "next/server";
import { driveConfigured } from "@/lib/drive";
import { requireCaller } from "@/lib/require-caller";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const caller = await requireCaller(request);
  if (!caller.ok) return caller.response;

  const configured = driveConfigured();
  return NextResponse.json(
    {
      ok: true,
      configured,
      mode: configured ? "google-drive-api" : "folder-link-only",
      message: configured
        ? "Google Drive API key is bound. Design systems and packages can sync from Drive."
        : "No GOOGLE_DRIVE_API_KEY yet — paste Drive folder links; local sample design systems still import.",
    },
    { headers: { "cache-control": "private, no-store" } },
  );
}
