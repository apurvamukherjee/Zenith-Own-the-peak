import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { useSetting } from "../../hooks/useSettings";
import { shiftDate, ARC_END, LEG_MUSCLES } from "../../lib/winterArc";
import { type BossDef, type TrialScore, type Wager, bossFor, trialOpen, wraithHp, canWager, parseJson } from "../../lib/arcBosses";
import { arcDayStates } from "../../lib/arcCalendar";

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
