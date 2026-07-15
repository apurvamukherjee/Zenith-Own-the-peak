import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { todayKey } from "../../lib/date.utils";

export function useUpcomingGoals(limit = 5) {
  return useLiveQuery(async () => {
    const all = await db.goalDays.orderBy("date").toArray();
    const today = todayKey();
    return all.filter((g) => g.date >= today).slice(0, limit);
  }, []) ?? [];
}

export function useGoalsForMonth(dates: string[]) {
  return useLiveQuery(
    () => db.goalDays.where("date").anyOf(dates).toArray(),
    [dates.join(",")],
  ) ?? [];
}

export function useGoalForDate(date: string) {
  return useLiveQuery(() => db.goalDays.where({ date }).first(), [date]);
}

export async function addGoalDay(date: string, title: string) {
  return db.goalDays.add({ date, title: title.trim(), createdAt: Date.now() });
}
export async function deleteGoalDay(id: number) {
  await db.goalDays.delete(id);
}

export function daysUntil(date: string): number {
  const today = new Date(todayKey());
  const target = new Date(date);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}
