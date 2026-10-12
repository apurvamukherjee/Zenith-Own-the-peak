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
      style={{ position: "relative", margin: "0 12px 12px",
        background: "var(--surface-2)", color: "var(--ink)", border: "1px solid var(--accent)", borderRadius: 14, padding: "12px 14px",
        boxShadow: "0 8px 24px -12px var(--ember-glow)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontWeight: 800, fontSize: 13 }}>{current + 1}/{steps.length} — {s.title}</span>
        <button onClick={onDone} aria-label="Dismiss tip" style={{ background: "none", border: "none", color: "var(--ink-soft)", cursor: "pointer", minWidth: 40, minHeight: 40 }}><TbX /></button>
      </div>
      <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 10 }}>{s.body}</div>
      <button onClick={isLast ? onDone : onNext}
        style={{ background: "var(--accent)", border: "none", color: "#fff", borderRadius: 10,
          minHeight: 40, padding: "0 18px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
        {isLast ? "Got it!" : "Next →"}
      </button>
    </motion.div>
  );
}
