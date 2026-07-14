import Dexie, { type Table } from "dexie";
import type {
  WorkoutSessionDto, WorkoutSetDto, BodyweightDto, WaterDto, SleepDto,
  StudyPathDto, StudyItemDto, StudySessionDto, FuelDto, SettingDto,
  ScheduleDto, ScheduleLogDto, MealDto,
} from "./types";

// Local-first store (IndexedDB via Dexie). No backend today, but every write
// goes through the hooks/*.ts data layer, so a remote sync adapter can slot in
// later without touching UI. See ARCHITECTURE.md.
class ZenithDB extends Dexie {
  workoutSessions!: Table<WorkoutSessionDto, number>;
  workoutSets!: Table<WorkoutSetDto, number>;
  bodyweight!: Table<BodyweightDto, number>;
  water!: Table<WaterDto, number>;
  sleep!: Table<SleepDto, number>;
  studyPaths!: Table<StudyPathDto, number>;
  studyItems!: Table<StudyItemDto, number>;
  studySessions!: Table<StudySessionDto, number>;
  fuel!: Table<FuelDto, number>;
  settings!: Table<SettingDto, string>;
  schedules!: Table<ScheduleDto, number>;
  scheduleLogs!: Table<ScheduleLogDto, number>;
  meals!: Table<MealDto, number>;

  constructor() {
    super("zenith");
    this.version(1).stores({
      workoutSessions: "++id, date, weekKey, dayType",
      workoutSets: "++id, sessionId, date, exercise, [exercise+date]",
      bodyweight: "++id, &date",
      water: "++id, date, timestamp",
      sleep: "++id, &date",
      studyPaths: "++id, createdAt",
      studyItems: "++id, pathId, order, status",
      studySessions: "++id, pathId, date",
      fuel: "++id, date, odometer",
      settings: "&key",
      schedules: "++id, time, active",
      scheduleLogs: "++id, scheduleId, date, [scheduleId+date]",
      meals: "++id, date",
    });
  }
}

export const db = new ZenithDB();

// Notify the mutation bus on any write so cloud auto-backup can debounce a push.
import { bumpMutation, suppressMutations } from "../lib/mutations";
for (const table of db.tables) {
  table.hook("creating", () => { bumpMutation(); });
  table.hook("updating", () => { bumpMutation(); });
  table.hook("deleting", () => { bumpMutation(); });
}

export async function exportAll(): Promise<string> {
  const data: Record<string, unknown> = { version: 1, exportedAt: new Date().toISOString() };
  for (const t of db.tables) data[t.name] = await t.toArray();
  return JSON.stringify(data, null, 2);
}

export async function importAll(json: string): Promise<void> {
  const d = JSON.parse(json);
  suppressMutations(true);
  try {
    await db.transaction("rw", db.tables, async () => {
      for (const t of db.tables) {
        await t.clear();
        if (Array.isArray(d[t.name])) await t.bulkAdd(d[t.name]);
      }
    });
  } finally {
    suppressMutations(false);
  }
}
