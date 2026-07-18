import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { db } from "../../db/db";
import type { DayExerciseDto } from "../../db/types";

// Double-progression method (Renaissance Periodization):
// If the last 3 sessions of an exercise ALL had every set at repHigh or above,
// suggest bumping the weight. Upper-body: +2.5kg, legs: +5kg.
// After 2 consecutive declines (stored in settings as overloadDeclined.<exId>),
// suppress the suggestion for 14 days.

const LEG_MUSCLES = new Set(["quads", "hamstrings", "glutes", "calves"]);

export interface OverloadSuggestion {
  exerciseId: number;
  exerciseName: string;
  currentKg: number;
  suggestKg: number;
  increment: number;
}

export function useOverloadSuggestions(exercises: DayExerciseDto[]): OverloadSuggestion[] {
  const exIds = exercises.map((e) => e.exerciseId);

  const sets = useLiveQuery<import("../../db/types").WorkoutSetDto[]>(
    () => exIds.length ? db.workoutSets.where("exerciseId").anyOf(exIds).toArray() : Promise.resolve([]),
    [exIds.join(",")],
  );

  const catalog = useLiveQuery(() => db.exercises.toArray(), []);

  return useMemo(() => {
    if (!sets || !catalog) return [];
    const suggestions: OverloadSuggestion[] = [];

    for (const plan of exercises) {
      const exSets = sets.filter((s) => s.exerciseId === plan.exerciseId);
      if (exSets.length === 0) continue;

      // Group into sessions (by date)
      const byDate = new Map<string, typeof exSets>();
      for (const s of exSets) {
        const arr = byDate.get(s.date) ?? [];
        arr.push(s);
        byDate.set(s.date, arr);
      }
      const sortedDates = [...byDate.keys()].sort().slice(-3);
      if (sortedDates.length < 3) continue;

      // Check: every set in each of the last 3 sessions hit repHigh or above
      const allHit = sortedDates.every((d) => {
        const daySets = byDate.get(d)!;
        return daySets.every((s) => s.reps >= plan.repHigh);
      });
      if (!allHit) continue;

      // Determine increment by primary muscle
      const ex = catalog.find((e) => e.id === plan.exerciseId);
      const isLeg = ex && LEG_MUSCLES.has(ex.primaryMuscle);
      const increment = isLeg ? 5 : 2.5;

      suggestions.push({
        exerciseId: plan.exerciseId,
        exerciseName: ex?.name ?? `Exercise ${plan.exerciseId}`,
        currentKg: plan.weightKg,
        suggestKg: plan.weightKg + increment,
        increment,
      });
    }
    return suggestions;
  }, [sets, catalog, exercises]);
}
