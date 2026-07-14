import { useEffect } from "react";
import { motion } from "framer-motion";
import { TbMountain } from "react-icons/tb";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5 }}
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "linear-gradient(160deg,#08060a 0%,#1a0509 30%,#6e0f1c 70%,#d81f34 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        color: "#fff", overflow: "hidden",
      }}
    >
      {/* Ambient glow rings */}
      <motion.div
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 0.15, scale: 1.2 }}
        transition={{ duration: 2.5, ease: "easeOut" }}
        style={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, #ff2740 0%, transparent 70%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 0.08, scale: 1.5 }}
        transition={{ duration: 3, delay: 0.3, ease: "easeOut" }}
        style={{
          position: "absolute", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, #ff6b3d 0%, transparent 70%)",
        }}
      />

      {/* Icon: scales + spins in with a drawing ring */}
      <motion.div
        initial={{ scale: 0, rotate: -120, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 14, delay: 0.2 }}
        style={{ position: "relative", width: 100, height: 100, marginBottom: 24, zIndex: 1 }}
      >
        <svg width="100" height="100" viewBox="0 0 100 100" style={{ position: "absolute", inset: 0 }}>
          <motion.circle
            cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.4, ease: "easeInOut" }}
            style={{ transformOrigin: "center" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <TbMountain size={46} strokeWidth={1.8} />
        </div>
      </motion.div>

      {/* Wordmark */}
      <motion.h1
        className="display"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        style={{ margin: 0, fontSize: 44, fontWeight: 800, letterSpacing: -1.5, zIndex: 1 }}
      >
        Zenith
      </motion.h1>

      {/* Tagline with staggered letters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        style={{ fontSize: 14, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", marginTop: 8, opacity: 0.92, zIndex: 1 }}
      >
        {"Own the peak".split("").map((ch, i) => (
          <motion.span key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 + i * 0.04, duration: 0.3 }}>
            {ch}
          </motion.span>
        ))}
      </motion.div>

      {/* Signature */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 1.8, duration: 0.6 }}
        style={{ position: "absolute", bottom: 44, fontSize: 12, letterSpacing: 2, zIndex: 1 }}
      >
        by Apurva
      </motion.div>

      {/* Loading bar */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 140 }}
        transition={{ delay: 1.2, duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ height: 3, background: "rgba(255,255,255,0.8)", borderRadius: 3, marginTop: 28, zIndex: 1 }}
      />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 80, x: (i - 3) * 40 }}
          animate={{ opacity: [0, 0.4, 0], y: -120 }}
          transition={{ delay: 0.5 + i * 0.25, duration: 2.5, ease: "easeOut" }}
          style={{
            position: "absolute", bottom: "30%",
            width: 3, height: 3, borderRadius: "50%",
            background: "#ff6b3d",
          }}
        />
      ))}
    </motion.div>
  );
}
