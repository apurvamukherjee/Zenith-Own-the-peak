import { test } from "node:test";
import assert from "node:assert/strict";
import { prFlagChanges } from "./workout.utils.ts";

type S = { id: number; e1rm: number; isPR: boolean; createdAt: number };
const set = (id: number, e1rm: number, isPR: boolean, createdAt = id): S => ({ id, e1rm, isPR, createdAt });

test("deleting a PR hands it to the next set that beats everything before it", () => {
  // logged 100 (PR), 105 (PR), 103 (not), 110 (PR) — then 105 is deleted
  const left = [set(1, 100, true), set(3, 103, false), set(4, 110, true)];
  assert.deepEqual(prFlagChanges(left, 2), [{ id: 3, isPR: true }]);
});

test("deleting an early big set can make later sets PRs", () => {
  // 120 (PR), 110 (not), 115 (not) — 120 deleted
  const left = [set(2, 110, false), set(3, 115, false)];
  assert.deepEqual(prFlagChanges(left, 1), [{ id: 2, isPR: true }, { id: 3, isPR: true }]);
});

test("editing a set up revokes later PRs it now beats", () => {
  // set 1 edited 100 -> 130; set 2 (120) was a PR, no longer is
  assert.deepEqual(prFlagChanges([set(1, 130, true), set(2, 120, true)], 1), [{ id: 2, isPR: false }]);
});

test("sets logged before the change are left as stored", () => {
  // set 1 stored isPR:false (bulk-completed), but would be a PR on replay
  assert.deepEqual(prFlagChanges([set(1, 100, false), set(2, 90, true)], 2), [{ id: 2, isPR: false }]);
});

test("zero e1RM is never a PR; ties are not PRs; order is createdAt then id", () => {
  assert.deepEqual(prFlagChanges([set(1, 0, true)]), [{ id: 1, isPR: false }]);
  assert.deepEqual(prFlagChanges([set(2, 100, true, 5), set(1, 100, true, 5)]), [{ id: 2, isPR: false }]);
});
