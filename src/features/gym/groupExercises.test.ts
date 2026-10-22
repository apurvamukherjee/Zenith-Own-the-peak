import { test } from "node:test";
import assert from "node:assert/strict";
import { buildItems, placeAfterGroup } from "./groupExercises.ts";
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
