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

/**
 * PR flags that are wrong for one exercise's sets, replayed in log order: a
 * set is a PR when its e1RM beats every set logged before it — the same rule
 * logSet applies live. Deleting or editing a set changes what came "before"
 * for everything after it, so those later flags go stale.
 *
 * Only sets logged at/after `fromCreatedAt` are corrected; older rows keep
 * whatever they were stored with (bulk "complete" rows are stored isPR:false
 * on purpose and shouldn't flip just because an unrelated set was deleted).
 */
export function prFlagChanges(
  sets: readonly Pick<WorkoutSetDto, "id" | "e1rm" | "isPR" | "createdAt">[],
  fromCreatedAt = -Infinity,
): { id: number; isPR: boolean }[] {
  const ordered = [...sets].sort((a, b) => a.createdAt - b.createdAt || (a.id ?? 0) - (b.id ?? 0));
  const out: { id: number; isPR: boolean }[] = [];
  let best = 0;
  for (const s of ordered) {
    const isPR = s.e1rm > 0 && s.e1rm > best;
    if (s.createdAt >= fromCreatedAt && s.id != null && s.isPR !== isPR) out.push({ id: s.id, isPR });
    best = Math.max(best, s.e1rm);
  }
  return out;
}

// Group a flat set list into one point per date: the top e1RM that day.
interface ProgressPoint {
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
