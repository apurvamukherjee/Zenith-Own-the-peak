import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import type { TaskDto } from "../../db/types";

// Maps every date in `dates` to the all-day/multi-day tasks active on it.
// `date` is indexed so the belowOrEqual(end) scan is cheap; allDay itself
// isn't indexed (few enough rows to filter in memory at this app's scale).
export function useAllDayEvents(dates: string[]): Map<string, TaskDto[]> {
  const key = dates.join(",");
  return useLiveQuery(async () => {
    const map = new Map<string, TaskDto[]>();
    for (const d of dates) map.set(d, []);
    if (!dates.length) return map;
    const start = dates[0];
    const end = dates[dates.length - 1];
    const candidates = await db.tasks
      .where("date").belowOrEqual(end)
      .and((t) => t.allDay === 1 && t.status !== "cancelled")
      .toArray();
    for (const t of candidates) {
      if (!t.date) continue;
      const spanEnd = t.spanEnd && t.spanEnd >= t.date ? t.spanEnd : t.date;
      if (spanEnd < start) continue;
      for (const d of dates) {
        if (d >= t.date && d <= spanEnd) map.get(d)?.push(t);
      }
    }
    return map;
  }, [key]) ?? emptyDayMap(dates);
}

function emptyDayMap(dates: string[]): Map<string, TaskDto[]> {
  const map = new Map<string, TaskDto[]>();
  for (const d of dates) map.set(d, []);
  return map;
}
