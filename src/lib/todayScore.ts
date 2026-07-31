import { db } from "../db/db";
import { todayKey } from "./date.utils";

// "Discipline score": avg of (water%, session done, sleep logged, protein target hit), 0-100.
export async function computeTodayScore(waterGoal: number, proteinTarget: number): Promise<{
  score: number; waterPct: number; sessionDone: boolean; sleepLogged: boolean; proteinPct: number;
}> {
  const date = todayKey();
  const weekday = new Date().getDay();
  const [waterEntries, setsCount, sleepEntry, meals, scheduleEntry] = await Promise.all([
    db.water.where({ date }).toArray(),
    db.workoutSets.where("date").equals(date).count(),
    db.sleep.where({ date }).first(),
    db.meals.where({ date }).toArray(),
    db.weekSchedule.where({ weekday }).first(),
  ]);
  const waterMl = waterEntries.reduce((s, e) => s + e.amountMl, 0);
  const waterPct = Math.min(100, Math.round((waterMl / waterGoal) * 100));
  const sessionDone = setsCount > 0;
  const sleepLogged = !!sleepEntry;
  const protein = meals.reduce((s, m) => s + m.protein, 0);
  const proteinPct = Math.min(100, proteinTarget > 0 ? Math.round((protein / proteinTarget) * 100) : 0);
  // Rest day (no dayId scheduled, or the "Rest" sentinel dayId 0 — same
  // convention as SessionLogger's `isRest`) — no training is expected, so the
  // session pillar is credited automatically instead of dragging the average down.
  const isRestDay = !scheduleEntry || scheduleEntry.dayId === 0;
  const sessionCredit = sessionDone || isRestDay ? 100 : 0;

  const pillars = [waterPct, sessionCredit, sleepLogged ? 100 : 0, proteinPct];
  const score = Math.round(pillars.reduce((a, b) => a + b, 0) / pillars.length);

  return { score, waterPct, sessionDone, sleepLogged, proteinPct };
}
