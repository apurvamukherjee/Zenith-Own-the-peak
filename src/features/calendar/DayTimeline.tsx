import { useMemo, useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TbFocus2, TbGripVertical } from "react-icons/tb";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { useTaskLists, completeTask, updateTask } from "../../features/tasks/useTasks";
import type { TaskDto, TaskListDto } from "../../db/types";
import { hapticLight } from "../../lib/haptics";

const HOUR_H = 60; // px per hour
const SNAP = 15;   // snap to 15-min grid
const START_HOUR = 5; // timeline starts at 5am
const END_HOUR = 23;  // ends at 11pm
const TOTAL_H = (END_HOUR - START_HOUR) * HOUR_H;

interface Props {
  date: string;
  onFocus?: (task: TaskDto) => void;
}

export function DayTimeline({ date, onFocus }: Props) {
  const lists = useTaskLists();
  const listMap = useMemo(() => new Map(lists.map((l) => [l.id, l])), [lists]);

  const tasks = useLiveQuery(
    () => db.tasks.where("date").equals(date).toArray(),
    [date],
  ) ?? [];

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current hour on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const h = new Date().getHours();
    const offset = Math.max(0, (h - START_HOUR - 1) * HOUR_H);
    scrollRef.current.scrollTop = offset;
  }, [date]);

  // Split: timed tasks (have time field) vs unscheduled
  const timed = tasks.filter((t) => t.time && t.status !== "cancelled");
  const unscheduled = tasks.filter((t) => !t.time && t.status !== "cancelled" && t.status !== "done");

  // Hours grid
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  return (
    <div style={{ marginTop: 16 }}>
      <div className="gothic-eyebrow" style={{ marginBottom: 8 }}>
        {new Date(date + "T00:00").toLocaleDateString("en", { weekday: "long", day: "numeric", month: "short" })}
      </div>

      {/* Scrollable timeline */}
      <div ref={scrollRef} style={{
        position: "relative", height: 360, overflowY: "auto",
        background: "var(--surface)", borderRadius: 14,
        border: "1px solid var(--border)",
      }}>
        {/* Hour lines */}
        <div style={{ position: "relative", height: TOTAL_H }}>
          {hours.map((h) => {
            const top = (h - START_HOUR) * HOUR_H;
            return (
              <div key={h} style={{ position: "absolute", top, left: 0, right: 0, height: HOUR_H }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 1,
                  background: "var(--border)", opacity: 0.5,
                }} />
                <span style={{
                  position: "absolute", top: 2, left: 8,
                  fontSize: 10, color: "var(--ink-soft)", fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {String(h).padStart(2, "0")}:00
                </span>
              </div>
            );
          })}

          {/* Now indicator */}
          {isToday(date) && (() => {
            const now = new Date();
            const mins = (now.getHours() - START_HOUR) * 60 + now.getMinutes();
            if (mins < 0 || mins > TOTAL_H) return null;
            return (
              <div style={{
                position: "absolute", top: mins, left: 42, right: 8, height: 2,
                background: "var(--accent)", borderRadius: 1, zIndex: 5,
              }}>
                <div style={{
                  position: "absolute", left: -5, top: -4, width: 10, height: 10,
                  borderRadius: "50%", background: "var(--accent)",
                }} />
              </div>
            );
          })()}

          {/* Time blocks */}
          {timed.map((task) => (
            <TimeBlock key={task.id} task={task} list={listMap.get(task.listId)} onFocus={onFocus} />
          ))}
        </div>
      </div>

      {/* Unscheduled tasks */}
      {unscheduled.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 6, fontWeight: 600 }}>
            UNSCHEDULED ({unscheduled.length})
          </div>
          {unscheduled.map((t) => {
            const list = listMap.get(t.listId);
            return (
              <div key={t.id} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                marginBottom: 3, borderRadius: 8, background: "var(--surface)",
                border: "1px solid var(--border)", borderLeft: `3px solid ${list?.color ?? "var(--border)"}`,
              }}>
                <button onClick={() => t.id && completeTask(t.id)}
                  style={{
                    width: 18, height: 18, borderRadius: 4,
                    border: `2px solid ${list?.color ?? "var(--ink-soft)"}`,
                    background: "transparent", cursor: "pointer", flexShrink: 0,
                  }} />
                <span style={{ fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.priority === 1 && <span style={{ color: "#ff2740" }}>● </span>}
                  {t.title}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function TimeBlock({ task, list, onFocus }: { task: TaskDto; list?: TaskListDto; onFocus?: (t: TaskDto) => void }) {
  const [dragging, setDragging] = useState(false);
  const color = list?.color ?? "var(--accent)";
  const [h, m] = (task.time ?? "09:00").split(":").map(Number);
  const top = (h - START_HOUR) * 60 + m;

  let height = 30; // default point-event height
  if (task.endTime) {
    const [eh, em] = task.endTime.split(":").map(Number);
    height = Math.max(20, (eh * 60 + em) - (h * 60 + m));
  }
  const isBlock = height > 30;
  const done = task.status === "done";

  async function handleDragEnd(_: any, info: { offset: { y: number } }) {
    setDragging(false);
    if (!task.id) return;
    const newTop = Math.max(0, Math.min(TOTAL_H - height, top + info.offset.y));
    const snapped = Math.round(newTop / SNAP) * SNAP;
    const newH = START_HOUR + Math.floor(snapped / 60);
    const newM = snapped % 60;
    const newTime = `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;

    // Also shift endTime by the same delta
    let newEndTime: string | undefined;
    if (task.endTime) {
      const delta = snapped - top;
      const [oeh, oem] = task.endTime.split(":").map(Number);
      const endSnapped = oeh * 60 + oem + delta;
      newEndTime = `${String(Math.floor(endSnapped / 60) % 24).padStart(2, "0")}:${String(endSnapped % 60).padStart(2, "0")}`;
    }

    await updateTask(task.id, { time: newTime, endTime: newEndTime });
    hapticLight();
  }

  return (
    <motion.div
      drag="y"
      dragMomentum={false}
      dragElastic={0}
      onDragStart={() => setDragging(true)}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.02, zIndex: 20 }}
      style={{
        position: "absolute",
        top, left: 48, right: 8,
        height: Math.max(20, height),
        background: done ? "var(--border)" : `${color}20`,
        borderLeft: `3px solid ${done ? "var(--ink-soft)" : color}`,
        borderRadius: 6,
        padding: "2px 8px",
        cursor: "grab",
        zIndex: dragging ? 20 : 2,
        display: "flex", alignItems: "flex-start", gap: 4,
        overflow: "hidden",
        opacity: done ? 0.5 : 1,
      }}
    >
      <TbGripVertical size={12} style={{ color: "var(--ink-soft)", marginTop: 3, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 11, fontWeight: 700,
          color: done ? "var(--ink-soft)" : color,
          textDecoration: done ? "line-through" : "none",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {task.priority === 1 && "● "}{task.title}
        </div>
        {isBlock && (
          <div style={{ fontSize: 9, color: "var(--ink-soft)" }}>
            {task.time}–{task.endTime} · {height}min
          </div>
        )}
      </div>
      {!done && onFocus && isBlock && (
        <button onClick={(e) => { e.stopPropagation(); onFocus(task); }}
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, color: "var(--ink-soft)" }}>
          <TbFocus2 size={14} />
        </button>
      )}
    </motion.div>
  );
}

function isToday(date: string): boolean {
  return date === new Date().toISOString().slice(0, 10);
}
