import { useMemo } from "react";
import { useSetting } from "../hooks/useSettings";

// Egg #15 — the Zenith mountain range. Every mythic-tier badge ever unlocked
// adds one distant peak. Starts as a lone silhouette; ends as a full range.
// Zero UI clutter — only ever seen on the Settings → About screen.
export function MountainGrows() {
  const peaks = Math.max(1, Number(useSetting("mountainPeaks") ?? 0) + 1);

  // Deterministic layout: each peak gets a fixed slot along X so the range
  // is stable across renders. `peaks` clamps to a comfortable maximum of 10.
  const slots = useMemo(() => {
    const N = Math.min(10, peaks);
    const arr: Array<{ cx: number; h: number; w: number; fill: string }> = [];
    for (let i = 0; i < N; i++) {
      const cx = 30 + (i * 240) / Math.max(1, N - 0.4);
      const rand = seed(i * 137.5); // deterministic
      const h = 55 + rand * 30;                       // 55–85
      const w = 45 + rand * 25;                       // 45–70
      const alpha = 0.35 + (i / N) * 0.55;
      arr.push({
        cx, h, w,
        fill: `rgba(255,39,64,${alpha.toFixed(2)})`,
      });
    }
    // Sort so back peaks paint first.
    return arr.sort((a, b) => a.h - b.h);
  }, [peaks]);

  return (
    <div style={{
      background: "linear-gradient(180deg,#08080a 0%,#1a0509 100%)",
      borderRadius: 12, padding: "14px 12px 0", overflow: "hidden",
      border: "1px solid var(--border)",
    }}>
      <svg viewBox="0 0 300 120" width="100%" height="140" preserveAspectRatio="xMidYMax meet">
        {/* Distant haze */}
        <rect x={0} y={0} width={300} height={120} fill="url(#haze)" />
        <defs>
          <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,39,64,0.04)" />
            <stop offset="100%" stopColor="rgba(255,39,64,0)" />
          </linearGradient>
        </defs>
        {slots.map((s, i) => (
          <polygon
            key={i}
            points={`${s.cx - s.w / 2},110 ${s.cx},${110 - s.h} ${s.cx + s.w / 2},110`}
            fill={s.fill}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={0.6}
          />
        ))}
        {/* Ground */}
        <rect x={0} y={110} width={300} height={10} fill="#08080a" />
      </svg>
      <div style={{
        color: "var(--ink-soft)", fontSize: 11, textAlign: "center",
        padding: "4px 0 10px", fontStyle: "italic", letterSpacing: 0.3,
      }}>
        Mythic peaks earned: {Math.max(0, peaks - 1)} · own the peak
      </div>
    </div>
  );
}

function seed(n: number): number {
  // Simple deterministic pseudo-random in [0, 1).
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
