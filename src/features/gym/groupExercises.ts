import type { DayExerciseDto, WorkoutSetDto } from "../../db/types";

export type Item = { type: "single"; ex: DayExerciseDto } | { type: "group"; exs: DayExerciseDto[] };

// Folds consecutive same-supersetGroupId exercises (by `order`) into one group
// item. Shared between SessionLogger (renders ExerciseBlock/SupersetBlock) and
// GymFocusMode (walks the same order to decide what's next) so the two views
// can never disagree about grouping.
export function buildItems(exercises: DayExerciseDto[]): Item[] {
  const items: Item[] = [];
  let i = 0;
  while (i < exercises.length) {
    const cur = exercises[i];
    const gid = cur.supersetGroupId;
    if (gid == null) {
      items.push({ type: "single", ex: cur });
      i++;
      continue;
    }
    const grp: DayExerciseDto[] = [cur];
    let j = i + 1;
    while (j < exercises.length && exercises[j].supersetGroupId === gid) {
      grp.push(exercises[j]);
      j++;
    }
    // A group of one is really just a single (user unlinked one side).
    if (grp.length >= 2) items.push({ type: "group", exs: grp });
    else items.push({ type: "single", ex: cur });
    i = j;
  }
  return items;
}

// Within a group, the next set to log is whichever partner has the FEWEST
// sets logged so far (ties broken by group order). Since every completed set
// increments that partner's count by exactly one, this greedy rule reproduces
// the real A1 → B1 → A2 → B2 alternation without needing an explicit "round"
// counter, and degrades gracefully if partners have different set targets.
export function findNextInGroup(group: DayExerciseDto[], sets: WorkoutSetDto[]): { ex: DayExerciseDto; setIndex: number } | null {
  let best: { ex: DayExerciseDto; setIndex: number; done: number } | null = null;
  for (const g of group) {
    const done = sets.filter((s) => s.exerciseId === g.exerciseId).length;
    if (done >= g.sets) continue;
    if (!best || done < best.done) best = { ex: g, setIndex: done + 1, done };
  }
  return best ? { ex: best.ex, setIndex: best.setIndex } : null;
}

// First unfinished set across the whole day, walking items in plan order.
export function findNextSet(items: Item[], sets: WorkoutSetDto[]): { ex: DayExerciseDto; setIndex: number } | null {
  for (const item of items) {
    if (item.type === "group") {
      const next = findNextInGroup(item.exs, sets);
      if (next) return next;
      continue;
    }
    const done = sets.filter((s) => s.exerciseId === item.ex.exerciseId).length;
    if (done < item.ex.sets) return { ex: item.ex, setIndex: done + 1 };
  }
  return null;
}

// Day order with `partner` moved to sit right after `anchor`'s superset group
// (or right after `anchor` if it isn't grouped yet).
export function placeAfterGroup(day: DayExerciseDto[], anchor: DayExerciseDto, partner: DayExerciseDto): DayExerciseDto[] {
  const rest = day.filter((e) => e.id !== partner.id);
  let at = rest.findIndex((e) => e.id === anchor.id);
  while (anchor.supersetGroupId != null && rest[at + 1]?.supersetGroupId === anchor.supersetGroupId) at++;
  return [...rest.slice(0, at + 1), partner, ...rest.slice(at + 1)];
}
