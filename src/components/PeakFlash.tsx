import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Egg #4 — brief non-blocking flash of the Zenith splash gradient.
// Triggered by the master useEasterEggs hook via a re-renderable timestamp.
export function PeakFlash({ triggerKey }: { triggerKey: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (triggerKey === 0) return;
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 700);
    return () => window.clearTimeout(t);
  }, [triggerKey]);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.35, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, times: [0, 0.35, 1] }}
          style={{
            position: "fixed", inset: 0, zIndex: 300,
            pointerEvents: "none",
            background: "linear-gradient(135deg,#1a0509 0%,#6e0f1c 55%,#ff2740 100%)",
          }}
        />
      )}
    </AnimatePresence>
  );
}
