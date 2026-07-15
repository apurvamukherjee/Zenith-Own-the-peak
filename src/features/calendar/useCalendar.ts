import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { computeScoresForMonth } from "../../lib/dayScore";
import { todayKey } from "../../lib/date.utils";

export interface DayCell {
  date: string; score: number; hasAny: boolean; isToday: boolean; isFuture: boolean;
  waterPct: number; sessionDone: boolean; sleepLogged: boolean; proteinPct: number;
}

// All dates in a given month (1-31), formatted YYYY-MM-DD.
function datesInMonth(year: number, month: number): string[] {
  const days = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: days }, (_, i) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`);
}

export function useMonthScores(year: number, month: number, waterGoal: number, proteinTarget: number) {
  const [cells, setCells] = useState<DayCell[]>([]);
  const dates = datesInMonth(year, month);
  const today = todayKey();

  // Re-run whenever any tracked table changes (bumpMutation triggers a re-render
  // upstream via useLiveQuery elsewhere); poll-safe via a light dependency key.
  const depKey = useLiveQuery(async () => {
    const counts = await Promise.all([
      db.water.where("date").anyOf(dates).count(),
      db.workoutSets.where("date").anyOf(dates).count(),
      db.sleep.where("date").anyOf(dates).count(),
      db.meals.where("date").anyOf(dates).count(),
    ]);
    return counts.join(",");
  }, [dates.join(",")]);

  useEffect(() => {
    let cancelled = false;
    computeScoresForMonth(dates, waterGoal, proteinTarget).then((map) => {
      if (cancelled) return;
      setCells(dates.map((date) => {
        const m = map.get(date);
        return {
          date,
          score: m?.score ?? 0,
          hasAny: m?.hasAny ?? false,
          isToday: date === today,
          isFuture: date > today,
          waterPct: m?.waterPct ?? 0,
          sessionDone: m?.sessionDone ?? false,
          sleepLogged: m?.sleepLogged ?? false,
          proteinPct: m?.proteinPct ?? 0,
        };
      }));
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dates.join(","), waterGoal, proteinTarget, depKey]);

  return cells;
}

export interface DayDetail {
  waterMl: number; sleepMin: number | null; sleepQuality: number | null;
  sets: number; volume: number; protein: number; studyMin: number; fuelCost: number;
}

export function useDayDetail(date: string) {
  return useLiveQuery(async () => {
    const [water, sleep, sets, meals, study, fuel] = await Promise.all([
      db.water.where({ date }).toArray(),
      db.sleep.where({ date }).first(),
      db.workoutSets.where("date").equals(date).toArray(),
      db.meals.where({ date }).toArray(),
      db.studySessions.where({ date }).toArray(),
      db.fuel.where({ date }).toArray(),
    ]);
    const detail: DayDetail = {
      waterMl: water.reduce((s, w) => s + w.amountMl, 0),
      sleepMin: sleep?.durationMin ?? null,
      sleepQuality: sleep?.quality ?? null,
      sets: sets.length,
      volume: Math.round(sets.reduce((s, x) => s + x.weightKg * x.reps, 0)),
      protein: meals.reduce((s, m) => s + m.protein, 0),
      studyMin: study.reduce((s, x) => s + x.minutes, 0),
      fuelCost: fuel.reduce((s, f) => s + f.cost, 0),
    };
    return detail;
  }, [date]) ?? null;
}
