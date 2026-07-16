// Domain types. Flat for Dexie indexing.

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

export type Effort = "easy" | "good" | "hard" | "failed";

export interface WorkoutSessionDto {
  id?: number; date: string; weekKey: string; dayId: number; notes?: string; createdAt: number;
}
export interface WorkoutSetDto {
  id?: number; sessionId: number; date: string; exerciseId: number; exerciseName: string;
  setIndex: number; weightKg: number; reps: number; e1rm: number; isPR: boolean;
  effort?: Effort; createdAt: number;
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

// ---- Achievements ----
export interface AchievementUnlockDto {
  id: string;
  unlockedAt: number;
  seen: number;
}
