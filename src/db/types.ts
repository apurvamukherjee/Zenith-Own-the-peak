// Domain types (DTOs). Kept flat so Dexie can index and query them cheaply.

export type DayType =
  | "PushA" | "PullA" | "LegsA"
  | "PushB" | "PullB" | "LegsB"
  | "Rest";

export interface ExercisePlan {
  name: string; sets: number; repLow: number; repHigh: number; restSec: number;
}
export interface DayPlan {
  dayType: DayType; label: string; focus: string; exercises: ExercisePlan[];
}

export interface WorkoutSessionDto {
  id?: number; date: string; weekKey: string; dayType: DayType; notes?: string; createdAt: number;
}
export interface WorkoutSetDto {
  id?: number; sessionId: number; date: string; exercise: string; setIndex: number;
  weightKg: number; reps: number; e1rm: number; isPR: boolean; createdAt: number;
}
export interface BodyweightDto { id?: number; date: string; kg: number; }

export interface WaterDto { id?: number; date: string; amountMl: number; timestamp: number; }

export interface SleepDto {
  id?: number; date: string; sleepAt: string; wakeAt: string;
  durationMin: number; quality: number; notes?: string;
}

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

export interface FuelDto {
  id?: number; date: string; odometer: number; litres: number; cost: number;
}

export interface SettingDto { key: string; value: number | string; }

export type ScheduleKind = "med" | "supplement" | "meal";
export interface ScheduleDto {
  id?: number; kind: ScheduleKind; label: string; dose?: string;
  time: string; active: number; // time HH:mm, active 1/0
}
export interface ScheduleLogDto { id?: number; scheduleId: number; date: string; doneAt: number; }

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export interface MealDto {
  id?: number; date: string; time: string; name: string;
  mealType: MealType; protein: number; calories: number;
}
