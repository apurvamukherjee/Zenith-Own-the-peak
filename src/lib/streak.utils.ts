import { db } from "../db/db";
import { todayKey, weekKey } from "./date.utils";

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

  let streak = 0;
  const d = new Date();
  const fmt = (x: Date) => todayKey(x);
  if (!allDates.has(fmt(d))) d.setDate(d.getDate() - 1);
  while (allDates.has(fmt(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
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

export async function isDateFrozen(date: string): Promise<boolean> {
  const f = await db.streakFreezes.where({ date }).first();
  return !!f;
}
