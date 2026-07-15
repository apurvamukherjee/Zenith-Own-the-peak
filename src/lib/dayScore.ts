import { db } from "../db/db";

// Same discipline-score formula as todayScore.ts, but for any date — powers
// the calendar heatmap. Kept separate from todayScore.ts (which stays simple
// and synchronous-feeling for the Home screen's live query deps).
export async function computeScoreForDate(date: string, waterGoal: number, proteinTarget: number): Promise<{
  score: number; waterPct: number; sessionDone: boolean; sleepLogged: boolean; proteinPct: number;
}> {
  const [waterEntries, setsCount, sleepEntry, meals] = await Promise.all([
    db.water.where({ date }).toArray(),
    db.workoutSets.where("date").equals(date).count(),
    db.sleep.where({ date }).first(),
    db.meals.where({ date }).toArray(),
  ]);
  const waterMl = waterEntries.reduce((s, e) => s + e.amountMl, 0);
  const waterPct = Math.min(100, Math.round((waterMl / waterGoal) * 100));
  const sessionDone = setsCount > 0;
  const sleepLogged = !!sleepEntry;
  const protein = meals.reduce((s, m) => s + m.protein, 0);
  const proteinPct = Math.min(100, proteinTarget > 0 ? Math.round((protein / proteinTarget) * 100) : 0);
  const pillars = [waterPct, sessionDone ? 100 : 0, sleepLogged ? 100 : 0, proteinPct];
  const score = Math.round(pillars.reduce((a, b) => a + b, 0) / pillars.length);
  return { score, waterPct, sessionDone, sleepLogged, proteinPct };
}

// Batch version for a whole month — avoids 30x sequential round trips.
export async function computeScoresForMonth(dates: string[], waterGoal: number, proteinTarget: number) {
  const [water, sets, sleep, meals] = await Promise.all([
    db.water.where("date").anyOf(dates).toArray(),
    db.workoutSets.where("date").anyOf(dates).toArray(),
    db.sleep.where("date").anyOf(dates).toArray(),
    db.meals.where("date").anyOf(dates).toArray(),
  ]);
  const out = new Map<string, { score: number; hasAny: boolean }>();
  for (const date of dates) {
    const waterMl = water.filter((w) => w.date === date).reduce((s, w) => s + w.amountMl, 0);
    const waterPct = Math.min(100, Math.round((waterMl / waterGoal) * 100));
    const sessionDone = sets.some((s) => s.date === date);
    const sleepLogged = sleep.some((s) => s.date === date);
    const protein = meals.filter((m) => m.date === date).reduce((s, m) => s + m.protein, 0);
    const proteinPct = Math.min(100, proteinTarget > 0 ? Math.round((protein / proteinTarget) * 100) : 0);
    const pillars = [waterPct, sessionDone ? 100 : 0, sleepLogged ? 100 : 0, proteinPct];
    const score = Math.round(pillars.reduce((a, b) => a + b, 0) / pillars.length);
    const hasAny = waterMl > 0 || sessionDone || sleepLogged || protein > 0;
    out.set(date, { score, hasAny });
  }
  return out;
}
