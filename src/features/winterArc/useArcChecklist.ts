import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { DEFAULTS, setSetting, type SettingKey } from "../../hooks/useSettings";
import { type ArcFacts, checklist, parseList, parseTicks, toggleTick } from "../../lib/arcChecklist";
import { inExam } from "../../lib/arcCalendar";

async function setting(key: SettingKey): Promise<string> {
  return String((await db.settings.get(key))?.value ?? DEFAULTS[key]);
}

const toMin = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };

export async function loadArcFacts(date: string): Promise<ArcFacts> {
  const weekday = new Date(`${date}T12:00`).getDay();
  const [row, sets, schedule, meals, water, sleep, study, proteinT, waterT, sleepT] = await Promise.all([
    db.arcDays.get(date),
    db.workoutSets.where("date").equals(date).count(),
    db.weekSchedule.toArray(),
    db.meals.where("date").equals(date).toArray(),
    db.water.where("date").equals(date).toArray(),
    db.sleep.where("date").equals(date).first(),
    db.studySessions.where("date").equals(date).toArray(),
    setting("proteinTargetG"), setting("waterGoalMl"), setting("sleepTargetMin"),
  ]);
  const restDay = !schedule.some((s) => s.weekday === weekday && s.dayId);
  return {
    drill: row?.kind === "done" || row?.kind === "exempt",
    training: sets > 0 || restDay,
    protein: meals.reduce((n, m) => n + m.protein, 0) >= Number(proteinT),
    water: water.reduce((n, w) => n + w.amountMl, 0) >= Number(waterT),
    sleep: (sleep?.durationMin ?? 0) >= Number(sleepT),
    wakeMin: sleep ? toMin(sleep.wakeAt) : undefined,
    studyMin: study.reduce((n, s) => n + s.minutes, 0),
  };
}

export async function loadArcChecklist(date: string) {
  const [facts, rules, ticks, examUntil] = await Promise.all([loadArcFacts(date), setting("arcRules"), setting("arcTicks"), setting("arcExamUntil")]);
  return checklist(date, facts, parseList(rules), parseTicks(ticks)[date] ?? [], inExam(date, examUntil));
}

export function useArcChecklist(date: string) {
  return useLiveQuery(() => loadArcChecklist(date), [date]);
}

export async function toggleArcRule(date: string, id: string): Promise<void> {
  await setSetting("arcTicks", toggleTick(await setting("arcTicks"), date, id));
}
