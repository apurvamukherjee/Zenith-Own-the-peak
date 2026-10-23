import type { MuscleGroup } from "../db/types";

// ponytail: pinned to the 2026 arc — move to settings if it ever runs again.
export const ARC_START = "2026-11-01";
export const ARC_END = "2026-12-31";

export type DrillUnit = "reps" | "sec" | "min";
export interface DrillDef { name: string; unit: DrillUnit; from: number; to: number; muscle: MuscleGroup }

// Hostel-room only: no bar, no weights. Peaks stay modest because the drill
// stacks on top of a 5–6 day split, and unaccustomed high-rep volume is the
// classic rhabdo trigger.
export const DRILLS: DrillDef[] = [
  { name: "Push-Ups", unit: "reps", from: 20, to: 50, muscle: "chest" },
  { name: "Diamond Push-Ups", unit: "reps", from: 10, to: 30, muscle: "triceps" },
  { name: "Pike Push-Ups", unit: "reps", from: 8, to: 25, muscle: "shoulders" },
  { name: "Chair Dips", unit: "reps", from: 12, to: 35, muscle: "triceps" },
  { name: "Bodyweight Squats", unit: "reps", from: 30, to: 80, muscle: "quads" },
  { name: "Jump Squats", unit: "reps", from: 15, to: 40, muscle: "quads" },
  { name: "Reverse Lunges (each leg)", unit: "reps", from: 10, to: 25, muscle: "glutes" },
  { name: "Wall Sit", unit: "sec", from: 45, to: 120, muscle: "quads" },
  { name: "Glute Bridges", unit: "reps", from: 20, to: 50, muscle: "glutes" },
  { name: "Single-Leg Calf Raises (each)", unit: "reps", from: 15, to: 40, muscle: "calves" },
  { name: "Burpees", unit: "reps", from: 10, to: 35, muscle: "quads" },
  { name: "Mountain Climbers", unit: "reps", from: 30, to: 90, muscle: "abs" },
  { name: "Plank", unit: "sec", from: 45, to: 120, muscle: "abs" },
  { name: "Hollow Body Hold", unit: "sec", from: 20, to: 60, muscle: "abs" },
  { name: "V-Ups", unit: "reps", from: 10, to: 30, muscle: "abs" },
  { name: "Superman Hold", unit: "sec", from: 30, to: 75, muscle: "back" },
];

export const LEG_MUSCLES: MuscleGroup[] = ["quads", "hamstrings", "glutes", "calves"];

const DAY_MS = 86_400_000;
const parse = (date: string) => { const [y, m, d] = date.split("-").map(Number); return new Date(y, m - 1, d); };
const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const shiftDate = (date: string, n: number) => { const d = parse(date); d.setDate(d.getDate() + n); return fmt(d); };

export function dayIndex(date: string): number {
  return Math.round((parse(date).getTime() - parse(ARC_START).getTime()) / DAY_MS);
}
export const ARC_DAYS = dayIndex(ARC_END) + 1;
export const inArc = (date: string) => { const i = dayIndex(date); return i >= 0 && i < ARC_DAYS; };
export const daysUntilArc = (date: string) => -dayIndex(date);

