import { motion } from "framer-motion";
import { TbBarbell } from "react-icons/tb";

const MAX_SEGMENTS = 30;

export function TrainingHeroBg() {
  return (
    <svg aria-hidden viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      <defs>
        <pattern id="hero-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#fff" strokeWidth="0.6" />
        </pattern>
        <linearGradient id="hero-fade" x1="0" x2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <radialGradient id="hero-ember" cx="100%" cy="100%" r="70%">
          <stop offset="0%" stopColor="#ff2740" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ff2740" stopOpacity="0" />
        </radialGradient>
        <mask id="hero-mask"><rect width="320" height="120" fill="url(#hero-fade)" /></mask>
      </defs>
      <rect width="320" height="120" fill="url(#hero-ember)" />
      <g mask="url(#hero-mask)">
        <rect width="320" height="120" fill="url(#hero-hatch)" opacity="0.06" />
        {/* weight plate, slowly turning */}
        <motion.g animate={{ rotate: 360 }} transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "268px 64px" }} fill="none" stroke="#fff">
          <circle cx="268" cy="64" r="70" strokeOpacity="0.1" strokeWidth="1.4" />
          <circle cx="268" cy="64" r="62" strokeOpacity="0.14" strokeWidth="5" strokeDasharray="3 9" />
          <circle cx="268" cy="64" r="48" strokeOpacity="0.1" strokeWidth="1" />
          <circle cx="268" cy="64" r="30" strokeOpacity="0.12" strokeWidth="1" />
          <circle cx="268" cy="64" r="10" strokeOpacity="0.2" strokeWidth="2" />
          <path d="M268 14 V28 M268 100 V114 M218 64 H232 M304 64 H318" strokeOpacity="0.18" strokeWidth="2" strokeLinecap="round" />
        </motion.g>
        {/* barbell silhouette across the bottom */}
        <g fill="#fff" fillOpacity="0.07">
          <rect x="120" y="100" width="200" height="4" rx="2" />
          <rect x="236" y="88" width="7" height="28" rx="2" />
          <rect x="246" y="92" width="5" height="20" rx="2" />
          <rect x="296" y="88" width="7" height="28" rx="2" />
          <rect x="288" y="92" width="5" height="20" rx="2" />
        </g>
      </g>
      {/* faint summit ridge, bottom-left */}
      <path d="M0 120 L40 84 L58 100 L90 58 L118 98 L140 86 L170 120 Z" fill="#fff" fillOpacity="0.04" />
      <path d="M0 120 L40 84 L58 100 L90 58 L118 98 L140 86 L170 120" fill="none" stroke="#fff" strokeOpacity="0.1" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

// One segment per set; each pops when it fills and a barbell rides the front.
export function SetsBar({ done, total }: { done: number; total: number }) {
  const n = Math.min(total, MAX_SEGMENTS);
  const filled = Math.round((done / total) * n);
  const pct = (filled / n) * 100;
  return (
    <div role="progressbar" aria-label="Training progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}
      style={{ position: "relative", height: 16, display: "flex", alignItems: "center", gap: 2 }}>
      {Array.from({ length: n }, (_, i) => {
        const on = i < filled;
        return (
          <motion.div key={i}
            initial={false}
            animate={{
              background: on ? "#fff" : "rgba(255,255,255,0.18)",
              scaleY: on ? [1, 2, 1] : 1,
              boxShadow: on ? "0 0 8px rgba(255,255,255,0.7)" : "0 0 0 rgba(255,255,255,0)",
            }}
            transition={{ duration: 0.45, delay: on ? i * 0.04 : 0, ease: "easeOut" }}
            style={{ flex: 1, height: 6, borderRadius: 3 }}
          />
        );
      })}
      {filled > 0 && (
        <motion.div aria-hidden
          initial={{ left: "0%" }} animate={{ left: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.1 }}
          style={{ position: "absolute", top: -2, transform: "translateX(-60%)", color: "#fff", filter: "drop-shadow(0 0 4px rgba(255,255,255,0.8))" }}
        >
          <motion.div animate={{ rotate: [-12, 8, -12] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
            <TbBarbell size={18} />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
