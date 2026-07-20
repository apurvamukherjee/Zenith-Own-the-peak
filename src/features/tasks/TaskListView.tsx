import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button, Segmented, App } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import {
  TbPlus, TbCheck, TbLayoutKanban, TbList, TbMapPin, TbClock,
  TbArrowLeft, TbTrash, TbLock,
} from "react-icons/tb";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { EmptyState } from "../../components/EmptyState";
import { ColdIcon } from "../../components/ColdIcon";
import {
  useTaskLists, useTasks, addTask, completeTask, deleteTask,
} from "./useTasks";
import { KanbanView } from "./KanbanView";
import { parseTaskInput } from "../../lib/taskParser";
import { hapticLight, hapticSuccess } from "../../lib/haptics";
import type { TaskDto } from "../../db/types";
import { db } from "../../db/db";
import { useLiveQuery } from "dexie-react-hooks";

const PRIORITY_COLOR: Record<number, string> = { 1: "#ff2740", 2: "var(--ink-soft)", 3: "var(--teal)" };

export function TaskListView() {
  const { message } = App.useApp();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const listId = params.get("list") ?? "daily";
  const lists = useTaskLists();
  const list = lists.find((l) => l.id === listId);
  const allTasks = useTasks({ listId });
  const activeTasks = allTasks.filter((t) => t.status !== "cancelled");
  const [view, setView] = useState<"list" | "kanban">("list");
  const [input, setInput] = useState("");

  // Smart suggestions — top 3 most-repeated task titles in this list
  const suggestions = useLiveQuery(async () => {
    const all = await db.tasks.where("listId").equals(listId).toArray();
    const freq = new Map<string, number>();
    for (const t of all) {
      const key = t.title.toLowerCase().trim();
      freq.set(key, (freq.get(key) ?? 0) + 1);
    }
    return [...freq.entries()]
      .filter(([, c]) => c >= 2) // only suggest if used 2+ times
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([title]) => title);
  }, [listId]) ?? [];

  // Location reminder check — on mount, check if any task in this list has a location nearby
  const [locationBanner, setLocationBanner] = useState<string | null>(null);
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const tasksWithLocation = activeTasks.filter((t) => t.location && t.status === "todo");
    if (!tasksWithLocation.length) return;

    navigator.geolocation.getCurrentPosition(
      () => {
        // Simple check: if user added a location string, we can't geocode it without an API.
        // Instead, show a gentle reminder that they have location-tagged tasks today.
        const locationTasks = tasksWithLocation.map((t) => t.title).join(", ");
        setLocationBanner(`📍 Location tasks: ${locationTasks}`);
      },
      () => { /* location denied — silent */ },
      { enableHighAccuracy: false, maximumAge: 300000 },
    );
  }, [listId]);

  async function handleQuickAdd() {
    const text = input.trim();
    if (!text) return;
    const parsed = parseTaskInput(text);
    if (!parsed.title) parsed.title = text;
    await addTask({ title: parsed.title, priority: parsed.priority ?? 2, listId, date: parsed.date, time: parsed.time, endTime: parsed.endTime, location: parsed.location });
    hapticSuccess();
    setInput("");
  }

  if (!list) return <PageTransition><EmptyState icon={<ColdIcon glyph="void" size={60} />} title="List not found" /></PageTransition>;

  return (
    <PageTransition>
      <SectionTitle eyebrow={list.name.toUpperCase()} title={`${activeTasks.filter((t) => t.status !== "done").length} tasks`} right={
        <div style={{ display: "flex", gap: 6 }}>
          <Button size="small" icon={<TbArrowLeft />} onClick={() => nav("/tasks")} />
          <Segmented size="small" value={view} onChange={(v) => setView(v as "list" | "kanban")}
            options={[
              { value: "list", icon: <TbList size={14} /> },
              { value: "kanban", icon: <TbLayoutKanban size={14} /> },
            ]} />
        </div>
      } />

      {/* Location banner */}
      {locationBanner && (
        <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 10, padding: "6px 10px", background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
          {locationBanner}
        </div>
      )}

      {/* Quick add */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, background: "var(--surface)", borderRadius: 12, padding: "8px 10px", border: "1px solid var(--border)" }}>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
          placeholder={`Add to ${list.name}...`}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--ink)", fontSize: 13, fontFamily: "inherit" }} />
        <Button type="primary" size="small" icon={<TbPlus />} onClick={handleQuickAdd} disabled={!input.trim()} style={{ borderRadius: 8 }} />
      </div>

      {/* Smart suggestions */}
      {suggestions.length > 0 && !input && (
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {suggestions.map((s) => (
            <button key={s} onClick={async () => {
              await addTask({ title: s, priority: 2, listId });
              hapticLight();
              message.success(`Added "${s}"`);
            }}
            style={{
              fontSize: 11, padding: "3px 10px", borderRadius: 16,
              background: `${list.color}15`, color: list.color,
              border: `1px solid ${list.color}30`, cursor: "pointer", fontWeight: 600,
            }}>
              + {s}
            </button>
          ))}
        </div>
      )}

      {/* Kanban or list view */}
      {view === "kanban" ? (
        <KanbanView tasks={activeTasks} list={list} />
      ) : (
        <div>
          {activeTasks.filter((t) => t.status !== "done").length === 0 && (
            <EmptyState icon={<ColdIcon glyph="spark" size={60} />} title="All clear" hint="Add a task to get started" />
          )}
          <AnimatePresence>
            {activeTasks.filter((t) => t.status !== "done").map((task) => (
              <TaskRowWithDeps key={task.id} task={task} list={list} allTasks={allTasks} />
            ))}
          </AnimatePresence>

          {/* Completed section (collapsed by default) */}
          {(() => {
            const done = activeTasks.filter((t) => t.status === "done");
            if (!done.length) return null;
            return (
              <details style={{ marginTop: 12 }}>
                <summary style={{ fontSize: 11, color: "var(--ink-soft)", cursor: "pointer", fontWeight: 600 }}>
                  Completed ({done.length})
                </summary>
                {done.slice(0, 10).map((t) => (
                  <div key={t.id} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                    marginTop: 3, borderRadius: 8, opacity: 0.5,
                  }}>
                    <TbCheck size={14} style={{ color: "var(--teal)" }} />
                    <span style={{ fontSize: 12, textDecoration: "line-through", flex: 1 }}>{t.title}</span>
                    <button onClick={() => t.id && deleteTask(t.id)}
                      style={{ background: "transparent", border: "none", color: "var(--ink-soft)", cursor: "pointer", padding: 2 }}>
                      <TbTrash size={12} />
                    </button>
                  </div>
                ))}
              </details>
            );
          })()}
        </div>
      )}
    </PageTransition>
  );
}

// Task row with dependency display
function TaskRowWithDeps({ task, list, allTasks }: { task: TaskDto; list: { color: string; name: string }; allTasks: TaskDto[] }) {
  const blocker = task.blockedBy ? allTasks.find((t) => t.id === task.blockedBy) : null;
  const isBlocked = blocker && blocker.status !== "done";

  return (
    <motion.div layout exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.18 }}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 10px", marginBottom: 3, borderRadius: 8,
        background: "var(--surface)", border: "1px solid var(--border)",
        borderLeft: `3px solid ${list.color}`,
        opacity: isBlocked ? 0.4 : 1,
        pointerEvents: isBlocked ? "none" : "auto",
      }}>
      <button onClick={() => !isBlocked && task.id && completeTask(task.id)}
        style={{
          width: 20, height: 20, borderRadius: 5,
          border: `2px solid ${PRIORITY_COLOR[task.priority] ?? "var(--ink-soft)"}`,
          background: "transparent", cursor: isBlocked ? "not-allowed" : "pointer", flexShrink: 0,
        }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {task.priority === 1 && <span style={{ color: "#ff2740" }}>● </span>}
          {task.title}
        </div>
        {isBlocked && (
          <div style={{ fontSize: 10, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
            <TbLock size={10} /> Waiting on: {blocker?.title}
          </div>
        )}
        <div style={{ fontSize: 10, color: "var(--ink-soft)", display: "flex", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
          {task.time && <span><TbClock size={10} /> {task.time}</span>}
          {task.location && <span><TbMapPin size={10} /> {task.location}</span>}
        </div>
      </div>
    </motion.div>
  );
}
