"use client";

import type { MotionDemoKind } from "@/lib/types";

export function MotionPreview({
  demo,
  accent = "#FF7551",
  support = "#8B7CF6",
  active,
}: {
  demo: MotionDemoKind;
  accent?: string;
  support?: string;
  active?: boolean;
}) {
  return (
    <div
      className={`motion-preview ${active ? "is-active" : ""}`}
      style={{ ["--mp-accent" as string]: accent, ["--mp-support" as string]: support }}
      data-demo={demo}
      aria-hidden
    >
      <div className="motion-preview__stage">
        {demo === "orbit" && (
          <>
            <span className="mp-orbit mp-orbit--a" />
            <span className="mp-orbit mp-orbit--b" />
            <span className="mp-core" />
          </>
        )}
        {demo === "pop" && (
          <>
            <span className="mp-dot mp-pop" style={{ animationDelay: "0ms" }} />
            <span className="mp-dot mp-pop" style={{ animationDelay: "80ms" }} />
            <span className="mp-dot mp-pop" style={{ animationDelay: "160ms" }} />
          </>
        )}
        {demo === "stroke" && <span className="mp-stroke" />}
        {demo === "morph" && <span className="mp-morph" />}
        {demo === "cursor" && (
          <>
            <span className="mp-target" />
            <span className="mp-cursor" />
          </>
        )}
        {demo === "stack" && (
          <>
            <span className="mp-toast" style={{ top: "28%" }} />
            <span className="mp-toast" style={{ top: "48%" }} />
            <span className="mp-toast" style={{ top: "68%" }} />
          </>
        )}
        {demo === "cards" && (
          <>
            <span className="mp-card" style={{ transform: "rotate(-8deg)" }} />
            <span className="mp-card mp-card--top" />
          </>
        )}
        {demo === "browser" && (
          <span className="mp-browser">
            <i />
            <i />
            <i />
            <span className="mp-scroll" />
          </span>
        )}
        {demo === "logo" && <span className="mp-logo" />}
        {demo === "sticker" && <span className="mp-sticker">NEW</span>}
        {demo === "lower-third" && <span className="mp-lower" />}
        {demo === "cta" && <span className="mp-cta">CTA</span>}
        {demo === "kinetic" && <span className="mp-words">MOVE</span>}
        {demo === "mask" && <span className="mp-mask"><span>LINE</span></span>}
        {demo === "typewriter" && <span className="mp-type">Type_</span>}
        {demo === "cascade" && (
          <span className="mp-cascade">
            {"ABC".split("").map((ch) => (
              <i key={ch}>{ch}</i>
            ))}
          </span>
        )}
        {demo === "highlighter" && (
          <span className="mp-hi">
            <em />
            key
          </span>
        )}
        {demo === "counter" && <span className="mp-counter">42</span>}
        {demo === "bars" && (
          <span className="mp-bars">
            <i style={{ height: "40%" }} />
            <i style={{ height: "70%" }} />
            <i style={{ height: "55%" }} />
          </span>
        )}
        {demo === "timeline" && <span className="mp-timeline" />}
        {demo === "ranking" && (
          <span className="mp-rank">
            <i />
            <i />
            <i />
          </span>
        )}
        {demo === "blob" && <span className="mp-blob" />}
        {demo === "particles" && (
          <>
            <span className="mp-spark" />
            <span className="mp-spark" style={{ animationDelay: "120ms" }} />
            <span className="mp-spark" style={{ animationDelay: "240ms" }} />
          </>
        )}
        {demo === "gradient" && <span className="mp-grad" />}
        {demo === "camera" && <span className="mp-cam" />}
        {demo === "blur" && <span className="mp-blur" />}
      </div>
    </div>
  );
}
