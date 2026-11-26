import { getMotionById } from "@/data/motion-gallery";
import { colorByRole } from "@/lib/palette";
import type { Brand, VideoConfig } from "@/lib/types";

const EASING_COPY: Record<VideoConfig["easing"], string> = {
  mechanical:
    "mechanical — easeOutQuad on entrances and easeInQuad on exits; short, precise moves",
  expressive:
    "expressive — easeOutExpo on entrances and easeInExpo on exits; fast settles",
  elastic:
    "elastic — easeOutBack on entrances and easeInBack on exits; controlled overshoot",
};

const INTENSITY_COPY: Record<VideoConfig["intensity"], string> = {
  subtle: "subtle — 16–32px travel, 92–104% scale, 200–400ms entrances",
  moderate: "moderate — 40–80px travel, 80–110% scale, 300–600ms entrances",
  intense: "intense — 80–140px travel, 70–120% scale, 450–800ms entrances",
};

const STYLE_COPY: Record<VideoConfig["visualStyle"], string> = {
  "flat-minimal": "flat minimal",
  geometric: "geometric",
  editorial: "editorial",
  "tech-ui": "tech / UI",
  organic: "organic",
  "bold-pop": "bold pop",
  luxury: "luxury",
  playful: "playful",
  documentary: "documentary",
};

const ASPECT_SIZE: Record<VideoConfig["aspectRatio"], string> = {
  "9:16": "1080×1920 (9:16)",
  "4:5": "1080×1350 (4:5)",
  "1:1": "1080×1080 (1:1)",
  "16:9": "1920×1080 (16:9)",
  "21:9": "2560×1080 (21:9)",
};

export function buildMotionPrompt(opts: {
  brand: Brand;
  config: VideoConfig;
  motionIds: string[];
  revisions?: string[];
}): string {
  const { brand, config, motionIds, revisions } = opts;
  const frames = Math.round(config.durationSec * config.fps);
  const motions = motionIds
    .map((id) => getMotionById(id))
    .filter(Boolean)
    .map((m) => `- ${m!.promptBlock}`)
    .join("\n");

  const extras: string[] = [];
  if (config.deliverables.contactSheet) extras.push("Contact sheet");
  if (config.deliverables.previewGif) extras.push("Preview GIF");
  if (config.deliverables.commentedSource) extras.push("Commented source");
  if (config.deliverables.version169) extras.push("16:9 version");
  if (config.deliverables.version11) extras.push("1:1 version");

  const driveLine = config.driveAssetsUrl.trim()
    ? `\n- Assets (Google Drive): ${config.driveAssetsUrl.trim()}`
    : brand.driveUrl
      ? `\n- Assets (brand Google Drive): ${brand.driveUrl}`
      : "";

  const paletteLine = config.palette
    .map((c) => `${c.role} ${c.hex}`)
    .join(", ");

  const revisionBlock =
    revisions && revisions.length
      ? `\n\n<revisions>\n${revisions.map((r, i) => `${i + 1}. ${r}`).join("\n")}\n</revisions>`
      : "";

  return `# Programmatic motion graphics prompt

<role>
You are a motion designer who works in code. Build this piece programmatically with HTML/SVG/CSS and a paused GSAP timeline, guided by the brief and brand. Render each frame deterministically, capture frames, and assemble an MP4. Work in stages and verify by looking at frames.
</role>

<material>
- Brand: ${brand.name}
- Brand typography: ${config.typography || brand.typography}${driveLine}
- Default render stack (unless the brief says otherwise): HTML/SVG + GSAP → Playwright frames → FFmpeg MP4
</material>

<briefing>
${config.briefing.trim() || "[Paste the creative brief — goal, copy, format, duration, and delivery notes.]"}
${config.extraNotes.trim() ? `Extra notes: ${config.extraNotes.trim()}` : ""}
</briefing>
${revisionBlock}

<specs>
- Prefer format / duration / fps from the briefing when stated. Fallback: ${ASPECT_SIZE[config.aspectRatio]}, ~${config.durationSec}s at ${config.fps} fps (~${frames} frames).
- Background: ${config.background === "solid" ? "solid brand background" : config.background === "gradient" ? "palette gradient" : "transparent (ProRes/WebM if needed)"}.
- Encode quality: ${config.quality}.
- Output: motion.mp4 H.264, yuv420p, CRF ${config.quality === "high" ? 15 : config.quality === "standard" ? 18 : 23}, preset slow, +faststart.
- Safe margins: no text within 6% of edges; for 9:16 leave ~20% clear at the bottom for platform UI.
</specs>

<visual_direction>
- Palette (hex, use only these — up to 8): ${paletteLine || `${colorByRole(config.palette, "background")} / ${colorByRole(config.palette, "text")} / ${colorByRole(config.palette, "accent")} / ${colorByRole(config.palette, "support")}`}. Accent color for one focus at a time.
- Typography: ${config.typography || brand.typography}. Load fonts locally before frame 0.
- Style: ${STYLE_COPY[config.visualStyle]}.
- Default easing: ${EASING_COPY[config.easing]}. Repertoire blocks with their own easing win.
- Intensity: ${INTENSITY_COPY[config.intensity]}.
- Default stagger inside a group: ${config.staggerMs} ms.
- Hierarchy: one focus at a time. Exit previous focus before the next enters.
</visual_direction>

<animation_repertoire>
Selected motions for this piece. The brief decides where, in what order, and how often each appears:
${motions || "- (none selected — pick from the full repertoire what serves each beat)"}
</animation_repertoire>

<how_to_apply>
1. Read the brief and split into idea blocks (one idea per scene).
2. Estimate each block by reading time (~2.5 words/sec + 0.5s breath), summing to total duration.
3. For each block, pick the repertoire motion that best carries the idea. Vary consecutive blocks.
4. Write storyboard.md: block, start/end (sec + frames), on-screen text, motion, why. Show the storyboard before animating.
5. Only then implement. If a motion fails in practice, swap and record the change.
</how_to_apply>

<render_pipeline>
1. Create index.html with the stage at the exact resolution and one gsap.timeline({ paused: true }) driven by the storyboard. Nothing animates outside that timeline.
2. Expose on window: ready (Promise after document.fonts.ready + images) and seek(t) → tl.seek(t, false).
3. Create render.mjs with Playwright Chromium: matching viewport, deviceScaleFactor 1; await ready; for frame i in 0…N−1 call seek(i / fps) and save frames/%05d.png.
4. Encode: ffmpeg -y -framerate ${config.fps} -i frames/%05d.png -c:v libx264 -pix_fmt yuv420p -crf ${config.quality === "high" ? 15 : config.quality === "standard" ? 18 : 23} -preset slow -movflags +faststart motion.mp4
</render_pipeline>

<determinism>
- Frame is a pure function of time. No requestAnimationFrame, setTimeout, Date.now(), or realtime media during capture.
- Randomness only via a seeded PRNG advanced by frame index.
- Local assets loaded before frame 0.
- Confirm PNG count before encode.
</determinism>

<delivery>
- motion.mp4
- storyboard.md
- Source + short README with the re-render command
${extras.length ? `- Also: ${extras.join(", ")}.` : ""}
- Delete frames/ after validation unless asked to keep it.
</delivery>
`;
}
