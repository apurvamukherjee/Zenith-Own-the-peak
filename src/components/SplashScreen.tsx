import { useEffect, useState, useMemo } from "react";
import { motion, MotionConfig } from "framer-motion";

// Summit intro (~4.75s first launch): arch + ridge draw, a sword plunges into
// the summit at 1.5s (flash, shockwaves, sparks, screen shake), then ZENITH
// slams in and the motto shimmers. Every delay/duration is multiplied by k, so
// returning launches replay the same beats at ~1/3 speed.
const ARCH = "M24 160 V84 C24 44 92 24 140 -6 C188 24 256 44 256 84 V160";
const ARCH_INNER = "M38 160 V88 C38 54 98 34 140 8 C182 34 242 54 242 88 V160";
const RIDGE = "M36 150 L84 96 L104 112 L130 34 L150 74 L166 62 L196 112 L212 100 L244 150";
const CAP = "M130 34 L117 72 L124 66 L130 80 L137 66 L144 74 L150 74 Z";
const BAT = "M0 0 Q-6 -5 -12 0 Q-8 -1 -6 3 Q-3 0 0 2 Q3 0 6 3 Q8 -1 12 0 Q6 -5 0 0Z";
const EASE = [0.22, 1, 0.36, 1] as const;
const IMPACT = 1.5;
const SPARKS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  const r = 34 + (i % 3) * 14;
  return { dx: Math.cos(a) * r, dy: Math.sin(a) * r * 0.8 - 6 };
});

function Ornament({ flip, k }: { flip?: boolean; k: number }) {
  return (
    <motion.svg aria-hidden width="46" height="8" viewBox="0 0 46 8"
      initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 0.8 }}
      transition={{ delay: 2.3 * k, duration: 0.6 * k, ease: EASE }}
      style={{ transformOrigin: flip ? "0% 50%" : "100% 50%", transform: flip ? "scaleX(-1)" : undefined, flexShrink: 0 }}
    >
      <line x1="0" y1="4" x2="34" y2="4" stroke="#c9a3a8" strokeWidth="0.8" strokeOpacity="0.7" />
      <rect x="36" y="1.5" width="5" height="5" fill="#ff2740" transform="rotate(45 38.5 4)" />
    </motion.svg>
  );
}

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [k] = useState(() => {
    let seen = false;
    try { seen = localStorage.getItem("zenith:splash-seen") === "1"; localStorage.setItem("zenith:splash-seen", "1"); } catch { /* storage blocked: play full splash */ }
    return seen ? 0.4 : 1.25;
  });

  useEffect(() => {
    const end = setTimeout(onDone, 3800 * k);
    return () => clearTimeout(end);
  }, [onDone, k]);

  // Deterministic flakes, negative delays so snow is already mid-fall on frame 1.
  const snow = useMemo(() => Array.from({ length: 56 }, (_, i) => {
    const size = 1.5 + (i % 4) * 0.9;
    return {
      left: `${(i * 37.7) % 100}%`, size,
      duration: 6 + ((i * 7) % 7),
      delay: -((i * 1.3) % 9),
      dx: ((i % 5) - 2) * 14,
      opacity: 0.35 + (size / 5) * 0.5,
      blur: size > 3 ? 1.5 : 0,
    };
  }), []);

  return (
    <MotionConfig reducedMotion="user">
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
      {snow.map((f, i) => (
        <div key={i} className="snow" style={{
          position: "absolute", top: 0, left: f.left, width: f.size, height: f.size,
          borderRadius: "50%", background: "#f3eef2", opacity: f.opacity,
          filter: f.blur ? `blur(${f.blur}px)` : undefined, zIndex: 4, pointerEvents: "none",
          animationDuration: `${f.duration}s`, animationDelay: `${f.delay}s`,
          ["--dx" as string]: `${f.dx}px`,
        }} />
      ))}

      {/* Blood glow behind the peak; swells hard on impact */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0, 0.6, 0.25], scale: [0.5, 0.5, 1.6, 1.2] }}
        transition={{ duration: 3.4 * k, times: [0, 0.4, 0.5, 1], ease: "easeOut" }}
        style={{
          position: "absolute", width: 420, height: 420, borderRadius: "50%",
          background: "radial-gradient(circle, #c8112a 0%, transparent 65%)",
          filter: "blur(4px)", pointerEvents: "none",
        }}
      />

      {/* Impact flash */}
      <motion.div aria-hidden
        initial={{ opacity: 0 }} animate={{ opacity: [0, 0.6, 0] }}
        transition={{ delay: IMPACT * k, duration: 0.5 * k, times: [0, 0.15, 1] }}
        style={{
          position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none",
          background: "radial-gradient(circle at 50% 42%, #fff 0%, rgba(255,39,64,0.55) 35%, transparent 70%)",
        }}
      />

      {/* Gothic arch frames a moonlit peak */}
      <motion.div
        animate={{ x: [0, -6, 6, -4, 3, 0], y: [0, 4, -2, 1, 0, 0] }}
        transition={{ duration: 0.45 * k, delay: IMPACT * k }}
        style={{ position: "relative", width: "min(280px, 78vw)", aspectRatio: "280 / 160", zIndex: 2, marginBottom: 14 }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 * k, duration: 1.2 * k, ease: EASE }}
          style={{ position: "absolute", left: "56%", top: "11%", width: "19%", aspectRatio: "1" }}
        >
          {/* breathing halo */}
          <motion.div aria-hidden
            animate={{ opacity: [0.55, 1, 0.55], scale: [1, 1.12, 1] }}
            transition={{ duration: 3.5 * k, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute", inset: "-45%", borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,200,200,0.28) 0%, rgba(255,39,64,0.14) 35%, transparent 68%)",
            }}
          />
          <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ position: "relative", overflow: "visible" }}>
            <defs>
              <clipPath id="moon-clip"><circle cx="50" cy="50" r="48" /></clipPath>
              <radialGradient id="moon-base" cx="38%" cy="34%" r="75%">
                <stop offset="0%" stopColor="#fffaf6" />
                <stop offset="55%" stopColor="#ecc9c6" />
                <stop offset="100%" stopColor="#a8606b" />
              </radialGradient>
              <radialGradient id="moon-shade" cx="34%" cy="30%" r="85%">
                <stop offset="55%" stopColor="#1a0509" stopOpacity="0" />
                <stop offset="100%" stopColor="#1a0509" stopOpacity="0.75" />
              </radialGradient>
              <radialGradient id="moon-crater" cx="62%" cy="62%" r="60%">
                <stop offset="0%" stopColor="#8a5058" stopOpacity="0.55" />
                <stop offset="75%" stopColor="#8a5058" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0.5" />
              </radialGradient>
              <filter id="moon-soft"><feGaussianBlur stdDeviation="2.2" /></filter>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#moon-base)" />
            <g clipPath="url(#moon-clip)">
              {/* maria: soft dark seas */}
              <g fill="#7a4650" opacity="0.4" filter="url(#moon-soft)">
                <path d="M22 30 Q34 20 46 28 Q50 38 40 44 Q26 48 20 40 Z" />
                <path d="M52 22 Q66 18 74 30 Q70 42 58 38 Q50 32 52 22 Z" />
                <path d="M34 54 Q46 50 52 60 Q48 72 36 70 Q28 62 34 54 Z" />
                <path d="M62 56 Q74 52 80 62 Q74 72 64 68 Z" />
              </g>
              {/* craters: shaded bowl + bright rim */}
              {[
                [30, 62, 7], [68, 44, 5.5], [48, 80, 4.5], [78, 70, 4], [58, 30, 3.5],
                [22, 48, 3], [44, 40, 2.6], [72, 22, 2.6], [36, 84, 2.4], [84, 52, 2.2],
              ].map(([x, y, r], i) => (
                <g key={i}>
                  <circle cx={x} cy={y} r={r} fill="url(#moon-crater)" />
                  <circle cx={x} cy={y} r={r} fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="0.5" />
                </g>
              ))}
              {/* Tycho-style ray crater */}
              <g stroke="#fff" strokeOpacity="0.22" strokeWidth="0.6" strokeLinecap="round">
                {[0, 40, 80, 120, 160, 200, 250, 300].map((a) => (
                  <line key={a} x1="40" y1="76" x2={40 + Math.cos((a * Math.PI) / 180) * 22} y2={76 + Math.sin((a * Math.PI) / 180) * 22} />
                ))}
              </g>
              {/* terminator shading for a sphere, lit from upper-left */}
              <circle cx="50" cy="50" r="48" fill="url(#moon-shade)" />
            </g>
            <circle cx="50" cy="50" r="48" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="0.6" />
          </svg>
        </motion.div>
        <svg viewBox="0 -10 280 170" width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <motion.path d={ARCH} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 1.2 * k, delay: 0.1 * k, ease: "easeInOut" }} />
          <motion.path d={ARCH_INNER} fill="none" stroke="#ff2740" strokeOpacity="0.45" strokeWidth="0.8" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 1.2 * k, delay: 0.3 * k, ease: "easeInOut" }} />
          <motion.path d={RIDGE + " Z"} fill="#0d0608" stroke="none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.5 * k, delay: 1.1 * k }} />
          <motion.path d={RIDGE} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 1.2 * k, delay: 0.2 * k, ease: "easeInOut" }} />
          <motion.path d={CAP} fill="#f3eef2" stroke="#f3eef2" strokeWidth="1" strokeLinejoin="round"
            initial={{ opacity: 0 }} animate={{ opacity: 0.95 }}
            transition={{ duration: 0.5 * k, delay: 1.2 * k }} />

          {/* Shockwaves + spark burst from the point of impact */}
          {[0, 1, 2].map((i) => (
            <motion.circle key={i} cx="130" cy="34" r="3.5" fill="none" stroke="#ff2740" strokeWidth={1.6 - i * 0.4}
              initial={{ scale: 1, opacity: 0 }} animate={{ scale: 11 + i * 3, opacity: [0, 0.9, 0] }}
              transition={{ duration: (1.0 + i * 0.15) * k, delay: (IMPACT + i * 0.12) * k, ease: "easeOut" }}
              style={{ transformOrigin: "130px 34px" }} />
          ))}
          {SPARKS.map((s, i) => (
            <motion.circle key={i} cx="130" cy="34" r={i % 2 ? 1.1 : 1.8} fill={i % 3 ? "#ff2740" : "#ffd76b"}
              initial={{ opacity: 0 }}
              animate={{ cx: 130 + s.dx, cy: [34, 34 + s.dy - 10, 34 + s.dy + 14], opacity: [0, 1, 0] }}
              transition={{ duration: 0.9 * k, delay: IMPACT * k, ease: "easeOut" }} />
          ))}
          <motion.circle cx="130" cy="34" r="4" fill="#ff2740"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 2.2, 1], opacity: 1 }}
            transition={{ duration: 0.6 * k, delay: IMPACT * k }}
            style={{ transformOrigin: "130px 34px", filter: "drop-shadow(0 0 8px #ff2740)" }} />

          {/* Sword: hangs above, hits the summit at 1.5s, overshoots, settles */}
          <motion.g
            initial={{ y: -110, opacity: 0 }}
            animate={{ y: [-110, 5, 0], opacity: 1 }}
            transition={{
              y: { duration: 0.45 * k, delay: (IMPACT - 0.4) * k, times: [0, 0.8, 1], ease: ["easeIn", "easeOut"] },
              opacity: { duration: 0.1 * k, delay: (IMPACT - 0.4) * k },
            }}
          >
            {/* blade: two-tone bevel, fuller, edge highlight */}
            <polygon points="126,-4 130,-4 130,36" fill="#e6e1e5" />
            <polygon points="130,-4 134,-4 130,36" fill="#a09aa0" />
            <line x1="130" y1="1" x2="130" y2="26" stroke="#5a5156" strokeWidth="1.3" strokeLinecap="round" />
            <line x1="126" y1="-4" x2="130" y2="36" stroke="#fff" strokeWidth="0.4" strokeOpacity="0.8" />
            <rect x="127" y="-6" width="6" height="3" fill="#2a1418" stroke="#c9a3a8" strokeWidth="0.3" />
            {/* runes flare along the fuller after impact */}
            <motion.g stroke="#ff2740" strokeWidth="0.7" strokeLinecap="round"
              initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.55, 1, 0.55] }}
              transition={{ delay: (IMPACT + 0.1) * k, duration: 1.6 * k }}
              style={{ filter: "drop-shadow(0 0 2px #ff2740)" }}>
              <line x1="128.6" y1="5" x2="131.4" y2="7" />
              <line x1="128.6" y1="11" x2="131.4" y2="9" />
              <line x1="128.6" y1="15" x2="131.4" y2="17" />
              <line x1="128.6" y1="21" x2="131.4" y2="19" />
            </motion.g>
            {/* curled gothic crossguard + gem */}
            <path d="M110 -13 Q111 -3 121 -6 L126 -7 H134 L139 -6 Q149 -3 150 -13 Q145 -8 138 -10 H122 Q115 -8 110 -13 Z"
              fill="#8a1020" stroke="#ff2740" strokeWidth="0.6" strokeLinejoin="round" />
            <polygon points="130,-11 133,-7.5 130,-4 127,-7.5" fill="#ff2740" stroke="#fff" strokeWidth="0.3" />
            {/* wrapped grip */}
            <rect x="128.7" y="-22" width="2.6" height="12" rx="1" fill="#1a0a0e" stroke="#c9a3a8" strokeWidth="0.4" />
            {[0, 1, 2, 3].map((i) => (
              <line key={i} x1="128.7" y1={-20 + i * 3} x2="131.3" y2={-18.6 + i * 3} stroke="#c9a3a8" strokeWidth="0.5" />
            ))}
            {/* spiked pommel with gem */}
            <circle cx="130" cy="-25.5" r="3.2" fill="#8a1020" stroke="#c9a3a8" strokeWidth="0.5" />
            <circle cx="130" cy="-25.5" r="1.2" fill="#ff2740" style={{ filter: "drop-shadow(0 0 3px #ff2740)" }} />
            <polygon points="130,-33 128.4,-28.6 131.6,-28.6" fill="#c9a3a8" />
            <motion.rect x="129" width="2" height="8" fill="#fff"
              initial={{ y: -4, opacity: 0 }} animate={{ y: 28, opacity: [0, 1, 0] }}
              transition={{ duration: 0.5 * k, delay: (IMPACT + 0.5) * k, ease: "easeOut" }} />
          </motion.g>
        </svg>
        {[0, 1].map((i) => (
          <motion.div key={i} aria-hidden
            initial={{ x: "-120%", opacity: 0 }} animate={{ x: "320%", opacity: [0, 0.5, 0.5, 0] }}
            transition={{ duration: (3.3 + i * 1.2) * k, delay: (0.8 + i * 0.7) * k, ease: "linear" }}
            style={{
              position: "absolute", left: 0, bottom: `${8 + i * 6}%`, width: "70%", height: 36, filter: "blur(10px)",
              background: "radial-gradient(ellipse, rgba(200,170,175,0.5) 0%, transparent 70%)", pointerEvents: "none",
            }}
          />
        ))}
        {[0, 1, 2].map((i) => (
          <motion.svg key={i} aria-hidden width="26" height="14" viewBox="-14 -6 28 12"
            initial={{ x: -40, y: 0, opacity: 0 }}
            animate={{ x: 320, y: [0, -14, 6, -10, 0], opacity: [0, 0.9, 0.9, 0] }}
            transition={{ duration: 2.2 * k, delay: (1.7 + i * 0.4) * k, ease: "linear" }}
            style={{ position: "absolute", top: `${6 + i * 9}%`, left: 0 }}
          >
            <motion.path d={BAT} fill="#0d0608" stroke="#c9a3a8" strokeWidth="0.6"
              animate={{ scaleY: [1, 0.35, 1] }} transition={{ duration: 0.25, repeat: Infinity }}
              style={{ transformOrigin: "0px 0px" }} />
          </motion.svg>
        ))}
      </motion.div>

      {/* Wordmark — slams in right after the impact */}
      <div className="gothic" aria-label="ZENITH" style={{
        position: "relative", zIndex: 2, display: "flex", fontSize: 52, fontWeight: 900,
        letterSpacing: "0.14em", marginRight: "-0.14em", color: "#f3eef2",
        textShadow: "0 2px 30px rgba(255, 39, 64, 0.25)",
      }}>
        {"ZENITH".split("").map((ch, i) => (
          <motion.span key={i} aria-hidden
            initial={{ y: 28, opacity: 0, filter: "blur(10px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            transition={{ delay: (IMPACT + 0.2 + i * 0.08) * k, duration: 0.6 * k, ease: EASE }}
          >{ch}</motion.span>
        ))}
      </div>

      {/* Red line sweeps out from center */}
      <motion.div
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
        transition={{ delay: 2.3 * k, duration: 0.7 * k, ease: EASE }}
        style={{
          width: 200, height: 2, marginTop: 12, zIndex: 2,
          background: "linear-gradient(90deg, transparent 0%, var(--accent) 50%, transparent 100%)",
        }}
      />

      {/* Motto: ornaments extend outward, letters shimmer white → muted rose */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18, zIndex: 2 }}>
        <Ornament k={k} />
        <div style={{
          fontFamily: "Cinzel, serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.5em",
          textTransform: "uppercase", marginRight: "-0.5em", whiteSpace: "nowrap",
        }}>
          {"OWN THE PEAK".split("").map((ch, i) => (
            <motion.span key={i}
              initial={{ opacity: 0, y: 6, filter: "blur(4px)", color: "#ffffff" }}
              animate={{ opacity: 0.8, y: 0, filter: "blur(0px)", color: "#c9a3a8" }}
              transition={{
                delay: (2.4 + i * 0.06) * k,
                opacity: { duration: 0.3 * k }, y: { duration: 0.4 * k }, filter: { duration: 0.4 * k },
                color: { duration: 0.9 * k },
              }}
            >{ch === " " ? " " : ch}</motion.span>
          ))}
        </div>
        <Ornament k={k} flip />
      </div>

      {/* Signature — breathing red glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.2 * k, duration: 0.6 * k }}
        style={{ position: "absolute", bottom: 52, zIndex: 2 }}
      >
        <span className="signature-glow gothic" style={{
          fontSize: 13, letterSpacing: "0.35em", color: "var(--accent)", fontWeight: 700,
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
    </MotionConfig>
  );
}
