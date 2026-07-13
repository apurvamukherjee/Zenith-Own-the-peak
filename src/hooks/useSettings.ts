import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";

export const DEFAULTS = {
  waterGoalMl: 3500,
  wakeHour: 9,
  wakingWindowH: 16,
  workoutBumpMl: 750,
  sleepTargetMin: 480, // 8h
  proteinTargetG: 90,   // ~1.8 g/kg at 50 kg
  calorieTargetKcal: 2400,
  name: "Apurva",
};
export type SettingKey = keyof typeof DEFAULTS;

export function useSetting<K extends SettingKey>(key: K): (typeof DEFAULTS)[K] {
  const value = useLiveQuery(() => db.settings.get(key), [key]);
  return (value?.value ?? DEFAULTS[key]) as (typeof DEFAULTS)[K];
}

export async function setSetting(key: SettingKey, value: number | string) {
  await db.settings.put({ key, value });
}
