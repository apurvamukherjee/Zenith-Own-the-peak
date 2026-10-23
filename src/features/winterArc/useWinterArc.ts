import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import type { ArcDayDto, MuscleGroup } from "../../db/types";
import { useSetting } from "../../hooks/useSettings";
import { todayKey } from "../../lib/date.utils";
import { type Drill, type Readiness, type ArcPhase, drillFor, missedStreak, shiftDate, dayIndex, phaseOf, LEG_MUSCLES, ARC_START } from "../../lib/winterArc";

export interface ArcToday {
  date: string; day: number; phase: ArcPhase; drill: Drill; readiness: Readiness;
  row: ArcDayDto | undefined; missed: number; kept: number; scars: number; reservesLeft: number;
}

function parseReadiness(raw: string, date: string): Readiness {
  const [d, r] = raw.split("|");
  return d === date && (r === "sore" || r === "wrecked") ? r : "fine";
}

// Yesterday's logged sets, not the plan: what you actually trained is what's sore.
async function legsYesterday(date: string): Promise<boolean> {
  const sets = await db.workoutSets.where("date").equals(shiftDate(date, -1)).toArray();
  if (!sets.length) return false;
  const exs = await db.exercises.bulkGet([...new Set(sets.map((s) => s.exerciseId))]);
  return exs.some((e) => e && LEG_MUSCLES.includes(e.primaryMuscle));
}

export function useArcToday(trainedToday: MuscleGroup[] | undefined): ArcToday | undefined {
  const joined = useSetting("arcJoined");
  const reserves = Number(useSetting("arcReserves"));
  const readinessRaw = useSetting("arcReadiness");
  const date = todayKey();
  const avoidKey = trainedToday?.join() ?? "";
  return useLiveQuery(async () => {
    if (!trainedToday) return undefined;
    const rows = await db.arcDays.toArray();
    const covered = new Set(rows.map((r) => r.date));
    const row = rows.find((r) => r.date === date);
    const missed = missedStreak(date, covered, joined);
    const readiness = parseReadiness(readinessRaw, date);
    const avoid = (await legsYesterday(date)) ? [...trainedToday, ...LEG_MUSCLES] : trainedToday;
    const drill = row?.kind === "done" && row.exercise && row.unit && row.target
      ? { name: row.exercise, unit: row.unit, base: row.target, target: row.target, debtDays: 0, kind: row.drillKind ?? "full" }
      : drillFor(date, missed, avoid, readiness);

    let uncovered = 0;
    const from = joined > ARC_START ? joined : ARC_START;
    for (let d = from; d < date; d = shiftDate(d, 1)) if (!covered.has(d)) uncovered++;

    return {
      date, day: dayIndex(date) + 1, phase: phaseOf(date), drill, readiness, row, missed,
      kept: rows.filter((r) => r.kind === "done" || r.kind === "repaired").length,
      scars: uncovered - missed,
      reservesLeft: Math.max(0, reserves - rows.filter((r) => r.kind === "reserve").length),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, joined, reserves, readinessRaw, avoidKey]);
}
