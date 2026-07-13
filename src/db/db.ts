import Dexie, { type Table } from "dexie";
import type {
  WorkoutSessionDto, WorkoutSetDto, BodyweightDto, WaterDto, SleepDto,
  StudyPathDto, StudyItemDto, StudySessionDto, FuelDto, SettingDto,
} from "./types";

// Local-first store. Everything lives in IndexedDB on the device — no backend.
class TrackLifeDB extends Dexie {
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

  constructor() {
    super("tracklife");
    this.version(1).stores({
      workoutSessions: "++id, date, weekKey, dayType",
      workoutSets: "++id, sessionId, date, exercise, [exercise+date]",
      bodyweight: "++id, &date",
    });
    this.version(2).stores({
      water: "++id, date, timestamp",
      sleep: "++id, &date",
      studyPaths: "++id, createdAt",
      studyItems: "++id, pathId, order, status",
      studySessions: "++id, pathId, date",
      fuel: "++id, date, odometer",
      settings: "&key",
    });
  }
}

export const db = new TrackLifeDB();

// Dump/restore for local backup (no cloud, so this is the safety net).
export async function exportAll(): Promise<string> {
  const [workoutSessions, workoutSets, bodyweight, water, sleep,
    studyPaths, studyItems, studySessions, fuel, settings] = await Promise.all([
    db.workoutSessions.toArray(), db.workoutSets.toArray(), db.bodyweight.toArray(),
    db.water.toArray(), db.sleep.toArray(), db.studyPaths.toArray(),
    db.studyItems.toArray(), db.studySessions.toArray(), db.fuel.toArray(),
    db.settings.toArray(),
  ]);
  return JSON.stringify({
    version: 2, exportedAt: new Date().toISOString(),
    workoutSessions, workoutSets, bodyweight, water, sleep,
    studyPaths, studyItems, studySessions, fuel, settings,
  }, null, 2);
}

export async function importAll(json: string): Promise<void> {
  const d = JSON.parse(json);
  await db.transaction("rw", db.tables, async () => {
    for (const t of db.tables) await t.clear();
    if (d.workoutSessions) await db.workoutSessions.bulkAdd(d.workoutSessions);
    if (d.workoutSets) await db.workoutSets.bulkAdd(d.workoutSets);
    if (d.bodyweight) await db.bodyweight.bulkAdd(d.bodyweight);
    if (d.water) await db.water.bulkAdd(d.water);
    if (d.sleep) await db.sleep.bulkAdd(d.sleep);
    if (d.studyPaths) await db.studyPaths.bulkAdd(d.studyPaths);
    if (d.studyItems) await db.studyItems.bulkAdd(d.studyItems);
    if (d.studySessions) await db.studySessions.bulkAdd(d.studySessions);
    if (d.fuel) await db.fuel.bulkAdd(d.fuel);
    if (d.settings) await db.settings.bulkAdd(d.settings);
  });
}
