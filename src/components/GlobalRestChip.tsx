import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { TbX, TbPlayerPauseFilled, TbPlayerPlayFilled } from "react-icons/tb";
import { useRestTimer } from "../hooks/useRestTimer";
import { pauseRest, resumeRest, skipRest } from "../lib/restTimerStore";
import { fmtMinSec } from "../lib/date.utils";
import { RestRing } from "./RestRing";

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
            <RestRing size={38} pct={pct} color={rest.color}>
              <span style={{ fontSize: 11, fontWeight: 800, color: rest.color }}>
                {fmtMinSec(rest.remaining)}
              </span>
            </RestRing>
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
