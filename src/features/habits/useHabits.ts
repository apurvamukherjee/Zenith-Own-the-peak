import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { todayKey, consecutiveStreak } from "../../lib/date.utils";

// Small fixed rotating palette — no color-picker UI needed, each new habit
// just gets the next color in the sequence (same "no picker, just a curated
// set" call already made for expense categories / task lists).
const PALETTE = ["#ff2740", "#f59e0b", "#22c55e", "#06b6d4", "#8b5cf6", "#ec4899", "#eab308", "#14b8a6"];

export function useHabits() {
  return useLiveQuery(() => db.habits.where("active").equals(1).sortBy("order"), []) ?? [];
}

export async function addHabit(input: { name?: string; triggerLabel: string; actionLabel: string; icon: string }) {
  const count = await db.habits.count();
  const name = input.name?.trim() || `${input.triggerLabel} → ${input.actionLabel}`;
  return db.habits.add({
    name, triggerLabel: input.triggerLabel.trim(), actionLabel: input.actionLabel.trim(),
    icon: input.icon, color: PALETTE[count % PALETTE.length],
    active: 1, order: count, createdAt: Date.now(),
  });
}

export async function deleteHabit(id: number) {
  await db.habits.delete(id);
  await db.habitLogs.where("habitId").equals(id).delete();
}

// Live "done today" flag for one habit.
export function useHabitDoneToday(habitId?: number) {
  const today = todayKey();
  return useLiveQuery(async () => {
    if (!habitId) return false;
    const row = await db.habitLogs.where("[habitId+date]").equals([habitId, today]).first();
    return !!row;
  }, [habitId, today]) ?? false;
}

export function useHabitStreak(habitId?: number) {
  return useLiveQuery(async () => {
    if (!habitId) return 0;
    const dates = await db.habitLogs.where("habitId").equals(habitId).toArray();
    return consecutiveStreak(dates.map((d) => d.date));
  }, [habitId]) ?? 0;
}

// Toggle today's completion for a habit — add the log if absent, remove it if present.
export async function toggleHabitToday(habitId: number) {
  const today = todayKey();
  const existing = await db.habitLogs.where("[habitId+date]").equals([habitId, today]).first();
  if (existing?.id) {
    await db.habitLogs.delete(existing.id);
    return false;
  }
  await db.habitLogs.add({ habitId, date: today, createdAt: Date.now() });
  return true;
}
