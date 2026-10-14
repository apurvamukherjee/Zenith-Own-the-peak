import type { CSSProperties } from "react";

// Animated liquid fill: two counter-scrolling sine waves riding the surface,
// bubbles rising inside. Parent must be `position: relative; overflow: hidden`
// and an isolation root (the kit's .z-hero / .z-tile already are).
export function Liquid({ pct, color = "var(--info)", reduced, min = 6 }: { pct: number; color?: string; reduced?: boolean; min?: number }) {
  return (
    <div className="z-liquid" style={{ height: `${Math.max(Math.min(pct, 100), min)}%`, "--liq": color } as CSSProperties} aria-hidden>
      <svg className={`z-wave z-wave--back${reduced ? " is-still" : ""}`} viewBox="0 0 200 20" preserveAspectRatio="none">
        <path d="M0 10 Q 25 2 50 10 T 100 10 T 150 10 T 200 10 V 20 H 0 Z" />
      </svg>
      <svg className={`z-wave z-wave--front${reduced ? " is-still" : ""}`} viewBox="0 0 200 20" preserveAspectRatio="none">
        <path d="M0 10 Q 25 18 50 10 T 100 10 T 150 10 T 200 10 V 20 H 0 Z" />
      </svg>
      {!reduced && <div className="z-bubbles"><i /><i /><i /><i /></div>}
    </div>
  );
}
