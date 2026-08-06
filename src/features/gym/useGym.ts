import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import type { DayExerciseDto, WorkoutDayDto, WorkoutSetDto, Effort, DropStageDto, MuscleGroup } from "../../db/types";
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
  // Drop set: additional weight-drop stages performed right after the primary
  // weightKg/reps above, no rest between. PR/e1RM are still computed off the
  // primary (top) weight — that's the number that matters for strength.
  dropStages?: DropStageDto[];
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

// User-authored exercise, added straight into the library (isCustom: 1) so it
// shows up alongside the pre-made list everywhere (planner picker, logger).
export async function addCustomExercise(data: {
  name: string; primaryMuscle: MuscleGroup; secondaryMuscles: MuscleGroup[]; equipment: string; cues?: string;
}): Promise<number> {
  return db.exercises.add({ ...data, isCustom: 1 });
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

// ---- Supersets (Phase 3) ---------------------------------------------------
// Two or more consecutive exercises within a day (by `order`) sharing the same
// non-null `supersetGroupId` are performed alternating. The group id itself is
// an opaque number — we use Date.now() at link time. Legacy rows without the
// field are just standalone exercises.
//
// `toggleSupersetLink(a, b)` links two exercises if neither is currently in a
// group, or breaks the pair apart if they already share a group. Small helper
// used by the Planner "Link" button on each row.
export async function toggleSupersetLink(aId: number, bId: number): Promise<void> {
  const [a, b] = await Promise.all([db.dayExercises.get(aId), db.dayExercises.get(bId)]);
  if (!a || !b) return;
  if (a.supersetGroupId && a.supersetGroupId === b.supersetGroupId) {
    // Already linked — unlink both ends of the pair. Also unlink any other
    // exercises that were transitively part of the same group so we don't
    // leave dangling links.
    const groupId = a.supersetGroupId;
    const group = await db.dayExercises.where({ dayId: a.dayId })
      .filter((e) => e.supersetGroupId === groupId).toArray();
    await Promise.all(group.map((e) => db.dayExercises.update(e.id!, { supersetGroupId: undefined })));
    return;
  }
  // Refuse to link across days (defensive — shouldn't happen from the UI).
  if (a.dayId !== b.dayId) return;
  const groupId = a.supersetGroupId ?? b.supersetGroupId ?? Date.now();
  await Promise.all([
    db.dayExercises.update(aId, { supersetGroupId: groupId }),
    db.dayExercises.update(bId, { supersetGroupId: groupId }),
  ]);
}

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

// Complete all remaining (unlogged) sets for ONE exercise in the CURRENT,
// in-progress session — planned weight + mid-range reps fill in whatever
// hasn't been tapped yet. Sets already logged are left untouched.
export async function completeRemainingSets(
  sessionId: number,
  plan: DayExerciseDto,
  alreadyLoggedIndices: number[],
): Promise<number> {
  const exercise = await db.exercises.get(plan.exerciseId);
  const midReps = Math.round((plan.repLow + plan.repHigh) / 2);
  const done = new Set(alreadyLoggedIndices);
  const date = todayKey();
  let added = 0;
  for (let i = 1; i <= plan.sets; i++) {
    if (done.has(i)) continue;
    const e1rm = estimate1RM(plan.weightKg, midReps);
    await db.workoutSets.add({
      sessionId, date, exerciseId: plan.exerciseId,
      exerciseName: exercise?.name ?? "Exercise", setIndex: i,
      weightKg: plan.weightKg, reps: midReps, e1rm, isPR: false, createdAt: Date.now(),
    });
    added++;
  }
  if (added > 0) hapticLight();
  return added;
}

// Complete every remaining set across the WHOLE day's plan in one tap —
// same placeholder logic as completeRemainingSets, applied exercise by
// exercise, for the "finish the rest of today's workout" button.
export async function completeAllRemainingForDay(
  sessionId: number,
  exercises: DayExerciseDto[],
  sets: WorkoutSetDto[],
): Promise<void> {
  for (const ex of exercises) {
    const loggedIndices = sets.filter((s) => s.exerciseId === ex.exerciseId).map((s) => s.setIndex);
    await completeRemainingSets(sessionId, ex, loggedIndices);
  }
  hapticSuccess();
}

// Backfill: log an entire missed session for a past date, using the day's
// planned sets/reps/weight as the recorded values (quick one-tap recovery
// for "I trained but forgot to log it").
export async function backfillSession(date: string, dayId: number): Promise<number> {
  const plan = await db.dayExercises.where({ dayId }).sortBy("order");
  const session = await db.workoutSessions.add({
    date, weekKey: weekKey(new Date(date)), dayId, createdAt: Date.now(),
    notes: "Backfilled",
  });
  for (const ex of plan) {
    const exercise = await db.exercises.get(ex.exerciseId);
    const midReps = Math.round((ex.repLow + ex.repHigh) / 2);
    for (let i = 1; i <= ex.sets; i++) {
      const e1rm = estimate1RM(ex.weightKg, midReps);
      await db.workoutSets.add({
        sessionId: session, date, exerciseId: ex.exerciseId,
        exerciseName: exercise?.name ?? "Exercise", setIndex: i,
        weightKg: ex.weightKg, reps: midReps, e1rm, isPR: false, createdAt: Date.now(),
      });
    }
  }
  return session;
}
