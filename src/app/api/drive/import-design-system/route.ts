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

type DriveList = {
  files?: { id: string; name: string }[];
  error?: { message?: string; status?: string };
};

function driveErrorMessage(status: number, message?: string) {
  const raw = (message || "").trim();
  // API keys + corpora=allDrives (and similar) often return a bare "Bad Request".
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
  // API keys only work for publicly / link-shared files. Do not send corpora=allDrives —
  // Google returns HTTP 400 "Bad Request" for that combo.
  const listUrl = new URL("https://www.googleapis.com/drive/v3/files");
  listUrl.searchParams.set("q", query);
  listUrl.searchParams.set("fields", "files(id,name,mimeType)");
  listUrl.searchParams.set("pageSize", "25");
  listUrl.searchParams.set("spaces", "drive");
  listUrl.searchParams.set("key", apiKey);

  const listRes = await fetch(listUrl);
  const listJson = (await listRes.json()) as DriveList;
  if (!listRes.ok) {
    throw new Error(driveErrorMessage(listRes.status, listJson.error?.message));
  }
  return listJson.files ?? [];
}

async function loadDriveTokens(folderId: string): Promise<
  | { ok: true; tokens: Parameters<typeof paletteFromTokensJson>[0] & { name?: string } }
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
    // Probe folder access first — API keys only see public / link-shared files.
    const children = await driveList(
      key,
      `'${folderId}' in parents and trashed=false`,
    );

    if (!children.length) {
      return {
        ok: false,
        error:
          "Drive folder looks empty or inaccessible with an API key. Share the folder as “Anyone with the link → Viewer” (or use a service account), confirm the full folder URL, and put tokens.json inside it.",
      };
    }

    const tokensFile =
      children.find((f) => f.name.toLowerCase() === "tokens.json") ??
      (
        await driveList(
          key,
          `'${folderId}' in parents and name contains 'tokens' and trashed=false`,
        )
      ).find((f) => f.name.toLowerCase().endsWith(".json"));

    if (!tokensFile) {
      const names = children.map((f) => f.name).slice(0, 8).join(", ");
      return {
        ok: false,
        error: `No tokens.json in that folder. Files seen: ${names || "(none)"}. Add a tokens.json with palette + typography.`,
      };
    }

    const fileUrl = new URL(`https://www.googleapis.com/drive/v3/files/${tokensFile.id}`);
    fileUrl.searchParams.set("alt", "media");
    fileUrl.searchParams.set("key", key);
    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) {
      let detail = "";
      try {
        const errJson = (await fileRes.json()) as DriveList;
        detail = errJson.error?.message || "";
      } catch {
        /* ignore */
      }
      return {
        ok: false,
        error: driveErrorMessage(
          fileRes.status,
          detail || `Found ${tokensFile.name} but could not download it (${fileRes.status}).`,
        ),
      };
    }

    try {
      const tokens = (await fileRes.json()) as Parameters<typeof paletteFromTokensJson>[0] & {
        name?: string;
      };
      return { ok: true, tokens };
    } catch {
      return {
        ok: false,
        error: `${tokensFile.name} is not valid JSON.`,
      };
    }
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

    let tokens: Awaited<ReturnType<typeof loadLocalTokens>> = null;
    let source: "google-drive" | "local-sample" | "none" = "none";
    let driveError: string | null = null;

    if (folderId && driveConfigured()) {
      const driveResult = await loadDriveTokens(folderId);
      if (driveResult.ok) {
        tokens = driveResult.tokens;
        source = "google-drive";
      } else {
        driveError = driveResult.error;
      }
    } else if (folderId && !driveConfigured()) {
      driveError = "Drive API key is not configured on the server.";
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
            driveError ||
            "No tokens.json found. Add tokens.json to the Drive folder and share it as Anyone with the link (Viewer).",
          configured: driveConfigured(),
          folderId,
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
