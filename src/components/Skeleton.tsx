import type { CSSProperties } from "react";

// Lightweight shimmer skeleton — no antd Skeleton dep, so it inherits our
// exact border-radius + border-color tokens. Two shapes cover 95% of the
// use cases: rectangular rows and pill chips.
interface Props {
  height?: number | string;
  width?: number | string;
  radius?: number;
  style?: CSSProperties;
}
export function Skeleton({ height = 16, width = "100%", radius = 6, style }: Props) {
  return (
    <div
      aria-hidden
      style={{
        height, width, borderRadius: radius,
        // UI #2 — red-tinted shimmer instead of the old grey. Even loading
        // states now feel gothic. `var(--ember-inner)` sits between the
        // two surface tones so the wave still reads on both light + dark.
        background: "linear-gradient(90deg, var(--surface) 0%, var(--ember-inner) 50%, var(--surface) 100%)",
        backgroundSize: "200% 100%",
        animation: "zenith-shimmer 1.6s linear infinite",
        ...style,
      }}
    />
  );
}

/** Convenience: stack of N skeleton rows for list placeholders. */
export function SkeletonList({ rows = 3, rowHeight = 44, gap = 8 }: {
  rows?: number; rowHeight?: number; gap?: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={rowHeight} radius={10} />
      ))}
    </div>
  );
}
