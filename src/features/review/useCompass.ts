import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { useSetting } from "../../hooks/useSettings";
import { lastNDates } from "../../lib/date.utils";
import { computeScoresForMonth } from "../../lib/dayScore";
import { computeCompassInsights, type CompassRow } from "../../lib/compass";

const WINDOW_DAYS = 60;

export function useCompassInsights() {
  const waterGoal = useSetting("waterGoalMl");
  const proteinTarget = useSetting("proteinTargetG");

  return useLiveQuery(async () => {
    const dates = lastNDates(WINDOW_DAYS);
    const [scores, sleep, fuel] = await Promise.all([
      computeScoresForMonth(dates, waterGoal, proteinTarget),
      db.sleep.where("date").anyOf(dates).toArray(),
      db.fuel.where("date").anyOf(dates).toArray(),
    ]);
    const sleepByDate = new Map(sleep.map((s) => [s.date, s.sleepAt]));
    const fuelDates = new Set(fuel.map((f) => f.date));

    const rows: CompassRow[] = dates
      .map((date): CompassRow | null => {
        const m = scores.get(date);
        if (!m || !m.hasAny) return null;
        return {
          date, score: m.score, waterPct: m.waterPct, proteinPct: m.proteinPct,
          sessionDone: m.sessionDone, sleepAt: sleepByDate.get(date), hasFuel: fuelDates.has(date),
        };
      })
      .filter((r): r is CompassRow => r !== null);

    return computeCompassInsights(rows);
  }, [waterGoal, proteinTarget]);
}
