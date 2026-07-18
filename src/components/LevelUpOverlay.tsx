import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LEVELS } from "../lib/xp";

interface Props { level: number; name: string; onDone: () => void; }

// Full-screen cinematic level-up moment. 2.8s then auto-dismisses.
// Deliberately gothic — red particles, Cinzel title, dark background.
// Does not block interaction (pointer-events: none on the overlay).
export function LevelUpOverlay({ level, name, onDone }: Props) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => { setVisible(false); onDone(); }, 2800);
    return () => window.clearTimeout(t);
  }, [onDone]);

  // 20 particles at random positions
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
          transition={{ duration: 0.3 }}
          onClick={() => { setVisible(false); onDone(); }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "radial-gradient(circle at 50% 40%, #1a0509 0%, #08060a 70%)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            color: "#f3eef2",
          }}
        >
          {/* Particles */}
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

          {/* Level number */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.15 }}
            style={{ textAlign: "center" }}
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

          {/* XP required label */}
          <div style={{ marginTop: 32, fontSize: 11, color: "var(--ink-soft)", letterSpacing: "0.3em", fontStyle: "italic", fontFamily: '"Cinzel", serif' }}>
            {LEVELS.find((l) => l.level === level)?.xpRequired.toLocaleString()} XP
          </div>

          <div style={{ marginTop: 48, fontSize: 10, color: "var(--ink-soft)", opacity: 0.5 }}>
            tap to continue
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
