import { useState, useMemo } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Button } from "antd";
import {
  TbCheck, TbPlus, TbClock, TbMapPin, TbAlertTriangle,
  TbChevronLeft, TbChevronRight, TbFocus2, TbBarbell, TbAdjustmentsHorizontal,
} from "react-icons/tb";
import { useLiveQuery } from "dexie-react-hooks";
import dayjs from "dayjs";
import { db } from "../../db/db";
import { useTaskLists, addTask } from "../tasks/useTasks";
import { parseTaskInput } from "../../lib/taskParser";
import { hapticLight, hapticSuccess } from "../../lib/haptics";
import { useGymOverlay } from "./useGymOverlay";
import { useMealCompletion } from "./useMealCompletion";
import { EventEditorSheet } from "./EventEditorSheet";
import { FoodPickerModal } from "../nutrition/FoodPickerModal";
import { useTokens } from "../../hooks/useTokens";
import type { TaskDto } from "../../db/types";

function inferMealType() {
  const h = new Date().getHours();
  if (h < 11) return "breakfast" as const;
  if (h < 15) return "lunch" as const;
  if (h < 21) return "dinner" as const;
  return "snack" as const;
}

interface Props {
  date: string | null;
  onClose: () => void;
  onDateChange: (date: string) => void;
  onFocus?: (task: TaskDto) => void;
  onGymTap?: (date: string, dayId: number, done: boolean) => void;
}

const SWIPE_THRESHOLD = 80;
const VELOCITY_THRESHOLD = 300;

export function DayTaskSheet({ date, onClose, onDateChange, onFocus, onGymTap }: Props) {
  const t = useTokens();
  const lists = useTaskLists();
  const listMap = useMemo(() => new Map(lists.map((l) => [l.id, l])), [lists]);
  const [input, setInput] = useState("");
  const gymDates = useMemo(() => (date ? [date] : []), [date]);
  const gymOverlay = useGymOverlay(gymDates);
  const gym = date ? gymOverlay.get(date) : undefined;
  const meal = useMealCompletion();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTask, setEditorTask] = useState<TaskDto | undefined>(undefined);

  // Preload: selected day + adjacent days
  const prev = date ? dayjs(date).subtract(1, "day").format("YYYY-MM-DD") : "";
  const next = date ? dayjs(date).add(1, "day").format("YYYY-MM-DD") : "";
  const queryDates = useMemo(() => [prev, date ?? "", next].filter(Boolean), [prev, date, next]);

  const allTasks = useLiveQuery(
    (): Promise<TaskDto[]> => date ? db.tasks.where("date").anyOf(queryDates).toArray() : Promise.resolve([]),
    [queryDates.join(",")],
  ) ?? [];

  const dayTasks = useMemo(() =>
    allTasks.filter((t) => t.date === date && t.status !== "cancelled")
      .sort((a, b) => {
        if (a.status === "done" && b.status !== "done") return 1;
        if (a.status !== "done" && b.status === "done") return -1;
        if (a.time && b.time) return a.time.localeCompare(b.time);
        if (a.time) return -1;
        if (b.time) return 1;
        return a.priority - b.priority;
      }),
    [allTasks, date],
  );

  // Overdue tasks (past dates, still todo)
  const overdue = useLiveQuery(async (): Promise<TaskDto[]> => {
    if (!date) return [];
    const today = dayjs().format("YYYY-MM-DD");
    if (date !== today) return [];
    const pastTasks = await db.tasks.where("status").equals("todo").toArray();
    return pastTasks.filter((t) => t.date && t.date < today);
  }, [date]) ?? [];

  const doneCount = dayTasks.filter((t) => t.status === "done").length;
  const totalCount = dayTasks.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  async function handleQuickAdd() {
    if (!input.trim() || !date) return;
    const parsed = parseTaskInput(input);
    if (!parsed.title) parsed.title = input.trim();
    await addTask({
      title: parsed.title,
      priority: parsed.priority ?? 2,
      listId: "daily",
      date: parsed.date ?? date, // default to selected day
      time: parsed.time,
      endTime: parsed.endTime,
      location: parsed.location,
    });
    hapticSuccess();
    setInput("");
  }

  function handleComplete(task: TaskDto) {
    hapticLight();
    meal.tryComplete(task);
  }

  function openEditor(task?: TaskDto) {
    setEditorTask(task);
    setEditorOpen(true);
  }

  // Swipe left/right to change day
  function handleHorizontalDrag(_: any, info: PanInfo) {
    if (!date) return;
    if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -VELOCITY_THRESHOLD) {
      hapticLight();
      onDateChange(next);
    } else if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > VELOCITY_THRESHOLD) {
      hapticLight();
      onDateChange(prev);
    }
  }

  // Swipe down to dismiss
  function handleVerticalDrag(_: any, info: PanInfo) {
    if (info.offset.y > 100 || info.velocity.y > 400) {
      onClose();
    }
  }

  if (!date) return null;

  const dayLabel = dayjs(date).format("ddd, MMM D");
  const isToday = date === dayjs().format("YYYY-MM-DD");

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 900 }}
      />

      {/* Sheet */}
      <motion.div
        key="sheet"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        drag="y" dragConstraints={{ top: 0 }} dragElastic={0.15}
        onDragEnd={handleVerticalDrag}
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 901,
          maxHeight: "70vh", minHeight: "40vh",
          background: "var(--surface)",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -8px 30px rgba(0,0,0,0.3)",
          display: "flex", flexDirection: "column",
          paddingBottom: "max(16px, env(safe-area-inset-bottom))",
        }}
      >
        {/* Handle bar */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border)" }} />
        </div>

        {/* Header: date nav + progress */}
        <motion.div
          drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.3}
          onDragEnd={handleHorizontalDrag}
          style={{ padding: "0 16px 10px", borderBottom: "1px solid var(--border)" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <button onClick={() => { hapticLight(); onDateChange(prev); }}
              style={{ background: "transparent", border: "none", color: "var(--ink-soft)", cursor: "pointer", padding: 4 }}>
              <TbChevronLeft size={20} />
            </button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>
                {isToday ? "Today" : dayLabel}
              </div>
              {totalCount > 0 && (
                <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                  {doneCount} of {totalCount} done · {pct}%
                </div>
              )}
            </div>
            <button onClick={() => { hapticLight(); onDateChange(next); }}
              style={{ background: "transparent", border: "none", color: "var(--ink-soft)", cursor: "pointer", padding: 4 }}>
              <TbChevronRight size={20} />
            </button>
          </div>

          {/* Progress bar */}
          {totalCount > 0 && (
            <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2,
                background: pct === 100 ? "var(--teal)" : "var(--accent)",
                width: `${pct}%`, transition: "width 400ms ease-out",
              }} />
            </div>
          )}
        </motion.div>

        {/* Gym-day overlay chip — synthetic, derived from the planned split */}
        {gym && (
          <div style={{ padding: "8px 16px 0" }}>
            <button onClick={() => date && onGymTap?.(date, gym.dayId, gym.done)} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              background: `${gym.done ? t.teal : t.accent}22`,
              border: `1px solid ${gym.done ? t.teal : t.accent}40`,
              borderRadius: 10, padding: "8px 12px", cursor: "pointer", textAlign: "left",
            }}>
              <TbBarbell size={15} style={{ color: gym.done ? t.teal : t.accent }} />
              <span style={{ flex: 1, fontSize: 12, fontWeight: 700 }}>{gym.dayName}</span>
              <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>{gym.done ? "Done ✓" : "Planned"}</span>
            </button>
          </div>
        )}

        {/* Quick add */}
        <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
              placeholder={`Add task for ${isToday ? "today" : dayLabel}...`}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: "var(--ink)", fontSize: 13, fontFamily: "inherit",
              }} />
            <Button type="primary" size="small" icon={<TbPlus />}
              onClick={handleQuickAdd} disabled={!input.trim()} style={{ borderRadius: 8 }} />
            <Button size="small" icon={<TbAdjustmentsHorizontal />} aria-label="More options"
              onClick={() => openEditor(undefined)} style={{ borderRadius: 8 }} />
          </div>
        </div>

        {/* Overdue banner */}
        {overdue.length > 0 && (
          <div style={{
            margin: "8px 16px 0", padding: "8px 12px", borderRadius: 10,
            background: "#ff274015", border: "1px solid #ff274030",
            display: "flex", alignItems: "center", gap: 8, fontSize: 12,
          }}>
            <TbAlertTriangle size={16} style={{ color: "#ff2740", flexShrink: 0 }} />
            <span style={{ color: "#ff2740", fontWeight: 600 }}>{overdue.length} overdue</span>
            <span style={{ color: "var(--ink-soft)", fontSize: 11 }}>from previous days</span>
          </div>
        )}

        {/* Task list (scrollable) */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px", WebkitOverflowScrolling: "touch" }}>
          {dayTasks.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--ink-soft)", fontSize: 13 }}>
              Nothing scheduled
            </div>
          )}

          {dayTasks.map((task) => {
            const list = listMap.get(task.listId);
            const done = task.status === "done";
            const hasTimeBlock = task.time && task.endTime;
            return (
              <motion.div key={task.id} layout
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 10px", marginBottom: 4, borderRadius: 10,
                  background: done ? "transparent" : "var(--bg)",
                  border: done ? "1px solid transparent" : "1px solid var(--border)",
                  borderLeft: done ? "3px solid transparent" : `3px solid ${list?.color ?? "var(--border)"}`,
                  opacity: done ? 0.45 : 1,
                }}>
                {/* Checkbox */}
                <button onClick={(e) => { e.stopPropagation(); if (!done) handleComplete(task); }}
                  style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${done ? "var(--teal)" : (task.priority === 1 ? "#ff2740" : "var(--ink-soft)")}`,
                    background: done ? "var(--teal)" : "transparent",
                    cursor: done ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                  {done && <TbCheck size={12} style={{ color: "#fff" }} />}
                </button>

                {/* Content — tap to edit */}
                <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => openEditor(task)}>
                  <div style={{
                    fontSize: 13, fontWeight: 600,
                    textDecoration: done ? "line-through" : "none",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {task.priority === 1 && !done && <span style={{ color: "#ff2740" }}>● </span>}
                    {task.title}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--ink-soft)", display: "flex", gap: 6, marginTop: 1 }}>
                    {task.time && (
                      <span><TbClock size={10} style={{ verticalAlign: "-1px" }} /> {task.time}{task.endTime ? `–${task.endTime}` : ""}</span>
                    )}
                    {task.location && (
                      <span><TbMapPin size={10} style={{ verticalAlign: "-1px" }} /> {task.location}</span>
                    )}
                    {list && (
                      <span style={{ color: list.color }}>{list.name}</span>
                    )}
                  </div>
                </div>

                {/* Focus button for time blocks */}
                {hasTimeBlock && !done && onFocus && (
                  <button onClick={() => onFocus(task)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, color: "var(--ink-soft)" }}>
                    <TbFocus2 size={16} />
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <EventEditorSheet
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        task={editorTask}
        defaultDate={date ?? undefined}
        onComplete={meal.tryComplete}
      />
      <FoodPickerModal
        open={!!meal.foodPickerTask}
        onClose={meal.closeFoodPicker}
        date={meal.foodPickerTask?.date}
        defaultMealType={inferMealType()}
        title="Log this meal"
      />
    </AnimatePresence>
  );
}
