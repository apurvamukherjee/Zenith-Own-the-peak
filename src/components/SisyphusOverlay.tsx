import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { setSetting } from "../hooks/useSettings";

// Egg #11 — plays when the user long-presses the discipline ring for 8s.
// Duration ≈ 2.4 s: a stone-boulder SVG rolls up a slope while a caption
// fades in. On mount, we persist eggSisyphus=1 so the achievement resolves.
export function SisyphusOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    void setSetting("eggSisyphus", 1);
    const t = window.setTimeout(onClose, 2400);
    return () => window.clearTimeout(t);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "fixed", inset: 0, zIndex: 260,
            background: "rgba(0,0,0,0.72)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <svg viewBox="0 0 240 140" width="220" height="130" aria-hidden>
            {/* Slope */}
            <path d="M20 128 L220 24" stroke="#5a4a52" strokeWidth={2} fill="none" />
            {/* Ground line */}
            <path d="M0 130 L240 130" stroke="#3a2f36" strokeWidth={1} fill="none" />
            {/* The stone: starts bottom-left, rolls up-right */}
            <motion.g
              initial={{ x: 0, y: 0, rotate: 0 }}
              animate={{ x: 170, y: -90, rotate: 720 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
            >
              <circle cx={28} cy={118} r={11} fill="none" stroke="#e5d8dc" strokeWidth={2} />
              <path d="M22 114 L28 118 L26 122 M32 116 L36 120" stroke="#b8a8ad" strokeWidth={1.4} fill="none" />
            </motion.g>
          </svg>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            style={{
              color: "#f3eef2", fontStyle: "italic",
              marginTop: 12, fontSize: 14, letterSpacing: 0.4,
              textShadow: "0 2px 12px rgba(0,0,0,0.6)",
            }}
          >
            "One must imagine Sisyphus happy."
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
