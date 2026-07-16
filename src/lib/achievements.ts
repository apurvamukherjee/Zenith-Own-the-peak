import { db } from "../db/db";
import { computeScoresForMonth } from "./dayScore";
import { computeUnifiedStreak } from "./streak.utils";
import { todayKey } from "./date.utils";
import type { GlyphName } from "../components/ColdIcon";

// ---- Tiers ---------------------------------------------------------------
export type Tier = "bronze" | "silver" | "gold" | "platinum" | "mythic";
export const TIER_RANK: Record<Tier, number> = { bronze: 1, silver: 2, gold: 3, platinum: 4, mythic: 5 };

export const TIER_META: Record<Tier, { label: string; grad: string; ring: string; glow: string }> = {
  bronze:   { label: "Bronze",   grad: "linear-gradient(135deg,#7a5230,#c98a4b)", ring: "#c98a4b", glow: "rgba(201,138,75,0.45)" },
  silver:   { label: "Silver",   grad: "linear-gradient(135deg,#727d86,#cdd6dd)", ring: "#cdd6dd", glow: "rgba(205,214,221,0.40)" },
  gold:     { label: "Gold",     grad: "linear-gradient(135deg,#b8860b,#ffd76b)", ring: "#ffd76b", glow: "rgba(255,215,107,0.50)" },
  platinum: { label: "Iron",     grad: "linear-gradient(135deg,#4a4550,#a8a2b0)", ring: "#a8a2b0", glow: "rgba(168,162,176,0.45)" },
  mythic:   { label: "Mythic",   grad: "linear-gradient(135deg,#1a0509,#6e0f1c 55%,#ff2740)", ring: "#ff2740", glow: "rgba(216,31,52,0.60)" },
};

export type AchGroup =
  | "streak" | "iron" | "discipline" | "water" | "sleep" | "mind"
  | "road" | "table" | "body" | "mystery";
export const GROUP_LABEL: Record<AchGroup, string> = {
  streak: "The Streak", iron: "Iron", discipline: "Discipline", water: "Water",
  sleep: "Sleep", mind: "The Mind", road: "The Road", table: "The Table",
  body: "The Body", mystery: "Mystery",
};

// ---- Context -------------------------------------------------------------
export interface AchievementContext {
  anyActivity: boolean;
  currentStreak: number;
  bestStreak: number;
  bestSessionStreak: number;
  distinctActiveDays: number;
  totalSessions: number;
  totalSets: number;
  totalVolume: number;
  maxWeight: number;
  prCount: number;
  perfectDays: number;
  waterGoalDays: number;
  totalWaterMl: number;
  nightsLogged: number;
  topicsDone: number;
  studyMinutes: number;
  fuelFills: number;
  bestMileage: number;
  totalFuelKm: number;
  mealsLogged: number;
  proteinHitDays: number;
  suppDoneCount: number;
  bwLogs: number;
  bwFirst: number | null;
  bwLatest: number | null;
  measureLogs: number;
  dayPhotoCount: number;
  freezesUsed: number;
  backupCount: number;
  latestSetHour: number | null;
  // Phase-3 egg-driven flags (read straight from settings).
  eggKonami: number;
  eggSisyphus: number;
  eggReflective: string;   // last YYYY collected — non-empty means at least one palindrome-day claimed
  // Sessions with 40+ sets logged (Rocky Mode).
  bruisingSessions: number;
}

// Longest consecutive-day run in a set of YYYY-MM-DD dates.
export function longestRun(dates: string[]): number {
  if (!dates.length) return 0;
  const sorted = [...new Set(dates)].sort();
  let best = 1, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round((new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86_400_000);
    cur = diff === 1 ? cur + 1 : 1;
    if (cur > best) best = cur;
  }
  return best;
}

export async function buildContext(waterGoal: number, proteinTarget: number): Promise<AchievementContext> {
  const [sets, sessions, water, sleep, study, meals, freezes, fuel, bw, measures, photos, schedLogs, settingBackup, settingKonami, settingSisyphus, settingReflective] =
    await Promise.all([
      db.workoutSets.toArray(),
      db.workoutSessions.toArray(),
      db.water.toArray(),
      db.sleep.toArray(),
      db.studySessions.toArray(),
      db.meals.toArray(),
      db.streakFreezes.count(),
      db.fuel.toArray(),
      db.bodyweight.orderBy("date").toArray(),
      db.bodyMeasurements.count(),
      db.dayPhotos.count(),
      db.scheduleLogs.count(),
      db.settings.get("backupCount"),
      db.settings.get("eggKonami"),
      db.settings.get("eggSisyphus"),
      db.settings.get("eggReflective"),
    ]);
  const items = await db.studyItems.toArray();

  // Union of all active dates → best overall streak + distinct active days.
  const active = new Set<string>();
  for (const s of sets) active.add(s.date);
  for (const w of water) active.add(w.date);
  for (const s of sleep) active.add(s.date);
  for (const s of study) active.add(s.date);
  for (const m of meals) active.add(m.date);
  const activeDates = [...active];

  const scored = activeDates.length
    ? await computeScoresForMonth(activeDates, waterGoal, proteinTarget)
    : new Map();
  let perfectDays = 0, waterGoalDays = 0;
  for (const m of scored.values()) {
    if (m.score >= 100) perfectDays++;
    if (m.waterPct >= 100) waterGoalDays++;
  }

  // Protein-hit days (>= target) from meals grouped by date.
  const proteinByDay = new Map<string, number>();
  for (const m of meals) proteinByDay.set(m.date, (proteinByDay.get(m.date) ?? 0) + m.protein);
  let proteinHitDays = 0;
  for (const v of proteinByDay.values()) if (proteinTarget > 0 && v >= proteinTarget) proteinHitDays++;

  // Fuel: full-to-full mileage + tracked distance.
  const sortedFuel = [...fuel].sort((a, b) => a.odometer - b.odometer);
  let bestMileage = 0;
  for (let i = 1; i < sortedFuel.length; i++) {
    const dist = sortedFuel[i].odometer - sortedFuel[i - 1].odometer;
    const l = sortedFuel[i].litres;
    if (l > 0) bestMileage = Math.max(bestMileage, dist / l);
  }
  const totalFuelKm = sortedFuel.length > 1 ? sortedFuel[sortedFuel.length - 1].odometer - sortedFuel[0].odometer : 0;

  const currentStreak = await computeUnifiedStreak();
  const sessionDates = sessions.map((s) => s.date);

  // Rocky Mode — sessions with 40+ sets logged. Group sets by sessionId then
  // count buckets meeting the threshold.
  const setsPerSession = new Map<number, number>();
  for (const s of sets) setsPerSession.set(s.sessionId, (setsPerSession.get(s.sessionId) ?? 0) + 1);
  let bruisingSessions = 0;
  for (const c of setsPerSession.values()) if (c >= 40) bruisingSessions++;

  return {
    anyActivity: activeDates.length > 0,
    currentStreak,
    bestStreak: Math.max(currentStreak, longestRun(activeDates)),
    bestSessionStreak: longestRun(sessionDates),
    distinctActiveDays: activeDates.length,
    totalSessions: sessions.length,
    totalSets: sets.length,
    totalVolume: Math.round(sets.reduce((a, s) => a + s.weightKg * s.reps, 0)),
    maxWeight: sets.reduce((m, s) => Math.max(m, s.weightKg), 0),
    prCount: sets.filter((s) => s.isPR).length,
    perfectDays,
    waterGoalDays,
    totalWaterMl: water.reduce((a, w) => a + w.amountMl, 0),
    nightsLogged: new Set(sleep.map((s) => s.date)).size,
    topicsDone: items.filter((i) => i.status === "done").length,
    studyMinutes: study.reduce((a, s) => a + s.minutes, 0),
    fuelFills: fuel.length,
    bestMileage: +bestMileage.toFixed(1),
    totalFuelKm,
    mealsLogged: meals.length,
    proteinHitDays,
    suppDoneCount: schedLogs,
    bwLogs: bw.length,
    bwFirst: bw.length ? bw[0].kg : null,
    bwLatest: bw.length ? bw[bw.length - 1].kg : null,
    measureLogs: measures,
    dayPhotoCount: photos,
    freezesUsed: freezes,
    backupCount: Number(settingBackup?.value ?? 0),
    latestSetHour: sets.length ? Math.max(...sets.map((s) => new Date(s.createdAt).getHours())) : null,
    eggKonami: Number(settingKonami?.value ?? 0),
    eggSisyphus: Number(settingSisyphus?.value ?? 0),
    eggReflective: String(settingReflective?.value ?? ""),
    bruisingSessions,
  };
}

// ---- Registry ------------------------------------------------------------
export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  hint: string;
  teaser?: string;     // shown while a mystery badge is still locked
  mystery?: boolean;
  tier: Tier;
  group: AchGroup;
  glyph: GlyphName;
  progress: (c: AchievementContext) => { done: boolean; ratio: number; value: string };
}

// count >= target
function thr(get: (c: AchievementContext) => number, target: number, unit = ""): AchievementDef["progress"] {
  return (c) => {
    const cur = get(c);
    const shown = cur >= 1000 ? Math.round(cur).toLocaleString() : Math.min(cur, target);
    const tgt = target >= 1000 ? target.toLocaleString() : target;
    return { done: cur >= target, ratio: Math.min(1, cur / target), value: `${shown} / ${tgt}${unit}` };
  };
}
// boolean flag
function flag(get: (c: AchievementContext) => boolean, todo: string): AchievementDef["progress"] {
  return (c) => { const d = get(c); return { done: d, ratio: d ? 1 : 0, value: d ? "Done" : todo }; };
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // ---- The Streak (9) ----
  { id: "first_blood", name: "First Blood", desc: "You showed up. Once.", hint: "Log anything, anywhere.", tier: "bronze", group: "streak", glyph: "spark", progress: flag((c) => c.anyActivity, "Log anything") },
  { id: "no_days_off", name: "No Days Off", desc: "Seven days, zero flinches.", hint: "Hold a 7-day streak.", tier: "bronze", group: "streak", glyph: "flame", progress: thr((c) => c.bestStreak, 7, "d") },
  { id: "two_weeks", name: "Two Weeks' Notice", desc: "A fortnight of not quitting.", hint: "Hold a 14-day streak.", tier: "bronze", group: "streak", glyph: "flame", progress: thr((c) => c.bestStreak, 14, "d") },
  { id: "built_different", name: "Built Different", desc: "A month. No excuses.", hint: "Reach a 30-day streak.", tier: "silver", group: "streak", glyph: "flame", progress: thr((c) => c.bestStreak, 30, "d") },
  { id: "off_season", name: "No Off-Season", desc: "Fifty straight. Nobody asked.", hint: "Reach a 50-day streak.", tier: "silver", group: "streak", glyph: "fang", progress: thr((c) => c.bestStreak, 50, "d") },
  { id: "certified_menace", name: "Certified Menace", desc: "75 days of quiet violence.", hint: "Reach a 75-day streak.", tier: "gold", group: "streak", glyph: "fang", progress: thr((c) => c.bestStreak, 75, "d") },
  { id: "unkillable", name: "Unkillable", desc: "Triple digits. You don't break.", hint: "Reach a 100-day streak.", tier: "platinum", group: "streak", glyph: "cracked-crown", progress: thr((c) => c.bestStreak, 100, "d") },
  { id: "relentless", name: "Relentless", desc: "Half a year, chained to it.", hint: "Reach a 182-day streak.", tier: "platinum", group: "streak", glyph: "chain", progress: thr((c) => c.bestStreak, 182, "d") },
  { id: "grass_never", name: "Grass? Never Met Her", desc: "365 days. Touch nothing but the bar.", hint: "Reach a 365-day streak.", tier: "mythic", group: "streak", glyph: "peak", progress: thr((c) => c.bestStreak, 365, "d") },

  // ---- Iron (13) ----
  { id: "rack_earned", name: "Rack Earned", desc: "First set on the board.", hint: "Log your first set.", tier: "bronze", group: "iron", glyph: "bar", progress: thr((c) => c.totalSets, 1) },
  { id: "warmed_up", name: "Warmed Up", desc: "25 sets. Now we talk.", hint: "Log 25 sets total.", tier: "bronze", group: "iron", glyph: "stack", progress: thr((c) => c.totalSets, 25) },
  { id: "volume_dealer", name: "Volume Dealer", desc: "100 sets pushed.", hint: "Log 100 sets total.", tier: "silver", group: "iron", glyph: "stack", progress: thr((c) => c.totalSets, 100) },
  { id: "set_machine", name: "Set Machine", desc: "A thousand sets. Inhuman.", hint: "Log 1,000 sets total.", tier: "gold", group: "iron", glyph: "stack", progress: thr((c) => c.totalSets, 1000) },
  { id: "new_ceiling", name: "New Ceiling", desc: "First PR. The floor moved up.", hint: "Set your first PR.", tier: "bronze", group: "iron", glyph: "ceiling", progress: thr((c) => c.prCount, 1) },
  { id: "ratchet", name: "Ratchet Effect", desc: "25 records. One direction only.", hint: "Set 25 PRs.", tier: "silver", group: "iron", glyph: "ceiling", progress: thr((c) => c.prCount, 25) },
  { id: "pr_tyrant", name: "Ceiling? What Ceiling", desc: "100 PRs. Physics is a suggestion.", hint: "Set 100 PRs.", tier: "gold", group: "iron", glyph: "ceiling", progress: thr((c) => c.prCount, 100) },
  { id: "first_ton", name: "First Ton", desc: "10,000 kg moved. Warm-up.", hint: "Accumulate 10,000 kg of volume.", tier: "bronze", group: "iron", glyph: "plate", progress: thr((c) => c.totalVolume, 10_000, "kg") },
  { id: "six_figure", name: "Six-Figure Tonnage", desc: "100,000 kg. Total.", hint: "Accumulate 100,000 kg of volume.", tier: "gold", group: "iron", glyph: "anvil", progress: thr((c) => c.totalVolume, 100_000, "kg") },
  { id: "moved_mountain", name: "Moved a Mountain", desc: "One million kilograms. Let it land.", hint: "Accumulate 1,000,000 kg of volume.", tier: "mythic", group: "iron", glyph: "monolith", progress: thr((c) => c.totalVolume, 1_000_000, "kg") },
  { id: "sessions_50", name: "Reps Don't Lie", desc: "50 sessions logged.", hint: "Log 50 training sessions.", tier: "silver", group: "iron", glyph: "gauntlet", progress: thr((c) => c.totalSessions, 50) },
  { id: "sessions_200", name: "Gym Rat, Confirmed", desc: "200 sessions. It's who you are now.", hint: "Log 200 training sessions.", tier: "gold", group: "iron", glyph: "gauntlet", progress: thr((c) => c.totalSessions, 200) },
  { id: "bar_bender", name: "Bar Bender", desc: "100 kg on a single set.", hint: "Log a set at 100 kg or heavier.", tier: "gold", group: "iron", glyph: "plate", progress: thr((c) => c.maxWeight, 100, "kg") },

  // ---- Discipline (6) ----
  { id: "flawless", name: "Flawless", desc: "Every pillar, one day.", hint: "Hit 100% discipline in a day.", tier: "silver", group: "discipline", glyph: "crosshair", progress: thr((c) => c.perfectDays, 1) },
  { id: "machine", name: "Machine Discipline", desc: "10 perfect days on the wall.", hint: "Rack up 10 perfect (100%) days.", tier: "gold", group: "discipline", glyph: "crosshair", progress: thr((c) => c.perfectDays, 10) },
  { id: "no_notes", name: "No Notes", desc: "30 flawless days. Nothing to fix.", hint: "Rack up 30 perfect (100%) days.", tier: "platinum", group: "discipline", glyph: "diamond", progress: thr((c) => c.perfectDays, 30) },
  { id: "above_reproach", name: "Above Reproach", desc: "60 perfect days. Untouchable.", hint: "Rack up 60 perfect (100%) days.", tier: "platinum", group: "discipline", glyph: "prism", progress: thr((c) => c.perfectDays, 60) },
  { id: "hundred_deep", name: "Hundred Days Deep", desc: "100 days with something logged.", hint: "Log activity on 100 distinct days.", tier: "silver", group: "discipline", glyph: "rune", progress: thr((c) => c.distinctActiveDays, 100) },
  { id: "half_your_year", name: "Half Your Year", desc: "182 active days. On the record.", hint: "Log activity on 182 distinct days.", tier: "gold", group: "discipline", glyph: "rune", progress: thr((c) => c.distinctActiveDays, 182) },

  // ---- Water (6) ----
  { id: "watered", name: "Watered", desc: "Goal hit. Hydrated once.", hint: "Hit your water goal for a day.", tier: "bronze", group: "water", glyph: "droplet", progress: thr((c) => c.waterGoalDays, 1) },
  { id: "seven_wet", name: "Seven Wet Days", desc: "A full week on target.", hint: "Hit your water goal on 7 days.", tier: "bronze", group: "water", glyph: "droplet", progress: thr((c) => c.waterGoalDays, 7) },
  { id: "aquifer", name: "Human Aquifer", desc: "30 days fully watered.", hint: "Hit your water goal on 30 days.", tier: "silver", group: "water", glyph: "wave", progress: thr((c) => c.waterGoalDays, 30) },
  { id: "tap_never_off", name: "Tap Never Off", desc: "100 days on target. Faucet human.", hint: "Hit your water goal on 100 days.", tier: "gold", group: "water", glyph: "wave", progress: thr((c) => c.waterGoalDays, 100) },
  { id: "priming_pump", name: "Priming the Pump", desc: "50 litres logged, lifetime.", hint: "Log 50 L of water total.", tier: "bronze", group: "water", glyph: "droplet", progress: thr((c) => c.totalWaterMl, 50_000, "ml") },
  { id: "reservoir", name: "Reservoir", desc: "250 litres. You are mostly water.", hint: "Log 250 L of water total.", tier: "silver", group: "water", glyph: "glacier", progress: thr((c) => c.totalWaterMl, 250_000, "ml") },

  // ---- Sleep (6) ----
  { id: "lights_out", name: "Lights Out", desc: "First night on record.", hint: "Log sleep once.", tier: "bronze", group: "sleep", glyph: "crescent", progress: thr((c) => c.nightsLogged, 1) },
  { id: "logged_loaded", name: "Logged & Loaded", desc: "A week of tracked nights.", hint: "Log sleep on 7 nights.", tier: "bronze", group: "sleep", glyph: "crescent", progress: thr((c) => c.nightsLogged, 7) },
  { id: "auditor", name: "Sleep Auditor", desc: "30 nights on the books.", hint: "Log sleep on 30 nights.", tier: "silver", group: "sleep", glyph: "eclipse", progress: thr((c) => c.nightsLogged, 30) },
  { id: "well_rested", name: "Rested & Ruthless", desc: "50 nights tracked.", hint: "Log sleep on 50 nights.", tier: "silver", group: "sleep", glyph: "eclipse", progress: thr((c) => c.nightsLogged, 50) },
  { id: "nothing_past", name: "Nothing Gets Past You", desc: "100 nights logged.", hint: "Log sleep on 100 nights.", tier: "gold", group: "sleep", glyph: "moon-full", progress: thr((c) => c.nightsLogged, 100) },
  { id: "dream_archivist", name: "Dream Archivist", desc: "200 nights. A ledger of rest.", hint: "Log sleep on 200 nights.", tier: "gold", group: "sleep", glyph: "moon-full", progress: thr((c) => c.nightsLogged, 200) },

  // ---- The Mind (6) ----
  { id: "sat_down", name: "Sat Down, Shut Up", desc: "First hour in the trenches.", hint: "Log 60 minutes of study.", tier: "bronze", group: "mind", glyph: "rune", progress: thr((c) => c.studyMinutes, 60, "m") },
  { id: "cracked_spine", name: "Cracked the Spine", desc: "First topic conquered.", hint: "Finish your first study topic.", tier: "bronze", group: "mind", glyph: "tome", progress: thr((c) => c.topicsDone, 1) },
  { id: "knowledge_tax", name: "Knowledge Tax", desc: "10 topics paid in full.", hint: "Finish 10 study topics.", tier: "silver", group: "mind", glyph: "tome", progress: thr((c) => c.topicsDone, 10) },
  { id: "syllabus_exec", name: "Syllabus Executioner", desc: "50 topics, done and buried.", hint: "Finish 50 study topics.", tier: "gold", group: "mind", glyph: "obelisk", progress: thr((c) => c.topicsDone, 50) },
  { id: "deep_work", name: "Deep Work Dealer", desc: "1,000 minutes deep.", hint: "Log 1,000 minutes of study.", tier: "gold", group: "mind", glyph: "obelisk", progress: thr((c) => c.studyMinutes, 1000, "m") },
  { id: "time_thief", name: "Time Thief", desc: "5,000 minutes stolen from the void.", hint: "Log 5,000 minutes of study.", tier: "platinum", group: "mind", glyph: "obelisk", progress: thr((c) => c.studyMinutes, 5000, "m") },

  // ---- The Road (5) ----
  { id: "full_to_full", name: "Full-to-Full", desc: "First tank logged.", hint: "Log your first fuel fill.", tier: "bronze", group: "road", glyph: "pump", progress: thr((c) => c.fuelFills, 1) },
  { id: "odo_obsessed", name: "Odometer Obsessed", desc: "10 fills tracked.", hint: "Log 10 fuel fills.", tier: "silver", group: "road", glyph: "gauge", progress: thr((c) => c.fuelFills, 10) },
  { id: "range_anxiety", name: "Range Anxiety Is For The Weak", desc: "50 km/L on a tank.", hint: "Hit 50 km/L on a full-to-full fill.", tier: "gold", group: "road", glyph: "gauge", progress: thr((c) => c.bestMileage, 50, " km/L") },
  { id: "thousand_km", name: "Thousand-Km Club", desc: "1,000 km tracked.", hint: "Track 1,000 km across fills.", tier: "silver", group: "road", glyph: "road", progress: thr((c) => c.totalFuelKm, 1000, "km") },
  { id: "long_hauler", name: "Long Hauler", desc: "10,000 km on the ledger.", hint: "Track 10,000 km across fills.", tier: "gold", group: "road", glyph: "road", progress: thr((c) => c.totalFuelKm, 10_000, "km") },

  // ---- The Table (6) ----
  { id: "on_record", name: "On the Record", desc: "First meal logged.", hint: "Log your first meal.", tier: "bronze", group: "table", glyph: "blade-fork", progress: thr((c) => c.mealsLogged, 1) },
  { id: "protein_enforcer", name: "Protein Enforcer", desc: "Hit your protein target once.", hint: "Hit your protein target for a day.", tier: "bronze", group: "table", glyph: "chalice", progress: thr((c) => c.proteinHitDays, 1) },
  { id: "nothing_untracked", name: "Nothing Untracked", desc: "30 days on protein target.", hint: "Hit protein target on 30 days.", tier: "silver", group: "table", glyph: "chalice", progress: thr((c) => c.proteinHitDays, 30) },
  { id: "meal_menace", name: "Meal Prep Menace", desc: "100 meals logged.", hint: "Log 100 meals.", tier: "silver", group: "table", glyph: "blade-fork", progress: thr((c) => c.mealsLogged, 100) },
  { id: "down_hatch", name: "Down the Hatch", desc: "First scheduled dose taken.", hint: "Mark a supplement/med done once.", tier: "bronze", group: "table", glyph: "capsule", progress: thr((c) => c.suppDoneCount, 1) },
  { id: "pill_punctual", name: "Pill Punctual", desc: "100 doses on schedule.", hint: "Mark 100 scheduled doses done.", tier: "gold", group: "table", glyph: "capsule", progress: thr((c) => c.suppDoneCount, 100) },

  // ---- The Body (5) ----
  { id: "watching_weigh", name: "Watching the Weigh", desc: "First weigh-in.", hint: "Log your bodyweight once.", tier: "bronze", group: "body", glyph: "scale", progress: thr((c) => c.bwLogs, 1) },
  { id: "scale_loyalist", name: "Scale Loyalist", desc: "30 weigh-ins tracked.", hint: "Log bodyweight 30 times.", tier: "silver", group: "body", glyph: "scale", progress: thr((c) => c.bwLogs, 30) },
  { id: "measured_merciless", name: "Measured & Merciless", desc: "First tape measurement.", hint: "Log a body measurement once.", tier: "bronze", group: "body", glyph: "ruler", progress: thr((c) => c.measureLogs, 1) },
  { id: "tape_dont_lie", name: "Tape Doesn't Lie", desc: "20 measurements logged.", hint: "Log 20 body measurements.", tier: "silver", group: "body", glyph: "ruler", progress: thr((c) => c.measureLogs, 20) },
  { id: "receipts", name: "Receipts", desc: "First progress photo pinned.", hint: "Pin a photo to a calendar day.", tier: "bronze", group: "body", glyph: "effigy", progress: thr((c) => c.dayPhotoCount, 1) },

  // ---- Mystery (7) ----
  { id: "iron_sabbath", name: "Iron Sabbath", desc: "Trained seven days straight. No rest.", hint: "Hidden objective.", teaser: "Rest is a rumor.", mystery: true, tier: "gold", group: "mystery", glyph: "gauntlet", progress: flag((c) => c.bestSessionStreak >= 7, "???") },
  { id: "witching_hour", name: "Witching Hour Regular", desc: "Logged a set at an hour that scares people.", hint: "Hidden objective.", teaser: "You'll know when it's late.", mystery: true, tier: "silver", group: "mystery", glyph: "crescent", progress: flag((c) => c.latestSetHour !== null && c.latestSetHour >= 23, "???") },
  { id: "ghost_month", name: "Ghost Month", desc: "A 30-day streak. No freezes spent.", hint: "Hidden objective.", teaser: "Earned in silence.", mystery: true, tier: "platinum", group: "mystery", glyph: "flame", progress: flag((c) => c.bestStreak >= 30 && c.freezesUsed === 0, "???") },
  { id: "the_vault", name: "The Vault", desc: "25 cloud backups. Nothing lost, ever.", hint: "Hidden objective.", teaser: "Nothing lost. Ever.", mystery: true, tier: "gold", group: "mystery", glyph: "rune", progress: flag((c) => c.backupCount >= 25, "???") },
  { id: "featherweight", name: "Featherweight No More", desc: "Gained 5 kg since your first weigh-in.", hint: "Hidden objective.", teaser: "The scale noticed.", mystery: true, tier: "silver", group: "mystery", glyph: "scale", progress: flag((c) => c.bwFirst !== null && c.bwLatest !== null && c.bwLatest - c.bwFirst >= 5, "???") },
  { id: "twice_yourself", name: "Twice Yourself", desc: "Moved twice your bodyweight on one bar.", hint: "Hidden objective.", teaser: "Twice your weight. One bar.", mystery: true, tier: "mythic", group: "mystery", glyph: "plate", progress: flag((c) => c.bwLatest !== null && c.bwLatest > 0 && c.maxWeight >= 2 * c.bwLatest, "???") },

  // ---- Phase 3 easter-egg unlocks (all mystery) ----
  { id: "contra", name: "Contra", desc: "Up up down down, left right left right, B A.", hint: "Hidden objective.", teaser: "Older than most passwords.", mystery: true, tier: "silver", group: "mystery", glyph: "diamond", progress: flag((c) => c.eggKonami === 1, "???") },
  { id: "the_number", name: "The Number", desc: "Logged 666 sets. The gym approves.", hint: "Hidden objective.", teaser: "A number you don't reach politely.", mystery: true, tier: "gold", group: "mystery", glyph: "fang", progress: flag((c) => c.totalSets >= 666, "???") },
  { id: "sisyphus", name: "Sisyphus", desc: "Held the ring long enough to hear the stone roll.", hint: "Hidden objective.", teaser: "Meaningful things take patience.", mystery: true, tier: "platinum", group: "mystery", glyph: "monolith", progress: flag((c) => c.eggSisyphus === 1, "???") },
  { id: "reflective", name: "Reflective", desc: "Logged a day on a palindrome date.", hint: "Hidden objective.", teaser: "Some days read the same forwards and back.", mystery: true, tier: "gold", group: "mystery", glyph: "prism", progress: flag((c) => c.eggReflective.length > 0, "???") },
  { id: "rocky", name: "Rocky", desc: "Forty sets in a single session. Cold storage stuff.", hint: "Hidden objective.", teaser: "Named after the man who trained in a freezer.", mystery: true, tier: "gold", group: "mystery", glyph: "anvil", progress: flag((c) => c.bruisingSessions >= 1, "???") },

  { id: "completionist", name: "The Completionist", desc: "Every other badge, claimed.", hint: "Hidden objective.", teaser: "There's always one more.", mystery: true, tier: "mythic", group: "mystery", glyph: "prism", progress: flag(() => false, "???") },
];

export const ACHIEVEMENT_COUNT = ACHIEVEMENTS.length; // 74 (69 originals + 5 new hidden)
export const MYSTERY_COUNT = ACHIEVEMENTS.filter((a) => a.mystery).length; // 12
const NON_MYSTERY_COUNT = ACHIEVEMENT_COUNT - MYSTERY_COUNT;

export function defById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

// ---- Unlock engine -------------------------------------------------------
export async function syncAchievements(ctx: AchievementContext): Promise<string[]> {
  const existing = await db.achievements.toArray();
  const have = new Set(existing.map((a) => a.id));
  const now = Date.now();
  const fresh: string[] = [];

  for (const a of ACHIEVEMENTS) {
    if (a.id === "completionist" || have.has(a.id)) continue;
    if (a.progress(ctx).done) {
      await db.achievements.add({ id: a.id, unlockedAt: now, seen: 0 });
      have.add(a.id);
      fresh.push(a.id);
    }
  }

  // Completionist resolves last: every non-mystery badge earned.
  if (!have.has("completionist")) {
    const nonMysteryUnlocked = ACHIEVEMENTS.filter((a) => !a.mystery && have.has(a.id)).length;
    if (nonMysteryUnlocked >= NON_MYSTERY_COUNT) {
      await db.achievements.add({ id: "completionist", unlockedAt: now, seen: 0 });
      fresh.push("completionist");
    }
  }
  return fresh;
}

export const TODAY = todayKey;
