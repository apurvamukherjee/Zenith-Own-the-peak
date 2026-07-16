import type { ReactNode } from "react";

// Cold vector glyph language for the Hall of Frame. All 24x24, stroke-based,
// angular, drawn with `currentColor` so each glyph inherits its tier color.
// Families are shared across a group; milestone/mythic badges get unique marks.
export type GlyphName =
  | "spark" | "flame" | "fang" | "cracked-crown" | "peak" | "chain" | "monolith"
  | "bar" | "stack" | "plate" | "anvil" | "ceiling" | "gauntlet"
  | "crosshair" | "diamond" | "prism" | "rune"
  | "droplet" | "wave" | "glacier"
  | "crescent" | "moon-full" | "eclipse"
  | "tome" | "obelisk"
  | "gauge" | "road" | "pump"
  | "blade-fork" | "chalice" | "capsule"
  | "scale" | "ruler" | "effigy"
  | "void";

const P: Record<GlyphName, ReactNode> = {
  // ---- streak ----
  spark: <><path d="M13 2 4 14h6l-1 8 9-12h-6z" /></>,
  flame: <><path d="M12 2c3 4 5 6 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .5 2 1 2 1 2 0-3 1-5 2-8Z" /></>,
  fang: <><path d="M5 3l4 10-4 8M19 3l-4 10 4 8M9 13h6" /></>,
  "cracked-crown": <><path d="M3 8l4 4 5-7 5 7 4-4v9H3z" /><path d="M12 12v5" /></>,
  peak: <><path d="M2 20 9 6l4 6 3-4 6 12z" /><path d="M9 6l2 3-2 2" /></>,
  chain: <><rect x="3" y="8" width="8" height="8" rx="1" /><rect x="13" y="8" width="8" height="8" rx="1" /><path d="M11 12h2" /></>,
  monolith: <><path d="M8 2h8l1 20H7z" /><path d="M8 8h8M8 15h8" /></>,
  // ---- iron ----
  bar: <><path d="M2 10v4M5 7v10M19 7v10M22 10v4M5 12h14" /></>,
  stack: <><path d="M4 8l8-4 8 4-8 4z" /><path d="M4 12l8 4 8-4M4 16l8 4 8-4" /></>,
  plate: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M10 4v16M14 4v16" /></>,
  anvil: <><path d="M3 7h14l-2 4h5l-3 4H8l-2-4H3z" /><path d="M10 15v4h6" /></>,
  ceiling: <><path d="M3 4h18" /><path d="M12 8l-5 6h10z" /><path d="M12 14v6" /></>,
  gauntlet: <><path d="M6 3h8v6l4 2v7l-3 3H8l-2-4V3z" /><path d="M14 9H6" /></>,
  // ---- discipline ----
  crosshair: <><path d="M12 2v6M12 16v6M2 12h6M16 12h6" /><path d="M12 8l4 4-4 4-4-4z" /></>,
  diamond: <><path d="M12 2 4 9l8 13 8-13z" /><path d="M4 9h16M12 2v20" /></>,
  prism: <><path d="M12 2 3 20h18z" /><path d="M12 2v18M3 20l9-6 9 6" /></>,
  rune: <><path d="M6 3h12v18H6z" /><path d="M9 6l6 6-6 6M15 6l-6 6 6 6" /></>,
  // ---- water ----
  droplet: <><path d="M12 2 5 12a7 7 0 0 0 14 0z" /></>,
  wave: <><path d="M2 9c3-3 5-3 8 0s5 3 8 0M2 14c3-3 5-3 8 0s5 3 8 0M2 19c3-3 5-3 8 0s5 3 8 0" /></>,
  glacier: <><path d="M3 20 8 6l4 5 3-6 6 15z" /><path d="M8 6l1 4M15 5l1 5" /></>,
  // ---- sleep ----
  crescent: <><path d="M17 3a9 9 0 1 0 4 12A7 7 0 0 1 17 3Z" /></>,
  "moon-full": <><path d="M12 2 3 12l9 10 9-10z" /><circle cx="12" cy="12" r="3" /></>,
  eclipse: <><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 0 0 18z" /></>,
  // ---- mind ----
  tome: <><path d="M5 4h9a4 4 0 0 1 4 4v12H9a4 4 0 0 0-4 4z" /><path d="M18 8H9a4 4 0 0 0-4 4" /></>,
  obelisk: <><path d="M9 2h6l1 16H8z" /><path d="M6 18h12v3H6z" /><path d="M12 2v16" /></>,
  // ---- road ----
  gauge: <><path d="M3 18a9 9 0 0 1 18 0" /><path d="M12 18l5-6" /><path d="M3 18h2M19 18h2" /></>,
  road: <><path d="M8 22 10 2h4l2 20z" /><path d="M12 6v3M12 12v3M12 18v2" /></>,
  pump: <><path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16z" /><path d="M5 10h10M15 8l4 3v6a2 2 0 0 1-4 0" /></>,
  // ---- table ----
  "blade-fork": <><path d="M6 2v7a2 2 0 0 0 4 0V2M8 9v13" /><path d="M16 2c-2 2-2 6 0 8v12" /></>,
  chalice: <><path d="M6 3h12l-2 7a4 4 0 0 1-8 0z" /><path d="M12 17v4M8 21h8" /></>,
  capsule: <><rect x="3" y="7" width="18" height="10" rx="5" transform="rotate(-20 12 12)" /><path d="M8.5 9.5 15 15" /></>,
  // ---- body ----
  scale: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M8 15a4 4 0 0 1 8 0" /><path d="M12 15v-3" /></>,
  ruler: <><rect x="3" y="7" width="18" height="10" rx="1" /><path d="M7 7v4M11 7v6M15 7v4M19 7v6" /></>,
  effigy: <><rect x="4" y="3" width="16" height="18" rx="2" /><circle cx="12" cy="9" r="2.5" /><path d="M7 19a5 5 0 0 1 10 0" /></>,
  // ---- mystery (obscured) ----
  void: <><path d="M12 2 3 8v8l9 6 9-6V8z" /><path d="M12 8v4M12 15.5v.5" /></>,
};

export function ColdIcon({ glyph, size = 24 }: { glyph: GlyphName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden focusable="false">
      {P[glyph]}
    </svg>
  );
}
