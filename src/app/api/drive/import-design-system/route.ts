import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { extractDriveFolderId, driveConfigured } from "@/lib/drive";
import { paletteFromTokensJson } from "@/lib/palette";
import { requireCaller } from "@/lib/require-caller";

export const runtime = "nodejs";

const LOCAL_SAMPLES: Record<string, string> = {
  "fungal-dreams": "examples/brands/fungal-dreams/tokens.json",
  fungal: "examples/brands/fungal-dreams/tokens.json",
};

async function loadLocalTokens(hint: string) {
  const key = Object.keys(LOCAL_SAMPLES).find((k) => hint.toLowerCase().includes(k));
  if (!key) return null;
  const file = path.resolve(/*turbopackIgnore: true*/ process.cwd(), LOCAL_SAMPLES[key]);
  const raw = await readFile(file, "utf8");
  return JSON.parse(raw) as {
    name?: string;
    palette?: Record<string, string>;
    typography?: {
      display?: { family?: string; weight?: number };
      body?: { family?: string; weight?: number };
    };
    motion?: { style?: string };
  };
}

async function loadDriveTokens(folderId: string) {
  const key = process.env.GOOGLE_DRIVE_API_KEY?.trim();
  if (!key) return null;

  const listUrl = new URL("https://www.googleapis.com/drive/v3/files");
  listUrl.searchParams.set("q", `'${folderId}' in parents and name='tokens.json' and trashed=false`);
  listUrl.searchParams.set("fields", "files(id,name)");
  listUrl.searchParams.set("pageSize", "1");
  listUrl.searchParams.set("key", key);

  const listRes = await fetch(listUrl);
  if (!listRes.ok) {
    throw new Error(`Drive list failed (${listRes.status})`);
  }
  const listJson = (await listRes.json()) as { files?: { id: string }[] };
  const fileId = listJson.files?.[0]?.id;
  if (!fileId) return null;

  const fileUrl = new URL(`https://www.googleapis.com/drive/v3/files/${fileId}`);
  fileUrl.searchParams.set("alt", "media");
  fileUrl.searchParams.set("key", key);
  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok) throw new Error(`Drive download failed (${fileRes.status})`);
  return (await fileRes.json()) as Parameters<typeof paletteFromTokensJson>[0] & { name?: string };
}

export async function POST(request: Request) {
  const caller = await requireCaller(request);
  if (!caller.ok) return caller.response;

  try {
    const body = (await request.json()) as {
      driveUrl?: string;
      designSystemPath?: string;
      brandName?: string;
    };
    const driveUrl = String(body.driveUrl ?? "");
    const pathHint = String(body.designSystemPath ?? body.brandName ?? "");
    const folderId = extractDriveFolderId(driveUrl);

    let tokens: Awaited<ReturnType<typeof loadDriveTokens>> | Awaited<ReturnType<typeof loadLocalTokens>> =
      null;
    let source: "google-drive" | "local-sample" | "none" = "none";

    if (folderId && driveConfigured()) {
      tokens = await loadDriveTokens(folderId);
      if (tokens) source = "google-drive";
    }

    if (!tokens) {
      tokens = await loadLocalTokens(pathHint || driveUrl);
      if (tokens) source = "local-sample";
    }

    if (!tokens) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No tokens.json found. Add tokens.json to the Drive folder (with API key), or use a known sample brand path.",
          configured: driveConfigured(),
        },
        { status: 404 },
      );
    }

    const parsed = paletteFromTokensJson(tokens);
    return NextResponse.json({
      ok: true,
      source,
      name: tokens.name,
      palette: parsed.palette,
      typography: parsed.typography,
      visualStyle: parsed.visualStyle,
      folderId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Import failed",
      },
      { status: 500 },
    );
  }
}
