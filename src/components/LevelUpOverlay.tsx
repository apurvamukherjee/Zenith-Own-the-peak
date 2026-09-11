import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LEVELS } from "../lib/xp";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { hapticSuccess } from "../lib/haptics";

interface Props { level: number; name: string; onDone: () => void; }

// Brutal per-tier line, banded by level range so a level 2 and a level 18
// don't get the same flavor text. Random within its band, same pattern as
// GymFocusMode's lock-in/quit-shame quote banks.
const EARLY_LINES = [ // levels 1-6
  "First blood. Barely anything. Keep going.",
  "You leveled up. That's the floor, not the ceiling.",
  "Cute. Come back when it's hard.",
];
const MID_LINES = [ // levels 7-13
  "Most people quit before this number. You didn't.",
  "This is where it stops being easy. Good.",
  "Halfway to something real. Don't get comfortable.",
];
const LATE_LINES = [ // levels 14-20
  "Almost nobody sees this level. Act like it.",
  "This is what showing up looks like, compounded.",
  "You're not chasing the peak anymore. You're near it.",
];
function lineFor(level: number): string {
  const bank = level <= 6 ? EARLY_LINES : level <= 13 ? MID_LINES : LATE_LINES;
  return bank[Math.floor(Math.random() * bank.length)];
}

// Full-screen cinematic level-up moment. 2.8s then auto-dismisses (or tap to
// skip early). Gothic — red particles, Cinzel title, dark background.
// Does not block interaction (pointer-events: none on the overlay).
export function LevelUpOverlay({ level, name, onDone }: Props) {
  const [visible, setVisible] = useState(true);
  const reducedMotion = useReducedMotion();
  const line = useMemo(() => lineFor(level), [level]);

  useEffect(() => {
    void hapticSuccess();
    const t = window.setTimeout(() => { setVisible(false); onDone(); }, 2800);
    return () => window.clearTimeout(t);
  }, [onDone]);

  // 20 particles at random positions — skipped entirely under reduced motion.
  const particles = Array.from({ length: 20 }, (_, i) => ({
    left: `${(i * 5.3 + 10) % 90}%`,
    delay: (i * 0.07) % 0.6,
    size: 4 + (i % 4),
  }));

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.01 : 0.3 }}
          onClick={() => { setVisible(false); onDone(); }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "radial-gradient(circle at 50% 40%, #1a0509 0%, #08060a 70%)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            color: "#f3eef2", padding: 24, textAlign: "center",
          }}
        >
          {!reducedMotion && (
            <>
              {/* Screen-flash burst on entry — the impact beat */}
              <motion.div
                initial={{ opacity: 0.9, scale: 0.4 }}
                animate={{ opacity: 0, scale: 2.2 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{
                  position: "absolute", width: 320, height: 320, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(255,39,64,0.6) 0%, rgba(255,39,64,0) 70%)",
                  pointerEvents: "none",
                }}
              />
              {particles.map((p, i) => (
                <motion.div key={i}
                  initial={{ y: 0, x: p.left, opacity: 0, scale: 0 }}
                  animate={{ y: "-60vh", opacity: [0, 1, 0], scale: [0, 1, 0.5] }}
                  transition={{ duration: 2, delay: p.delay, ease: "easeOut" }}
                  style={{
                    position: "absolute", bottom: "30%", width: p.size, height: p.size,
                    borderRadius: "50%", background: "#ff2740",
                    boxShadow: "0 0 8px #ff2740",
                  }}
                />
              ))}
            </>
          )}

          {/* Level number */}
          <motion.div
            initial={{ scale: reducedMotion ? 1 : 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={reducedMotion ? { duration: 0.01 } : { type: "spring", stiffness: 200, damping: 14, delay: 0.15 }}
          >
            <div style={{ fontSize: 11, letterSpacing: "0.5em", color: "var(--ink-soft)", marginBottom: 8,
              fontFamily: '"Cinzel", serif', fontWeight: 600, textTransform: "uppercase" }}>
              Level up
            </div>
            <div style={{
              fontFamily: '"Cinzel", serif', fontWeight: 900,
              fontSize: 72, lineHeight: 1, color: "#ff2740",
              textShadow: "0 0 30px rgba(255,39,64,0.6), 0 0 60px rgba(255,39,64,0.3)",
            }}>
              {level}
            </div>
            <div style={{
              fontFamily: '"Cinzel", serif', fontWeight: 700,
              fontSize: 22, letterSpacing: "0.2em", marginTop: 10,
              color: "#f3eef2", textTransform: "uppercase",
            }}>
              {name}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: reducedMotion ? 0 : 0.5 }}
            style={{ marginTop: 20, fontSize: 15, fontWeight: 700, maxWidth: 320, lineHeight: 1.4 }}
          >
            {line}
          </motion.div>

          {/* XP required label */}
          <div style={{ marginTop: 24, fontSize: 11, color: "var(--ink-soft)", letterSpacing: "0.3em", fontStyle: "italic", fontFamily: '"Cinzel", serif' }}>
            {LEVELS.find((l) => l.level === level)?.xpRequired.toLocaleString()} XP
          </div>

          <div style={{ marginTop: 40, fontSize: 10, color: "var(--ink-soft)", opacity: 0.5 }}>
            tap to continue
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
