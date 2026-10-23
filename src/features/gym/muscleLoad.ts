import type { DayExerciseDto, ExerciseDto, MuscleGroup, WorkoutSetDto } from "../../db/types";

export interface MuscleRow { muscle: MuscleGroup; total: number; done: number }

// Hot = what the day targets plus every primary muscle actually in it, so a
// day with no picked muscles still lights up from its exercises;
// warm = secondaries hit along the way. Rows keep the day's own order first.
export function muscleLoad(
  dayMuscles: MuscleGroup[], plan: DayExerciseDto[], library: ExerciseDto[], sets: WorkoutSetDto[] = [],
): { hot: MuscleGroup[]; warm: MuscleGroup[]; rows: MuscleRow[] } {
  const byId = new Map(library.map((e) => [e.id, e]));
  const rows = new Map<MuscleGroup, MuscleRow>(dayMuscles.map((m) => [m, { muscle: m, total: 0, done: 0 }]));
  const warm = new Set<MuscleGroup>();
  for (const p of plan) {
    const ex = byId.get(p.exerciseId);
    if (!ex) continue;
    const row = rows.get(ex.primaryMuscle) ?? { muscle: ex.primaryMuscle, total: 0, done: 0 };
    row.total += p.sets;
    row.done += Math.min(p.sets, sets.filter((s) => s.exerciseId === p.exerciseId).length);
    rows.set(ex.primaryMuscle, row);
    ex.secondaryMuscles.forEach((m) => warm.add(m));
  }
  const hot = [...rows.keys()];
  return { hot, warm: [...warm].filter((m) => !rows.has(m)), rows: [...rows.values()] };
}
