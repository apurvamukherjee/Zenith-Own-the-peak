import { motion } from "framer-motion";
import { TbX } from "react-icons/tb";

export function CoachMark({ steps, current, onNext, onDone }: {
  steps: { title: string; body: string }[];
  current: number;
  onNext: () => void;
  onDone: () => void;
}) {
  const s = steps[current];
  if (!s) return null;
  const isLast = current >= steps.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ position: "sticky", top: 8, zIndex: 60, margin: "0 12px 12px",
        background: "var(--accent)", color: "#fff", borderRadius: 14, padding: "14px 16px",
        boxShadow: "0 6px 24px rgba(255,39,64,0.3)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontWeight: 800, fontSize: 13 }}>{current + 1}/{steps.length} — {s.title}</span>
        <button onClick={onDone} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><TbX /></button>
      </div>
      <div style={{ fontSize: 13, opacity: 0.92, marginBottom: 10 }}>{s.body}</div>
      <button onClick={isLast ? onDone : onNext}
        style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 8,
          padding: "6px 16px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
        {isLast ? "Got it!" : "Next →"}
      </button>
    </motion.div>
  );
}
