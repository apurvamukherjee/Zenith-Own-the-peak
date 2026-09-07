// Built-in plan catalog. Each is a plain WorkoutPlanFile — the same shape the
// "Plan file (advanced)" Settings import/export already uses (see
// lib/workoutPlanFile.ts, docs/WORKOUT_PLAN_FORMAT.md) — so activating one is
// just importWorkoutPlan(file, "replace"). Every exercise name below already
// exists in config/exerciseLibrary.ts.
import type { WorkoutPlanFile } from "../../lib/workoutPlanFile";

export type BuiltInPlanKey = "classic-ppl" | "ppl-rest" | "bro-split";

export interface BuiltInPlanDef {
  key: BuiltInPlanKey;
  name: string;
  description: string;
  file: WorkoutPlanFile;
}

// The original 6-day PPL split — unchanged from the previous hardcoded
// seedProgram.ts definition, just expressed as a WorkoutPlanFile so it can go
// through importWorkoutPlan() like every other plan.
const CLASSIC_PPL: WorkoutPlanFile = {
  type: "zenith-workout-plan",
  version: 1,
  days: [
    { name: "Push A", muscles: ["chest", "shoulders", "triceps"], exercises: [
      { name: "Incline Dumbbell Press", sets: 3, repLow: 6, repHigh: 10, weightKg: 14, restSec: 150 },
      { name: "Flat Dumbbell Press", sets: 3, repLow: 8, repHigh: 12, weightKg: 12, restSec: 120 },
      { name: "Overhead Press", sets: 3, repLow: 8, repHigh: 12, weightKg: 20, restSec: 120 },
      { name: "Lateral Raise", sets: 3, repLow: 12, repHigh: 20, weightKg: 6, restSec: 75 },
      { name: "Triceps Pushdown", sets: 3, repLow: 10, repHigh: 15, weightKg: 15, restSec: 75 },
      { name: "Overhead Triceps Extension", sets: 2, repLow: 12, repHigh: 15, weightKg: 10, restSec: 75 },
    ]},
    { name: "Pull A", muscles: ["back", "biceps"], exercises: [
      { name: "Pull-Up", sets: 3, repLow: 6, repHigh: 12, weightKg: 0, restSec: 150 },
      { name: "Chest-Supported Row", sets: 3, repLow: 8, repHigh: 12, weightKg: 14, restSec: 120 },
      { name: "Seated Cable Row", sets: 3, repLow: 10, repHigh: 12, weightKg: 30, restSec: 90 },
      { name: "Rear-Delt Fly", sets: 3, repLow: 12, repHigh: 20, weightKg: 6, restSec: 75 },
      { name: "Barbell Curl", sets: 3, repLow: 8, repHigh: 12, weightKg: 15, restSec: 90 },
      { name: "Incline Dumbbell Curl", sets: 2, repLow: 10, repHigh: 15, weightKg: 6, restSec: 75 },
    ]},
    { name: "Legs A", muscles: ["quads", "hamstrings", "glutes", "calves", "abs"], exercises: [
      { name: "Barbell Squat", sets: 3, repLow: 6, repHigh: 10, weightKg: 40, restSec: 180 },
      { name: "Romanian Deadlift", sets: 3, repLow: 8, repHigh: 12, weightKg: 40, restSec: 150 },
      { name: "Leg Extension", sets: 3, repLow: 12, repHigh: 15, weightKg: 25, restSec: 90 },
      { name: "Lying Leg Curl", sets: 3, repLow: 10, repHigh: 15, weightKg: 20, restSec: 90 },
      { name: "Standing Calf Raise", sets: 4, repLow: 10, repHigh: 15, weightKg: 40, restSec: 75 },
      { name: "Hanging Leg Raise", sets: 3, repLow: 10, repHigh: 15, weightKg: 0, restSec: 60 },
    ]},
    { name: "Push B", muscles: ["chest", "shoulders", "triceps"], exercises: [
      { name: "Flat Dumbbell Press", sets: 3, repLow: 10, repHigh: 15, weightKg: 10, restSec: 120 },
      { name: "Incline Machine Press", sets: 3, repLow: 12, repHigh: 15, weightKg: 20, restSec: 90 },
      { name: "Seated Dumbbell Shoulder Press", sets: 3, repLow: 10, repHigh: 15, weightKg: 8, restSec: 90 },
      { name: "Cable Lateral Raise", sets: 3, repLow: 15, repHigh: 20, weightKg: 5, restSec: 60 },
      { name: "Cable Triceps Pushdown", sets: 3, repLow: 12, repHigh: 20, weightKg: 12, restSec: 60 },
      { name: "Overhead Cable Extension", sets: 2, repLow: 15, repHigh: 20, weightKg: 10, restSec: 60 },
    ]},
    { name: "Pull B", muscles: ["back", "biceps"], exercises: [
      { name: "Close-Grip Lat Pulldown", sets: 3, repLow: 10, repHigh: 15, weightKg: 35, restSec: 120 },
      { name: "Machine Row", sets: 3, repLow: 12, repHigh: 15, weightKg: 30, restSec: 90 },
      { name: "Straight-Arm Pulldown", sets: 3, repLow: 12, repHigh: 15, weightKg: 15, restSec: 90 },
      { name: "Reverse Pec Deck", sets: 3, repLow: 15, repHigh: 20, weightKg: 20, restSec: 60 },
      { name: "Hammer Curl", sets: 3, repLow: 12, repHigh: 15, weightKg: 8, restSec: 75 },
      { name: "Spider Curl", sets: 2, repLow: 12, repHigh: 20, weightKg: 6, restSec: 60 },
    ]},
    { name: "Legs B", muscles: ["quads", "hamstrings", "glutes", "calves", "abs"], exercises: [
      { name: "Leg Press", sets: 3, repLow: 12, repHigh: 20, weightKg: 80, restSec: 150 },
      { name: "Hip Thrust", sets: 3, repLow: 10, repHigh: 15, weightKg: 40, restSec: 120 },
      { name: "Bulgarian Split Squat", sets: 3, repLow: 10, repHigh: 12, weightKg: 8, restSec: 90 },
      { name: "Seated Leg Curl", sets: 3, repLow: 12, repHigh: 15, weightKg: 20, restSec: 90 },
      { name: "Standing Calf Raise", sets: 4, repLow: 12, repHigh: 20, weightKg: 35, restSec: 60 },
      { name: "Cable Crunch", sets: 3, repLow: 12, repHigh: 15, weightKg: 20, restSec: 60 },
    ]},
  ],
  schedule: { mon: "Push A", tue: "Pull A", wed: "Legs A", thu: "Push B", fri: "Pull B", sat: "Legs B", sun: "Rest" },
};

// Push Pull Legs Rest Push Pull Legs — 3 day templates reused across the week,
// exactly the rotation the user asked for.
const PPL_REST: WorkoutPlanFile = {
  type: "zenith-workout-plan",
  version: 1,
  days: [
    { name: "Push", muscles: ["chest", "shoulders", "triceps"], exercises: [
      { name: "Flat Barbell Bench Press", sets: 4, repLow: 6, repHigh: 10, weightKg: 30, restSec: 150 },
      { name: "Incline Dumbbell Press", sets: 3, repLow: 8, repHigh: 12, weightKg: 12, restSec: 120 },
      { name: "Overhead Press", sets: 3, repLow: 8, repHigh: 12, weightKg: 20, restSec: 120 },
      { name: "Lateral Raise", sets: 3, repLow: 12, repHigh: 20, weightKg: 6, restSec: 75 },
      { name: "Cable Triceps Pushdown", sets: 3, repLow: 10, repHigh: 15, weightKg: 15, restSec: 75 },
      { name: "Overhead Triceps Extension", sets: 2, repLow: 12, repHigh: 15, weightKg: 10, restSec: 60 },
    ]},
    { name: "Pull", muscles: ["back", "biceps"], exercises: [
      { name: "Conventional Deadlift", sets: 3, repLow: 5, repHigh: 8, weightKg: 40, restSec: 180 },
      { name: "Pull-Up", sets: 3, repLow: 6, repHigh: 12, weightKg: 0, restSec: 150 },
      { name: "Barbell Row", sets: 3, repLow: 8, repHigh: 12, weightKg: 30, restSec: 120 },
      { name: "Face Pull", sets: 3, repLow: 12, repHigh: 15, weightKg: 12, restSec: 75 },
      { name: "Barbell Curl", sets: 3, repLow: 8, repHigh: 12, weightKg: 15, restSec: 90 },
      { name: "Hammer Curl", sets: 2, repLow: 10, repHigh: 15, weightKg: 8, restSec: 75 },
    ]},
    { name: "Legs", muscles: ["quads", "hamstrings", "glutes", "calves"], exercises: [
      { name: "Barbell Squat", sets: 4, repLow: 6, repHigh: 10, weightKg: 40, restSec: 180 },
      { name: "Romanian Deadlift", sets: 3, repLow: 8, repHigh: 12, weightKg: 40, restSec: 150 },
      { name: "Leg Press", sets: 3, repLow: 12, repHigh: 15, weightKg: 60, restSec: 120 },
      { name: "Lying Leg Curl", sets: 3, repLow: 10, repHigh: 15, weightKg: 20, restSec: 90 },
      { name: "Standing Calf Raise", sets: 4, repLow: 10, repHigh: 15, weightKg: 40, restSec: 75 },
      { name: "Leg Extension", sets: 3, repLow: 12, repHigh: 15, weightKg: 25, restSec: 75 },
    ]},
  ],
  schedule: { mon: "Push", tue: "Pull", wed: "Legs", thu: "Rest", fri: "Push", sat: "Pull", sun: "Legs" },
};

// Classic 6-day bro split + 1 rest day.
const BRO_SPLIT: WorkoutPlanFile = {
  type: "zenith-workout-plan",
  version: 1,
  days: [
    { name: "Chest + Forearms A", muscles: ["chest", "forearms"], exercises: [
      { name: "Flat Barbell Bench Press", sets: 4, repLow: 6, repHigh: 10, weightKg: 30, restSec: 150 },
      { name: "Incline Dumbbell Press", sets: 3, repLow: 8, repHigh: 12, weightKg: 12, restSec: 120 },
      { name: "Cable Fly", sets: 3, repLow: 12, repHigh: 15, weightKg: 10, restSec: 75 },
      { name: "Wrist Curl", sets: 3, repLow: 15, repHigh: 20, weightKg: 8, restSec: 60 },
      { name: "Reverse Wrist Curl", sets: 3, repLow: 15, repHigh: 20, weightKg: 5, restSec: 60 },
      { name: "Barbell Wrist Roller", sets: 2, repLow: 8, repHigh: 12, weightKg: 5, restSec: 60 },
    ]},
    { name: "Shoulders + Triceps", muscles: ["shoulders", "triceps"], exercises: [
      { name: "Overhead Press", sets: 3, repLow: 8, repHigh: 12, weightKg: 20, restSec: 120 },
      { name: "Lateral Raise", sets: 3, repLow: 12, repHigh: 20, weightKg: 6, restSec: 75 },
      { name: "Rear-Delt Fly", sets: 3, repLow: 12, repHigh: 20, weightKg: 6, restSec: 75 },
      { name: "Close-Grip Bench Press", sets: 3, repLow: 8, repHigh: 12, weightKg: 25, restSec: 120 },
      { name: "Cable Triceps Pushdown", sets: 3, repLow: 10, repHigh: 15, weightKg: 15, restSec: 75 },
      { name: "Overhead Triceps Extension", sets: 2, repLow: 12, repHigh: 15, weightKg: 10, restSec: 60 },
    ]},
    { name: "Back + Biceps", muscles: ["back", "biceps"], exercises: [
      { name: "Conventional Deadlift", sets: 3, repLow: 5, repHigh: 8, weightKg: 40, restSec: 180 },
      { name: "Pull-Up", sets: 3, repLow: 6, repHigh: 12, weightKg: 0, restSec: 150 },
      { name: "Barbell Row", sets: 3, repLow: 8, repHigh: 12, weightKg: 30, restSec: 120 },
      { name: "Barbell Curl", sets: 3, repLow: 8, repHigh: 12, weightKg: 15, restSec: 90 },
      { name: "Incline Dumbbell Curl", sets: 3, repLow: 10, repHigh: 15, weightKg: 6, restSec: 75 },
      { name: "Hammer Curl", sets: 2, repLow: 10, repHigh: 15, weightKg: 8, restSec: 75 },
    ]},
    { name: "Chest + Forearms B", muscles: ["chest", "forearms"], exercises: [
      { name: "Incline Barbell Bench Press", sets: 4, repLow: 6, repHigh: 10, weightKg: 25, restSec: 150 },
      { name: "Flat Dumbbell Press", sets: 3, repLow: 8, repHigh: 12, weightKg: 12, restSec: 120 },
      { name: "Pec Deck", sets: 3, repLow: 12, repHigh: 15, weightKg: 20, restSec: 75 },
      { name: "Reverse Wrist Curl", sets: 3, repLow: 15, repHigh: 20, weightKg: 8, restSec: 60 },
      { name: "Wrist Curl", sets: 3, repLow: 15, repHigh: 20, weightKg: 5, restSec: 60 },
      { name: "Barbell Wrist Roller", sets: 2, repLow: 8, repHigh: 12, weightKg: 5, restSec: 60 },
    ]},
    { name: "Arms", muscles: ["biceps", "triceps"], exercises: [
      { name: "Preacher Curl", sets: 3, repLow: 8, repHigh: 12, weightKg: 15, restSec: 90 },
      { name: "Concentration Curl", sets: 3, repLow: 10, repHigh: 15, weightKg: 8, restSec: 75 },
      { name: "EZ-Bar Curl", sets: 3, repLow: 8, repHigh: 12, weightKg: 15, restSec: 90 },
      { name: "Skull Crusher", sets: 3, repLow: 8, repHigh: 12, weightKg: 15, restSec: 90 },
      { name: "Rope Pushdown", sets: 3, repLow: 10, repHigh: 15, weightKg: 15, restSec: 75 },
      { name: "Triceps Kickback", sets: 2, repLow: 12, repHigh: 15, weightKg: 6, restSec: 60 },
    ]},
    { name: "Abs + Forearms", muscles: ["abs", "forearms"], exercises: [
      { name: "Hanging Leg Raise", sets: 3, repLow: 10, repHigh: 15, weightKg: 0, restSec: 60 },
      { name: "Cable Crunch", sets: 3, repLow: 12, repHigh: 15, weightKg: 20, restSec: 60 },
      { name: "Ab Wheel Rollout", sets: 3, repLow: 8, repHigh: 12, weightKg: 0, restSec: 75 },
      { name: "Wrist Curl", sets: 3, repLow: 15, repHigh: 20, weightKg: 8, restSec: 60 },
      { name: "Reverse Wrist Curl", sets: 3, repLow: 15, repHigh: 20, weightKg: 5, restSec: 60 },
      { name: "Barbell Wrist Roller", sets: 2, repLow: 8, repHigh: 12, weightKg: 5, restSec: 60 },
    ]},
  ],
  schedule: {
    mon: "Chest + Forearms A", tue: "Shoulders + Triceps", wed: "Back + Biceps",
    thu: "Chest + Forearms B", fri: "Arms", sat: "Abs + Forearms", sun: "Rest",
  },
};

export const BUILT_IN_PLANS: BuiltInPlanDef[] = [
  { key: "classic-ppl", name: "Classic PPL", description: "6-day Push/Pull/Legs A+B, Sunday rest.", file: CLASSIC_PPL },
  { key: "ppl-rest", name: "PPL + Rest", description: "Push, Pull, Legs, Rest, Push, Pull, Legs.", file: PPL_REST },
  { key: "bro-split", name: "Bro Split", description: "Chest+Forearms, Shoulders+Triceps, Back+Biceps, Chest+Forearms, Arms, Abs+Forearms, Rest.", file: BRO_SPLIT },
];

export function builtInPlanByKey(key: BuiltInPlanKey): BuiltInPlanDef {
  const def = BUILT_IN_PLANS.find((p) => p.key === key);
  if (!def) throw new Error(`Unknown built-in plan key: ${key}`);
  return def;
}
