---
name: digitalist-motion-prompt
description: Build and execute Digitalist programmatic motion videos from the dashboard prompt (HTML/SVG/CSS + paused GSAP timeline, Playwright frames, FFmpeg MP4), using brand design systems and selected motion repertoire. Use when generating or revising Digitalist Video Editor projects, brand motion pieces, or GSAP deterministic renders.
---

# Digitalist motion prompt

## When to use

A user clicked **Generate video** in Digitalist Video Editor, or asked to revise a saved project under `data/projects/<id>/`.

## Inputs

1. Read `data/projects/<id>/prompt.md` (or the live prompt from the dashboard).
2. Read the brand pack under `examples/brands/<slug>/` or the path noted on the brand.
3. Pull logos/photos from the Google Drive URL only when the user provided access; otherwise use local sample assets.

## Workflow

Follow the prompt sections in order:

1. `<como_aplicar>` → write/update `storyboard.md`
2. Implement `index.html` with `gsap.timeline({ paused: true })`, `window.ready`, `window.seek(t)`
3. `render.mjs` via Playwright, then FFmpeg as in `<pipeline_de_render>`
4. Verify with contact sheet + ffprobe per `<verificacao>`
5. Deliver listed files; delete `frames/` after validation

## Rules

- Deterministic frames only (no wall-clock time during capture).
- One accent focus at a time; respect brand palette order.
- Prefer selected repertoire blocks; do not invent off-list effects unless asked.
- After first cut, treat Chat + Feedback timestamps as the edit brief and regenerate.

## Related skills

Remotion and HyperFrames skills are installed for alternate engines; default stack for this app is **HTML/SVG + GSAP**.
