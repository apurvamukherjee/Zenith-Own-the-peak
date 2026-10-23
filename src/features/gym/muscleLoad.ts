import type { DayExerciseDto, ExerciseDto, MuscleGroup, WeekScheduleDto, WorkoutSetDto } from "../../db/types";

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

export type MuscleTally = Partial<Record<MuscleGroup, number>>;

// Sets per muscle, the usual way volume is counted: a set is a full set for
// its primary muscle and half a set for each assist.
export function tallySets(entries: { exerciseId: number; sets: number }[], library: ExerciseDto[]): MuscleTally {
  const byId = new Map(library.map((e) => [e.id, e]));
  const tally: MuscleTally = {};
  const add = (m: MuscleGroup, n: number) => { tally[m] = (tally[m] ?? 0) + n; };
  for (const { exerciseId, sets } of entries) {
    const ex = byId.get(exerciseId);
    if (!ex) continue;
    add(ex.primaryMuscle, sets);
    ex.secondaryMuscles.forEach((m) => add(m, sets / 2));
  }
  return tally;
}

// Planned sets per muscle across one week of the schedule.
export function weeklyPlanTally(schedule: WeekScheduleDto[], dayExercises: DayExerciseDto[], library: ExerciseDto[]): MuscleTally {
  const entries = schedule.filter((s) => s.dayId).flatMap((s) => dayExercises.filter((d) => d.dayId === s.dayId));
  return tallySets(entries, library);
}

export function loggedTally(sets: Pick<WorkoutSetDto, "exerciseId">[], library: ExerciseDto[]): MuscleTally {
  return tallySets(sets.map((s) => ({ exerciseId: s.exerciseId, sets: 1 })), library);
}

export const fmtSets = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

// 10–20 sets a week per muscle is the commonly cited growth range.
export type VolumeStatus = "none" | "low" | "good" | "high";
export function volumeStatus(setsPerWeek: number): VolumeStatus {
  if (setsPerWeek <= 0) return "none";
  if (setsPerWeek < 10) return "low";
  return setsPerWeek <= 20 ? "good" : "high";
}
