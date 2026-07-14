import { db } from "../db/db";
import { EXERCISE_LIBRARY } from "./exerciseLibrary";
import type { MuscleGroup } from "../db/types";

// Seeds the exercise library + default PPL split on first launch. Idempotent.
export async function seedIfEmpty() {
  const count = await db.exercises.count();
  if (count > 0) return; // already seeded

  // 1. Seed exercise library
  const ids = await db.exercises.bulkAdd(
    EXERCISE_LIBRARY.map((e) => ({ ...e, isCustom: 0 })),
    { allKeys: true },
  );
  const byName = new Map<string, number>();
  EXERCISE_LIBRARY.forEach((e, i) => byName.set(e.name, ids[i]));

  // 2. Create default PPL days
  type DayDef = { name: string; muscles: MuscleGroup[]; exercises: { name: string; sets: number; repLow: number; repHigh: number; weight: number; rest: number }[] };
  const days: DayDef[] = [
    { name: "Push A", muscles: ["chest", "shoulders", "triceps"], exercises: [
      { name: "Incline Dumbbell Press", sets: 3, repLow: 6, repHigh: 10, weight: 14, rest: 150 },
      { name: "Flat Dumbbell Press", sets: 3, repLow: 8, repHigh: 12, weight: 12, rest: 120 },
      { name: "Overhead Press", sets: 3, repLow: 8, repHigh: 12, weight: 20, rest: 120 },
      { name: "Lateral Raise", sets: 3, repLow: 12, repHigh: 20, weight: 6, rest: 75 },
      { name: "Triceps Pushdown", sets: 3, repLow: 10, repHigh: 15, weight: 15, rest: 75 },
      { name: "Overhead Triceps Extension", sets: 2, repLow: 12, repHigh: 15, weight: 10, rest: 75 },
    ]},
    { name: "Pull A", muscles: ["back", "biceps"], exercises: [
      { name: "Pull-Up", sets: 3, repLow: 6, repHigh: 12, weight: 0, rest: 150 },
      { name: "Chest-Supported Row", sets: 3, repLow: 8, repHigh: 12, weight: 14, rest: 120 },
      { name: "Seated Cable Row", sets: 3, repLow: 10, repHigh: 12, weight: 30, rest: 90 },
      { name: "Rear-Delt Fly", sets: 3, repLow: 12, repHigh: 20, weight: 6, rest: 75 },
      { name: "Barbell Curl", sets: 3, repLow: 8, repHigh: 12, weight: 15, rest: 90 },
      { name: "Incline Dumbbell Curl", sets: 2, repLow: 10, repHigh: 15, weight: 6, rest: 75 },
    ]},
    { name: "Legs A", muscles: ["quads", "hamstrings", "glutes", "calves", "abs"], exercises: [
      { name: "Barbell Squat", sets: 3, repLow: 6, repHigh: 10, weight: 40, rest: 180 },
      { name: "Romanian Deadlift", sets: 3, repLow: 8, repHigh: 12, weight: 40, rest: 150 },
      { name: "Leg Extension", sets: 3, repLow: 12, repHigh: 15, weight: 25, rest: 90 },
      { name: "Lying Leg Curl", sets: 3, repLow: 10, repHigh: 15, weight: 20, rest: 90 },
      { name: "Standing Calf Raise", sets: 4, repLow: 10, repHigh: 15, weight: 40, rest: 75 },
      { name: "Hanging Leg Raise", sets: 3, repLow: 10, repHigh: 15, weight: 0, rest: 60 },
    ]},
    { name: "Push B", muscles: ["chest", "shoulders", "triceps"], exercises: [
      { name: "Flat Dumbbell Press", sets: 3, repLow: 10, repHigh: 15, weight: 10, rest: 120 },
      { name: "Incline Machine Press", sets: 3, repLow: 12, repHigh: 15, weight: 20, rest: 90 },
      { name: "Seated Dumbbell Shoulder Press", sets: 3, repLow: 10, repHigh: 15, weight: 8, rest: 90 },
      { name: "Cable Lateral Raise", sets: 3, repLow: 15, repHigh: 20, weight: 5, rest: 60 },
      { name: "Cable Triceps Pushdown", sets: 3, repLow: 12, repHigh: 20, weight: 12, rest: 60 },
      { name: "Overhead Cable Extension", sets: 2, repLow: 15, repHigh: 20, weight: 10, rest: 60 },
    ]},
    { name: "Pull B", muscles: ["back", "biceps"], exercises: [
      { name: "Close-Grip Lat Pulldown", sets: 3, repLow: 10, repHigh: 15, weight: 35, rest: 120 },
      { name: "Machine Row", sets: 3, repLow: 12, repHigh: 15, weight: 30, rest: 90 },
      { name: "Straight-Arm Pulldown", sets: 3, repLow: 12, repHigh: 15, weight: 15, rest: 90 },
      { name: "Reverse Pec Deck", sets: 3, repLow: 15, repHigh: 20, weight: 20, rest: 60 },
      { name: "Hammer Curl", sets: 3, repLow: 12, repHigh: 15, weight: 8, rest: 75 },
      { name: "Spider Curl", sets: 2, repLow: 12, repHigh: 20, weight: 6, rest: 60 },
    ]},
    { name: "Legs B", muscles: ["quads", "hamstrings", "glutes", "calves", "abs"], exercises: [
      { name: "Leg Press", sets: 3, repLow: 12, repHigh: 20, weight: 80, rest: 150 },
      { name: "Hip Thrust", sets: 3, repLow: 10, repHigh: 15, weight: 40, rest: 120 },
      { name: "Bulgarian Split Squat", sets: 3, repLow: 10, repHigh: 12, weight: 8, rest: 90 },
      { name: "Seated Leg Curl", sets: 3, repLow: 12, repHigh: 15, weight: 20, rest: 90 },
      { name: "Standing Calf Raise", sets: 4, repLow: 12, repHigh: 20, weight: 35, rest: 60 },
      { name: "Cable Crunch", sets: 3, repLow: 12, repHigh: 15, weight: 20, rest: 60 },
    ]},
  ];

  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    const dayId = await db.workoutDays.add({ name: d.name, muscles: d.muscles, order: i });
    await db.dayExercises.bulkAdd(
      d.exercises.map((ex, j) => ({
        dayId, exerciseId: byName.get(ex.name) ?? 0, order: j,
        sets: ex.sets, repLow: ex.repLow, repHigh: ex.repHigh, weightKg: ex.weight, restSec: ex.rest,
      })),
    );
  }

  // 3. Default week schedule: Mon=Push A .. Sat=Legs B, Sun=rest
  const dayIds = await db.workoutDays.toArray();
  const schedule = [
    { weekday: 1, dayId: dayIds[0]?.id ?? 0 },
    { weekday: 2, dayId: dayIds[1]?.id ?? 0 },
    { weekday: 3, dayId: dayIds[2]?.id ?? 0 },
    { weekday: 4, dayId: dayIds[3]?.id ?? 0 },
    { weekday: 5, dayId: dayIds[4]?.id ?? 0 },
    { weekday: 6, dayId: dayIds[5]?.id ?? 0 },
    { weekday: 0, dayId: 0 }, // rest
  ];
  await db.weekSchedule.bulkAdd(schedule);
}
