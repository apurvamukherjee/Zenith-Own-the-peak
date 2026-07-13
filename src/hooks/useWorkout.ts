import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import type { DayType, WorkoutSetDto } from "../db/types";
import { estimate1RM, bestE1RM } from "../lib/workout.utils";
import { todayKey, weekKey } from "../lib/date.utils";

// Get (or lazily create) today's session for a given day type.
export function useTodaySession(dayType: DayType) {
  const date = todayKey();
  const session = useLiveQuery(
    () => db.workoutSessions.where({ date, dayType }).first(),
    [date, dayType],
  );
  return session;
}

export async function ensureSession(dayType: DayType): Promise<number> {
  const date = todayKey();
  const existing = await db.workoutSessions.where({ date, dayType }).first();
  if (existing?.id) return existing.id;
  return db.workoutSessions.add({
    date,
    weekKey: weekKey(),
    dayType,
    createdAt: Date.now(),
  });
}

// Sets logged for a session (live).
export function useSessionSets(sessionId?: number) {
  return useLiveQuery(
    () => (sessionId ? db.workoutSets.where({ sessionId }).toArray() : Promise.resolve([] as WorkoutSetDto[])),
    [sessionId],
  );
}

// "Ghost" numbers: the sets from the most recent PAST session of this day type,
// so the lifter always knows what to beat.
export function useGhostSets(dayType: DayType, exercise: string) {
  const date = todayKey();
  return useLiveQuery(async () => {
    const past = await db.workoutSessions
      .where("dayType").equals(dayType)
      .and((s) => s.date < date)
      .reverse()
      .sortBy("date");
    const last = past[0];
    if (!last?.id) return [] as WorkoutSetDto[];
    return db.workoutSets.where({ sessionId: last.id, exercise }).sortBy("setIndex");
  }, [dayType, exercise, date]);
}

// All-time history for one exercise (for the progression chart).
export function useExerciseHistory(exercise?: string) {
  return useLiveQuery(
    () => (exercise ? db.workoutSets.where("exercise").equals(exercise).sortBy("date") : Promise.resolve([] as WorkoutSetDto[])),
    [exercise],
  );
}

// List of every exercise the lifter has ever logged (for the chart picker).
export function useLoggedExercises() {
  return useLiveQuery(async () => {
    const names = await db.workoutSets.orderBy("exercise").uniqueKeys();
    return names as string[];
  }, []);
}

export function useRecentPRs(limit = 8) {
  return useLiveQuery(async () => {
    const prs = await db.workoutSets.filter((s) => s.isPR).toArray();
    return prs.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }, [limit]);
}

// Log a single set. Computes e1RM, decides PR vs the exercise's prior best,
// writes it, and returns whether it was a PR so the UI can celebrate.
export async function logSet(params: {
  sessionId: number;
  exercise: string;
  setIndex: number;
  weightKg: number;
  reps: number;
}): Promise<{ isPR: boolean; e1rm: number }> {
  const e1rm = estimate1RM(params.weightKg, params.reps);
  const priorBest = bestE1RM(
    await db.workoutSets.where("exercise").equals(params.exercise).toArray(),
  );
  const isPR = e1rm > 0 && e1rm > priorBest;
  await db.workoutSets.add({
    sessionId: params.sessionId,
    date: todayKey(),
    exercise: params.exercise,
    setIndex: params.setIndex,
    weightKg: params.weightKg,
    reps: params.reps,
    e1rm,
    isPR,
    createdAt: Date.now(),
  });
  return { isPR, e1rm };
}

export async function deleteSet(id: number) {
  await db.workoutSets.delete(id);
}
