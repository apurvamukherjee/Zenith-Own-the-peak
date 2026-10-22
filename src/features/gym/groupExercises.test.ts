import { test } from "node:test";
import assert from "node:assert/strict";
import { buildItems, placeAfterGroup, arrangeForToday, doNextOrder, itemKey } from "./groupExercises.ts";
import type { DayExerciseDto } from "../../db/types";

const ex = (id: number, supersetGroupId?: number): DayExerciseDto => ({
  id, dayId: 1, exerciseId: id * 10, order: id, sets: 3, repLow: 8, repHigh: 12, weightKg: 20, restSec: 90, supersetGroupId,
});
const ids = (d: DayExerciseDto[]) => d.map((e) => e.id);

test("pulls a later exercise up next to the anchor", () => {
  const day = [ex(1), ex(2), ex(3), ex(4)];
  assert.deepEqual(ids(placeAfterGroup(day, day[0], day[3])), [1, 4, 2, 3]);
});

test("pushes an earlier exercise down next to the anchor", () => {
  const day = [ex(1), ex(2), ex(3), ex(4)];
  assert.deepEqual(ids(placeAfterGroup(day, day[2], day[0])), [2, 3, 1, 4]);
});

test("joins after the anchor's whole group, and the result groups as one item", () => {
  const day = [ex(1, 7), ex(2, 7), ex(3), ex(4)];
  const out = placeAfterGroup(day, day[0], day[3]).map((e) => (e.id === 4 ? { ...e, supersetGroupId: 7 } : e));
  assert.deepEqual(ids(out), [1, 2, 4, 3]);
  const items = buildItems(out);
  assert.equal(items[0].type, "group");
  assert.equal(items[0].type === "group" && items[0].exs.length, 3);
});

const keys = (d: DayExerciseDto[], order?: number[], skipped?: number[]) => {
  const r = arrangeForToday(buildItems(d), order, skipped);
  return { active: r.active.map(itemKey), skipped: r.skipped.map(itemKey) };
};

test("today's arrangement: skip removes, order wins, unordered keep plan order after", () => {
  const day = [ex(1), ex(2, 9), ex(3, 9), ex(4), ex(5)];
  assert.deepEqual(keys(day), { active: [1, 2, 4, 5], skipped: [] });
  assert.deepEqual(keys(day, undefined, [4]), { active: [1, 2, 5], skipped: [4] });
  assert.deepEqual(keys(day, [5, 1]), { active: [5, 1, 2, 4], skipped: [] });
});

test("do-next slots the block in front of the first unfinished one", () => {
  assert.deepEqual(doNextOrder([1, 2, 4, 5], 5, 2), [1, 5, 2, 4]);
  assert.deepEqual(doNextOrder([1, 2, 4, 5], 2, 2), [1, 2, 4, 5]);
  assert.deepEqual(doNextOrder([1, 2, 4], 4, undefined), [1, 2, 4]);
});
