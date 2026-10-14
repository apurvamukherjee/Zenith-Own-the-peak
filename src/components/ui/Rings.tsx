import { useId, type ReactNode } from "react";
import { motion } from "framer-motion";

export interface RingSpec {
  key: string;
  pct: number;
  /** Any CSS color (CSS vars included) or a two-stop gradient. Applied via
   *  `style`, where vars resolve inside SVG — unlike presentation attributes. */
  color: string | [string, string];
}

interface Props {
  rings: RingSpec[];
  size?: number;
  stroke?: number;
  gap?: number;
  reduced?: boolean;
  /** Seconds before the first ring starts drawing. */
  delay?: number;
  children?: ReactNode;
}

const solid = (c: RingSpec["color"]) => (Array.isArray(c) ? c[0] : c);

// Apple-style concentric rings: one per input, so a composite score never
// hides what it's made of. Also used single-ring as a generic progress dial.
export function Rings({ rings, size = 152, stroke = 10, gap = 3.5, reduced, delay = 0.15, children }: Props) {
  const uid = useId().replace(/:/g, "");
  const c = size / 2;
  return (
    <div className="z-rings" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden style={{ overflow: "visible", display: "block" }}>
        <defs>
          {rings.map((ring) => Array.isArray(ring.color) && (
            <linearGradient key={ring.key} id={`${uid}-${ring.key}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" style={{ stopColor: ring.color[0] }} />
              <stop offset="100%" style={{ stopColor: ring.color[1] }} />
            </linearGradient>
          ))}
        </defs>
        <g transform={`rotate(-90 ${c} ${c})`}>
          {rings.map((ring, i) => {
            const r = c - stroke / 2 - i * (stroke + gap);
            const p = Math.max(0, Math.min(100, ring.pct)) / 100;
            const done = p >= 1;
            const base = solid(ring.color);
            const t = delay + i * 0.12;
            return (
              <g key={ring.key}>
                <circle cx={c} cy={c} r={r} fill="none" strokeWidth={stroke}
                  style={{ stroke: `color-mix(in srgb, ${base} 11%, transparent)` }} />
                <motion.circle
                  cx={c} cy={c} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
                  className={done ? "z-ring-done" : undefined}
                  style={{
                    stroke: Array.isArray(ring.color) ? `url(#${uid}-${ring.key})` : ring.color,
                    filter: `drop-shadow(0 0 ${done ? 7 : 4}px color-mix(in srgb, ${base} 70%, transparent))`,
                  }}
                  initial={reduced ? false : { pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: p, opacity: p > 0 ? 1 : 0 }}
                  transition={reduced
                    ? { duration: 0 }
                    : { pathLength: { type: "spring", stiffness: 42, damping: 14, delay: t }, opacity: { duration: 0.2, delay: t } }}
                />
              </g>
            );
          })}
        </g>
      </svg>
      {children && <div className="z-rings__center">{children}</div>}
    </div>
  );
}
