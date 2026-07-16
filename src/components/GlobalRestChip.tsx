import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { TbX, TbPlayerPauseFilled, TbPlayerPlayFilled } from "react-icons/tb";
import { useRestTimer } from "../hooks/useRestTimer";
import { pauseRest, resumeRest, skipRest } from "../lib/restTimerStore";

// Floating rest chip. Renders only when:
//   • The global rest store is active, AND
//   • The user is NOT on /workout (which shows the in-card RestTimer already).
// One tap on the chip jumps back to /workout so the user can keep logging.
export function GlobalRestChip() {
  const rest = useRestTimer();
  const location = useLocation();
  const navigate = useNavigate();

  const show = rest.active && location.pathname !== "/workout";
  const pct = rest.totalSec > 0 ? (1 - rest.remaining / rest.totalSec) * 100 : 0;
  const CIRC = 100.5; // 2·π·16

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          style={{
            position: "fixed", bottom: 132, right: 20, zIndex: 45,
            background: "var(--surface)", color: "var(--ink)",
            border: "1px solid var(--border)", borderRadius: 999,
            padding: "6px 10px 6px 6px",
            display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 6px 22px rgba(0,0,0,0.25)",
            maxWidth: "calc(100vw - 40px)",
          }}
        >
          <div
            onClick={() => navigate("/workout")}
            role="button"
            aria-label="Return to workout"
            style={{ position: "relative", width: 38, height: 38, cursor: "pointer" }}
          >
            <svg width="38" height="38" viewBox="0 0 38 38" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="19" cy="19" r="16" fill="none" stroke="var(--border)" strokeWidth="3" />
              <motion.circle
                cx="19" cy="19" r="16" fill="none" stroke={rest.color}
                strokeWidth="3" strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - pct / 100)}
                initial={false}
                animate={{ strokeDashoffset: CIRC * (1 - pct / 100) }}
                transition={{ duration: 0.35, ease: "linear" }}
              />
            </svg>
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 11, fontWeight: 800, color: rest.color,
            }}>
              {fmt(rest.remaining)}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1, minWidth: 0 }}>
            <span style={{ fontSize: 10, color: "var(--ink-soft)", fontWeight: 700, letterSpacing: 0.4 }}>
              {rest.paused ? "PAUSED" : "REST"}
            </span>
            {rest.label && (
              <span style={{ fontSize: 12, fontWeight: 700,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>
                {rest.label}
              </span>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); rest.paused ? resumeRest() : pauseRest(); }}
            aria-label={rest.paused ? "Resume" : "Pause"}
            style={chipBtn}
          >
            {rest.paused ? <TbPlayerPlayFilled size={14} /> : <TbPlayerPauseFilled size={14} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); skipRest(); }}
            aria-label="Skip rest"
            style={chipBtn}
          >
            <TbX size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const chipBtn: React.CSSProperties = {
  background: "transparent", border: "none", cursor: "pointer",
  color: "var(--ink-soft)", padding: 4, display: "inline-flex",
  alignItems: "center", justifyContent: "center",
};

function fmt(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
}
