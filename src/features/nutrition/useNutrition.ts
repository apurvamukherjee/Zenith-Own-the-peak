import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import type { MealDto, ScheduleDto, ScheduleKind } from "../../db/types";
import { todayKey } from "../../lib/date.utils";

export type SlotStatus = "done" | "due" | "overdue" | "upcoming";

export function useSchedules() {
  return useLiveQuery(() => db.schedules.orderBy("time").toArray(), []) ?? [];
}
export function useTodayLogs() {
  const date = todayKey();
  return useLiveQuery(() => db.scheduleLogs.where({ date }).toArray(), [date]) ?? [];
}
export function useTodayMeals() {
  const date = todayKey();
  return useLiveQuery(() => db.meals.where({ date }).toArray(), [date]) ?? [];
}

export async function addSchedule(s: Omit<ScheduleDto, "id" | "active"> & { active?: number }) {
  return db.schedules.add({ active: 1, ...s });
}
export async function deleteSchedule(id: number) {
  await db.schedules.delete(id);
  await db.scheduleLogs.where({ scheduleId: id }).delete();
}
export async function markDone(scheduleId: number, done: boolean) {
  const date = todayKey();
  const existing = await db.scheduleLogs.where({ scheduleId, date }).first();
  if (done && !existing) await db.scheduleLogs.add({ scheduleId, date, doneAt: Date.now() });
  if (!done && existing?.id) await db.scheduleLogs.delete(existing.id);
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
  supplement: { label: "Supplement", icon: "🧪", color: "#7c5cfc" },
  meal: { label: "Meal", icon: "🍽️", color: "#12b3a1" },
};
