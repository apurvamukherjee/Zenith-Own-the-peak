// Compat hooks for the Progress page. Session logging moved to features/gym/useGym.ts.
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import type { WorkoutSetDto } from "../db/types";

export function useExerciseHistory(exerciseName?: string) {
  return useLiveQuery(
    () => (exerciseName ? db.workoutSets.where("exerciseName").equals(exerciseName).sortBy("date") : Promise.resolve([] as WorkoutSetDto[])),
    [exerciseName],
  ) ?? [];
}

export function useLoggedExercises() {
  return useLiveQuery(async () => {
    const names = await db.workoutSets.orderBy("exerciseName").uniqueKeys();
    return names as string[];
  }, []) ?? [];
}

export function useRecentPRs(limit = 8) {
  return useLiveQuery(async () => {
    const prs = await db.workoutSets.filter((s) => s.isPR).toArray();
    return prs.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }, [limit]) ?? [];
}
