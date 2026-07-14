import { db } from "../db/db";
import { todayKey } from "./date.utils";

// A day counts as "kept" if ANY trackable action happened: workout set, water logged,
// sleep logged, study minutes, or meal logged. Returns count of consecutive kept days
// ending today (or yesterday as grace).
export async function computeUnifiedStreak(): Promise<number> {
  const [sets, water, sleep, study, meals] = await Promise.all([
    db.workoutSets.orderBy("date").uniqueKeys(),
    db.water.orderBy("date").uniqueKeys(),
    db.sleep.orderBy("date").uniqueKeys(),
    db.studySessions.orderBy("date").uniqueKeys(),
    db.meals.orderBy("date").uniqueKeys(),
  ]);
  const allDates = new Set<string>();
  for (const arr of [sets, water, sleep, study, meals]) for (const d of arr) allDates.add(d as string);

  let streak = 0;
  const d = new Date();
  const fmt = (x: Date) => todayKey(x);
  if (!allDates.has(fmt(d))) d.setDate(d.getDate() - 1); // yesterday grace
  while (allDates.has(fmt(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
