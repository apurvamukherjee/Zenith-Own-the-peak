import { todayKey } from "./date.utils";
import { computeScoresForMonth, type DayMetrics } from "./dayScore";

// "Discipline score" for today: the calendar's per-day scorer (avg of water%,
// session done or rest day, sleep logged, protein%), so the two never drift.
export async function computeTodayScore(waterGoal: number, proteinTarget: number): Promise<DayMetrics> {
  const date = todayKey();
  return (await computeScoresForMonth([date], waterGoal, proteinTarget)).get(date)!;
}
