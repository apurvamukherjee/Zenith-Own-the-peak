import { AnimatePresence, motion } from "framer-motion";
import { TbPlayerPauseFilled, TbPlayerPlayFilled, TbPlayerTrackNextFilled } from "react-icons/tb";
import { addRest, pauseRest, resumeRest, skipRest, useRestTimer } from "../../lib/restTimerStore";
import { fmtMinSec } from "../../lib/date.utils";

// Rest countdown pinned above the bottom nav on /workout, so it never scrolls
// out of view mid-list. Off /workout, AppShell's GlobalRestChip takes over.
export function RestDock({ upNext }: { upNext?: string }) {
  const rest = useRestTimer();
  const pct = rest.totalSec > 0 ? (rest.remaining / rest.totalSec) * 100 : 0;
  const urgent = !rest.paused && rest.remaining <= 10;

  return (
    <AnimatePresence>
      {rest.active && (
        <motion.div
          className={`rd${urgent ? " is-urgent" : ""}`} role="timer" aria-live="off"
          initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
        >
          <div className="rd-bar" style={{ transform: `scaleX(${pct / 100})` }} aria-hidden />
          <div className="rd-main">
            <div className="rd-time" aria-label={`Rest ${fmtMinSec(rest.remaining)} remaining`}>
              {fmtMinSec(rest.remaining)}
            </div>
            <div className="rd-info">
              <span className="rd-label">{rest.paused ? "Paused" : "Rest"}</span>
              {upNext && <span className="rd-next">Next · {upNext}</span>}
            </div>
          </div>
          <div className="rd-ctrls">
            <button type="button" onClick={() => addRest(-15)} aria-label="Remove 15 seconds">−15</button>
            <button type="button" onClick={() => addRest(15)} aria-label="Add 15 seconds">+15</button>
            <button type="button" onClick={rest.paused ? resumeRest : pauseRest} aria-label={rest.paused ? "Resume rest" : "Pause rest"}>
              {rest.paused ? <TbPlayerPlayFilled size={15} /> : <TbPlayerPauseFilled size={15} />}
            </button>
            <button type="button" className="rd-skip" onClick={skipRest} aria-label="Skip rest">
              <TbPlayerTrackNextFilled size={15} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
