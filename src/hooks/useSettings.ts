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
  carbTargetG: 320,        // ~55% of a 2600 kcal surplus
  fatTargetG: 75,          // ~25% of 2600 kcal
  name: "Apurva",
  themeMode: "dark",       // gothic by default
  profilePic: "",          // dataURL
  bgImage: "",             // dataURL
  bgBlur: 10,              // px
  bgOpacity: 35,           // 0-100
  // Cloud
  autoBackup: 0,           // 1 = push to cloud on change
  backupCount: 0,          // lifetime successful cloud backups (for achievements)
  onboarded: 0,            // 1 = onboarding completed
  firstSeenAt: 0,          // epoch ms of first launch — drives 7-day review nudge
  reviewNudgeDone: 0,      // 1 = nudge shown/dismissed, never show again
  // CoachMark first-visit flags (1 = shown)
  coachLogger: 0,
  coachPlanner: 0,
  coachNutrition: 0,
  tasksMigrated: 0,     // 1 = existing schedules migrated to tasks
  // Reminders (times are HH:mm)
  remWater: 1,
  remWaterEveryH: 2,
  remBedtime: 1,
  remBedtimeAt: "23:30",
  remSupps: 1,
  remSession: 1,
  remSessionAt: "18:00",
  // Phase-3 accessibility + motion
  highContrast: 0,        // 1 = WCAG-AAA gradient-free skin
  reduceMotion: 0,        // 1 = user-forced motion reduction on top of OS preference
  // Phase-3 easter eggs + observability
  birthday: "",           // MM-DD (empty = not set)
  eggKonami: 0,
  egg666: 0,
  eggSisyphus: 0,
  eggReflective: "",      // last YYYY collected (one per year)
  eggPeak: 0,
  eggIddqd: 0,
  eggDramatic: 0,         // 1 = seen the "System overload…" intro (once per lifetime)
  hardcoreUntil: 0,       // epoch ms — Hardcore Mode active until
  sabbathUntil: 0,        // epoch ms — Sabbath Mode active until (Sunday-only)
  mountainPeaks: 0,       // count of mythic badges ever unlocked (drives Settings→About)
};
export type SettingKey = keyof typeof DEFAULTS;

export function useSetting<K extends SettingKey>(key: K): (typeof DEFAULTS)[K] {
  const value = useLiveQuery(() => db.settings.get(key), [key]);
  return (value?.value ?? DEFAULTS[key]) as (typeof DEFAULTS)[K];
}

export async function setSetting(key: SettingKey, value: number | string) {
  await db.settings.put({ key, value });
}
