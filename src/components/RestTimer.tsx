import { motion, AnimatePresence } from "framer-motion";
import { TbPlayerPauseFilled, TbPlayerPlayFilled, TbX } from "react-icons/tb";
import { useRestTimer } from "../hooks/useRestTimer";
import { pauseRest, resumeRest, skipRest } from "../lib/restTimerStore";

// In-card rest timer — reads from the global store. Renders nothing when the
// store is inactive. Kept as a controlled *view*; ticking, haptics, and reset
// live in `lib/restTimerStore.ts`. This is the SessionLogger's inline card.
// The floating chip in AppShell shares the exact same source of truth.
export function RestTimer() {
  const rest = useRestTimer();

  return (
    <AnimatePresence>
      {rest.active && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
            background: "var(--bg)", borderRadius: 10, marginTop: 6,
            borderLeft: `3px solid ${rest.color}`,
          }}
        >
          <RestDial />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 600 }}>
              {rest.paused ? "Paused" : "Rest"}
            </div>
            <div className="display" style={{ fontSize: 18, fontWeight: 800, color: rest.color, lineHeight: 1 }}>
              {fmt(rest.remaining)}
            </div>
          </div>
          <button
            onClick={skipRest}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)", padding: 6 }}
            aria-label="Skip rest"
          >
            <TbX size={18} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RestDial() {
  const rest = useRestTimer();
  const pct = rest.totalSec > 0 ? (1 - rest.remaining / rest.totalSec) * 100 : 0;
  const CIRC = 107; // 2·π·17 ≈ 106.8
  return (
    <motion.div
      style={{ position: "relative", width: 40, height: 40, cursor: "pointer" }}
      whileTap={{ scale: 0.9 }}
      onClick={() => (rest.paused ? resumeRest() : pauseRest())}
      role="button"
      aria-label={rest.paused ? "Resume rest" : "Pause rest"}
    >
      <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="20" cy="20" r="17" fill="none" stroke="var(--border)" strokeWidth="3" />
        <motion.circle
          cx="20" cy="20" r="17" fill="none" stroke={rest.color}
          strokeWidth="3" strokeLinecap="round"
          strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - pct / 100)}
          initial={false}
          animate={{ strokeDashoffset: CIRC * (1 - pct / 100) }}
          transition={{ duration: 0.35, ease: "linear" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center",
        justifyContent: "center", color: "var(--ink-soft)",
      }}>
        {rest.paused ? <TbPlayerPlayFilled size={12} /> : <TbPlayerPauseFilled size={12} />}
      </div>
    </motion.div>
  );
}

function fmt(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
}
