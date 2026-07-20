import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TbX, TbCheck, TbBarbell, TbBook2 } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import { completeTask } from "../features/tasks/useTasks";
import type { TaskDto } from "../db/types";
import { hapticSuccess } from "../lib/haptics";

// Focus mode — fullscreen countdown for a time-block task.
// Links to Session Logger for gym blocks, Study for study blocks.
// "Done early" completes the task + records actual duration.
interface Props { task: TaskDto | null; onClose: () => void; }

export function FocusMode({ task, onClose }: Props) {
  const nav = useNavigate();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!task) return;
    setElapsed(0);
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [task?.id]);

  if (!task || !task.time) return null;

  const [h, m] = task.time.split(":").map(Number);
  const [eh, em] = (task.endTime ?? task.time).split(":").map(Number);
  const totalSec = Math.max(60, ((eh * 60 + em) - (h * 60 + m)) * 60);
  const remaining = Math.max(0, totalSec - elapsed);
  const pct = totalSec > 0 ? ((totalSec - remaining) / totalSec) * 100 : 0;

  const remH = Math.floor(remaining / 3600);
  const remM = Math.floor((remaining % 3600) / 60);
  const remS = remaining % 60;

  const isGym = task.listId === "gym";
  const isStudy = task.listId === "study" || task.listId === "learn";

  async function handleDoneEarly() {
    if (task?.id) { await completeTask(task.id); hapticSuccess(); }
    onClose();
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0, zIndex: 9998,
          background: "radial-gradient(circle at 50% 35%, #1a0509 0%, #08060a 70%)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          color: "#f3eef2", padding: 24,
        }}
      >
        {/* Close */}
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16,
          background: "transparent", border: "none", color: "var(--ink-soft)", cursor: "pointer",
        }}>
          <TbX size={24} />
        </button>

        {/* Task title */}
        <div style={{
          fontFamily: '"Cinzel", serif', fontWeight: 700,
          fontSize: 14, letterSpacing: "0.2em", textTransform: "uppercase",
          color: "#948b98", marginBottom: 24,
        }}>
          {task.title}
        </div>

        {/* Circular progress ring */}
        <div style={{ position: "relative", width: 200, height: 200, marginBottom: 24 }}>
          <svg viewBox="0 0 200 200" width="200" height="200">
            <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
            <circle cx="100" cy="100" r="90" fill="none"
              stroke="#ff2740" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 90}
              strokeDashoffset={2 * Math.PI * 90 * (1 - pct / 100)}
              transform="rotate(-90 100 100)"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}>
            <div className="display" style={{
              fontSize: 42, fontWeight: 800, lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}>
              {remH > 0 && `${remH}:`}{String(remM).padStart(2, "0")}:{String(remS).padStart(2, "0")}
            </div>
            <div style={{ fontSize: 11, color: "#948b98", marginTop: 4 }}>remaining</div>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div style={{
            fontSize: 13, color: "#948b98", maxWidth: 300, textAlign: "center",
            marginBottom: 20, lineHeight: 1.5,
          }}>
            {task.description}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {isGym && (
            <button onClick={() => { onClose(); nav("/workout"); }} style={{
              background: "#ff2740", color: "#fff", border: "none", borderRadius: 12,
              padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <TbBarbell size={16} /> Start workout
            </button>
          )}
          {isStudy && (
            <button onClick={() => { onClose(); nav("/study"); }} style={{
              background: "#ff2740", color: "#fff", border: "none", borderRadius: 12,
              padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <TbBook2 size={16} /> Start studying
            </button>
          )}
          <button onClick={handleDoneEarly} style={{
            background: "rgba(255,255,255,0.1)", color: "#f3eef2", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 12, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <TbCheck size={16} /> Done early
          </button>
        </div>

        {remaining === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: 24, fontWeight: 700, color: "#ff2740", fontSize: 16 }}>
            Time's up — mark as done?
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
