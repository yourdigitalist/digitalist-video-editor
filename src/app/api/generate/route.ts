import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getIdentity } from "../../../../cursor/identity";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 256_000;
const MAX_PROMPT_CHARS = 100_000;
const ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function safeProjectId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  if (!ID_RE.test(raw)) return null;
  return raw;
}

function clip(value: unknown, max: number): string {
  const text = typeof value === "string" ? value : String(value ?? "");
  return text.slice(0, max);
}

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

function projectsDirFor(id: string): string | null {
  const projectsRoot = path.resolve(process.cwd(), "data", "projects");
  const root = path.resolve(projectsRoot, id);
  const relative = path.relative(projectsRoot, root);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  if (relative.includes(path.sep)) return null;
  return root;
}

export async function POST(request: Request) {
  try {
    const identity = await getIdentity(request);
    const isLocalDev =
      !process.env.CURSOR_APP_ID && !process.env.VERCEL && process.env.NODE_ENV !== "production";

    if (!identity.verified && !isLocalDev) {
      return NextResponse.json(
        { ok: false, error: "unauthorized", reason: identity.reason },
        { status: 401 },
      );
    }

    const rateKey = identity.verified ? `id:${identity.sub}` : "local-dev";
    if (!allowRequest(rateKey)) {
      return NextResponse.json({ ok: false, error: "rate limit exceeded" }, { status: 429 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json({ ok: false, error: "unsupported content type" }, { status: 415 });
    }

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, error: "payload too large" }, { status: 413 });
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, error: "payload too large" }, { status: 413 });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
    }

    const id = safeProjectId(body.id);
    if (!id) {
      return NextResponse.json({ ok: false, error: "invalid project id" }, { status: 400 });
    }

    const root = projectsDirFor(id);
    if (!root) {
      return NextResponse.json({ ok: false, error: "invalid project path" }, { status: 400 });
    }

    const title = clip(body.title ?? "untitled", 200);
    const prompt = clip(body.prompt ?? "", MAX_PROMPT_CHARS);
    const brandName = clip(body.brandName ?? "", 200);
    const motionIds = Array.isArray(body.motionIds)
      ? body.motionIds.filter((m): m is string => typeof m === "string" && ID_RE.test(m)).slice(0, 40)
      : [];

    const storyboard = `# Storyboard — ${title}

Brand: ${brandName}
Generated: ${new Date().toISOString()}

## Motions
${motionIds.map((m) => `- ${m}`).join("\n") || "- (none)"}

## Notes
This package was created by Digitalist Video Editor.
`;

    const readme = `# ${title}

## Render again

1. Open \`prompt.md\`
2. Follow the pipeline in the prompt (storyboard → GSAP timeline → Playwright → ffmpeg)
`;

    const meta = {
      id,
      title,
      brandName,
      motionIds,
      createdAt: new Date().toISOString(),
      owner: identity.verified ? identity.sub : "local-dev",
    };

    // On the published host, skip disk writes (ephemeral FS) and return the package.
    const canWriteDisk = isLocalDev || process.env.DIGITALIST_WRITE_PROJECTS === "1";
    if (canWriteDisk) {
      await mkdir(root, { recursive: true });
      await writeFile(path.join(root, "prompt.md"), prompt, "utf8");
      await writeFile(path.join(root, "storyboard.md"), storyboard, "utf8");
      await writeFile(path.join(root, "README.md"), readme, "utf8");
      await writeFile(path.join(root, "meta.json"), JSON.stringify(meta, null, 2), "utf8");
    }

    return NextResponse.json({
      ok: true,
      projectDir: canWriteDisk ? `data/projects/${id}` : null,
      files: {
        "prompt.md": prompt,
        "storyboard.md": storyboard,
        "README.md": readme,
        "meta.json": meta,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "generate failed" },
      { status: 500 },
    );
  }
}
