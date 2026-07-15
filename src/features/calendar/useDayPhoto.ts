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

export async function setDayPhoto(date: string, dataUrl: string) {
  const existing = await db.dayPhotos.where({ date }).first();
  if (existing?.id) await db.dayPhotos.update(existing.id, { dataUrl });
  else await db.dayPhotos.add({ date, dataUrl });
}

export async function removeDayPhoto(date: string) {
  const existing = await db.dayPhotos.where({ date }).first();
  if (existing?.id) await db.dayPhotos.delete(existing.id);
}
