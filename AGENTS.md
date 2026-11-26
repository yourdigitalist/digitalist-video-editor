# Digitalist Video Editor — for AI agents

Multi-brand motion dashboard. Default render stack in generated prompts: **HTML/SVG + GSAP** (paused timeline) → Playwright frames → FFmpeg MP4.

## Key paths

- App UI: `src/app/`, `src/components/`
- Prompt builder: `src/lib/prompt-builder.ts`
- Motion repertoire: `src/data/motion-gallery.ts`
- Saved packages: `data/projects/<id>/`
- Sample brand pack: `examples/brands/fungal-dreams/`
- Skills: `.agents/skills/` (see `SKILLS.md`)
- Reference clones: `references/` (local symlink; see `REFERENCES.md`)

## Rules

- Prefer the dashboard prompt + `digitalist-motion-prompt` skill over inventing a new pipeline.
- Respect brand tokens (palette order: background, text, accent, support).
- Do not commit rendered `frames/` or large MP4s.
