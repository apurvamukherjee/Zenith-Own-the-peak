import { useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Tag, App, Modal, Select } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import {
  TbPlus, TbCheck, TbCalendar, 
  TbTrash, TbMapPin, TbUser, TbPhone, TbNotes, TbFlag,
  TbBriefcase, TbHome, TbBarbell, TbShoppingCart, TbCash, TbPill,
  TbShoppingBag, TbClock,
} from "react-icons/tb";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { EmptyState } from "../../components/EmptyState";
import { ColdIcon } from "../../components/ColdIcon";
import {
  useTaskLists, useTodayTasks, useUpcomingTasks, useTaskCountByList,
  addTask, completeTask, deleteTask,
} from "./useTasks";
import { TaskListView } from "./TaskListView";
import { parseTaskInput } from "../../lib/taskParser";
import { hapticLight, hapticSuccess } from "../../lib/haptics";
import { prettyDate } from "../../lib/date.utils";
import type { TaskDto, TaskListDto } from "../../db/types";

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  TbBriefcase, TbHome, TbBarbell, TbShoppingCart, TbCash, TbPill, TbShoppingBag,
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
  const [detailTask, setDetailTask] = useState<TaskDto | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  async function handleComplete(id: number) {
    hapticLight();
    await completeTask(id);
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
            <TaskRow key={t.id} task={t} lists={lists} onComplete={handleComplete}
              onTap={() => setDetailTask(t)} />
          ))}
        </AnimatePresence>
      </div>

      {/* List cards grid */}
      <div style={{ marginBottom: 20 }}>
        <span className="gothic-eyebrow" style={{ display: "block", marginBottom: 8 }}>LISTS</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {lists.map((l) => {
            const Icon = ICON_MAP[l.icon] ?? TbFlag;
            const count = counts.get(l.id) ?? 0;
            return (
              <Link key={l.id} to={`/tasks?list=${l.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  background: "var(--surface)", borderRadius: 12, padding: "12px 8px",
                  textAlign: "center", border: "1px solid var(--border)",
                  borderLeft: `3px solid ${l.color}`,
                }}>
                  <Icon size={18} style={{ color: l.color, marginBottom: 4 }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink)", marginBottom: 2,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.name}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: count > 0 ? l.color : "var(--ink-soft)" }}>{count}</div>
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
            <TaskRow key={t.id} task={t} lists={lists} onComplete={handleComplete}
              onTap={() => setDetailTask(t)} showDate />
          ))}
          {upcoming.length > 10 && (
            <div style={{ fontSize: 11, color: "var(--ink-soft)", textAlign: "center", padding: 8 }}>
              +{upcoming.length - 10} more
            </div>
          )}
        </div>
      )}

      {/* Task detail modal */}
      <TaskDetailModal task={detailTask} lists={lists} onClose={() => setDetailTask(null)} />
    </PageTransition>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function TaskRow({ task, lists, onComplete, onTap, showDate }: {
  task: TaskDto; lists: TaskListDto[]; onComplete: (id: number) => void;
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
      <button onClick={(e) => { e.stopPropagation(); if (task.id) onComplete(task.id); }}
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

// ─────────────────────────────────────────────────────────────────────────────
function TaskDetailModal({ task, lists, onClose }: {
  task: TaskDto | null; lists: TaskListDto[]; onClose: () => void;
}) {
  const { message } = App.useApp();
  if (!task) return null;
  const pri = PRIORITY_LABEL[task.priority] ?? PRIORITY_LABEL[2];

  return (
    <Modal open={!!task} onCancel={onClose} footer={null} title={null}
      styles={{ body: { padding: "16px 18px" } }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{task.title}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Tag color={task.priority === 1 ? "red" : task.priority === 3 ? "green" : "default"}
            style={{ borderRadius: 6 }}>{pri.label}</Tag>
          <Tag style={{ borderRadius: 6 }}>{lists.find((l) => l.id === task.listId)?.name}</Tag>
          {task.status === "done" && <Tag color="green" style={{ borderRadius: 6 }}>Done</Tag>}
        </div>
      </div>

      {task.date && (
        <div style={{ fontSize: 13, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <TbCalendar size={14} /> {prettyDate(task.date)}
          {task.time && <span> · {task.time}{task.endTime ? ` – ${task.endTime}` : ""}</span>}
        </div>
      )}
      {task.location && (
        <div style={{ fontSize: 13, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <TbMapPin size={14} /> {task.location}
        </div>
      )}
      {task.contactName && (
        <div style={{ fontSize: 13, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <TbUser size={14} /> {task.contactName}
          {task.contactPhone && (
            <a href={`tel:${task.contactPhone}`} style={{ color: "var(--accent)" }}>
              <TbPhone size={14} /> {task.contactPhone}
            </a>
          )}
        </div>
      )}
      {task.description && (
        <div style={{ fontSize: 13, marginBottom: 8, padding: "8px 10px", background: "var(--bg)", borderRadius: 8, whiteSpace: "pre-wrap" }}>
          {task.description}
        </div>
      )}
      {task.notes && (
        <div style={{ fontSize: 12, color: "var(--ink-soft)", fontStyle: "italic", marginBottom: 8, padding: "6px 10px", background: "var(--bg)", borderRadius: 8, whiteSpace: "pre-wrap" }}>
          <TbNotes size={12} style={{ verticalAlign: "-1px" }} /> {task.notes}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {task.status !== "done" && (
          <Button type="primary" icon={<TbCheck />} onClick={async () => {
            if (task.id) { await completeTask(task.id); hapticSuccess(); onClose(); }
          }} style={{ flex: 1 }}>
            Complete
          </Button>
        )}
        <Button danger icon={<TbTrash />} onClick={async () => {
          if (task.id) { await deleteTask(task.id); hapticLight(); onClose(); message.info("Deleted"); }
        }}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}
