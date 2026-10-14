import { db } from "../db/db";

export interface DayMetrics {
  score: number; waterPct: number; sessionDone: boolean; sleepLogged: boolean;
  proteinPct: number; hasAny: boolean;
}

export type ScoreFilter = "blended" | "water" | "sleep" | "session" | "protein";

export function filteredValue(m: DayMetrics, filter: ScoreFilter): number {
  switch (filter) {
    case "water": return m.waterPct;
    case "sleep": return m.sleepLogged ? 100 : 0;
    case "session": return m.sessionDone ? 100 : 0;
    case "protein": return m.proteinPct;
    default: return m.score;
  }
}

// Batch version for a whole month — avoids N sequential round trips.
export async function computeScoresForMonth(dates: string[], waterGoal: number, proteinTarget: number): Promise<Map<string, DayMetrics>> {
  const [water, sets, sleep, meals, weekSchedule] = await Promise.all([
    db.water.where("date").anyOf(dates).toArray(),
    db.workoutSets.where("date").anyOf(dates).toArray(),
    db.sleep.where("date").anyOf(dates).toArray(),
    db.meals.where("date").anyOf(dates).toArray(),
    db.weekSchedule.toArray(),
  ]);
  const dayIdByWeekday = new Map(weekSchedule.map((w) => [w.weekday, w.dayId]));
  const out = new Map<string, DayMetrics>();
  for (const date of dates) {
    const waterMl = water.filter((w) => w.date === date).reduce((s, w) => s + w.amountMl, 0);
    const waterPct = Math.min(100, Math.round((waterMl / waterGoal) * 100));
    const sessionDone = sets.some((s) => s.date === date);
    const sleepLogged = sleep.some((s) => s.date === date);
    const protein = meals.filter((m) => m.date === date).reduce((s, m) => s + m.protein, 0);
    const proteinPct = Math.min(100, proteinTarget > 0 ? Math.round((protein / proteinTarget) * 100) : 0);
    const weekday = new Date(date + "T00:00").getDay();
    const scheduledDayId = dayIdByWeekday.get(weekday);
    const isRestDay = !scheduledDayId; // undefined (unscheduled) or 0 (Rest sentinel)
    const sessionCredit = sessionDone || isRestDay ? 100 : 0;
    const pillars = [waterPct, sessionCredit, sleepLogged ? 100 : 0, proteinPct];
    const score = Math.round(pillars.reduce((a, b) => a + b, 0) / pillars.length);
    const hasAny = waterMl > 0 || sessionDone || sleepLogged || protein > 0;
    out.set(date, { score, waterPct, sessionDone, sleepLogged, proteinPct, hasAny });
  }
  return out;
}

// "On this day" comparison — same weekday, 7 and 30 days back.
