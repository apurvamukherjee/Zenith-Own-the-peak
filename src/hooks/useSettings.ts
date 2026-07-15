import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";

export const DEFAULTS = {
  waterGoalMl: 3500,
  wakeHour: 9,
  wakingWindowH: 16,
  workoutBumpMl: 750,
  sleepTargetMin: 480,     // 8h
  calorieTargetKcal: 2600, // surplus for lean gain at ~50kg
  proteinTargetG: 100,     // ~2 g/kg
  name: "Apurva",
  themeMode: "dark",       // gothic by default
  profilePic: "",          // dataURL
  bgImage: "",             // dataURL
  bgBlur: 10,              // px
  bgOpacity: 35,           // 0-100
  // Cloud
  autoBackup: 0,           // 1 = push to cloud on change
  onboarded: 0,            // 1 = onboarding completed
  // Reminders (times are HH:mm)
  remWater: 1,
  remWaterEveryH: 2,
  remBedtime: 1,
  remBedtimeAt: "23:30",
  remSupps: 1,
  remSession: 1,
  remSessionAt: "18:00",
};
export type SettingKey = keyof typeof DEFAULTS;

export function useSetting<K extends SettingKey>(key: K): (typeof DEFAULTS)[K] {
  const value = useLiveQuery(() => db.settings.get(key), [key]);
  return (value?.value ?? DEFAULTS[key]) as (typeof DEFAULTS)[K];
}

export async function setSetting(key: SettingKey, value: number | string) {
  await db.settings.put({ key, value });
}
