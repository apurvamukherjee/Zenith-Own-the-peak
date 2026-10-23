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

// Training-block shape: deload ≈ every 5–6 weeks, taper into the Dec 31 finale.
export type ArcPhase = "calibration" | "build" | "deload" | "taper" | "finale";
export function phaseOf(date: string): ArcPhase {
  const day = dayIndex(date) + 1;
  if (day <= 3) return "calibration";
  if (day >= 29 && day <= 35) return "deload";
  if (day >= 57 && day <= 60) return "taper";
  if (day === ARC_DAYS) return "finale";
  return "build";
}
const PHASE_SCALE: Record<ArcPhase, number> = { calibration: 1, build: 1, deload: 0.5, taper: 0.5, finale: 1 };

// Seeded Fisher–Yates per cycle through the pool: random-looking, the same on
// every device, and no repeats until every drill has come up once.
function cycleOrder(cycle: number): DrillDef[] {
  let s = cycle * 2654435761 >>> 0;
  const rand = () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32; };
  const out = [...DRILLS];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

export type Readiness = "fine" | "sore" | "wrecked";
export type DrillKind = "full" | "minimum" | "recovery";
export interface Drill { name: string; unit: DrillUnit; base: number; target: number; debtDays: number; kind: DrillKind }

// Missed days carry over as +50% each, capped at 2 days, and the total never
// passes 1.5× the movement's arc peak — so a bad week can't snowball into an
// unsafe single-day volume.
export const MAX_DEBT_DAYS = 2;

export const RECOVERY: Drill = { name: "Recovery · McGill Big 3 + hips", unit: "min", base: 8, target: 8, debtDays: 0, kind: "recovery" };

const roundTo = (n: number, unit: DrillUnit) => { const step = unit === "sec" ? 5 : 1; return Math.max(step, Math.round(n / step) * step); };

/** `avoid`: muscles today's (and yesterday's leg) session hits — no push-up quota on chest day. */
export function drillFor(date: string, missedBefore = 0, avoid: MuscleGroup[] = [], readiness: Readiness = "fine"): Drill {
  if (readiness !== "fine") return RECOVERY;
  const i = Math.max(0, Math.min(ARC_DAYS - 1, dayIndex(date)));
  const n = DRILLS.length;
  const order = cycleOrder(Math.floor(i / n) + 1);
  let def = order[i % n];
  for (let k = 0; k < n; k++) {
    const d = order[(i + k) % n];
    if (!avoid.includes(d.muscle)) { def = d; break; }
  }
  const ramp = def.from + (def.to - def.from) * i / (ARC_DAYS - 1);
  const base = roundTo(ramp * PHASE_SCALE[phaseOf(date)], def.unit);
  const debtDays = Math.min(missedBefore, MAX_DEBT_DAYS);
  const target = Math.min(roundTo(base * (1 + 0.5 * debtDays), def.unit), roundTo(def.to * 1.5, def.unit));
  return { name: def.name, unit: def.unit, base, target, debtDays, kind: "full" };
}

export const drillAmount = (d: Drill) => d.unit === "sec" ? `${d.target}s hold` : d.unit === "min" ? `${d.target} min` : `${d.target} reps`;

/** The 5-minute floor: half of today's base, keeps the chain, repays nothing. */
export const minimumOf = (d: Drill): Drill => ({ ...d, target: roundTo(d.base / 2, d.unit), debtDays: 0, kind: "minimum" });

