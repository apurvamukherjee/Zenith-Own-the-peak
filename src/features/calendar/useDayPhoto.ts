import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";

export function useDayPhoto(date: string) {
  return useLiveQuery(() => db.dayPhotos.where({ date }).first(), [date]);
}

export function usePhotoDatesInMonth(dates: string[]) {
  return useLiveQuery(async () => {
    const rows = await db.dayPhotos.where("date").anyOf(dates).toArray();
    return new Set(rows.map((r) => r.date));
  }, [dates.join(",")]) ?? new Set<string>();
}

