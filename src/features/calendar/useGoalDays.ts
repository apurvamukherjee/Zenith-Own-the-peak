import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { todayKey } from "../../lib/date.utils";
import { addTask } from "../tasks/useTasks";

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

// Summit Push — milestone checklist items for a goal day. `goalDayId` is
// deliberately unindexed (same convention as TaskDto.blockedBy), so this
// reads the already-indexed "milestones" list and filters in-memory rather
// than adding a schema bump for what's a small, bounded dataset.
export function useMilestonesForGoal(goalDayId?: number) {
  return useLiveQuery(async () => {
    if (!goalDayId) return [];
    const rows = await db.tasks.where("listId").equals("milestones").toArray();
    return rows.filter((t) => t.goalDayId === goalDayId).sort((a, b) => a.createdAt - b.createdAt);
  }, [goalDayId]) ?? [];
}

// Batched done/total counts for a set of goals (e.g. the countdown strip) —
// one query instead of one-per-goal.
export function useMilestoneCounts(goalIds: number[]) {
  const key = goalIds.join(",");
  return useLiveQuery(async () => {
    const rows = await db.tasks.where("listId").equals("milestones").toArray();
    const out = new Map<number, { done: number; total: number }>();
    for (const t of rows) {
      if (t.goalDayId == null) continue;
      const cur = out.get(t.goalDayId) ?? { done: 0, total: 0 };
      cur.total += 1;
      if (t.status === "done") cur.done += 1;
      out.set(t.goalDayId, cur);
    }
    return out;
  }, [key]) ?? new Map<number, { done: number; total: number }>();
}

export async function addMilestone(goalDayId: number, title: string) {
  return addTask({ title: title.trim(), listId: "milestones", priority: 2, goalDayId });
}
