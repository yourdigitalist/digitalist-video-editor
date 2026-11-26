import type { MotionItem } from "@/lib/types";

export const MOTION_CATEGORIES = [
  "Kinetic type",
  "Shapes & icons",
  "Data & infographics",
  "Interface & product",
  "Brand & structure",
  "Look & finish",
] as const;

export const MOTION_GALLERY: MotionItem[] = [
  {
    id: "orbit-loop",
    title: "Orbit loop",
    category: "Shapes & icons",
    description: "Icons and logos travel elliptical orbits around a center.",
    demo: "orbit",
    promptBlock:
      "Orbit loop: elements (icons, partner marks, dots) travel concentric elliptical orbits around a center, different speeds per orbit, faux depth via scale/opacity at the back. Total period is a multiple of the piece duration so the loop closes.",
  },
  {
    id: "icons-pop",
    title: "Icon pop",
    category: "Shapes & icons",
    description: "Icon grid enters with elastic scale on a diagonal stagger.",
    demo: "pop",
    promptBlock:
      "Icon pop: a grid of icons enters item-by-item with scale 0 → 115% → 100% (easeOutBack, 400ms), 70ms diagonal stagger. Each sits on a rounded accent fill at 15% with a stroked icon on top.",
  },
  {
    id: "drawn-stroke",
    title: "Drawn stroke",
    category: "Shapes & icons",
    description: "Lines draw via stroke-dashoffset; fills fade in after.",
    demo: "stroke",
    promptBlock:
      "Drawn stroke: line icons/illustrations draw with stroke-dashoffset total→0 over 900ms easeInOutCubic; fill fades in over 200ms after the stroke completes. Constant stroke weight, rounded joins.",
  },
  {
    id: "shape-morph",
    title: "Shape morph",
    category: "Shapes & icons",
    description: "Circle → rounded square → final icon by vertex morph.",
    demo: "morph",
    promptBlock:
      "Shape morph: one shape morphs into another (circle → rounded square → final icon) by interpolating equal vertex counts. Each morph 600ms easeInOutCubic with 300ms hold and a 90° twist mid-transition.",
  },
  {
    id: "cursor-clicks",
    title: "Cursor & clicks",
    category: "Interface & product",
    description: "Vector cursor follows Bézier paths and clicks with ripples.",
    demo: "cursor",
    promptBlock:
      "Cursor & clicks: a drawn cursor moves between UI targets on Bézier curves (500–700ms, easeInOutCubic). On click: cursor scales to 85%, 300ms ripple, button state hover → pressed → success.",
  },
  {
    id: "notif-stack",
    title: "Notification stack",
    category: "Interface & product",
    description: "Toasts stack from the top with depth.",
    demo: "stack",
    promptBlock:
      "Notification stack: toasts enter from the top every 450ms (easeOutBack); older ones sink, shrink (95%/90%), and darken. Max 4 visible. Short copy, circular icon, timestamp.",
  },
  {
    id: "sliding-cards",
    title: "Sliding cards",
    category: "Interface & product",
    description: "Card stack; top slides away and the next rises.",
    demo: "cards",
    promptBlock:
      "Sliding cards: stack of 3–5 slightly rotated cards; every 800ms the top card exits sideways with rotation (easeInBack) and the next rises and straightens (easeOutBack).",
  },
  {
    id: "browser-scroll",
    title: "Browser scroll",
    category: "Interface & product",
    description: "Generic browser chrome with smooth page scroll.",
    demo: "browser",
    promptBlock:
      "Browser scroll: generic browser chrome (three dots + address field, no brand marks), page scrolling in soft 600ms steps with a border highlight on the cited section.",
  },
  {
    id: "logo-reveal",
    title: "Logo reveal",
    category: "Brand & structure",
    description: "Shapes converge, collapse, and the logo blooms.",
    demo: "logo",
    promptBlock:
      "Logo reveal: simple palette shapes converge (700ms), collapse to a point, logo blooms 70%→100% (easeOutExpo) with a left-to-right sheen; brand name follows 200ms later via mask reveal. Use the supplied logo file — do not redraw it.",
  },
  {
    id: "stickers",
    title: "Stickers & seals",
    category: "Brand & structure",
    description: "Thick-border stickers pop in with elastic scale.",
    demo: "sticker",
    promptBlock:
      "Stickers & seals: labels with thick white borders, hard offset shadows, and slight rotation enter with elastic scale and idle ±3° wobble. Use for offers, news, and numbers.",
  },
  {
    id: "lower-third",
    title: "Lower third",
    category: "Brand & structure",
    description: "Bottom bar with name/CTA via mask reveal.",
    demo: "lower-third",
    promptBlock:
      "Lower third: bottom bar enters from the left with a mask, support type and mark on the right; exits reversed after reading time.",
  },
  {
    id: "end-cta",
    title: "End CTA",
    category: "Brand & structure",
    description: "Close on logo, line, and action button.",
    demo: "cta",
    promptBlock:
      "End CTA: solid palette background, centered logo, short line, button with hover/press; hold 1.2s at the end.",
  },
  {
    id: "kinetic-type",
    title: "Kinetic type",
    category: "Kinetic type",
    description: "Headline words enter with varied moves.",
    demo: "kinetic",
    promptBlock:
      "Kinetic type: headline enters word-by-word with varied entrances (scale 0→110%→100%, −8°→0°, 40px slide). Key word 1.5× larger in accent. Centered, ~70% width.",
  },
  {
    id: "mask-reveal",
    title: "Mask reveal",
    category: "Kinetic type",
    description: "Lines rise out of rectangular masks.",
    demo: "mask",
    promptBlock:
      "Mask reveal: each line rises 100% of its height from an overflow-hidden mask, 80ms stagger, easeOutExpo, 600ms per line. Exit is the reverse upward.",
  },
  {
    id: "typewriter",
    title: "Typewriter",
    category: "Kinetic type",
    description: "Character-by-character with a blinking caret.",
    demo: "typewriter",
    promptBlock:
      "Typewriter: text appears character-by-character at 18–24 cps with a block caret blinking every 500ms. Monospace. 300ms pauses on commas. Caret blinks twice then hides.",
  },
  {
    id: "cascade-letters",
    title: "Letter cascade",
    category: "Kinetic type",
    description: "Each letter slides, rotates, and fades in.",
    demo: "cascade",
    promptBlock:
      "Letter cascade: split the title into letters; each enters with −60px Y, 20°→0°, opacity 0→1, 30ms stagger, easeOutBack, 500ms. Keep final kerning intact.",
  },
  {
    id: "highlighter",
    title: "Highlighter",
    category: "Kinetic type",
    description: "Accent bar draws behind the key word.",
    demo: "highlighter",
    promptBlock:
      "Highlighter: after the line appears, an accent rectangle draws L→R behind the key word (scaleX 0→1, left origin, 400ms, easeInOutQuart) with −2° tilt. Covered word flips to dark.",
  },
  {
    id: "counter",
    title: "Counter",
    category: "Data & infographics",
    description: "Number counts up with support unit.",
    demo: "counter",
    promptBlock:
      "Counter: number animates 0→target in 1.2s easeOutExpo; unit and label fade in 200ms later.",
  },
  {
    id: "bar-chart",
    title: "Bar chart",
    category: "Data & infographics",
    description: "Bars grow with staggered labels.",
    demo: "bars",
    promptBlock:
      "Bar chart: bars grow from the baseline with 80ms stagger, easeOutExpo; labels/values appear once bars reach ~80% height.",
  },
  {
    id: "timeline",
    title: "Timeline",
    category: "Data & infographics",
    description: "Horizontal axis with milestones popping in.",
    demo: "timeline",
    promptBlock:
      "Timeline: axis draws L→R; milestones pop with short labels; focus one at a time.",
  },
  {
    id: "ranking",
    title: "Ranking",
    category: "Data & infographics",
    description: "Ordered list with proportion bars.",
    demo: "ranking",
    promptBlock:
      "Ranking: rows enter from below with stagger; rank highlighted; proportion bars fill to the right.",
  },
  {
    id: "liquid-blob",
    title: "Liquid blob",
    category: "Look & finish",
    description: "Organic noisy shape looping over 4s.",
    demo: "blob",
    promptBlock:
      "Liquid blob: organic shape from seeded noise (base radius + Perlin/Simplex, 6–8 harmonics), deforming on a 4s loop back to the start. Palette gradient fill.",
  },
  {
    id: "particle-burst",
    title: "Particle burst",
    category: "Look & finish",
    description: "Particles explode from a reveal center.",
    demo: "particles",
    promptBlock:
      "Particle burst: 60–120 seeded particles explode from the element center with high initial velocity, exponential drag, light gravity, scale/opacity→0 in 900ms. Palette colors. Fire on the reveal beat.",
  },
  {
    id: "living-gradient",
    title: "Living gradient",
    category: "Look & finish",
    description: "Palette gradient drifts slowly.",
    demo: "gradient",
    promptBlock:
      "Living gradient: palette gradient drifts and rotates slowly (cycle ≥ piece length) without competing with the focus.",
  },
  {
    id: "living-camera",
    title: "Living camera",
    category: "Look & finish",
    description: "Slow push-in and lateral drift per scene.",
    demo: "camera",
    promptBlock:
      "Living camera: each scene gets a slow push-in (100%→106%) with light lateral drift so nothing feels frozen. Linear or easeInOutSine — never showy.",
  },
  {
    id: "motion-blur",
    title: "Motion blur",
    category: "Look & finish",
    description: "8-subframe average (180° shutter) on fast moves.",
    demo: "blur",
    promptBlock:
      "Motion blur: for each final frame, average 8 subframes across 50% of the frame interval (180° shutter). Limit to fast elements if render cost is high.",
  },
];

export function getMotionById(id: string) {
  return MOTION_GALLERY.find((m) => m.id === id);
}
