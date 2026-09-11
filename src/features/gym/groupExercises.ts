import type { DayExerciseDto } from "../../db/types";

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
