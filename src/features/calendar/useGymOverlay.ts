import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";

export interface GymDayInfo {
  date: string;
  dayId: number;
  dayName: string;
  done: boolean;
}

// Synthetic overlay — derived purely from the planned weekly split
// (db.weekSchedule) + actual session logs (db.workoutSessions). Nothing is
// ever written here, so gym days on the calendar can never drift from the
// Planner: change the split and every future date updates immediately.
export function useGymOverlay(dates: string[]): Map<string, GymDayInfo> {
  const key = dates.join(",");
  return useLiveQuery(async () => {
    const [weekSchedule, workoutDays, sessions] = await Promise.all([
      db.weekSchedule.toArray(),
      db.workoutDays.toArray(),
      db.workoutSessions.where("date").anyOf(dates).toArray(),
    ]);
    const dayNameById = new Map(workoutDays.map((d) => [d.id, d.name]));
    const dayIdByWeekday = new Map(weekSchedule.map((w) => [w.weekday, w.dayId]));
    const doneDates = new Set(sessions.map((s) => s.date));
    const map = new Map<string, GymDayInfo>();
    for (const date of dates) {
      const weekday = new Date(date + "T00:00").getDay();
      const dayId = dayIdByWeekday.get(weekday);
      if (dayId == null) continue;
      map.set(date, {
        date,
        dayId,
        dayName: dayNameById.get(dayId) ?? "Workout",
        done: doneDates.has(date),
      });
    }
    return map;
  }, [key]) ?? new Map();
}
