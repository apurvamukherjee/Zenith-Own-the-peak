import { motion, AnimatePresence } from "framer-motion";
import { TbPlayerPauseFilled, TbPlayerPlayFilled, TbX } from "react-icons/tb";
import { useRestTimer } from "../hooks/useRestTimer";
import { pauseRest, resumeRest, skipRest } from "../lib/restTimerStore";
import { fmtMinSec } from "../lib/date.utils";
import { RestRing } from "./RestRing";

// In-card rest timer — reads from the global store. Renders nothing when the
// store is inactive. Kept as a controlled *view*; ticking, haptics, and reset
// live in `lib/restTimerStore.ts`. This is the SessionLogger's inline card.
// The floating chip in AppShell shares the exact same source of truth.
//
// `matchLabel`: the store is a single global singleton (one rest at a time),
// but SessionLogger mounts one <RestTimer/> per exercise/superset card. Without
// this, every card would show the same running countdown regardless of which
// exercise actually triggered it. Pass the label `startRest()` was called with
// for this card; omit it (e.g. the floating GlobalRestChip) to always render.
export function RestTimer({ matchLabel }: { matchLabel?: string } = {}) {
  const rest = useRestTimer();
  const relevant = matchLabel === undefined || rest.label === matchLabel;

  return (
    <AnimatePresence>
      {rest.active && relevant && (
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
              {fmtMinSec(rest.remaining)}
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
  return (
    <motion.div
      style={{ position: "relative", width: 40, height: 40, cursor: "pointer" }}
      whileTap={{ scale: 0.9 }}
      onClick={() => (rest.paused ? resumeRest() : pauseRest())}
      role="button"
      aria-label={rest.paused ? "Resume rest" : "Pause rest"}
    >
      <RestRing size={40} pct={pct} color={rest.color}>
        <span style={{ color: "var(--ink-soft)", display: "inline-flex" }}>
          {rest.paused ? <TbPlayerPlayFilled size={12} /> : <TbPlayerPauseFilled size={12} />}
        </span>
      </RestRing>
    </motion.div>
  );
}
