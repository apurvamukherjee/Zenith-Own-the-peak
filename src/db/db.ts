import Dexie, { type Table } from "dexie";
import type {
  ExerciseDto, WorkoutDayDto, DayExerciseDto, WeekScheduleDto,
  WorkoutSessionDto, WorkoutSetDto, BodyweightDto, WaterDto, SleepDto,
  StudyPathDto, StudyItemDto, StudySessionDto, FuelDto, SettingDto,
  ScheduleDto, ScheduleLogDto, MealDto, GoalDayDto, DayPhotoDto, StreakFreezeDto,
  QuoteDto, BodyMeasurementDto, MealTemplateDto, RestDayLogDto, HabitChainDto,
  AchievementUnlockDto, FoodDto, MealTemplateItemDto, UsageHistoryDto, XpEventDto,
  TaskDto, TaskListDto, RecurringRuleDto, CosmeticUnlockDto, GoogleSyncOutboxDto,
} from "./types";

class ZenithDB extends Dexie {
  exercises!: Table<ExerciseDto, number>;
  workoutDays!: Table<WorkoutDayDto, number>;
  dayExercises!: Table<DayExerciseDto, number>;
  weekSchedule!: Table<WeekScheduleDto, number>;
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
  goalDays!: Table<GoalDayDto, number>;
  dayPhotos!: Table<DayPhotoDto, number>;
  streakFreezes!: Table<StreakFreezeDto, number>;
  quotes!: Table<QuoteDto, number>;
  bodyMeasurements!: Table<BodyMeasurementDto, number>;
  mealTemplates!: Table<MealTemplateDto, number>;
  restDayLogs!: Table<RestDayLogDto, number>;
  habitChains!: Table<HabitChainDto, number>;
  achievements!: Table<AchievementUnlockDto, string>;
  foods!: Table<FoodDto, number>;
  mealTemplateItems!: Table<MealTemplateItemDto, number>;
  usageHistory!: Table<UsageHistoryDto, string>;
  xpEvents!: Table<XpEventDto, number>;
  tasks!: Table<TaskDto, number>;
  taskLists!: Table<TaskListDto, string>;
  recurringRules!: Table<RecurringRuleDto, number>;
  cosmeticUnlocks!: Table<CosmeticUnlockDto, string>;
  googleSyncOutbox!: Table<GoogleSyncOutboxDto, number>;

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
    this.version(2).stores({
      exercises: "++id, name, primaryMuscle, isCustom",
      workoutDays: "++id, order",
      dayExercises: "++id, dayId, exerciseId, order",
      weekSchedule: "++id, &weekday, dayId",
      workoutSessions: "++id, date, weekKey, dayId",
      workoutSets: "++id, sessionId, date, exerciseId, exerciseName, [exerciseName+date]",
    });
    this.version(3).stores({
      goalDays: "++id, date",
      dayPhotos: "++id, &date",
      streakFreezes: "++id, &date, weekKey",
      quotes: "++id, category, isFavorite, createdAt",
    });
    this.version(4).stores({
      bodyMeasurements: "++id, date, metric, [metric+date]",
      mealTemplates: "++id, name, createdAt",
      restDayLogs: "++id, &date, kind",
      habitChains: "++id, triggerTable, active",
    });
    this.version(5).stores({
      achievements: "&id, unlockedAt, seen",
    });
    this.version(6).stores({
      workoutSessions: "++id, date, weekKey, dayId, [date+dayId]",
    });
    // v7: foods catalog + meal template items (for combos)
    this.version(7).stores({
      foods: "++id, name, category, favorite, isCustom, createdAt",
      mealTemplateItems: "++id, templateId, order",
    });
    // v8: usage history — predictive input backing store. Small (<200 rows in
    // practice), single primary key. No secondary index needed; we always
    // read by exact key.
    this.version(8).stores({
      usageHistory: "&key, updatedAt",
    });
    // v9: XP events — every action that earns XP writes one row here.
    // Keeping events rather than a single total gives us an auditable log
    // and lets us recompute the level/total from scratch at any time.
    // action: short string key (e.g. "set", "pr", "streak_day", "badge_gold").
    // xp: the amount granted for that event (positive int).
    // weekKey: ISO week string "YYYY-Www" so weekly XP is fast to query.
    this.version(9).stores({
      xpEvents: "++id, action, weekKey, createdAt",
    });
    // v10: Tasks + Calendar system (Phase 6)
    this.version(10).stores({
      tasks: "++id, listId, status, date, priority, recurringRuleId, createdAt",
      taskLists: "&id, order",
      recurringRules: "++id, active",
    });
    // v11: Reward Vault — cosmetic unlocks (accent themes + avatar frames).
    // Same shape as `achievements`: id keyed by the definition id in
    // lib/rewardVault.ts, table only persists *which* cosmetics are unlocked.
    this.version(11).stores({
      cosmeticUnlocks: "&id, unlockedAt, seen",
    });
    // v12: Google Calendar two-way sync. `googleEventId` indexed on `tasks`
    // for fast reverse lookup during pull-merge (match an incoming Google
    // event back to its local row without a full scan). `googleSyncOutbox`
    // queues remote deletions for tasks that get hard-deleted locally before
    // a push has run — see GoogleSyncOutboxDto.
    this.version(12).stores({
      tasks: "++id, listId, status, date, priority, recurringRuleId, createdAt, googleEventId",
      googleSyncOutbox: "++id, googleEventId",
    });
  }
}

export const db = new ZenithDB();

import { bumpMutation, suppressMutations } from "../lib/mutations";
for (const table of db.tables) {
  table.hook("creating", () => { bumpMutation(); });
  table.hook("updating", () => { bumpMutation(); });
  table.hook("deleting", () => { bumpMutation(); });
}
// A task with a googleEventId is about to vanish (hard delete is the app's
// convention — no tombstone field) — capture the id it needs deleted on
// Google's side before it's gone. Deferred via setTimeout for the same
// reason bumpMutation() is: this hook runs inside the `tasks` deletion's own
// transaction, which doesn't include `googleSyncOutbox`, so writing to it
// synchronously here would throw "object store not found". Dexie's
// `deleting` hook fires for bulkDelete/query-.delete() too, not just
// single-row .delete() — so this one hook covers every current delete path
// (useTasks.deleteTask, useRecurringSpawner.stopRecurringSeries,
// useTasks.deleteTaskList) and any future one, with nothing to remember to
// wire up at each call site.
db.tasks.hook("deleting", (_primKey, obj) => {
  const googleEventId = (obj as TaskDto).googleEventId;
  if (!googleEventId) return;
  setTimeout(() => {
    db.googleSyncOutbox.add({ googleEventId, deletedAt: Date.now() }).catch(() => {});
  }, 0);
});

export async function exportAll(): Promise<string> {
  const data: Record<string, unknown> = { version: 12, exportedAt: new Date().toISOString() };
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
