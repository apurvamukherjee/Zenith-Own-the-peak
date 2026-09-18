import { motion } from "framer-motion";

// Shared countdown ring for the two rest-timer surfaces (in-card RestTimer and
// the floating GlobalRestChip). Sized by `size`; the geometry derives from it,
// so the two callers stay pixel-identical to their hand-rolled originals.
export function RestRing({ size, pct, color, children }: {
  size: number; pct: number; color: string; children: React.ReactNode;
}) {
  const c = size / 2;
  const r = c - 3;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--border)" strokeWidth="3" />
        <motion.circle
          cx={c} cy={c} r={r} fill="none" stroke={color}
          strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.35, ease: "linear" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </>
  );
}
