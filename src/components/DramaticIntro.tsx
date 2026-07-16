import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLiveQuery } from "dexie-react-hooks";
import { useSetting, setSetting } from "../hooks/useSettings";
import { lastNDates } from "../lib/date.utils";
import { computeScoresForMonth } from "../lib/dayScore";

// Egg #10 — the "System overload… user achieving peak…" intro screen.
// Fires exactly once per lifetime after 7 consecutive perfect (100%) days,
// gated on `eggDramatic=1`. Rendered above the AppShell root.
export function DramaticIntro() {
  const seen = Number(useSetting("eggDramatic"));
  const waterGoal = useSetting("waterGoalMl");
  const proteinTarget = useSetting("proteinTargetG");
  const [showing, setShowing] = useState(false);

  const last7 = lastNDates(7);
  const scores = useLiveQuery(
    () => computeScoresForMonth(last7, waterGoal, proteinTarget),
    [last7.join(","), waterGoal, proteinTarget],
  );

  useEffect(() => {
    if (seen === 1) return;
    if (!scores) return;
    let perfect = 0;
    for (const d of last7) {
      const m = scores.get(d);
      if (m && m.score >= 100) perfect++;
    }
    if (perfect >= 7) {
      setShowing(true);
      void setSetting("eggDramatic", 1);
      const t = window.setTimeout(() => setShowing(false), 4000);
      return () => window.clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scores, seen]);

  return (
    <AnimatePresence>
      {showing && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "fixed", inset: 0, zIndex: 400,
            background: "linear-gradient(135deg,#08080a 0%,#3f0b15 100%)",
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", color: "#ff2740",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
          aria-live="polite"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 3.8, times: [0, 0.15, 0.85, 1] }}
            style={{ fontSize: 14, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}
          >
            SYSTEM OVERLOAD
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: [0, 1, 1, 0], y: 0 }}
            transition={{ duration: 3.8, delay: 0.2, times: [0, 0.2, 0.85, 1] }}
            className="display"
            style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: 1 }}
          >
            user achieving peak…
          </motion.div>
          <motion.div
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ duration: 3.2, delay: 0.4, ease: "linear" }}
            style={{
              width: 180, height: 2, background: "#ff2740",
              transformOrigin: "left center", marginTop: 22,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
