import { useLiveQuery } from "dexie-react-hooks";
import dayjs from "dayjs";
import { db } from "../../db/db";
import type { MealDto, ScheduleDto, ScheduleKind, RecurringRuleDto } from "../../db/types";
import { todayKey } from "../../lib/date.utils";
import { spawnRecurring } from "../tasks/useRecurringSpawner";
import { completeTask } from "../tasks/useTasks";

export type SlotStatus = "done" | "due" | "overdue" | "upcoming";

// Phase 7 — meds/supplements/meal-reminders are unified into the Task +
// RecurringRule system so they become real calendar events. This module keeps
// the original ScheduleDto/ScheduleLogDto *shapes* as its public API (so
// NutritionPage and the reminder engines don't need to change) while storing
// everything in db.tasks/db.recurringRules under three dedicated lists.
const KIND_TO_LIST: Record<ScheduleKind, string> = { med: "medicine", supplement: "supplement", meal: "mealtime" };
const LIST_TO_KIND: Record<string, ScheduleKind> = { medicine: "med", supplement: "supplement", mealtime: "meal" };
const SCHEDULE_LISTS = Object.keys(LIST_TO_KIND);

function ruleToSchedule(r: RecurringRuleDto): ScheduleDto {
  return {
    id: r.id,
    kind: LIST_TO_KIND[r.templateListId] ?? "med",
    label: r.templateTitle,
    dose: r.templateDose,
    time: r.templateTime ?? "09:00",
    active: r.active,
  };
}

export function useSchedules() {
  const rules = useLiveQuery(() => db.recurringRules.toArray(), []) ?? [];
  return rules
    .filter((r) => SCHEDULE_LISTS.includes(r.templateListId) && r.active)
    .sort((a, b) => (a.templateTime ?? "").localeCompare(b.templateTime ?? ""))
    .map(ruleToSchedule);
}
export function useTodayLogs() {
  const date = todayKey();
  const tasks = useLiveQuery(() => db.tasks.where({ date }).toArray(), [date]) ?? [];
  return tasks
    .filter((t) => t.recurringRuleId && SCHEDULE_LISTS.includes(t.listId) && t.status === "done")
    .map((t) => ({ id: t.id, scheduleId: t.recurringRuleId!, date: t.date!, doneAt: t.completedAt ?? t.updatedAt }));
}
export function useTodayMeals() {
  const date = todayKey();
  return useLiveQuery(() => db.meals.where({ date }).toArray(), [date]) ?? [];
}

export async function addSchedule(s: Omit<ScheduleDto, "id" | "active"> & { active?: number }) {
  const now = Date.now();
  const ruleId = await db.recurringRules.add({
    frequency: "daily",
    interval: 1,
    active: s.active ?? 1,
    templateTitle: s.label,
    templateListId: KIND_TO_LIST[s.kind],
    templatePriority: 2,
    templateTime: s.time,
    templateDose: s.dose,
    createdAt: now,
  });
  // Spawn instances out 60 days so it shows up on the calendar immediately,
  // not just once CalendarPage's own month-view effect happens to run.
  await spawnRecurring(todayKey(), dayjs().add(60, "day").format("YYYY-MM-DD"));
  return ruleId;
}
export async function deleteSchedule(id: number) {
  await db.tasks.where("recurringRuleId").equals(id).delete();
  await db.recurringRules.delete(id);
}
export async function markDone(scheduleId: number, done: boolean) {
  const date = todayKey();
  let instances = await db.tasks.where("recurringRuleId").equals(scheduleId).toArray();
  let task = instances.find((t) => t.date === date);
  if (!task) {
    // Rule was created after the last spawn pass covered today — spawn now.
    await spawnRecurring(date, date);
    instances = await db.tasks.where("recurringRuleId").equals(scheduleId).toArray();
    task = instances.find((t) => t.date === date);
  }
  if (!task?.id) return;
  if (done) await completeTask(task.id);
  else await db.tasks.update(task.id, { status: "todo", completedAt: undefined, updatedAt: Date.now() });
}

export async function addMeal(m: Omit<MealDto, "id">) { return db.meals.add(m); }
export async function deleteMeal(id: number) { await db.meals.delete(id); }

export function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function slotStatus(time: string, done: boolean, graceMin = 30): SlotStatus {
  if (done) return "done";
  const now = nowHHMM();
  const [nh, nm] = now.split(":").map(Number);
  const [th, tm] = time.split(":").map(Number);
  const diff = nh * 60 + nm - (th * 60 + tm);
  if (diff < 0) return "upcoming";
  if (diff <= graceMin) return "due";
  return "overdue";
}

export const KIND_META: Record<ScheduleKind, { label: string; icon: string; color: string }> = {
  med: { label: "Medicine", icon: "💊", color: "#ff5c7a" },
  supplement: { label: "Supplement", icon: "🥤", color: "#f6b93b" },
  meal: { label: "Meal", icon: "🍽️", color: "#12b3a1" },
};
