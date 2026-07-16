import type { IconType } from "react-icons";
import {
  TbFlame, TbSkull, TbCrown, TbMountain, TbBarbell, TbTrophy, TbBolt,
  TbTargetArrow, TbDroplet, TbMoon, TbBook2, TbSunrise, TbMoonStars,
  TbDiamond, TbActivity, TbStack2,
} from "react-icons/tb";
import { db } from "../db/db";
import { computeScoresForMonth } from "./dayScore";
import { computeUnifiedStreak } from "./streak.utils";
import { todayKey } from "./date.utils";

// ---- Tiers ---------------------------------------------------------------
export type Tier = "bronze" | "silver" | "gold" | "platinum" | "mythic";

export const TIER_META: Record<Tier, { label: string; grad: string; ring: string; glow: string }> = {
  bronze:   { label: "Bronze",   grad: "linear-gradient(135deg,#7a5230,#c98a4b)", ring: "#c98a4b", glow: "rgba(201,138,75,0.45)" },
  silver:   { label: "Silver",   grad: "linear-gradient(135deg,#727d86,#cdd6dd)", ring: "#cdd6dd", glow: "rgba(205,214,221,0.40)" },
  gold:     { label: "Gold",     grad: "linear-gradient(135deg,#b8860b,#ffd76b)", ring: "#ffd76b", glow: "rgba(255,215,107,0.50)" },
  platinum: { label: "Platinum", grad: "linear-gradient(135deg,#5b47c9,#b39dfc)", ring: "#b39dfc", glow: "rgba(179,157,252,0.50)" },
  mythic:   { label: "Mythic",   grad: "linear-gradient(135deg,#1a0509,#6e0f1c 55%,#ff2740)", ring: "#ff2740", glow: "rgba(216,31,52,0.60)" },
};

export type AchGroup = "streak" | "iron" | "discipline" | "water" | "sleep" | "mind" | "grind";
export const GROUP_LABEL: Record<AchGroup, string> = {
  streak: "The Streak", iron: "Iron", discipline: "Discipline",
  water: "Water", sleep: "Sleep", mind: "Mind", grind: "The Grind",
};

// ---- Context: one snapshot of everything the checks need -----------------
export interface AchievementContext {
  anyActivity: boolean;
  currentStreak: number;
  bestStreak: number;
  totalSessions: number;
  totalSets: number;
  totalVolume: number;   // kg
  prCount: number;
  perfectDays: number;   // discipline score === 100
  waterGoalDays: number;
  nightsLogged: number;
  topicsDone: number;
  studyMinutes: number;
  earliestSetHour: number | null; // 0-23, when a set was logged
  latestSetHour: number | null;
}

// Longest consecutive-day run in a set of YYYY-MM-DD dates.
export function longestRun(dates: string[]): number {
  if (!dates.length) return 0;
  const sorted = [...new Set(dates)].sort();
  let best = 1, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const day = new Date(sorted[i]);
    const diff = Math.round((day.getTime() - prev.getTime()) / 86_400_000);
    cur = diff === 1 ? cur + 1 : 1;
    if (cur > best) best = cur;
  }
  return best;
}

export async function buildContext(waterGoal: number, proteinTarget: number): Promise<AchievementContext> {
  const [sets, sessions, water, sleep, study, meals, freezes] = await Promise.all([
    db.workoutSets.toArray(),
    db.workoutSessions.count(),
    db.water.toArray(),
    db.sleep.toArray(),
    db.studySessions.toArray(),
    db.meals.toArray(),
    db.streakFreezes.toArray(),
  ]);
  const items = await db.studyItems.toArray();

  // Union of all active dates → best streak.
  const active = new Set<string>();
  for (const s of sets) active.add(s.date);
  for (const w of water) active.add(w.date);
  for (const s of sleep) active.add(s.date);
  for (const s of study) active.add(s.date);
  for (const m of meals) active.add(m.date);
  for (const f of freezes) active.add(f.date);
  const activeDates = [...active];

  // Per-day discipline + water-goal counts (batch, one round trip per table).
  const scored = activeDates.length
    ? await computeScoresForMonth(activeDates, waterGoal, proteinTarget)
    : new Map();
  let perfectDays = 0, waterGoalDays = 0;
  for (const m of scored.values()) {
    if (m.score >= 100) perfectDays++;
    if (m.waterPct >= 100) waterGoalDays++;
  }

  const setHours = sets.map((s) => new Date(s.createdAt).getHours());
  const currentStreak = await computeUnifiedStreak();

  return {
    anyActivity: activeDates.length > 0,
    currentStreak,
    bestStreak: Math.max(currentStreak, longestRun(activeDates)),
    totalSessions: sessions,
    totalSets: sets.length,
    totalVolume: Math.round(sets.reduce((a, s) => a + s.weightKg * s.reps, 0)),
    prCount: sets.filter((s) => s.isPR).length,
    perfectDays,
    waterGoalDays,
    nightsLogged: new Set(sleep.map((s) => s.date)).size,
    topicsDone: items.filter((i) => i.status === "done").length,
    studyMinutes: study.reduce((a, s) => a + s.minutes, 0),
    earliestSetHour: setHours.length ? Math.min(...setHours) : null,
    latestSetHour: setHours.length ? Math.max(...setHours) : null,
  };
}

// ---- Registry ------------------------------------------------------------
export interface AchievementDef {
  id: string;
  name: string;   // rude / cold / conqueror
  desc: string;   // what it means once earned
  hint: string;   // how to get it, shown while locked
  tier: Tier;
  group: AchGroup;
  icon: IconType;
  // progress 0..1 toward unlock, and the display value (e.g. "18 / 30")
  progress: (c: AchievementContext) => { done: boolean; ratio: number; value: string };
}

// helper for simple "count >= threshold" checks
function threshold(get: (c: AchievementContext) => number, target: number, unit = ""): AchievementDef["progress"] {
  return (c) => {
    const cur = get(c);
    return { done: cur >= target, ratio: Math.min(1, cur / target), value: `${Math.min(cur, target)} / ${target}${unit}` };
  };
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // ---- Streak ----
  { id: "first_blood", name: "First Blood", desc: "You showed up. Once.", hint: "Log anything, anywhere.",
    tier: "bronze", group: "streak", icon: TbBolt,
    progress: (c) => ({ done: c.anyActivity, ratio: c.anyActivity ? 1 : 0, value: c.anyActivity ? "Done" : "Nothing logged" }) },
  { id: "no_days_off", name: "No Days Off", desc: "A full week without flinching.", hint: "Keep a 7-day streak.",
    tier: "bronze", group: "streak", icon: TbFlame, progress: threshold((c) => c.bestStreak, 7, "d") },
  { id: "built_different", name: "Built Different", desc: "A month. No excuses.", hint: "Reach a 30-day streak.",
    tier: "silver", group: "streak", icon: TbFlame, progress: threshold((c) => c.bestStreak, 30, "d") },
  { id: "certified_menace", name: "Certified Menace", desc: "75 days of quiet violence.", hint: "Reach a 75-day streak.",
    tier: "gold", group: "streak", icon: TbSkull, progress: threshold((c) => c.bestStreak, 75, "d") },
  { id: "unkillable", name: "Unkillable", desc: "Triple digits. You don't break.", hint: "Reach a 100-day streak.",
    tier: "platinum", group: "streak", icon: TbCrown, progress: threshold((c) => c.bestStreak, 100, "d") },
  { id: "grass_never", name: "Grass? Never Met Her", desc: "A year straight. Touch nothing but the bar.", hint: "Reach a 365-day streak.",
    tier: "mythic", group: "streak", icon: TbMountain, progress: threshold((c) => c.bestStreak, 365, "d") },

  // ---- Iron ----
  { id: "rack_earned", name: "Rack Earned", desc: "First set on the board.", hint: "Log your first set.",
    tier: "bronze", group: "iron", icon: TbBarbell, progress: threshold((c) => c.totalSets, 1) },
  { id: "volume_dealer", name: "Volume Dealer", desc: "100 sets pushed.", hint: "Log 100 sets total.",
    tier: "silver", group: "iron", icon: TbStack2, progress: threshold((c) => c.totalSets, 100) },
  { id: "set_machine", name: "Set Machine", desc: "A thousand sets. Inhuman.", hint: "Log 1,000 sets total.",
    tier: "gold", group: "iron", icon: TbStack2, progress: threshold((c) => c.totalSets, 1000) },
  { id: "new_ceiling", name: "New Ceiling", desc: "First PR. The floor just moved up.", hint: "Set your first personal record.",
    tier: "bronze", group: "iron", icon: TbTrophy, progress: threshold((c) => c.prCount, 1) },
  { id: "ratchet", name: "Ratchet Effect", desc: "25 records. Only one direction.", hint: "Set 25 personal records.",
    tier: "silver", group: "iron", icon: TbTrophy, progress: threshold((c) => c.prCount, 25) },
  { id: "six_figure", name: "Six-Figure Tonnage", desc: "100,000 kg moved. Total.", hint: "Accumulate 100,000 kg of volume.",
    tier: "gold", group: "iron", icon: TbActivity, progress: threshold((c) => c.totalVolume, 100_000, "kg") },
  { id: "moved_mountain", name: "Moved a Mountain", desc: "One million kilograms. Let that land.", hint: "Accumulate 1,000,000 kg of volume.",
    tier: "mythic", group: "iron", icon: TbMountain, progress: threshold((c) => c.totalVolume, 1_000_000, "kg") },

  // ---- Discipline ----
  { id: "flawless", name: "Flawless", desc: "Every pillar, one day.", hint: "Hit 100% discipline in a single day.",
    tier: "silver", group: "discipline", icon: TbTargetArrow, progress: threshold((c) => c.perfectDays, 1) },
  { id: "machine", name: "Machine Discipline", desc: "10 perfect days on the wall.", hint: "Rack up 10 perfect (100%) days.",
    tier: "gold", group: "discipline", icon: TbTargetArrow, progress: threshold((c) => c.perfectDays, 10) },
  { id: "no_notes", name: "No Notes", desc: "30 flawless days. Nothing to fix.", hint: "Rack up 30 perfect (100%) days.",
    tier: "platinum", group: "discipline", icon: TbDiamond, progress: threshold((c) => c.perfectDays, 30) },

  // ---- Water ----
  { id: "watered", name: "Watered", desc: "Goal hit. Hydrated once.", hint: "Hit your water goal for a day.",
    tier: "bronze", group: "water", icon: TbDroplet, progress: threshold((c) => c.waterGoalDays, 1) },
  { id: "aquifer", name: "Human Aquifer", desc: "30 days fully watered.", hint: "Hit your water goal on 30 days.",
    tier: "silver", group: "water", icon: TbDroplet, progress: threshold((c) => c.waterGoalDays, 30) },

  // ---- Sleep ----
  { id: "logged_loaded", name: "Logged & Loaded", desc: "A week of tracked nights.", hint: "Log sleep on 7 nights.",
    tier: "bronze", group: "sleep", icon: TbMoon, progress: threshold((c) => c.nightsLogged, 7) },
  { id: "auditor", name: "Sleep Auditor", desc: "30 nights on record.", hint: "Log sleep on 30 nights.",
    tier: "silver", group: "sleep", icon: TbMoonStars, progress: threshold((c) => c.nightsLogged, 30) },

  // ---- Mind ----
  { id: "cracked_spine", name: "Cracked the Spine", desc: "First topic conquered.", hint: "Finish your first study topic.",
    tier: "bronze", group: "mind", icon: TbBook2, progress: threshold((c) => c.topicsDone, 1) },
  { id: "knowledge_tax", name: "Knowledge Tax", desc: "10 topics paid in full.", hint: "Finish 10 study topics.",
    tier: "silver", group: "mind", icon: TbBook2, progress: threshold((c) => c.topicsDone, 10) },
  { id: "deep_work", name: "Deep Work Dealer", desc: "1,000 minutes in the trenches.", hint: "Log 1,000 minutes of study.",
    tier: "gold", group: "mind", icon: TbBook2, progress: threshold((c) => c.studyMinutes, 1000, "m") },

  // ---- Grind (time-of-day) ----
  { id: "dawn_raider", name: "Dawn Raider", desc: "Trained before the sun bothered to.", hint: "Log a set before 7 AM.",
    tier: "silver", group: "grind", icon: TbSunrise,
    progress: (c) => { const done = c.earliestSetHour !== null && c.earliestSetHour < 7; return { done, ratio: done ? 1 : 0, value: done ? "Done" : "Before 7 AM" }; } },
  { id: "graveyard", name: "Graveyard Shift", desc: "Iron at an hour that scares people.", hint: "Log a set at or after 10 PM.",
    tier: "silver", group: "grind", icon: TbMoonStars,
    progress: (c) => { const done = c.latestSetHour !== null && c.latestSetHour >= 22; return { done, ratio: done ? 1 : 0, value: done ? "Done" : "After 10 PM" }; } },
];

export const ACHIEVEMENT_COUNT = ACHIEVEMENTS.length;

// ---- Unlock engine -------------------------------------------------------
// Compares registry checks against the persisted unlock table. Inserts any
// newly-earned rows (seen=0 so the UI can toast + dot them). Returns new ids.
export async function syncAchievements(ctx: AchievementContext): Promise<string[]> {
  const existing = await db.achievements.toArray();
  const have = new Set(existing.map((a) => a.id));
  const now = Date.now();
  const fresh: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (have.has(a.id)) continue;
    if (a.progress(ctx).done) {
      await db.achievements.add({ id: a.id, unlockedAt: now, seen: 0 });
      fresh.push(a.id);
    }
  }
  return fresh;
}

export function defById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

// today string re-exported for callers that toast "unlocked today"
export const TODAY = todayKey;
