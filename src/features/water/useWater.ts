import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { todayKey, lastNDates } from "../../lib/date.utils";

export type WaterStatus = "done" | "on-track" | "behind" | "way-behind";

export function useTodayWater() {
  const date = todayKey();
  const entries = useLiveQuery(() => db.water.where({ date }).toArray(), [date]) ?? [];
  const total = entries.reduce((s, e) => s + e.amountMl, 0);
  return { entries, total };
}

export function useWorkoutToday() {
  const date = todayKey();
  return (useLiveQuery(() => db.workoutSets.where("date").equals(date).count(), [date]) ?? 0) > 0;
}

export function useWeeklyWater() {
  const dates = lastNDates(7);
  return useLiveQuery(async () => {
    const all = await db.water.where("date").anyOf(dates).toArray();
    return dates.map((d) => ({
      date: d.slice(5),
      ml: all.filter((e) => e.date === d).reduce((s, e) => s + e.amountMl, 0),
    }));
  }, [dates.join()]) ?? [];
}

export async function addWater(amountMl: number) {
  await db.water.add({ date: todayKey(), amountMl, timestamp: Date.now() });
}
export async function undoLastWater() {
  const last = await db.water.where({ date: todayKey() }).last();
  if (last?.id) await db.water.delete(last.id);
}

export function computeStatus(total: number, goal: number, wakeHour: number, windowH: number): {
  status: WaterStatus; expected: number; deltaMl: number;
} {
  const now = new Date();
  const hoursSinceWake = Math.max(0, now.getHours() + now.getMinutes() / 60 - wakeHour);
  const fraction = Math.min(1, hoursSinceWake / windowH);
  const expected = Math.round(goal * fraction);
  const deltaMl = total - expected;
  let status: WaterStatus;
  if (total >= goal) status = "done";
  else if (total < expected * 0.6) status = "way-behind";
  else if (total < expected * 0.85) status = "behind";
  else status = "on-track";
  return { status, expected, deltaMl };
}
