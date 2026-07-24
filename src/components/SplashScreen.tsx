import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";

// Gothic splash — 3.8s cinematic intro.
// Feel: cold-blood black bg, monumental gothic wordmark (Cinzel), two brief
// glitch beats on the wordmark, a lone red scanline sweep, drifting grey ash,
// breathing red signature. No purple, no sparkles.
export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    // Two glitch beats: quick @ 0.9s, longer @ 2.2s
    const g1 = setTimeout(() => setGlitching(true), 900);
    const g1off = setTimeout(() => setGlitching(false), 1120);
    const g2 = setTimeout(() => setGlitching(true), 2200);
    const g2off = setTimeout(() => setGlitching(false), 2500);
    const end = setTimeout(onDone, 3800);
    return () => [g1, g1off, g2, g2off, end].forEach(clearTimeout);
  }, [onDone]);

  // Ash particles — 14 flakes with randomized position/speed. Memoized so
  // they don't reshuffle on every render.
  const ash = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    left: `${(i * 7.3) % 100}%`,
    size: 2 + (i % 3),
    duration: 6 + (i % 5),
    delay: (i * 0.3) % 4,
  })), []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="gothic-vignette"
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "radial-gradient(ellipse at 50% 40%, #1a0509 0%, #0d0608 55%, #050203 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        color: "#f3eef2", overflow: "hidden",
      }}
    >
      {/* Falling ash (grey specks). Rendered behind everything. */}
      {ash.map((a, i) => (
        <div key={i} className="ash" style={{
          position: "absolute", top: 0, left: a.left,
          width: a.size, height: a.size, borderRadius: "50%",
          background: "rgba(180, 170, 175, 0.5)",
          animationDuration: `${a.duration}s`, animationDelay: `${a.delay}s`,
        }} />
      ))}

      {/* Faint radial blood pulse behind the icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.35, 0.2], scale: [0.5, 1.4, 1.2] }}
        transition={{ duration: 3, ease: "easeOut" }}
        style={{
          position: "absolute", width: 420, height: 420, borderRadius: "50%",
          background: "radial-gradient(circle, #c8112a 0%, transparent 65%)",
          filter: "blur(4px)", pointerEvents: "none",
        }}
      />

      {/* Icon: mountain in a drawing ring */}
      <motion.div
        initial={{ scale: 0, rotate: -60, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 16, delay: 0.15 }}
        style={{ position: "relative", width: 92, height: 92, marginBottom: 28, zIndex: 2 }}
      >
        <svg width="92" height="92" viewBox="0 0 92 92" style={{ position: "absolute", inset: 0 }}>
          <motion.circle
            cx="46" cy="46" r="42" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, delay: 0.3, ease: "easeInOut" }}
          />
          <motion.circle
            cx="46" cy="46" r="42" fill="none" stroke="#ff2740" strokeWidth="1.5"
            strokeLinecap="round" strokeDasharray="4 8"
            initial={{ rotate: 0 }} animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "46px 46px", opacity: 0.3 }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src="/logo-mark.png" alt="" width={48} height={48} style={{ objectFit: "contain" }} />
        </div>
      </motion.div>

      {/* Wordmark — gothic serif, uppercase, with glitch effect on beats */}
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: "relative", zIndex: 2 }}
      >
        <span
          className={`gothic glitch${glitching ? " glitch-active" : ""}`}
          data-text="ZENITH"
          style={{
            fontSize: 52, fontWeight: 900, letterSpacing: "0.14em",
            color: "#f3eef2",
            textShadow: glitching ? "none" : "0 2px 30px rgba(255, 39, 64, 0.25)",
          }}
        >ZENITH</span>
      </motion.div>

      {/* Scan-line under the wordmark — sweeps once left→right */}
      <div style={{ position: "relative", width: 200, height: 2, marginTop: 12, overflow: "hidden", zIndex: 2 }}>
        <div className="scan-line" style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, transparent 0%, #ff2740 50%, transparent 100%)",
        }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(255, 39, 64, 0.08)" }} />
      </div>

      {/* Tagline — small caps, letter-spaced, staggered fade */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: 11, fontWeight: 600, letterSpacing: "0.5em",
          textTransform: "uppercase", marginTop: 18, opacity: 0.65,
          color: "#c9a3a8", zIndex: 2, marginLeft: "0.5em",
        }}
      >
        {"OWN THE PEAK".split("").map((ch, i) => (
          <motion.span key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 + i * 0.05, duration: 0.3 }}
          >{ch === " " ? "\u00A0" : ch}</motion.span>
        ))}
      </motion.div>

      {/* Signature — breathing red glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.6, duration: 0.6 }}
        style={{ position: "absolute", bottom: 52, zIndex: 2 }}
      >
        <span className="signature-glow gothic" style={{
          fontSize: 13, letterSpacing: "0.35em", color: "#ff2740", fontWeight: 700,
        }}>
          BY APURVA
        </span>
      </motion.div>

      {/* Subtle scanline overlay for CRT feel */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3, opacity: 0.04,
        background: "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, #000 3px, transparent 3px)",
      }} />
    </motion.div>
  );
}
