import type { WorkoutSetDto } from "../db/types";

// Epley estimated 1RM. Captures BOTH weight and reps in one number, so beating
// last week on either lever moves the progression curve up.
export function estimate1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

export function bestE1RM(sets: WorkoutSetDto[]): number {
  return sets.reduce((max, s) => Math.max(max, s.e1rm), 0);
}

// Group a flat set list into one point per date: the top e1RM that day.
export interface ProgressPoint {
  date: string;
  topE1rm: number;
  topWeight: number;
  topReps: number;
}

export function progressionByDate(sets: WorkoutSetDto[]): ProgressPoint[] {
  const byDate = new Map<string, WorkoutSetDto[]>();
  for (const s of sets) {
    const arr = byDate.get(s.date) ?? [];
    arr.push(s);
    byDate.set(s.date, arr);
  }
  return [...byDate.entries()]
    .map(([date, daySets]) => {
      const top = daySets.reduce((a, b) => (b.e1rm > a.e1rm ? b : a));
      return { date, topE1rm: top.e1rm, topWeight: top.weightKg, topReps: top.reps };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Total volume load (kg lifted) — sets x reps x weight.
export function volumeLoad(sets: WorkoutSetDto[]): number {
  return Math.round(sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0));
}
