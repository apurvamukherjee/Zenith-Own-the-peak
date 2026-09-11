import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import type { TaskDto, TaskListDto, TaskStatus } from "../../db/types";
import { todayKey } from "../../lib/date.utils";

// ─────────────────────────────────────────────────────────────────────────────
// TASK HOOKS — read/write layer for tasks. Same convention as all Zenith hooks:
// UI never touches Dexie directly, only through these functions.
// ─────────────────────────────────────────────────────────────────────────────

export function useTaskLists() {
  return useLiveQuery(() => db.taskLists.orderBy("order").toArray(), []) ?? [];
}

export function useTasks(filters?: { listId?: string; status?: TaskStatus; date?: string }) {
  const key = JSON.stringify(filters ?? {});
  return useLiveQuery(async () => {
    let coll = db.tasks.orderBy("createdAt");
    let arr = await coll.reverse().toArray();
    if (filters?.listId) arr = arr.filter((t) => t.listId === filters.listId);
    if (filters?.status) arr = arr.filter((t) => t.status === filters.status);
    if (filters?.date) arr = arr.filter((t) => t.date === filters.date);
    return arr;
  }, [key]) ?? [];
}

export function useTodayTasks() {
  const today = todayKey();
  return useLiveQuery(async () => {
    const all = await db.tasks.where("date").equals(today).toArray();
    // Also include undated todos (they always show in "today")
    const undated = await db.tasks.where("status").equals("todo").toArray();
    const undatedOnly = undated.filter((t) => !t.date);
    const merged = [...all, ...undatedOnly];
    // Deduplicate by id
    const seen = new Set<number>();
    return merged.filter((t) => { if (!t.id || seen.has(t.id)) return false; seen.add(t.id); return true; })
      .sort((a, b) => {
        // Priority first (1=urgent on top), then time
        if (a.priority !== b.priority) return a.priority - b.priority;
        if (a.time && b.time) return a.time.localeCompare(b.time);
        if (a.time) return -1;
        if (b.time) return 1;
        return b.createdAt - a.createdAt;
      });
  }, [today]) ?? [];
}

export function useUpcomingTasks(days = 7) {
  const today = todayKey();
  return useLiveQuery(async () => {
    const dates: string[] = [];
    for (let i = 1; i <= days; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }
    const arr = await db.tasks.where("date").anyOf(dates).toArray();
    return arr
      .filter((t) => t.status === "todo" || t.status === "in_progress")
      .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "") || a.priority - b.priority);
  }, [today]) ?? [];
}

export function useTaskCountByList() {
  return useLiveQuery(async () => {
    const all = await db.tasks.where("status").anyOf(["todo", "in_progress"]).toArray();
    const counts = new Map<string, number>();
    for (const t of all) counts.set(t.listId, (counts.get(t.listId) ?? 0) + 1);
    return counts;
  }, []) ?? new Map();
}

// ── Mutations ────────────────────────────────────────────────────────────────

// Every write below goes through a plain Dexie table method (add/update/put/
// delete), and db.ts already registers creating/updating/deleting hooks on
// EVERY table that call bumpMutation(table.name) automatically — including
// for the query-based .delete() in deleteTaskList. Calling bumpMutation()
// again here was pure duplication (double-firing the mutation bus, and with
// no table name, defeating the gameplay-table filter other listeners use).

export async function addTask(task: Omit<TaskDto, "id" | "createdAt" | "updatedAt" | "status">): Promise<number> {
  const now = Date.now();
  return db.tasks.add({
    ...task,
    status: "todo",
    createdAt: now,
    updatedAt: now,
  } as TaskDto);
}

export async function updateTask(id: number, changes: Partial<TaskDto>): Promise<void> {
  await db.tasks.update(id, { ...changes, updatedAt: Date.now() });
}

export async function completeTask(id: number): Promise<void> {
  await db.tasks.update(id, { status: "done", completedAt: Date.now(), updatedAt: Date.now() });
}

export async function deleteTask(id: number): Promise<void> {
  await db.tasks.delete(id);
}

export async function addTaskList(list: Omit<TaskListDto, "createdAt">): Promise<void> {
  await db.taskLists.put({ ...list, createdAt: Date.now() });
}

export async function deleteTaskList(id: string): Promise<void> {
  // Don't delete defaults
  const list = await db.taskLists.get(id);
  if (list?.isDefault) return;
  await db.taskLists.delete(id);
  // Also delete all tasks in this list
  await db.tasks.where("listId").equals(id).delete();
}
