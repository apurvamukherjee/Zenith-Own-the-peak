import { db } from "../db/db";
import { consecutiveStreak, weekKey } from "./date.utils";

// A day counts as "kept" if ANY trackable action happened, OR it was frozen
// (one skip per week, spent deliberately from the calendar's day-detail sheet).
export async function computeUnifiedStreak(): Promise<number> {
  const [sets, water, sleep, study, meals, freezes] = await Promise.all([
    db.workoutSets.orderBy("date").uniqueKeys(),
    db.water.orderBy("date").uniqueKeys(),
    db.sleep.orderBy("date").uniqueKeys(),
    db.studySessions.orderBy("date").uniqueKeys(),
    db.meals.orderBy("date").uniqueKeys(),
    db.streakFreezes.toArray(),
  ]);
  const allDates = new Set<string>();
  for (const arr of [sets, water, sleep, study, meals]) for (const d of arr) allDates.add(d as string);
  for (const f of freezes) allDates.add(f.date);

  return consecutiveStreak([...allDates]);
}

// One freeze per calendar week (Mon-Sun via weekKey). Returns false if the
// week's freeze is already used.
export async function useStreakFreeze(date: string): Promise<boolean> {
  const wk = weekKey(new Date(date));
  const existing = await db.streakFreezes.where({ weekKey: wk }).first();
  if (existing) return false;
  await db.streakFreezes.add({ date, weekKey: wk });
  return true;
}

export async function isFreezeAvailable(date: string): Promise<boolean> {
  const wk = weekKey(new Date(date));
  const existing = await db.streakFreezes.where({ weekKey: wk }).first();
  return !existing;
}

