// Shared hour-grid primitives used by both DayTimeline (single day, Phase 6)
// and WeekView (Phase 7, 7-day grid). Keeping the drag-to-reschedule block,
// hour lines, and "now" indicator in one place means both views stay
// pixel-identical and a future timing tweak only has to happen once.
import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode, CSSProperties } from "react";
import { motion } from "framer-motion";
import { TbFocus2, TbGripVertical, TbCheck } from "react-icons/tb";
import { updateTask } from "../tasks/useTasks";
import type { TaskDto, TaskListDto } from "../../db/types";
import { hapticLight } from "../../lib/haptics";
import { useTokens } from "../../hooks/useTokens";

export const HOUR_H = 60; // px per hour
export const SNAP = 15;   // snap to 15-min grid
export const START_HOUR = 5; // grid starts at 5am
export const END_HOUR = 23;  // ends at 11pm
export const TOTAL_H = (END_HOUR - START_HOUR) * HOUR_H;

export function isToday(date: string): boolean {
  return date === new Date().toISOString().slice(0, 10);
}

// pointerEvents: "none" throughout — these are purely decorative and must not
// intercept taps, otherwise TimeGridColumn can never see an "empty space" tap
// (there'd always be some hour-row div directly under the pointer).
export function HourGridLines({ showLabels = true }: { showLabels?: boolean }) {
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  return (
    <div style={{ pointerEvents: "none" }}>
      {hours.map((h) => {
        const top = (h - START_HOUR) * HOUR_H;
        return (
          <div key={h} style={{ position: "absolute", top, left: 0, right: 0, height: HOUR_H }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "var(--border)", opacity: 0.5 }} />
            {showLabels && (
              <span style={{
                position: "absolute", top: 2, left: 8,
                fontSize: 10, color: "var(--ink-soft)", fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
              }}>
                {String(h).padStart(2, "0")}:00
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// The moving "now" line. `left`/`right` let a caller confine it to one day
// column in WeekView, or the whole width (minus the hour gutter) in DayTimeline.
export function NowIndicator({ date, left = 42, right = 8 }: { date: string; left?: number; right?: number }) {
  if (!isToday(date)) return null;
  const now = new Date();
  const mins = (now.getHours() - START_HOUR) * 60 + now.getMinutes();
  if (mins < 0 || mins > TOTAL_H) return null;
  return (
    <div style={{ position: "absolute", top: mins, left, right, height: 2, background: "var(--accent)", borderRadius: 1, zIndex: 5, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: -4, top: -4, width: 10, height: 10, borderRadius: "50%", background: "var(--accent)" }} />
    </div>
  );
}

function snapMinutes(y: number): number {
  const snapped = Math.round(y / SNAP) * SNAP;
  return Math.max(0, Math.min(TOTAL_H - 15, snapped));
}
function minutesToTime(mins: number): string {
  const h = START_HOUR + Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const LONG_PRESS_MS = 400;
const MOVE_CANCEL_PX = 8;

// Wraps one day's grid column (used once per day, including in WeekView's
// 7-column layout). Long-press-then-drag on empty space stakes out a new
// time-blocked event (mirrors the Month view's existing long-press-for-range
// gesture, so a quick tap/scroll never gets misread as event creation). A
// plain quick tap on empty space (no hold) fires `onEmptyTap` instead, e.g.
// WeekView uses it to drill into Day view.
export function TimeGridColumn({ date, onCreateAt, onEmptyTap, style, children }: {
  date: string;
  onCreateAt?: (date: string, time: string, endTime: string) => void;
  onEmptyTap?: () => void;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const t = useTokens();
  const pressTimer = useRef<number | null>(null);
  const startYRef = useRef(0);
  const [dragRange, setDragRange] = useState<{ start: number; end: number } | null>(null);

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget || !onCreateAt) return;
    const rect = e.currentTarget.getBoundingClientRect();
    startYRef.current = e.clientY - rect.top;
    pressTimer.current = window.setTimeout(() => {
      hapticLight();
      setDragRange({ start: startYRef.current, end: startYRef.current });
    }, LONG_PRESS_MS);
  }
  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    if (pressTimer.current && !dragRange) {
      if (Math.abs(y - startYRef.current) > MOVE_CANCEL_PX) {
        window.clearTimeout(pressTimer.current);
        pressTimer.current = null;
      }
      return;
    }
    if (!dragRange) return;
    setDragRange((d) => (d ? { ...d, end: y } : d));
  }
  function endDrag() {
    if (dragRange) {
      const a = snapMinutes(Math.min(dragRange.start, dragRange.end));
      const bRaw = snapMinutes(Math.max(dragRange.start, dragRange.end));
      const b = Math.max(a + 30, bRaw);
      setDragRange(null);
      onCreateAt?.(date, minutesToTime(a), minutesToTime(b));
      return;
    }
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
      onEmptyTap?.();
    }
  }
  function cancelPress() {
    if (pressTimer.current) { window.clearTimeout(pressTimer.current); pressTimer.current = null; }
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerLeave={cancelPress}
      style={{ position: "relative", ...style }}
    >
      {children}
      {dragRange && (() => {
        const top = Math.min(dragRange.start, dragRange.end);
        const h = Math.max(30, Math.abs(dragRange.end - dragRange.start));
        return (
          <div style={{
            position: "absolute", top, left: 2, right: 2, height: h,
            background: `${t.accent}25`, border: `2px dashed ${t.accent}`,
            borderRadius: 6, zIndex: 15, pointerEvents: "none",
          }} />
        );
      })()}
    </div>
  );
}

interface TimeBlockProps {
  task: TaskDto;
  list?: TaskListDto;
  onFocus?: (t: TaskDto) => void;
  onTap?: (t: TaskDto) => void;
  onToggleDone?: (t: TaskDto) => void;
  insetLeft?: number;
  insetRight?: number;
  compact?: boolean;
}

export function TimeBlock({ task, list, onFocus, onTap, onToggleDone, insetLeft = 48, insetRight = 8, compact = false }: TimeBlockProps) {
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

  async function handleDragEnd(_: unknown, info: { offset: { y: number } }) {
    setDragging(false);
    if (!task.id) return;
    const newTop = Math.max(0, Math.min(TOTAL_H - height, top + info.offset.y));
    const snapped = Math.round(newTop / SNAP) * SNAP;
    const newH = START_HOUR + Math.floor(snapped / 60);
    const newM = snapped % 60;
    const newTime = `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;

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
      layout
      drag="y"
      dragMomentum={false}
      dragElastic={0}
      onDragStart={() => setDragging(true)}
      onDragEnd={handleDragEnd}
      onClick={() => onTap?.(task)}
      whileDrag={{ scale: 1.03, zIndex: 20, boxShadow: "0 6px 20px rgba(0,0,0,0.35)" }}
      transition={{ type: "spring", damping: 30, stiffness: 400 }}
      style={{
        position: "absolute",
        top, left: insetLeft, right: insetRight,
        height: Math.max(20, height),
        background: done ? "var(--border)" : `${color}20`,
        borderLeft: `3px solid ${done ? "var(--ink-soft)" : color}`,
        borderRadius: 6,
        padding: compact ? "1px 4px" : "2px 8px",
        cursor: onTap ? "pointer" : "grab",
        zIndex: dragging ? 20 : 2,
        display: "flex", alignItems: "flex-start", gap: 4,
        overflow: "hidden",
        opacity: done ? 0.5 : 1,
      }}
    >
      {!compact && onToggleDone && (
        <button onClick={(e) => { e.stopPropagation(); onToggleDone(task); }} style={{
          width: 14, height: 14, borderRadius: 4, flexShrink: 0, marginTop: 2,
          border: `2px solid ${done ? "var(--teal)" : color}`,
          background: done ? "var(--teal)" : "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
        }}>
          {done && <TbCheck size={9} style={{ color: "#fff" }} />}
        </button>
      )}
      {!compact && !onToggleDone && <TbGripVertical size={12} style={{ color: "var(--ink-soft)", marginTop: 3, flexShrink: 0 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: compact ? 10 : 11, fontWeight: 700,
          color: done ? "var(--ink-soft)" : color,
          textDecoration: done ? "line-through" : "none",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {task.priority === 1 && "● "}{task.title}
        </div>
        {isBlock && !compact && (
          <div style={{ fontSize: 9, color: "var(--ink-soft)" }}>
            {task.time}–{task.endTime} · {height}min
          </div>
        )}
      </div>
      {!done && onFocus && isBlock && !compact && (
        <button onClick={(e) => { e.stopPropagation(); onFocus(task); }}
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, color: "var(--ink-soft)" }}>
          <TbFocus2 size={14} />
        </button>
      )}
      {!compact && !done && <ResizeHandle task={task} top={top} height={height} />}
    </motion.div>
  );
}

// Drag the bottom edge to change duration (endTime only — start stays put).
// A nested draggable inside an already-draggable TimeBlock: stopping
// propagation on pointerdown keeps the parent's move-drag from also engaging.
function ResizeHandle({ task, top, height }: { task: TaskDto; top: number; height: number }) {
  const [dragging, setDragging] = useState(false);

  async function handleDragEnd(_: unknown, info: { offset: { y: number } }) {
    setDragging(false);
    if (!task.id || !task.time) return;
    const rawHeight = height + info.offset.y;
    const snappedHeight = Math.max(15, Math.round(rawHeight / SNAP) * SNAP);
    const endMin = Math.min(TOTAL_H, top + snappedHeight);
    const newEndTime = minutesToTime(Math.max(top + 15, endMin));
    await updateTask(task.id, { endTime: newEndTime });
    hapticLight();
  }

  return (
    <motion.div
      drag="y"
      dragMomentum={false}
      dragElastic={0}
      onPointerDown={(e) => e.stopPropagation()}
      onDragStart={() => setDragging(true)}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.15 }}
      style={{
        position: "absolute", bottom: -3, left: "50%", marginLeft: -14,
        width: 28, height: 7, borderRadius: 4,
        background: "var(--ink-soft)", opacity: dragging ? 1 : 0.4,
        cursor: "ns-resize", zIndex: 25, touchAction: "none",
      }}
    />
  );
}
