import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Progress } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useTokens } from "../../hooks/useTokens";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

// Floating rest countdown. `trigger` is a changing key; each new value (with
// its seconds) restarts the timer.
export function RestTimer({ trigger }: { trigger: { key: number; seconds: number } | null }) {
  const t = useTokens();
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!trigger) return;
    setTotal(trigger.seconds);
    setRemaining(trigger.seconds);
    setOpen(true);
  }, [trigger?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (intervalRef.current) window.clearInterval(intervalRef.current);
          if (navigator.vibrate) navigator.vibrate(200);
          setTimeout(() => setOpen(false), 800);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [open, trigger?.key]);

  const pct = total ? ((total - remaining) / total) * 100 : 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          style={{
            position: "sticky", bottom: 68, margin: "0 12px", zIndex: 20,
            background: "#fff", borderRadius: 16, padding: "12px 16px",
            boxShadow: "0 8px 30px rgba(80,60,180,0.18)",
            display: "flex", alignItems: "center", gap: 14,
          }}
        >
          <Progress
            type="circle" percent={pct} size={44}
            strokeColor={remaining === 0 ? t.teal : t.accent}
            format={() => <span style={{ fontSize: 12, fontWeight: 700 }}>{fmt(remaining)}</span>}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{remaining === 0 ? "Rest done — go!" : "Resting"}</div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Recover for your next set</div>
          </div>
          <Button type="text" icon={<CloseOutlined />} onClick={() => setOpen(false)} aria-label="Skip rest" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
