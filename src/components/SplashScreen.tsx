import { useEffect } from "react";
import { motion } from "framer-motion";
import { ThunderboltFilled } from "@ant-design/icons";

// Clean launch animation. Auto-dismisses after the sequence completes.
export function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "linear-gradient(160deg,#6b4dfc 0%,#8b6bff 55%,#b39dff 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        color: "#fff",
      }}
    >
      {/* Icon: scales + spins in, then a ring draws around it */}
      <motion.div
        initial={{ scale: 0, rotate: -90, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.15 }}
        style={{ position: "relative", width: 96, height: 96, marginBottom: 26 }}
      >
        <svg width="96" height="96" viewBox="0 0 96 96" style={{ position: "absolute", inset: 0 }}>
          <motion.circle
            cx="48" cy="48" r="44" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0, rotate: -90 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, delay: 0.4, ease: "easeInOut" }}
            style={{ transformOrigin: "center" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ThunderboltFilled style={{ fontSize: 44, color: "#fff" }} />
        </div>
      </motion.div>

      <motion.h1
        className="display"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        style={{ margin: 0, fontSize: 40, fontWeight: 800, letterSpacing: -1 }}
      >
        TrackLife
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        style={{ fontSize: 15, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", marginTop: 8, opacity: 0.92 }}
      >
        Build with discipline
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3, duration: 0.6 }}
        style={{ position: "absolute", bottom: 44, fontSize: 13, letterSpacing: 1, opacity: 0.8 }}
      >
        by Apurva
      </motion.div>

      {/* progress underline */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 120 }}
        transition={{ delay: 1, duration: 1.3, ease: "easeInOut" }}
        style={{ height: 3, background: "rgba(255,255,255,0.85)", borderRadius: 3, marginTop: 30 }}
      />
    </motion.div>
  );
}
