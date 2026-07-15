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

export async function computeScoreForDate(date: string, waterGoal: number, proteinTarget: number): Promise<DayMetrics> {
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
  const hasAny = waterMl > 0 || sessionDone || sleepLogged || protein > 0;
  return { score, waterPct, sessionDone, sleepLogged, proteinPct, hasAny };
}

// Batch version for a whole month — avoids N sequential round trips.
export async function computeScoresForMonth(dates: string[], waterGoal: number, proteinTarget: number): Promise<Map<string, DayMetrics>> {
  const [water, sets, sleep, meals] = await Promise.all([
    db.water.where("date").anyOf(dates).toArray(),
    db.workoutSets.where("date").anyOf(dates).toArray(),
    db.sleep.where("date").anyOf(dates).toArray(),
    db.meals.where("date").anyOf(dates).toArray(),
  ]);
  const out = new Map<string, DayMetrics>();
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
    out.set(date, { score, waterPct, sessionDone, sleepLogged, proteinPct, hasAny });
  }
  return out;
}

// "On this day" comparison — same weekday, 7 and 30 days back.
export interface OnThisDay { label: string; date: string; metrics: DayMetrics | null }
export async function onThisDayComparisons(date: string, waterGoal: number, proteinTarget: number): Promise<OnThisDay[]> {
  const base = new Date(date);
  const lastWeek = new Date(base); lastWeek.setDate(base.getDate() - 7);
  const lastMonth = new Date(base); lastMonth.setDate(base.getDate() - 30);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const targets = [
    { label: "Last week", date: fmt(lastWeek) },
    { label: "Last month", date: fmt(lastMonth) },
  ];
  const results: OnThisDay[] = [];
  for (const t of targets) {
    const m = await computeScoreForDate(t.date, waterGoal, proteinTarget);
    results.push({ ...t, metrics: m.hasAny ? m : null });
  }
  return results;
}
