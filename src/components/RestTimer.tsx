import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { TbPlayerPauseFilled, TbPlayerPlayFilled, TbX } from "react-icons/tb";
import { hapticMedium } from "../lib/haptics";

// Circular rest-timer that lives INSIDE an exercise card. Starts when a set is
// completed, counts down from restSec, haptic on zero. Tap to pause/resume,
// X to skip early. Persists via localStorage-free approach — pure component
// state, resets on unmount (which is fine: navigating away = you're done resting).
export function RestTimer({ seconds, onDone, onSkip, color }: {
  seconds: number; onDone: () => void; onSkip: () => void; color: string;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const [paused, setPaused] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(id);
          if (!firedRef.current) {
            firedRef.current = true;
            hapticMedium();
            onDone();
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [paused, onDone]);

  const pct = (1 - remaining / seconds) * 100;
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "var(--bg)",
      borderRadius: 10, marginTop: 6, borderLeft: `3px solid ${color}` }}>
      <motion.div style={{ position: "relative", width: 40, height: 40 }} whileTap={{ scale: 0.9 }}
        onClick={() => setPaused(!paused)}>
        <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="20" cy="20" r="17" fill="none" stroke="var(--border)" strokeWidth="3" />
          <motion.circle cx="20" cy="20" r="17" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={107} strokeDashoffset={107 * (1 - pct / 100)}
            initial={false} animate={{ strokeDashoffset: 107 * (1 - pct / 100) }} transition={{ duration: 0.5 }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-soft)" }}>
          {paused ? <TbPlayerPlayFilled size={12} /> : <TbPlayerPauseFilled size={12} />}
        </div>
      </motion.div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 600 }}>{paused ? "Paused" : "Rest"}</div>
        <div className="display" style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{mm}:{ss}</div>
      </div>
      <button onClick={onSkip} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)", padding: 6 }} aria-label="Skip">
        <TbX size={18} />
      </button>
    </div>
  );
}
