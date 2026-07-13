import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import type { SleepDto } from "../../db/types";
import { lastNDates, sleepDurationMin, todayKey } from "../../lib/date.utils";

export function useRecentSleep(n = 14) {
  const dates = lastNDates(n);
  return useLiveQuery(async () => {
    const all = await db.sleep.where("date").anyOf(dates).toArray();
    const map = new Map(all.map((s) => [s.date, s]));
    return dates.map((d) => map.get(d) ?? null);
  }, [dates.join()]) ?? [];
}

export async function upsertSleep(entry: Omit<SleepDto, "id" | "durationMin">) {
  const durationMin = sleepDurationMin(entry.sleepAt, entry.wakeAt);
  const existing = await db.sleep.where({ date: entry.date }).first();
  if (existing?.id) await db.sleep.update(existing.id, { ...entry, durationMin });
  else await db.sleep.add({ ...entry, durationMin });
}

export function useTonightKey() { return todayKey(); }
