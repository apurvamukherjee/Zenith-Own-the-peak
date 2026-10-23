import { ARC_END } from "./winterArc.ts";
import { chapterOf } from "./arcCalendar.ts";

// Weekly bosses: one per chapter, doable any day of it — fixed-time windows
// punish people with classes and jobs. Rematches put last time's score up as
// the boss's HP. No randomization claims here: formats rotate for novelty only.
export type BossKind = "deck" | "deathby" | "amrap" | "max" | "quality" | "murph";
export interface BossDef {
  id: string; chapter: number; title: string; kind: BossKind;
  rules: string; scoreLabel: string;
  minutes?: number;      // countdown for deck / amrap; deathby counts up by the minute
  legs?: boolean;        // squat volume — guarded within 48h of a leg day
  rematchOf?: string;
}

export const BOSSES: BossDef[] = [
  { id: "lights-out-deck", chapter: 2, title: "Lights Out Deck", kind: "deck", minutes: 20,
    rules: "Indoors. Draw a card, do the reps: ♠ push-ups, ♥ squats, ♦ crunches, ♣ burpees. Face cards 10, aces 11. Stop at 20 minutes.", scoreLabel: "cards cleared", legs: true },
  { id: "death-by-pushups", chapter: 3, title: "Death by Push-Ups", kind: "deathby",
    rules: "Minute 1: 1 push-up. Minute 2: 2. Keep going until you can't finish a minute's reps inside that minute.", scoreLabel: "minutes survived" },
  { id: "room-cindy", chapter: 4, title: "Room Cindy", kind: "amrap", minutes: 10,
    rules: "10-minute AMRAP: 5 pike push-ups, 10 push-ups, 15 squats.", scoreLabel: "rounds", legs: true },
  { id: "pushup-max-2", chapter: 6, title: "Push-Up Max Rematch", kind: "max",
    rules: "One set of strict push-ups — chest to fist, full lockout. No rest at the top.", scoreLabel: "reps", rematchOf: "trial:pushups" },
  { id: "death-by-2", chapter: 7, title: "Death-by Rematch", kind: "deathby",
    rules: "Same rules as Nov 15. Beat your minutes.", scoreLabel: "minutes survived", rematchOf: "death-by-pushups" },
  { id: "room-cindy-2", chapter: 8, title: "Room Cindy Rematch", kind: "amrap", minutes: 10,
    rules: "Same 10 minutes, same rounds. Beat Nov 22.", scoreLabel: "rounds", legs: true, rematchOf: "room-cindy" },
  { id: "big-3", chapter: 9, title: "Big 3 Quality", kind: "quality",
    rules: "Taper week: McGill curl-up, side plank and bird dog — 10-second holds, 5/4/3 per side. Perfect form, nothing else.", scoreLabel: "clean sets" },
];
// Chapter 1 is Trials + calibration, chapter 5 is the deload — no boss.
export const bossFor = (date: string) => BOSSES.find((b) => b.chapter === chapterOf(date).n);

// Day 1 / Day 31 / Day 60 battery (final Trials move to Dec 30, the day before Murph).
export interface TrialScore { pushups: number; plank: number; deathBy: number }
export const TRIALS = [
  { n: 1, opens: "2026-11-01", closes: "2026-11-07" },
  { n: 2, opens: "2026-12-01", closes: "2026-12-07" },
  { n: 3, opens: "2026-12-30", closes: ARC_END },
] as const;
export const trialOpen = (date: string) => TRIALS.find((t) => date >= t.opens && date <= t.closes);
export const PLANK_CAP_SEC = 120; // holds past ~2 min add little (McGill)

// Dec 31. No pull-ups (no bar in a hostel room), and the squat block swaps to
// plank minutes if legs were trained in the last 48h.
export type MurphTier = "half" | "intermediate" | "full";
export function murphPlan(tier: MurphTier, legsRecent: boolean): { move: string; amount: string }[] {
  const n = { half: 1, intermediate: 2, full: 3 }[tier];
  return [
    { move: "Push-ups", amount: `${[50, 100, 200][n - 1]}` },
    legsRecent ? { move: "Plank (any split)", amount: `${[3, 5, 8][n - 1]} min` } : { move: "Air squats", amount: `${[100, 200, 300][n - 1]}` },
    { move: "Burpees", amount: `${[25, 50, 100][n - 1]}` },
  ];
}

