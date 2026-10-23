import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import type { ArcDayDto, MuscleGroup } from "../../db/types";
import { setSetting, useSetting } from "../../hooks/useSettings";
import { todayKey } from "../../lib/date.utils";
import { grantXP } from "../../lib/xp";
import { markDrillTaskDone } from "./vow";
import {
  type Drill, type Readiness, type ArcPhase, drillFor, missedStreak, settle, shiftDate, dayIndex, phaseOf,
  LEG_MUSCLES,
} from "../../lib/winterArc";
import { halfStart, chapterOf, themeFor, inExam, type ArcDayTheme } from "../../lib/arcCalendar";

export interface ArcToday {
  date: string; day: number; phase: ArcPhase; drill: Drill; readiness: Readiness;
  row: ArcDayDto | undefined; missed: number; kept: number; scars: number; reservesLeft: number;
  chapter: { n: number; kept: number; days: number }; theme: ArcDayTheme | undefined; exam: boolean;
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
  const examUntil = String(useSetting("arcExamUntil"));
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

    // Second Wind: from Dec 1, scars and reserves count for Phase 2 only.
    const half = halfStart(date);
    const from = joined > half ? joined : half;
    let uncovered = 0;
    for (let d = from; d < date; d = shiftDate(d, 1)) if (!covered.has(d)) uncovered++;
    const isKept = (r: ArcDayDto) => r.kind === "done" || r.kind === "repaired";
    const ch = chapterOf(date);

    return {
      date, day: dayIndex(date) + 1, phase: phaseOf(date), drill, readiness, row, missed,
      kept: rows.filter(isKept).length,
      scars: Math.max(0, uncovered - missed),
      reservesLeft: Math.max(0, reserves - rows.filter((r) => r.kind === "reserve" && r.date >= half).length),
      chapter: {
        n: ch.n, days: dayIndex(ch.end) - dayIndex(ch.start) + 1,
        kept: rows.filter((r) => isKept(r) && r.date >= ch.start && r.date <= ch.end).length,
      },
      theme: themeFor(date), exam: inExam(date, examUntil),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, joined, reserves, readinessRaw, avoidKey, examUntil]);
}

// Clearing a debt drill pays back the missed days it carried, so they count
// as kept — repair beats punishment for staying in (Silverman & Barasch 2023).
// Returns true when this was a comeback (first drill after a miss): the
// return-after-a-miss bonus was the top arm of Milkman et al.'s 61k-person
// gym megastudy (+27% visits).
export async function completeDrill(arc: ArcToday, drill: Drill): Promise<boolean> {
  const at = Date.now();
  await db.arcDays.bulkPut([
    { date: arc.date, kind: "done", at, exercise: drill.name, unit: drill.unit, target: drill.target, drillKind: drill.kind },
    ...settle(arc.date, arc.missed, drill.debtDays, arc.reservesLeft).map((s) => ({ ...s, at })),
  ]);
  await markDrillTaskDone(arc.date);
  if (arc.missed === 0) return false;
  await grantXP("arc_comeback");
  return true;
}

/** Sick/injury pause — today or, at most, yesterday. */
export async function pauseDay(date: string): Promise<void> {
  if (await db.arcDays.get(date)) return;
  await db.arcDays.put({ date, kind: "exempt", at: Date.now() });
}

export const setReadiness = (date: string, r: Readiness) => setSetting("arcReadiness", `${date}|${r}`);

