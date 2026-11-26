import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { extractDriveFolderId, driveConfigured } from "@/lib/drive";
import {
  isDefaultPalette,
  paletteFromTokensCss,
  paletteFromTokensJson,
} from "@/lib/palette";
import { requireCaller } from "@/lib/require-caller";

export const runtime = "nodejs";

const LOCAL_SAMPLES: Record<string, string> = {
  "fungal-dreams": "examples/brands/fungal-dreams/tokens.json",
  fungal: "examples/brands/fungal-dreams/tokens.json",
};

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function allowRequest(key: string): boolean {
  const now = Date.now();
  const current = rateBuckets.get(key);
  if (!current || now >= current.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (current.count >= RATE_MAX) return false;
  current.count += 1;
  return true;
}

async function loadLocalTokens(hint: string) {
  const key = Object.keys(LOCAL_SAMPLES).find((k) => hint.toLowerCase().includes(k));
  if (!key) return null;
  const file = path.resolve(/*turbopackIgnore: true*/ process.cwd(), LOCAL_SAMPLES[key]);
  const raw = await readFile(file, "utf8");
  return JSON.parse(raw) as Record<string, unknown> & { name?: string };
}

type DriveList = {
  files?: { id: string; name: string; mimeType?: string }[];
  error?: { message?: string; status?: string };
};

function driveErrorMessage(status: number, message?: string) {
  const raw = (message || "").trim();
  if (status === 400 || /bad request/i.test(raw)) {
    return (
      "Google Drive rejected the lookup (Bad Request). Checklist: (1) API key Application restriction = None " +
      "(not HTTP referrers — this app calls Drive from the server), (2) Drive API enabled on that Cloud project, " +
      "(3) folder URL is drive.google.com/drive/folders/… in My Drive, (4) folder + tokens.json shared as " +
      "Anyone with the link → Viewer. Shared drives need a service account, not an API key."
    );
  }
  if (status === 403 || /forbidden|permission|access not configured/i.test(raw)) {
    return (
      "Drive API key cannot see that folder. Share the folder (and tokens.json) as Anyone with the link → Viewer, " +
      "and enable the Google Drive API on the same Google Cloud project as the key."
    );
  }
  return raw || `Drive list failed (${status})`;
}

async function driveList(apiKey: string, query: string) {
  const listUrl = new URL("https://www.googleapis.com/drive/v3/files");
  listUrl.searchParams.set("q", query);
  listUrl.searchParams.set("fields", "files(id,name,mimeType)");
  listUrl.searchParams.set("pageSize", "50");
  listUrl.searchParams.set("spaces", "drive");
  listUrl.searchParams.set("key", apiKey);

  const listRes = await fetch(listUrl);
  const listJson = (await listRes.json()) as DriveList;
  if (!listRes.ok) {
    throw new Error(driveErrorMessage(listRes.status, listJson.error?.message));
  }
  return listJson.files ?? [];
}

async function driveDownloadText(apiKey: string, fileId: string) {
  const fileUrl = new URL(`https://www.googleapis.com/drive/v3/files/${fileId}`);
  fileUrl.searchParams.set("alt", "media");
  fileUrl.searchParams.set("key", apiKey);
  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok) {
    let detail = "";
    try {
      const errJson = (await fileRes.json()) as DriveList;
      detail = errJson.error?.message || "";
    } catch {
      /* ignore */
    }
    throw new Error(driveErrorMessage(fileRes.status, detail || `Download failed (${fileRes.status})`));
  }
  return fileRes.text();
}

type DriveBundle = {
  tokens?: Record<string, unknown> & { name?: string };
  cssText?: string;
  fileNames: string[];
  tokenFileName?: string;
  cssFileName?: string;
};

async function loadDriveBundle(folderId: string): Promise<
  | { ok: true; bundle: DriveBundle }
  | { ok: false; error: string }
> {
  const key = process.env.GOOGLE_DRIVE_API_KEY?.trim();
  if (!key) {
    return {
      ok: false,
      error: "GOOGLE_DRIVE_API_KEY is not set on the server yet.",
    };
  }

  try {
    const children = await driveList(key, `'${folderId}' in parents and trashed=false`);

    if (!children.length) {
      return {
        ok: false,
        error:
          "Drive folder looks empty or inaccessible with an API key. Share the folder as “Anyone with the link → Viewer” (or use a service account), confirm the full folder URL, and put tokens.json inside it.",
      };
    }

    const fileNames = children.map((f) => f.name);
    const tokensFile =
      children.find((f) => f.name.toLowerCase() === "tokens.json") ??
      children.find((f) => /tokens?\.json$/i.test(f.name)) ??
      children.find((f) => f.name.toLowerCase().endsWith(".json") && /token|design|brand|theme/i.test(f.name));

    const cssFile =
      children.find((f) => f.name.toLowerCase() === "tokens.css") ??
      children.find((f) => f.name.toLowerCase().endsWith(".css") && /token|theme|brand|variables/i.test(f.name));

    if (!tokensFile && !cssFile) {
      return {
        ok: false,
        error: `No tokens.json (or tokens.css) in that folder. Files seen: ${fileNames.slice(0, 10).join(", ") || "(none)"}.`,
      };
    }

    const bundle: DriveBundle = { fileNames };

    if (tokensFile) {
      const raw = await driveDownloadText(key, tokensFile.id);
      try {
        bundle.tokens = JSON.parse(raw) as Record<string, unknown> & { name?: string };
        bundle.tokenFileName = tokensFile.name;
      } catch {
        return { ok: false, error: `${tokensFile.name} is not valid JSON.` };
      }
    }

    if (cssFile) {
      bundle.cssText = await driveDownloadText(key, cssFile.id);
      bundle.cssFileName = cssFile.name;
    }

    return { ok: true, bundle };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Drive import failed",
    };
  }
}

export async function POST(request: Request) {
  const caller = await requireCaller(request);
  if (!caller.ok) return caller.response;

  if (!allowRequest(`drive-import:${caller.sub}`)) {
    return NextResponse.json({ ok: false, error: "rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = (await request.json()) as {
      driveUrl?: string;
      designSystemPath?: string;
      brandName?: string;
    };
    const driveUrl = String(body.driveUrl ?? "");
    const pathHint = String(body.designSystemPath ?? body.brandName ?? "");
    const folderId = extractDriveFolderId(driveUrl);

    if (driveUrl && !folderId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Could not read a folder id from that Google Drive link. Paste the full folders/… URL.",
        },
        { status: 400 },
      );
    }

    let tokens: (Record<string, unknown> & { name?: string }) | null = null;
    let cssText: string | null = null;
    let source: "google-drive" | "local-sample" | "none" = "none";
    let driveError: string | null = null;
    let fileNames: string[] = [];
    let tokenFileName: string | undefined;
    let cssFileName: string | undefined;

    if (folderId && driveConfigured()) {
      const driveResult = await loadDriveBundle(folderId);
      if (driveResult.ok) {
        tokens = driveResult.bundle.tokens ?? null;
        cssText = driveResult.bundle.cssText ?? null;
        fileNames = driveResult.bundle.fileNames;
        tokenFileName = driveResult.bundle.tokenFileName;
        cssFileName = driveResult.bundle.cssFileName;
        source = "google-drive";
      } else {
        driveError = driveResult.error;
      }
    } else if (folderId && !driveConfigured()) {
      driveError = "Drive API key is not configured on the server.";
    }

    if (!tokens && !cssText) {
      tokens = await loadLocalTokens(pathHint || driveUrl);
      if (tokens) source = "local-sample";
    }

    if (!tokens && !cssText) {
      return NextResponse.json(
        {
          ok: false,
          error:
            driveError ||
            "No tokens.json found. Add tokens.json to the Drive folder and share it as Anyone with the link (Viewer).",
          configured: driveConfigured(),
          folderId,
        },
        { status: 404 },
      );
    }

    const parsed = tokens
      ? paletteFromTokensJson(tokens)
      : { palette: [], typography: "", visualStyle: undefined, usedFallback: true };

    let palette = parsed.palette;
    let usedFallback = parsed.usedFallback;
    let typography = parsed.typography;
    let fromCss = false;

    if ((usedFallback || !palette.length) && cssText) {
      const cssPalette = paletteFromTokensCss(cssText);
      if (cssPalette.length) {
        palette = cssPalette;
        usedFallback = false;
        fromCss = true;
      }
    }

    // Drive file downloaded, but no parseable colors → do not pretend we updated the brand.
    if (source === "google-drive" && usedFallback) {
      const topKeys = tokens ? Object.keys(tokens).slice(0, 12).join(", ") : "(no json)";
      return NextResponse.json(
        {
          ok: false,
          error:
            `Found ${tokenFileName || cssFileName || "token file"} but could not read brand colors from it. ` +
            `Top-level JSON keys: ${topKeys || "(none)"}. ` +
            `Use a flat palette map like {"palette":{"background":"#111","text":"#fff","accent":"#f60"}} ` +
            `or CSS variables in tokens.css (--background: #111). Files in folder: ${fileNames.slice(0, 10).join(", ")}.`,
          configured: true,
          folderId,
          tokenFileName,
          cssFileName,
          fileNames,
          topKeys: tokens ? Object.keys(tokens) : [],
        },
        { status: 422 },
      );
    }

    const warning =
      source === "google-drive" && isDefaultPalette(palette)
        ? "These colors match the app sample palette (navy / coral / violet). If Rootlab should look different, update tokens.json in Drive and pull again."
        : undefined;

    return NextResponse.json({
      ok: true,
      source,
      warning,
      name: typeof tokens?.name === "string" ? tokens.name : undefined,
      palette,
      typography,
      visualStyle: parsed.visualStyle,
      folderId,
      tokenFileName,
      cssFileName,
      fromCss,
      colorCount: palette.length,
      fileNames: source === "google-drive" ? fileNames : undefined,
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
