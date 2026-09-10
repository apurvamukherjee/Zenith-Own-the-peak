// Domain types. Flat for Dexie indexing.
import type { WorkoutPlanFile } from "../lib/workoutPlanFile";

// ---- Workout (redesigned) ----
export type MuscleGroup =
  | "chest" | "back" | "shoulders" | "biceps" | "triceps"
  | "quads" | "hamstrings" | "glutes" | "calves" | "abs" | "forearms" | "traps";

export interface ExerciseDto {
  id?: number;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: string;
  cues?: string;
  isCustom: number;
}

export interface WorkoutDayDto {
  id?: number;
  name: string;
  muscles: MuscleGroup[];
  order: number;
}

export interface DayExerciseDto {
  id?: number;
  dayId: number;
  exerciseId: number;
  order: number;
  sets: number;
  repLow: number;
  repHigh: number;
  weightKg: number;
  restSec: number;
  // Phase 3 — Superset linking. Two or more consecutive exercises (by `order`)
  // sharing the same non-null group id are performed alternating: A1 → B1 →
  // rest → A2 → B2 → rest. Legacy rows omit the field entirely.
  supersetGroupId?: number;
}

export interface WeekScheduleDto {
  id?: number;
  weekday: number;
  dayId: number;
}

// ---- Multi-plan support (switchable full-week programs) ----
// `workoutDays`/`dayExercises`/`weekSchedule` above always represent only the
// CURRENTLY ACTIVE plan, live — exactly as before this feature existed. Every
// plan (active or not) is additionally kept here as a serialized snapshot in
// the same `WorkoutPlanFile` shape used by the existing plan-file import/export
// (lib/workoutPlanFile.ts), so switching is just export-current → import-target.
export interface WorkoutPlanRowDto {
  id?: number;
  name: string;
  isBuiltIn: 0 | 1;
  builtInKey?: "classic-ppl" | "ppl-rest" | "bro-split"; // only set when isBuiltIn
  snapshot: WorkoutPlanFile;
  createdAt: number;
  updatedAt: number;
}

export type Effort = "easy" | "good" | "hard" | "failed";

export interface WorkoutSessionDto {
  id?: number; date: string; weekKey: string; dayId: number; notes?: string; createdAt: number;
  // Phase 4B: auto-timed duration in minutes, set when session ends / user navigates away.
  durationMin?: number;
}
// A drop set: one logged set (weightKg/reps above = the top/primary stage)
// followed by one or more weight-drop stages performed back-to-back with no
// rest between them. `dropStages` is undefined/omitted for ordinary sets.
export interface DropStageDto { weightKg: number; reps: number; }

export interface WorkoutSetDto {
  id?: number; sessionId: number; date: string; exerciseId: number; exerciseName: string;
  setIndex: number; weightKg: number; reps: number; e1rm: number; isPR: boolean;
  effort?: Effort; createdAt: number;
  dropStages?: DropStageDto[];
}

export interface BodyweightDto { id?: number; date: string; kg: number; }

// ---- Water ----
export interface WaterDto { id?: number; date: string; amountMl: number; timestamp: number; }

// ---- Sleep ----
export interface SleepDto {
  id?: number; date: string; sleepAt: string; wakeAt: string;
  durationMin: number; quality: number; notes?: string;
}

// ---- Study ----
export type StudyStatus = "todo" | "doing" | "done";
export type StudySource = "youtube" | "playlist" | "course" | "book" | "other";
export interface StudyPathDto {
  id?: number; title: string; sourceType: StudySource; sourceUrl?: string; createdAt: number;
}
export interface StudyItemDto {
  id?: number; pathId: number; title: string; order: number; status: StudyStatus;
  sourceUrl?: string; notes?: string;
}
export interface StudySessionDto { id?: number; pathId: number; date: string; minutes: number; }

// ---- Fuel ----
export interface FuelDto {
  id?: number; date: string; odometer: number; litres: number; cost: number;
}

// ---- Expenses (War Chest) ----
export interface ExpenseCategoryDto {
  id: string; name: string; color: string; icon: string;
  order: number; isDefault: number; createdAt: number;
}
export interface ExpensePresetDto { label: string; amount: number; }
export interface ExpenseItemDto {
  id?: number; categoryId: string; name: string; defaultAmount: number;
  presets: ExpensePresetDto[]; favorite: 0 | 1; isCustom: 0 | 1; createdAt: number;
}
export interface ExpenseDto {
  id?: number; date: string; categoryId: string; itemId?: number;
  label?: string; amount: number; createdAt: number;
}
export interface CategoryBudgetDto { categoryId: string; monthlyBudget: number; }

// ---- Nutrition ----
export type ScheduleKind = "med" | "supplement" | "meal";
export interface ScheduleDto {
  id?: number; kind: ScheduleKind; label: string; dose?: string;
  time: string; active: number;
}
export interface ScheduleLogDto { id?: number; scheduleId: number; date: string; doneAt: number; }
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export interface MealDto {
  id?: number; date: string; time: string; name: string;
  mealType: MealType; protein: number; calories: number;
  // Phase 3: nullable extended macros (older meals stay valid without these)
  fatG?: number; carbsG?: number;
  foodId?: number;    // link to catalog if logged from-food
  grams?: number;     // portion size used
}

// ---- Foods catalog (Phase 3) ----
// A food's macros can be stored per-100g or per whole-piece.
// unit "g" or "ml" => amounts are per-100 of that unit; user picks grams/ml.
// unit "piece" | "scoop" | "tbsp" | "slice" => amounts are per one unit; user picks count.
export type FoodUnit = "g" | "ml" | "piece" | "scoop" | "tbsp" | "slice";
export type FoodCategory = "protein" | "carb" | "fat" | "hybrid" | "beverage" | "custom";
export interface FoodPresetDto { label: string; amount: number; }
export interface FoodDto {
  id?: number;
  name: string;
  category: FoodCategory;
  unit: FoodUnit;           // "g"/"ml" => per-100 basis; others => per-1 basis
  protein: number;          // g per 100g/ml, or per 1 piece/scoop/tbsp/slice
  fat: number;
  carbs: number;
  kcal: number;
  presets: FoodPresetDto[]; // quick-tap portions
  favorite: number;         // 0 | 1
  isCustom: number;         // 0 = seed catalog, 1 = user-added
  createdAt: number;
}

// ---- Settings ----
export interface SettingDto { key: string; value: number | string; }

// ---- Quotes ----
export type QuoteCategory = "gym" | "study" | "life";
export interface QuoteDto {
  id?: number;
  text: string;
  author?: string;
  category: QuoteCategory;
  isFavorite: number;
  createdAt: number;
}

// Legacy compat
export type DayType = string;
export interface ExercisePlan {
  name: string; sets: number; repLow: number; repHigh: number; restSec: number;
}
export interface DayPlan {
  dayType: DayType; label: string; focus: string; exercises: ExercisePlan[];
}

// ---- Calendar extensions ----
export interface GoalDayDto { id?: number; date: string; title: string; createdAt: number; }
export interface DayPhotoDto { id?: number; date: string; dataUrl: string; }
export interface StreakFreezeDto { id?: number; date: string; weekKey: string; }

// ---- Phase 1 close-out ----
export type BodyMetric = "waist" | "chest" | "arm" | "thigh" | "hip";
export interface BodyMeasurementDto { id?: number; date: string; metric: BodyMetric; cm: number; }

// A template can be a single-line entry (legacy) OR a combo (has items in mealTemplateItems).
export interface MealTemplateDto {
  id?: number; name: string; mealType: MealType;
  protein: number; calories: number;   // sum-of-items for combos, or fixed for legacy
  fatG?: number; carbsG?: number;
  isCombo?: number;                    // 1 if it has items
  createdAt: number;
}
export interface MealTemplateItemDto {
  id?: number; templateId: number; foodId: number; amount: number; order: number;
}

export type RestDayKind = "full" | "active" | "cardio";
export interface RestDayLogDto { id?: number; date: string; kind: RestDayKind; notes?: string; }

export interface HabitChainDto {
  id?: number; triggerTable: string; triggerKey?: string;
  action: "notify"; delayMin: number; message: string; active: number; createdAt: number;
}

// ---- Forged Habits ----
// habitChains (above) was never wired to any UI and is shaped for a
// different, background-automation concept (trigger table → delayed
// notification) — it stays dormant rather than repurposed. These two tables
// are the real vehicle for user-facing trigger→action habits with streaks.
export interface HabitDto {
  id?: number; name: string; triggerLabel: string; actionLabel: string;
  icon: string; color: string; active: number; order: number; createdAt: number;
}
export interface HabitLogDto { id?: number; habitId: number; date: string; createdAt: number; }

// ---- Achievements ----
export interface AchievementUnlockDto {
  id: string;
  unlockedAt: number;
  seen: number;
}

// ---- Reward Vault (cosmetics) ----
export interface CosmeticUnlockDto {
  id: string;
  unlockedAt: number;
  seen: number;
}

// ---- Phase-3 usage history ------------------------------------------------
// Keyed store used by predictive-input UX. Key format: "<kind>:<itemId>".
//   • "weight:<exerciseId>" → last-used weight for that exercise (kg)
//   • "reps:<exerciseId>"   → last-used reps
//   • "grams:<foodId>"      → last-used portion size for a catalog food
// One row per key; updated in-place. Never deleted.
export interface UsageHistoryDto {
  key: string;
  value: number;
  updatedAt: number;
}

// ---- XP system (Phase 5) ----
export interface XpEventDto {
  id?: number;
  action: string;    // "set" | "pr" | "streak_day" | "water_goal" | "discipline_80"
                     // | "discipline_100" | "perfect_week" | "sleep" | "meal"
                     // | "badge_bronze" | "badge_silver" | "badge_gold"
                     // | "badge_iron" | "badge_mythic" | "session_done"
  xp: number;
  weekKey: string;   // "2025-W12" — for fast weekly XP aggregation
  createdAt: number;
}

// ---- Tasks + Calendar system (Phase 6) ----
export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";
export type TaskPriority = 1 | 2 | 3; // 1=urgent 2=normal 3=low

export interface TaskDto {
  id?: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  listId: string;
  createdAt: number;
  updatedAt: number;
  // Scheduling (optional — if date set, shows on calendar)
  date?: string;          // YYYY-MM-DD
  time?: string;          // HH:mm
  endTime?: string;       // HH:mm (makes it a time-block vs point event)
  // Phase 9 — all-day / multi-day events. allDay:1 means `time`/`endTime` are
  // ignored for rendering; spanEnd (if set) makes it multi-day, inclusive of
  // both `date` and `spanEnd`.
  allDay?: number;        // 1 = all-day event
  spanEnd?: string;       // YYYY-MM-DD, inclusive — only meaningful when allDay:1
  // Recurrence
  recurringRuleId?: number;
  isRecurringInstance?: number; // 1 = spawned from rule
  // Rich fields (all optional)
  description?: string;
  location?: string;
  contactName?: string;
  contactPhone?: string;
  notes?: string;
  dose?: string;           // for medicine/supplement list items, e.g. "500mg"
  // Reminder
  remindAt?: number;
  remindBefore?: number;  // minutes before date+time
  // Dependencies
  blockedBy?: number;
  // Summit Push — links a "milestones"-list task to the goal day it belongs to
  goalDayId?: number;
  // Kanban
  startedAt?: number;
  completedAt?: number;
  // Google Calendar two-way sync — all optional, absent means never synced.
  googleEventId?: string;   // this task's event id on the dedicated "Zenith" Google calendar
  googleUpdatedAt?: number; // Google's `updated` timestamp (ms) as of the last pull, for conflict comparison
  syncedAt?: number;        // last time THIS row was written by the sync engine (pull or push) — lets push skip rows it just pulled
}

export interface TaskListDto {
  id: string;
  name: string;
  color: string;
  icon: string;
  order: number;
  isDefault: number; // 1 = can't delete
  createdAt: number;
}

export interface RecurringRuleDto {
  id?: number;
  frequency: "daily" | "weekly" | "monthly";
  interval: number;
  weekdays?: string;   // "1,3,5" for Mon/Wed/Fri
  endDate?: string;
  active: number;
  templateTitle: string;
  templateListId: string;
  templatePriority: TaskPriority;
  templateTime?: string;
  templateEndTime?: string;
  templateDose?: string;   // carried onto spawned instances' `dose` field
  templateRemindBefore?: number; // carried onto spawned instances' `remindBefore` field
  templateAllDay?: number;       // carried onto spawned instances' `allDay` field
  createdAt: number;
}

// A task that was deleted locally while it still had a `googleEventId` needs
// its remote event deleted too, but by the time the push engine runs, the
// local row (the only record of that id) is already gone — hard delete is
// Zenith's existing convention, no tombstone field on TaskDto. This table is
// the queue: `db.tasks`'s "deleting" hook writes one row here right before
// the task disappears, the next push flushes it against Google, then clears it.
export interface GoogleSyncOutboxDto {
  id?: number;
  googleEventId: string;
  deletedAt: number;
}
