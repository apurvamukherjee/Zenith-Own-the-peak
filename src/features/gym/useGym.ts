import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import type { DayExerciseDto, WorkoutDayDto, WorkoutSetDto, Effort } from "../../db/types";
import { estimate1RM, bestE1RM } from "../../lib/workout.utils";
import { todayKey, weekKey } from "../../lib/date.utils";
import { hapticLight, hapticSuccess } from "../../lib/haptics";

// ---- Read hooks ----
export function useWorkoutDays() {
  return useLiveQuery(() => db.workoutDays.orderBy("order").toArray(), []) ?? [];
}

export function useExerciseLibrary() {
  return useLiveQuery(() => db.exercises.orderBy("name").toArray(), []) ?? [];
}

export function useDayExercises(dayId?: number) {
  return useLiveQuery(
    () => dayId ? db.dayExercises.where({ dayId }).sortBy("order") : Promise.resolve([] as DayExerciseDto[]),
    [dayId],
  ) ?? [];
}

export function useExercise(id?: number) {
  return useLiveQuery(() => id ? db.exercises.get(id) : undefined, [id]);
}

export function useTodayDayId(): number | null {
  const wd = new Date().getDay();
  const entry = useLiveQuery(() => db.weekSchedule.where({ weekday: wd }).first(), [wd]);
  return entry?.dayId ?? null;
}

export function useTodaySession(dayId: number | null) {
  const date = todayKey();
  return useLiveQuery(
    () => dayId ? db.workoutSessions.where({ date, dayId }).first() : undefined,
    [date, dayId],
  );
}

export function useSessionSets(sessionId?: number) {
  return useLiveQuery(
    () => sessionId ? db.workoutSets.where({ sessionId }).sortBy("setIndex") : Promise.resolve([] as WorkoutSetDto[]),
    [sessionId],
  ) ?? [];
}

export function useGhostSets(dayId: number | null, exerciseId: number) {
  const date = todayKey();
  return useLiveQuery(async () => {
    if (!dayId) return [] as WorkoutSetDto[];
    const pastSessions = await db.workoutSessions
      .where("dayId").equals(dayId)
      .and((s) => s.date < date)
      .reverse().sortBy("date");
    const last = pastSessions[0];
    if (!last?.id) return [] as WorkoutSetDto[];
    return db.workoutSets.where({ sessionId: last.id, exerciseId }).sortBy("setIndex");
  }, [dayId, exerciseId, date]) ?? [];
}

export function useWeekSchedule() {
  return useLiveQuery(() => db.weekSchedule.orderBy("weekday").toArray(), []) ?? [];
}

// ---- Write functions ----
export async function ensureSession(dayId: number): Promise<number> {
  const date = todayKey();
  const existing = await db.workoutSessions.where({ date, dayId }).first();
  if (existing?.id) return existing.id;
  return db.workoutSessions.add({ date, weekKey: weekKey(), dayId, createdAt: Date.now() });
}

export async function logSet(params: {
  sessionId: number; exerciseId: number; exerciseName: string;
  setIndex: number; weightKg: number; reps: number; effort?: Effort;
}): Promise<{ isPR: boolean; e1rm: number }> {
  const e1rm = estimate1RM(params.weightKg, params.reps);
  const priorBest = bestE1RM(
    await db.workoutSets.where("exerciseName").equals(params.exerciseName).toArray(),
  );
  const isPR = e1rm > 0 && e1rm > priorBest;
  await db.workoutSets.add({
    ...params, e1rm, isPR, date: todayKey(), createdAt: Date.now(),
  });
  if (isPR) hapticSuccess(); else hapticLight();
  return { isPR, e1rm };
}

export async function deleteSet(id: number) { await db.workoutSets.delete(id); }

// ---- Planner writes ----
export async function addWorkoutDay(name: string, muscles: string[]): Promise<number> {
  const count = await db.workoutDays.count();
  return db.workoutDays.add({ name, muscles: muscles as any, order: count });
}

export async function updateWorkoutDay(id: number, data: Partial<WorkoutDayDto>) {
  await db.workoutDays.update(id, data);
}

export async function deleteWorkoutDay(id: number) {
  await db.dayExercises.where({ dayId: id }).delete();
  await db.weekSchedule.where({ dayId: id }).delete();
  await db.workoutDays.delete(id);
}

export async function addDayExercise(dayId: number, exerciseId: number, plan: {
  sets: number; repLow: number; repHigh: number; weightKg: number; restSec: number;
}) {
  const count = await db.dayExercises.where({ dayId }).count();
  return db.dayExercises.add({ dayId, exerciseId, order: count, ...plan });
}

export async function updateDayExercise(id: number, data: Partial<DayExerciseDto>) {
  await db.dayExercises.update(id, data);
}

export async function removeDayExercise(id: number) { await db.dayExercises.delete(id); }

export async function setWeekday(weekday: number, dayId: number) {
  const existing = await db.weekSchedule.where({ weekday }).first();
  if (existing?.id) await db.weekSchedule.update(existing.id, { dayId });
  else await db.weekSchedule.add({ weekday, dayId });
}

export async function cloneDay(srcId: number, newName: string): Promise<number> {
  const src = await db.workoutDays.get(srcId);
  if (!src) throw new Error("Day not found");
  const count = await db.workoutDays.count();
  const newId = await db.workoutDays.add({ name: newName, muscles: src.muscles, order: count });
  const exs = await db.dayExercises.where({ dayId: srcId }).toArray();
  await db.dayExercises.bulkAdd(exs.map((e) => ({ ...e, id: undefined, dayId: newId })));
  return newId;
}
