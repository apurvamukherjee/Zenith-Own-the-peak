import { test } from "node:test";
import assert from "node:assert/strict";
import { muscleLoad, weeklyPlanTally, loggedTally } from "./muscleLoad.ts";
import type { DayExerciseDto, ExerciseDto, WorkoutSetDto } from "../../db/types";

const lib: ExerciseDto[] = [
  { id: 1, name: "Bench", primaryMuscle: "chest", secondaryMuscles: ["triceps", "shoulders"], equipment: "barbell", isCustom: 0 },
  { id: 2, name: "Pushdown", primaryMuscle: "triceps", secondaryMuscles: [], equipment: "cable", isCustom: 0 },
];
const plan = (exerciseId: number, sets: number): DayExerciseDto =>
  ({ id: exerciseId, dayId: 1, exerciseId, order: exerciseId, sets, repLow: 8, repHigh: 12, weightKg: 0, restSec: 90 });
const set = (exerciseId: number, setIndex: number) => ({ exerciseId, setIndex }) as WorkoutSetDto;

test("day muscles lead, primaries are hot, secondaries only warm when not hot", () => {
  const r = muscleLoad(["shoulders", "chest"], [plan(1, 3), plan(2, 2)], lib, [set(1, 1), set(1, 2), set(2, 1), set(2, 2), set(2, 3)]);
  assert.deepEqual(r.hot, ["shoulders", "chest", "triceps"]);
  assert.deepEqual(r.warm, []);
  assert.deepEqual(r.rows.map((x) => [x.muscle, x.done, x.total]), [["shoulders", 0, 0], ["chest", 2, 3], ["triceps", 2, 2]]);
});

test("secondary muscles show warm", () => {
  assert.deepEqual(muscleLoad([], [plan(1, 3)], lib).warm, ["triceps", "shoulders"]);
});

test("tally counts primary sets fully and assists as half", () => {
  const t = weeklyPlanTally(
    [{ weekday: 1, dayId: 1 }, { weekday: 4, dayId: 1 }, { weekday: 0, dayId: 0 }],
    [plan(1, 3), { ...plan(2, 2), dayId: 2 }],
    lib,
  );
  assert.deepEqual(t, { chest: 6, triceps: 3, shoulders: 3 });
  assert.deepEqual(loggedTally([set(2, 1), set(1, 1)], lib), { triceps: 1.5, chest: 1, shoulders: 0.5 });
});
