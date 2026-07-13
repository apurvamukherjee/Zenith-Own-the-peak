import type { DayPlan, DayType } from "../db/types";

// The lifter's actual 6-day Push/Pull/Legs split, run twice a week.
// A = heavier / lower rep, B = lighter / higher rep. Edit here to retune.
export const PPL_PROGRAM: Record<Exclude<DayType, "Rest">, DayPlan> = {
  PushA: {
    dayType: "PushA", label: "Push A", focus: "Chest · Shoulders · Triceps",
    exercises: [
      { name: "Incline Barbell / DB Press", sets: 3, repLow: 6, repHigh: 10, restSec: 150 },
      { name: "Flat Machine / DB Press", sets: 3, repLow: 8, repHigh: 12, restSec: 120 },
      { name: "Overhead Press", sets: 3, repLow: 8, repHigh: 12, restSec: 120 },
      { name: "Lateral Raise", sets: 3, repLow: 12, repHigh: 20, restSec: 75 },
      { name: "Triceps Pushdown", sets: 3, repLow: 10, repHigh: 15, restSec: 75 },
      { name: "Overhead Triceps Extension", sets: 2, repLow: 12, repHigh: 15, restSec: 75 },
    ],
  },
  PullA: {
    dayType: "PullA", label: "Pull A", focus: "Back · Rear delt · Biceps",
    exercises: [
      { name: "Pull-up / Lat Pulldown", sets: 3, repLow: 6, repHigh: 12, restSec: 150 },
      { name: "Chest-Supported Row", sets: 3, repLow: 8, repHigh: 12, restSec: 120 },
      { name: "Seated Cable Row", sets: 3, repLow: 10, repHigh: 12, restSec: 90 },
      { name: "Rear-Delt Fly", sets: 3, repLow: 12, repHigh: 20, restSec: 75 },
      { name: "Barbell / DB Curl", sets: 3, repLow: 8, repHigh: 12, restSec: 90 },
      { name: "Incline DB Curl", sets: 2, repLow: 10, repHigh: 15, restSec: 75 },
    ],
  },
  LegsA: {
    dayType: "LegsA", label: "Legs A", focus: "Quads · Hams · Glutes · Calves",
    exercises: [
      { name: "Squat / Leg Press", sets: 3, repLow: 6, repHigh: 10, restSec: 180 },
      { name: "Romanian Deadlift", sets: 3, repLow: 8, repHigh: 12, restSec: 150 },
      { name: "Leg Extension", sets: 3, repLow: 12, repHigh: 15, restSec: 90 },
      { name: "Lying / Seated Leg Curl", sets: 3, repLow: 10, repHigh: 15, restSec: 90 },
      { name: "Calf Raise", sets: 4, repLow: 10, repHigh: 15, restSec: 75 },
      { name: "Hanging / Cable Ab", sets: 3, repLow: 10, repHigh: 15, restSec: 60 },
    ],
  },
  PushB: {
    dayType: "PushB", label: "Push B", focus: "Chest · Shoulders · Triceps (high rep)",
    exercises: [
      { name: "Flat DB Press", sets: 3, repLow: 10, repHigh: 15, restSec: 120 },
      { name: "Incline Machine Press", sets: 3, repLow: 12, repHigh: 15, restSec: 90 },
      { name: "Seated DB Shoulder Press", sets: 3, repLow: 10, repHigh: 15, restSec: 90 },
      { name: "Cable Lateral Raise", sets: 3, repLow: 15, repHigh: 20, restSec: 60 },
      { name: "Cable Triceps Pushdown", sets: 3, repLow: 12, repHigh: 20, restSec: 60 },
      { name: "Overhead Cable Extension", sets: 2, repLow: 15, repHigh: 20, restSec: 60 },
    ],
  },
  PullB: {
    dayType: "PullB", label: "Pull B", focus: "Back · Rear delt · Biceps (high rep)",
    exercises: [
      { name: "Close-Grip Lat Pulldown", sets: 3, repLow: 10, repHigh: 15, restSec: 120 },
      { name: "Machine / Cable Row", sets: 3, repLow: 12, repHigh: 15, restSec: 90 },
      { name: "Straight-Arm Pulldown", sets: 3, repLow: 12, repHigh: 15, restSec: 90 },
      { name: "Reverse Pec Deck", sets: 3, repLow: 15, repHigh: 20, restSec: 60 },
      { name: "Hammer / Cable Curl", sets: 3, repLow: 12, repHigh: 15, restSec: 75 },
      { name: "Spider / Preacher Curl", sets: 2, repLow: 12, repHigh: 20, restSec: 60 },
    ],
  },
  LegsB: {
    dayType: "LegsB", label: "Legs B", focus: "Quads · Hams · Glutes · Calves (high rep)",
    exercises: [
      { name: "Leg Press (high rep)", sets: 3, repLow: 12, repHigh: 20, restSec: 150 },
      { name: "Hip Thrust", sets: 3, repLow: 10, repHigh: 15, restSec: 120 },
      { name: "Bulgarian Split Squat", sets: 3, repLow: 10, repHigh: 12, restSec: 90 },
      { name: "Seated Leg Curl", sets: 3, repLow: 12, repHigh: 15, restSec: 90 },
      { name: "Standing Calf Raise", sets: 4, repLow: 12, repHigh: 20, restSec: 60 },
      { name: "Cable Crunch", sets: 3, repLow: 12, repHigh: 15, restSec: 60 },
    ],
  },
};

// Weekday -> session. getDay(): 0 Sun .. 6 Sat
const WEEKDAY_MAP: Record<number, DayType> = {
  1: "PushA", 2: "PullA", 3: "LegsA",
  4: "PushB", 5: "PullB", 6: "LegsB",
  0: "Rest",
};

export function dayTypeForDate(d: Date): DayType {
  return WEEKDAY_MAP[d.getDay()];
}

export const ALL_DAY_TYPES: Exclude<DayType, "Rest">[] = [
  "PushA", "PullA", "LegsA", "PushB", "PullB", "LegsB",
];
