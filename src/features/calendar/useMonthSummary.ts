import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";

export interface MonthSummary {
  avgScore: number; bestWeek: { weekLabel: string; avg: number } | null;
  totalVolume: number; totalSets: number; totalStudyMin: number; daysActive: number;
}

// Aggregate stats for a visible month — powers the "tap month title" summary.
export function useMonthSummary(dates: string[], scores: Map<string, { score: number; hasAny: boolean }>): MonthSummary {
  const raw = useLiveQuery(async () => {
    const [sets, study] = await Promise.all([
      db.workoutSets.where("date").anyOf(dates).toArray(),
      db.studySessions.where("date").anyOf(dates).toArray(),
    ]);
    return { sets, study };
  }, [dates.join(",")]);

  if (!raw) return { avgScore: 0, bestWeek: null, totalVolume: 0, totalSets: 0, totalStudyMin: 0, daysActive: 0 };

  const activeDays = dates.filter((d) => scores.get(d)?.hasAny);
  const avgScore = activeDays.length
    ? Math.round(activeDays.reduce((s, d) => s + (scores.get(d)?.score ?? 0), 0) / activeDays.length)
    : 0;

  // Group into weeks of 7 for a "best week" comparison
  const weeks: string[][] = [];
  for (let i = 0; i < dates.length; i += 7) weeks.push(dates.slice(i, i + 7));
  let bestWeek: { weekLabel: string; avg: number } | null = null;
  weeks.forEach((week, i) => {
    const active = week.filter((d) => scores.get(d)?.hasAny);
    if (!active.length) return;
    const avg = Math.round(active.reduce((s, d) => s + (scores.get(d)?.score ?? 0), 0) / active.length);
    if (!bestWeek || avg > bestWeek.avg) bestWeek = { weekLabel: `Week ${i + 1}`, avg };
  });

  return {
    avgScore, bestWeek,
    totalVolume: Math.round(raw.sets.reduce((s, x) => s + x.weightKg * x.reps, 0)),
    totalSets: raw.sets.length,
    totalStudyMin: raw.study.reduce((s, x) => s + x.minutes, 0),
    daysActive: activeDays.length,
  };
}
