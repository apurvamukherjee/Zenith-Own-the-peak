import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { DEFAULTS, setSetting, useSetting, type SettingKey } from "../../hooks/useSettings";
import { grantXP } from "../../lib/xp";
import { shiftDate, ARC_END, LEG_MUSCLES } from "../../lib/winterArc";
import {
  type BossDef, type TrialScore, type Wager, type MurphTier, bossFor, trialOpen, wraithHp, canWager, settleWager, parseJson,
  PLANK_CAP_SEC, WAGER_STAKE,
} from "../../lib/arcBosses";
import { arcDayStates } from "../../lib/arcCalendar";

async function raw(key: SettingKey): Promise<string> {
  return String((await db.settings.get(key))?.value ?? DEFAULTS[key]);
}

/** Legs in the last 48h (today or yesterday's logged sets) — squat-heavy bosses swap their squats out. */
export async function legsWithin48h(date: string): Promise<boolean> {
  const sets = await db.workoutSets.where("date").anyOf([date, shiftDate(date, -1)]).toArray();
  if (!sets.length) return false;
  const exs = await db.exercises.bulkGet([...new Set(sets.map((s) => s.exerciseId))]);
  return exs.some((e) => e && LEG_MUSCLES.includes(e.primaryMuscle));
}

export interface ArcBossState {
  boss: BossDef | undefined; bossScore: number | undefined; beat: number | undefined;
  trial: { n: number; logged: TrialScore | undefined } | undefined;
  murph: boolean; murphDone: string;
  wraith: number; legsRecent: boolean;
  wager: Wager | null; wagerOpen: boolean;
}

export function useArcBosses(date: string): ArcBossState | undefined {
  const scoresRaw = String(useSetting("arcBossScores"));
  const trialsRaw = String(useSetting("arcTrials"));
  const wagerRaw = String(useSetting("arcWager"));
  const murphDone = String(useSetting("arcMurph"));
  const joined = String(useSetting("arcJoined"));
  return useLiveQuery(async () => {
    const scores = parseJson<Record<string, number>>(scoresRaw, {});
    const trials = parseJson<Record<string, TrialScore>>(trialsRaw, {});
    const wager = parseJson<Wager | null>(wagerRaw, null);
    const boss = bossFor(date);
    const rematch = boss?.rematchOf;
    const beat = !rematch ? undefined
      : rematch === "trial:pushups" ? trials["1"]?.pushups
      : scores[rematch];
    const t = trialOpen(date);
    const rows = await db.arcDays.toArray();
    const states = arcDayStates(rows, joined, date);
    const kept = rows.filter((r) => r.kind === "done" || r.kind === "repaired").length;
    const scars = [...states.values()].filter((s) => s === "scar").length;
    return {
      boss, bossScore: boss ? scores[boss.id] : undefined, beat,
      trial: t ? { n: t.n, logged: trials[String(t.n)] } : undefined,
      murph: date === ARC_END, murphDone,
      wraith: wraithHp(kept, Object.keys(scores).length + (murphDone ? 1 : 0), scars),
      legsRecent: await legsWithin48h(date),
      wager, wagerOpen: canWager(date, wager),
    };
  }, [date, scoresRaw, trialsRaw, wagerRaw, murphDone, joined]);
}

export async function saveBossScore(id: string, score: number): Promise<void> {
  const scores = parseJson<Record<string, number>>(await raw("arcBossScores"), {});
  const first = scores[id] === undefined;
  await setSetting("arcBossScores", JSON.stringify({ ...scores, [id]: score }));
  if (first) await grantXP("arc_boss");
}

export async function saveTrial(n: number, score: TrialScore): Promise<void> {
  const trials = parseJson<Record<string, TrialScore>>(await raw("arcTrials"), {});
  const first = trials[String(n)] === undefined;
  const capped = { ...score, plank: Math.min(score.plank, PLANK_CAP_SEC) };
  await setSetting("arcTrials", JSON.stringify({ ...trials, [String(n)]: capped }));
  if (first) await grantXP("arc_trial");
}

export async function finishMurph(tier: MurphTier): Promise<void> {
  const first = !(await raw("arcMurph"));
  await setSetting("arcMurph", tier);
  if (first) await grantXP("arc_boss");
}

export async function placeWager(chapter: number, date: string): Promise<void> {
  await setSetting("arcWager", JSON.stringify({ chapter, placedOn: date } satisfies Wager));
  await grantXP("arc_wager_stake");
}

/** Called from the XP engine: pays out (or not) once the wagered chapter is over. */
export async function settleArcWager(today: string): Promise<void> {
  const wager = parseJson<Wager | null>(await raw("arcWager"), null);
  if (!wager) return;
  const covered = new Set((await db.arcDays.toArray()).filter((r) => r.kind !== "reserve").map((r) => r.date));
  const won = settleWager(wager, today, covered);
  if (won === null) return;
  await setSetting("arcWager", "");
  const log = await raw("arcWagerLog");
  await setSetting("arcWagerLog", [log, `${wager.chapter}:${won ? "won" : "lost"}`].filter(Boolean).join(","));
  if (won) await grantXP("arc_wager_win");
}

export { WAGER_STAKE };
