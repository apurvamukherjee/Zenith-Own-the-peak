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
  equipment: string;     // "barbell" | "dumbbell" | "cable" | "machine" | "bodyweight"
  cues?: string;         // coaching notes shown on session page
  isCustom: number;      // 0 = seed library, 1 = user-added
}

export interface WorkoutDayDto {
  id?: number;
  name: string;          // "Back Day", "Push Heavy", etc.
  muscles: MuscleGroup[]; // highlighted on heatmap
  order: number;         // display order in planner
}

export interface DayExerciseDto {
  id?: number;
  dayId: number;
  exerciseId: number;
  order: number;
  sets: number;
  repLow: number;
  repHigh: number;
  weightKg: number;      // planned weight
  restSec: number;
}

export interface WeekScheduleDto {
  id?: number;
  weekday: number;       // 0=Sun .. 6=Sat
  dayId: number;         // -> WorkoutDayDto.id, 0 = rest
}

// Feeling tag per exercise in a session
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
}

// ---- Settings ----
export interface SettingDto { key: string; value: number | string; }

// ---- Quotes (self-motivation) ----
export type QuoteCategory = "gym" | "study" | "life";
export interface QuoteDto {
  id?: number;
  text: string;
  author?: string;
  category: QuoteCategory;
  isFavorite: number; // 0 | 1
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

export interface MealTemplateDto {
  id?: number; name: string; mealType: MealType; protein: number; calories: number; createdAt: number;
}

export type RestDayKind = "full" | "active" | "cardio";
export interface RestDayLogDto { id?: number; date: string; kind: RestDayKind; notes?: string; }

export interface HabitChainDto {
  id?: number; triggerTable: string; triggerKey?: string;
  action: "notify"; delayMin: number; message: string; active: number; createdAt: number;
}

// ---- Achievements ----
// Definitions live in code (lib/achievements.ts). This table only persists
// which ones the user has unlocked, keyed by the definition id (string).
export interface AchievementUnlockDto {
  id: string;         // matches an ACHIEVEMENTS[].id
  unlockedAt: number; // epoch ms
  seen: number;       // 0 = fresh (dot + toast), 1 = acknowledged
}
