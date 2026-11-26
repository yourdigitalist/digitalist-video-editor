import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 512_000;
const ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

function safeProjectId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  if (!ID_RE.test(raw)) return null;
  if (raw.includes("..") || raw.includes("/") || raw.includes("\\")) return null;
  return raw;
}

function clip(value: unknown, max: number): string {
  const text = typeof value === "string" ? value : String(value ?? "");
  return text.slice(0, max);
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > MAX_BODY_BYTES) {
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

    const title = clip(body.title ?? "untitled", 200);
    const prompt = clip(body.prompt ?? "", 200_000);
    const brandName = clip(body.brandName ?? "", 200);
    const motionIds = Array.isArray(body.motionIds)
      ? body.motionIds.filter((m): m is string => typeof m === "string").slice(0, 50)
      : [];

    const projectsRoot = path.resolve(process.cwd(), "data", "projects");
    const root = path.resolve(projectsRoot, id);
    if (!root.startsWith(projectsRoot + path.sep)) {
      return NextResponse.json({ ok: false, error: "invalid project path" }, { status: 400 });
    }

    await mkdir(root, { recursive: true });

    const storyboard = `# Storyboard — ${title}

Brand: ${brandName}
Generated: ${new Date().toISOString()}

## Motions
${motionIds.map((m) => `- ${m}`).join("\n") || "- (none)"}

## Notes
This package was created by Digitalist Video Editor.
A Cursor agent should expand this into timed blocks, then implement HTML/SVG + GSAP and render via Playwright + FFmpeg.
`;

    const readme = `# ${title}

## Render again

1. Open \`prompt.md\`
2. Ask Cursor to follow the pipeline (storyboard → index.html GSAP timeline → render.mjs → ffmpeg)
3. Deliverables requested are listed in the prompt \`<entrega>\` section.

Brand Drive / assets should be pulled before frame 0.
`;

    await writeFile(path.join(root, "prompt.md"), prompt, "utf8");
    await writeFile(path.join(root, "storyboard.md"), storyboard, "utf8");
    await writeFile(path.join(root, "README.md"), readme, "utf8");
    await writeFile(
      path.join(root, "meta.json"),
      JSON.stringify(
        {
          id,
          title,
          brandName,
          config: body.config ?? null,
          motionIds,
          createdAt: new Date().toISOString(),
        },
        null,
        2,
      ),
      "utf8",
    );

    return NextResponse.json({
      ok: true,
      projectDir: `data/projects/${id}`,
      files: ["prompt.md", "storyboard.md", "README.md", "meta.json"],
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "generate failed" },
      { status: 500 },
    );
  }
}
