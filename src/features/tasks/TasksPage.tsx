import { useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Tag, App, Select } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import {
  TbPlus, TbCheck, TbCalendar, TbFlag,
  TbMapPin, TbUser,
  TbBriefcase, TbHome, TbBarbell, TbShoppingCart, TbCash, TbPill,
  TbShoppingBag, TbClock, TbMotorbike, TbCapsule, TbToolsKitchen2, TbBook2,
} from "react-icons/tb";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { EmptyState } from "../../components/EmptyState";
import { ColdIcon } from "../../components/ColdIcon";
import {
  useTaskLists, useTodayTasks, useUpcomingTasks, useTaskCountByList,
  addTask,
} from "./useTasks";
import { TaskListView } from "./TaskListView";
import { parseTaskInput } from "../../lib/taskParser";
import { hapticSuccess } from "../../lib/haptics";
import { prettyDate } from "../../lib/date.utils";
import { EventEditorSheet } from "../calendar/EventEditorSheet";
import { FoodPickerModal } from "../nutrition/FoodPickerModal";
import { useMealCompletion } from "../calendar/useMealCompletion";
import type { TaskDto, TaskListDto } from "../../db/types";

function inferMealType() {
  const h = new Date().getHours();
  if (h < 11) return "breakfast" as const;
  if (h < 15) return "lunch" as const;
  if (h < 21) return "dinner" as const;
  return "snack" as const;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  TbBriefcase, TbHome, TbBarbell, TbShoppingCart, TbCash, TbPill, TbShoppingBag, TbMotorbike,
  TbCapsule, TbToolsKitchen2, TbBook2,
};

const PRIORITY_LABEL: Record<number, { label: string; color: string }> = {
  1: { label: "Urgent", color: "#ff2740" },
  2: { label: "Normal", color: "var(--ink-soft)" },
  3: { label: "Low", color: "var(--teal)" },
};

export function TasksPage() {
  // If ?list=X is in the URL, show the filtered list/kanban view instead of hub
  const [params] = useSearchParams();
  if (params.has("list")) return <TaskListView />;

  return <TaskHub />;
}

function TaskHub() {
  const { message } = App.useApp();
  const lists = useTaskLists();
  const todayTasks = useTodayTasks();
  const upcoming = useUpcomingTasks();
  const counts = useTaskCountByList();
  const [input, setInput] = useState("");
  const [selectedList, setSelectedList] = useState("daily");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTask, setEditorTask] = useState<TaskDto | undefined>(undefined);
  const meal = useMealCompletion();
  const inputRef = useRef<HTMLInputElement>(null);

  function openEditor(task?: TaskDto) {
    setEditorTask(task);
    setEditorOpen(true);
  }

  async function handleQuickAdd() {
    const text = input.trim();
    if (!text) return;
    const parsed = parseTaskInput(text);
    if (!parsed.title) parsed.title = text;
    await addTask({
      title: parsed.title,
      priority: parsed.priority ?? 2,
      listId: selectedList,
      date: parsed.date,
      time: parsed.time,
      endTime: parsed.endTime,
      location: parsed.location,
    });
    hapticSuccess();
    setInput("");
    message.success("Task added");
  }

  return (
    <PageTransition>
      <SectionTitle eyebrow="Get it done" title="Tasks" right={
        <Select size="small" value={selectedList} onChange={setSelectedList}
          options={lists.map((l) => ({ value: l.id, label: l.name }))}
          style={{ width: 110 }} />
      } />

      {/* Quick-add bar — always visible, zero-field entry */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 16,
        background: "var(--surface)", borderRadius: 14,
        padding: "10px 12px", border: "1px solid var(--border)",
      }}>
        <input
          ref={inputRef as any}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
          placeholder='Type "gym tomorrow 7am" or just a task name'
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: "var(--ink)", fontSize: 14, fontFamily: "inherit",
          }}
        />
        <Button type="primary" size="small" icon={<TbPlus />} onClick={handleQuickAdd}
          disabled={!input.trim()} style={{ borderRadius: 10 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -10, marginBottom: 12 }}>
        <Button size="small" type="text" onClick={() => openEditor(undefined)} style={{ fontSize: 12, color: "var(--ink-soft)" }}>
          More options (date, recurrence, reminders)…
        </Button>
      </div>

      {/* Live parse preview */}
      {input.trim().length > 3 && (() => {
        const p = parseTaskInput(input);
        const parts: string[] = [];
        if (p.date) parts.push(`📅 ${p.date}`);
        if (p.time) parts.push(`🕐 ${p.time}${p.endTime ? `–${p.endTime}` : ""}`);
        if (p.priority === 1) parts.push("🔴 urgent");
        if (p.priority === 3) parts.push("🟢 low");
        if (p.location) parts.push(`📍 ${p.location}`);
        if (p.recurring) parts.push(`🔁 ${p.recurring.frequency}`);
        return parts.length > 0 ? (
          <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: -10, marginBottom: 12, paddingLeft: 4 }}>
            Parsed: <strong>{p.title || "..."}</strong> · {parts.join(" · ")}
          </div>
        ) : null;
      })()}

      {/* Today's tasks */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span className="gothic-eyebrow">TODAY ({todayTasks.filter((t) => t.status !== "done").length})</span>
        </div>
        {todayTasks.length === 0 && (
          <EmptyState icon={<ColdIcon glyph="spark" size={60} />} title="Nothing for today" hint="Add a task above to get started" />
        )}
        <AnimatePresence>
          {todayTasks.map((t) => (
            <TaskRow key={t.id} task={t} lists={lists} onComplete={meal.tryComplete}
              onTap={() => openEditor(t)} />
          ))}
        </AnimatePresence>
      </div>

      {/* List cards grid — frosted glass with icon glow */}
      <div style={{ marginBottom: 20 }}>
        <span className="gothic-eyebrow" style={{ display: "block", marginBottom: 10 }}>LISTS</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {lists.map((l) => {
            const Icon = ICON_MAP[l.icon] ?? TbFlag;
            const count = counts.get(l.id) ?? 0;
            return (
              <Link key={l.id} to={`/tasks?list=${l.id}`} style={{ textDecoration: "none" }}>
                <div className="glass-card" style={{ padding: "16px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Icon with colored glow behind it */}
                  <div style={{
                    position: "relative", width: 44, height: 44, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {/* Glow */}
                    <div style={{
                      position: "absolute", inset: -4,
                      background: `radial-gradient(circle, ${l.color}40 0%, transparent 70%)`,
                      borderRadius: "50%", filter: "blur(4px)",
                    }} />
                    {/* Icon ring */}
                    <div style={{
                      position: "relative", width: 44, height: 44, borderRadius: 12,
                      background: `${l.color}18`,
                      border: `1px solid ${l.color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={22} style={{ color: l.color }} />
                    </div>
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 700, color: "var(--ink)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{l.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 1 }}>
                      {count > 0 ? `${count} active` : "No tasks"}
                    </div>
                  </div>

                  {/* Count badge */}
                  {count > 0 && (
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: `${l.color}20`, color: l.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, fontSize: 14, flexShrink: 0,
                    }}>
                      {count}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <span className="gothic-eyebrow" style={{ display: "block", marginBottom: 8 }}>
            UPCOMING ({upcoming.length})
          </span>
          {upcoming.slice(0, 10).map((t) => (
            <TaskRow key={t.id} task={t} lists={lists} onComplete={meal.tryComplete}
              onTap={() => openEditor(t)} showDate />
          ))}
          {upcoming.length > 10 && (
            <div style={{ fontSize: 11, color: "var(--ink-soft)", textAlign: "center", padding: 8 }}>
              +{upcoming.length - 10} more
            </div>
          )}
        </div>
      )}

      {/* Unified event editor — also the "task detail" view (tap any row) */}
      <EventEditorSheet open={editorOpen} onClose={() => setEditorOpen(false)} task={editorTask} onComplete={meal.tryComplete} />
      <FoodPickerModal open={!!meal.foodPickerTask} onClose={meal.closeFoodPicker}
        date={meal.foodPickerTask?.date} defaultMealType={inferMealType()} title="Log this meal" />
    </PageTransition>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function TaskRow({ task, lists, onComplete, onTap, showDate }: {
  task: TaskDto; lists: TaskListDto[]; onComplete: (task: TaskDto) => void;
  onTap: () => void; showDate?: boolean;
}) {
  const list = lists.find((l) => l.id === task.listId);
  const pri = PRIORITY_LABEL[task.priority] ?? PRIORITY_LABEL[2];
  const done = task.status === "done";
  return (
    <motion.div
      layout exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.2 }}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", marginBottom: 4,
        background: "var(--surface)", borderRadius: 10,
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${list?.color ?? "var(--border)"}`,
        opacity: done ? 0.5 : 1,
      }}
    >
      {/* Checkbox */}
      <button onClick={(e) => { e.stopPropagation(); onComplete(task); }}
        style={{
          width: 22, height: 22, borderRadius: 6, border: `2px solid ${pri.color}`,
          background: done ? pri.color : "transparent", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
        {done && <TbCheck size={12} style={{ color: "#fff" }} />}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={onTap}>
        <div style={{
          fontWeight: 600, fontSize: 13,
          textDecoration: done ? "line-through" : "none",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {task.priority === 1 && <span style={{ color: "#ff2740", marginRight: 4 }}>●</span>}
          {task.title}
        </div>
        <div style={{ fontSize: 10, color: "var(--ink-soft)", display: "flex", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
          {task.time && <span><TbClock size={10} style={{ verticalAlign: "-1px" }} /> {task.time}{task.endTime ? `–${task.endTime}` : ""}</span>}
          {showDate && task.date && <span><TbCalendar size={10} style={{ verticalAlign: "-1px" }} /> {prettyDate(task.date)}</span>}
          {task.location && <span><TbMapPin size={10} style={{ verticalAlign: "-1px" }} /> {task.location}</span>}
          {task.contactName && <span><TbUser size={10} style={{ verticalAlign: "-1px" }} /> {task.contactName}</span>}
        </div>
      </div>

      {/* List tag */}
      <Tag style={{ margin: 0, borderRadius: 6, fontSize: 10, background: `${list?.color}20`, color: list?.color, border: "none" }}>
        {list?.name ?? "—"}
      </Tag>
    </motion.div>
  );
}
