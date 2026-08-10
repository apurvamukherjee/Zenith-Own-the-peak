// Bulk import/export of a full workout program (days + exercises + weekly
// schedule) as one JSON file — an "advanced" Settings feature for users who'd
// rather hand-write or script a plan than click through the Planner UI.
// See docs/WORKOUT_PLAN_FORMAT.md for the user-facing field reference.
import { db } from "../db/db";
import { MUSCLE_LABELS } from "../config/exerciseLibrary";
import { setWeekday } from "../features/gym/useGym";
import type { MuscleGroup, ExerciseDto, WorkoutDayDto, DayExerciseDto } from "../db/types";

const VALID_MUSCLES = new Set(Object.keys(MUSCLE_LABELS) as MuscleGroup[]);

export type ScheduleKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
const SCHEDULE_KEYS: ScheduleKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
// getDay(): 0 Sun .. 6 Sat — matches WorkoutPlanner's WEEKDAY_NAMES/weekSchedule.weekday
const SCHEDULE_KEY_TO_WEEKDAY: Record<ScheduleKey, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

export interface WorkoutPlanExerciseDef {
  name: string;
  sets: number; repLow: number; repHigh: number; weightKg: number; restSec: number;
  // Only used when `name` doesn't match an existing library exercise (case-insensitive).
  // Ignored — never overwrites — when it does match, so re-importing your own
  // export can't corrupt the shared exercise library's metadata.
  primaryMuscle?: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  equipment?: string;
  cues?: string;
  // Short tag linking this exercise to its immediate neighbor(s) in the array
  // sharing the same tag into a superset chain. Must be on consecutive entries
  // — the app's UI only ever renders adjacent-order superset links.
  superset?: string;
}

export interface WorkoutPlanDayDef {
  name: string;
  muscles: MuscleGroup[];
  exercises: WorkoutPlanExerciseDef[];
}

export interface WorkoutPlanFile {
  type: "zenith-workout-plan";
  version: 1;
  days: WorkoutPlanDayDef[];
  schedule?: Partial<Record<ScheduleKey, string>>; // value = a days[].name from this file, or "Rest"
}

export type ValidationResult =
  | { ok: true; plan: WorkoutPlanFile; warnings: string[] }
  | { ok: false; errors: string[] };

export interface ImportResult { daysCreated: number; exercisesCreated: number; warnings: string[]; }

// ---- Shared pure helpers (single source of truth between validate & import) ----

// Groups consecutive same-tagged exercises into supersetGroupId-worthy runs.
// Returns, per exercise index, the run it belongs to (or null if untagged /
// unpaired), plus warnings for tags that were reused non-adjacently or that
// never found a neighbor.
function computeSupersetRuns(exercises: WorkoutPlanExerciseDef[], dayName: string) {
  const runOf: (number | null)[] = exercises.map(() => null);
  const runIdsByTag = new Map<string, number[]>(); // tag -> ids of every *real* (length>=2) run it formed
  const warnings: string[] = [];
  let runSeq = 0;
  let i = 0;
  while (i < exercises.length) {
    const tag = exercises[i].superset?.trim();
    if (!tag) { i++; continue; }
    let j = i;
    while (j + 1 < exercises.length && exercises[j + 1].superset?.trim() === tag) j++;
    if (j > i) {
      const run = runSeq++;
      for (let k = i; k <= j; k++) runOf[k] = run;
      const runIds = runIdsByTag.get(tag) ?? [];
      runIds.push(run);
      runIdsByTag.set(tag, runIds);
    } else {
      warnings.push(`Day "${dayName}": superset tag "${tag}" on "${exercises[i].name}" has no neighbor with the same tag — ignored.`);
    }
    i = j + 1;
  }
  // Only warn about ambiguous reuse when the same tag formed two or more real
  // (length>=2) chains — a tag mixing one real chain with a stray singleton
  // elsewhere is already fully explained by the "no neighbor" warning above.
  for (const [tag, runIds] of runIdsByTag) {
    if (runIds.length > 1) {
      warnings.push(`Day "${dayName}": superset tag "${tag}" appears in more than one place — only exercises next to each other are linked; each run became its own group.`);
    }
  }
  return { runOf, warnings };
}

function resolveScheduleDayId(
  key: ScheduleKey, value: string, dayIdByName: Map<string, number>,
): { dayId: number } | { warning: string } {
  if (value.trim().toLowerCase() === "rest") return { dayId: 0 };
  const id = dayIdByName.get(value.trim().toLowerCase());
  if (id != null) return { dayId: id };
  return { warning: `schedule.${key}: unknown day "${value}" — skipped, left unchanged.` };
}

// ---- Validation ----

export async function validateWorkoutPlanFile(raw: unknown): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, errors: ["Not a valid JSON object."] };
  }
  const obj = raw as Record<string, unknown>;

  if (obj.type !== "zenith-workout-plan") {
    errors.push('Not a Zenith workout plan file (missing or wrong "type" field).');
  }
  if (obj.version !== 1) {
    errors.push(`Unsupported format version "${String(obj.version)}" — this app supports version 1.`);
  }
  if (errors.length) return { ok: false, errors }; // no point validating further

  if (!Array.isArray(obj.days) || obj.days.length === 0) {
    return { ok: false, errors: ['"days" must be a non-empty array.'] };
  }
  if (obj.days.length > 50) errors.push(`Too many days (${obj.days.length}) — max 50.`);

  const seenNames = new Map<string, number>(); // lowercase name -> first index
  const days: WorkoutPlanDayDef[] = [];

  obj.days.forEach((rawDay, i) => {
    if (typeof rawDay !== "object" || rawDay === null) {
      errors.push(`Day ${i + 1}: must be an object.`);
      return;
    }
    const d = rawDay as Record<string, unknown>;
    const name = typeof d.name === "string" ? d.name.trim() : "";
    if (!name) { errors.push(`Day ${i + 1}: "name" is required.`); return; }
    if (name.length > 80) errors.push(`Day ${i + 1}: name too long (max 80 chars).`);
    const lower = name.toLowerCase();
    if (seenNames.has(lower)) {
      errors.push(`Duplicate day name "${name}" — day names must be unique within the file.`);
      return;
    }
    seenNames.set(lower, i);

    const musclesRaw = d.muscles;
    if (musclesRaw !== undefined && !Array.isArray(musclesRaw)) {
      errors.push(`Day "${name}": "muscles" must be an array.`);
    }
    const muscles: MuscleGroup[] = Array.isArray(musclesRaw)
      ? musclesRaw.filter((m): m is MuscleGroup => {
          if (typeof m === "string" && VALID_MUSCLES.has(m as MuscleGroup)) return true;
          errors.push(`Day "${name}": unknown muscle "${String(m)}".`);
          return false;
        })
      : [];

    const exercisesRaw = d.exercises;
    if (!Array.isArray(exercisesRaw) || exercisesRaw.length === 0) {
      errors.push(`Day "${name}": needs at least 1 exercise.`);
      days.push({ name, muscles, exercises: [] });
      return;
    }
    if (exercisesRaw.length > 40) errors.push(`Day "${name}": too many exercises (${exercisesRaw.length}) — max 40.`);

    const exercises: WorkoutPlanExerciseDef[] = [];
    exercisesRaw.forEach((rawEx, j) => {
      if (typeof rawEx !== "object" || rawEx === null) {
        errors.push(`Day "${name}", exercise ${j + 1}: must be an object.`);
        return;
      }
      const e = rawEx as Record<string, unknown>;
      const prefix = `Day "${name}", exercise ${j + 1}`;
      const exName = typeof e.name === "string" ? e.name.trim() : "";
      if (!exName) { errors.push(`${prefix}: "name" is required.`); return; }

      const isIntInRange = (v: unknown, min: number, max: number) =>
        typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
      if (!isIntInRange(e.sets, 1, 20)) errors.push(`${prefix}: "sets" must be a whole number 1–20.`);
      if (!(typeof e.repLow === "number" && Number.isInteger(e.repLow) && e.repLow >= 1)) {
        errors.push(`${prefix}: "repLow" must be a whole number ≥ 1.`);
      }
      const repLow = typeof e.repLow === "number" ? e.repLow : 1;
      if (!(typeof e.repHigh === "number" && Number.isInteger(e.repHigh) && e.repHigh >= repLow)) {
        errors.push(`${prefix}: "repHigh" must be ≥ repLow.`);
      }
      if (!(typeof e.weightKg === "number" && !Number.isNaN(e.weightKg) && e.weightKg >= 0)) {
        errors.push(`${prefix}: "weightKg" must be a number ≥ 0.`);
      }
      if (!(typeof e.restSec === "number" && Number.isInteger(e.restSec) && e.restSec >= 0)) {
        errors.push(`${prefix}: "restSec" must be a whole number ≥ 0.`);
      }
      let primaryMuscle: MuscleGroup | undefined;
      if (e.primaryMuscle !== undefined) {
        if (typeof e.primaryMuscle === "string" && VALID_MUSCLES.has(e.primaryMuscle as MuscleGroup)) {
          primaryMuscle = e.primaryMuscle as MuscleGroup;
        } else {
          errors.push(`${prefix}: unknown primaryMuscle "${String(e.primaryMuscle)}".`);
        }
      }
      let secondaryMuscles: MuscleGroup[] | undefined;
      if (e.secondaryMuscles !== undefined) {
        if (Array.isArray(e.secondaryMuscles) && e.secondaryMuscles.every((m) => typeof m === "string" && VALID_MUSCLES.has(m as MuscleGroup))) {
          secondaryMuscles = e.secondaryMuscles as MuscleGroup[];
        } else {
          errors.push(`${prefix}: invalid secondaryMuscles.`);
        }
      }
      if (e.equipment !== undefined && typeof e.equipment !== "string") errors.push(`${prefix}: "equipment" must be a string.`);
      if (e.cues !== undefined && typeof e.cues !== "string") errors.push(`${prefix}: "cues" must be a string.`);
      let superset: string | undefined;
      if (e.superset !== undefined) {
        if (typeof e.superset === "string" && e.superset.trim() && e.superset.trim().length <= 20) {
          superset = e.superset.trim();
        } else {
          errors.push(`${prefix}: "superset" tag must be a short string (max 20 chars).`);
        }
      }

      exercises.push({
        name: exName,
        sets: e.sets as number, repLow, repHigh: e.repHigh as number,
        weightKg: e.weightKg as number, restSec: e.restSec as number,
        primaryMuscle, secondaryMuscles, equipment: e.equipment as string | undefined,
        cues: e.cues as string | undefined, superset,
      });
    });

    days.push({ name, muscles, exercises });
    warnings.push(...computeSupersetRuns(exercises, name).warnings);
  });

  const scheduleRaw = obj.schedule;
  const schedule: Partial<Record<ScheduleKey, string>> = {};
  if (scheduleRaw !== undefined) {
    if (typeof scheduleRaw !== "object" || scheduleRaw === null || Array.isArray(scheduleRaw)) {
      errors.push('"schedule" must be an object.');
    } else {
      const s = scheduleRaw as Record<string, unknown>;
      for (const k of Object.keys(s)) {
        if (!SCHEDULE_KEYS.includes(k as ScheduleKey)) {
          errors.push(`Unknown schedule key "${k}" — expected mon/tue/wed/thu/fri/sat/sun.`);
          continue;
        }
        const v = s[k];
        if (v === undefined || v === null || v === "") continue;
        if (typeof v !== "string") { errors.push(`schedule.${k} must be a string.`); continue; }
        schedule[k as ScheduleKey] = v;
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  // Cross-check needing a DB read: unmatched exercise name + no primaryMuscle
  // + owning day has no muscles to fall back to.
  const existing = await db.exercises.toArray();
  const byLowerName = new Set(existing.map((e) => e.name.trim().toLowerCase()));
  for (const day of days) {
    for (const ex of day.exercises) {
      const matched = byLowerName.has(ex.name.toLowerCase());
      if (!matched && !ex.primaryMuscle && day.muscles.length === 0) {
        errors.push(`Day "${day.name}", exercise "${ex.name}": no library match and no primaryMuscle — and the day has no muscles to fall back to. Add a primaryMuscle.`);
      }
    }
  }
  if (errors.length > 0) return { ok: false, errors };

  // Schedule warnings (day names are now known-valid — errors already returned above)
  const dayNameSet = new Set(days.map((d) => d.name.toLowerCase()));
  for (const k of SCHEDULE_KEYS) {
    const v = schedule[k];
    if (!v) continue;
    if (v.trim().toLowerCase() !== "rest" && !dayNameSet.has(v.trim().toLowerCase())) {
      warnings.push(`schedule.${k}: unknown day "${v}" — skipped, left unchanged.`);
    }
  }

  return { ok: true, plan: { type: "zenith-workout-plan", version: 1, days, schedule }, warnings };
}

// ---- Export (also doubles as a live example generator) ----

export async function exportWorkoutPlan(): Promise<WorkoutPlanFile> {
  const [days, dayExercises, exercises, weekSchedule] = await Promise.all([
    db.workoutDays.orderBy("order").toArray(),
    db.dayExercises.toArray(),
    db.exercises.toArray(),
    db.weekSchedule.toArray(),
  ]);
  const exerciseById = new Map(exercises.map((e) => [e.id!, e]));

  const planDays: WorkoutPlanDayDef[] = days.map((day) => {
    const rows = dayExercises.filter((de) => de.dayId === day.id).sort((a, b) => a.order - b.order);
    // Reconstruct superset tags from supersetGroupId runs (adjacent rows sharing an id).
    const tagByGroupId = new Map<number, string>();
    let tagSeq = 0;
    const nextTag = () => { const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; return letters[tagSeq++ % 26]; };
    const exercises: WorkoutPlanExerciseDef[] = rows.map((de, idx) => {
      const ex = exerciseById.get(de.exerciseId);
      let superset: string | undefined;
      if (de.supersetGroupId != null) {
        const prev = rows[idx - 1];
        const next = rows[idx + 1];
        const linkedToPrev = prev && prev.supersetGroupId === de.supersetGroupId;
        const linkedToNext = next && next.supersetGroupId === de.supersetGroupId;
        if (linkedToPrev || linkedToNext) {
          if (!tagByGroupId.has(de.supersetGroupId)) tagByGroupId.set(de.supersetGroupId, nextTag());
          superset = tagByGroupId.get(de.supersetGroupId);
        }
      }
      return {
        name: ex?.name ?? "Unknown exercise",
        sets: de.sets, repLow: de.repLow, repHigh: de.repHigh, weightKg: de.weightKg, restSec: de.restSec,
        superset,
      };
    });
    return { name: day.name, muscles: day.muscles, exercises };
  });

  const dayNameById = new Map(days.map((d) => [d.id!, d.name]));
  const schedule: Partial<Record<ScheduleKey, string>> = {};
  for (const entry of weekSchedule) {
    const key = SCHEDULE_KEYS.find((k) => SCHEDULE_KEY_TO_WEEKDAY[k] === entry.weekday);
    if (!key) continue;
    schedule[key] = entry.dayId === 0 ? "Rest" : (dayNameById.get(entry.dayId) ?? "Rest");
  }

  return { type: "zenith-workout-plan", version: 1, days: planDays, schedule };
}

// ---- Import ----

export async function importWorkoutPlan(plan: WorkoutPlanFile, mode: "add" | "replace"): Promise<ImportResult> {
  const warnings: string[] = [];

  return db.transaction("rw", [db.exercises, db.workoutDays, db.dayExercises, db.weekSchedule], async () => {
    // Step 1 — resolve/create exercises, batched (no N+1).
    const existing = await db.exercises.toArray();
    const byLowerName = new Map(existing.map((e) => [e.name.trim().toLowerCase(), e]));

    type Draft = Omit<ExerciseDto, "id">;
    const drafts = new Map<string, Draft>();
    for (const day of plan.days) {
      for (const ex of day.exercises) {
        const lower = ex.name.toLowerCase();
        if (byLowerName.has(lower) || drafts.has(lower)) continue;
        drafts.set(lower, {
          name: ex.name,
          primaryMuscle: ex.primaryMuscle ?? day.muscles[0],
          secondaryMuscles: ex.secondaryMuscles ?? [],
          equipment: ex.equipment?.trim() || "other",
          cues: ex.cues?.trim() || undefined,
          isCustom: 1,
        });
      }
    }
    const draftEntries = [...drafts.entries()];
    const newIds = draftEntries.length
      ? await db.exercises.bulkAdd(draftEntries.map(([, d]) => d), { allKeys: true })
      : [];
    const newIdByLower = new Map(draftEntries.map(([lower], i) => [lower, newIds[i]]));
    const resolveExerciseId = (name: string): number => {
      const lower = name.toLowerCase();
      return byLowerName.get(lower)?.id ?? newIdByLower.get(lower)!;
    };

    // Step 2 — wipe (replace mode only). Never touches exercises or logged history.
    if (mode === "replace") {
      await db.dayExercises.clear();
      await db.weekSchedule.clear();
      await db.workoutDays.clear();
    }

    // Step 3 — create days, batched.
    const startOrder = mode === "replace" ? 0 : await db.workoutDays.count();
    const dayIds = plan.days.length
      ? await db.workoutDays.bulkAdd(
          plan.days.map((d, i): Omit<WorkoutDayDto, "id"> => ({ name: d.name, muscles: d.muscles, order: startOrder + i })),
          { allKeys: true },
        )
      : [];
    const dayIdByName = new Map(plan.days.map((d, i) => [d.name.toLowerCase(), dayIds[i]]));

    // Step 4 — create day-exercises with supersets, batched into one call.
    const groupBase = Date.now();
    let groupSeq = 0;
    const flatRows: Omit<DayExerciseDto, "id">[] = [];
    plan.days.forEach((day, di) => {
      const dayId = dayIds[di];
      const { runOf, warnings: runWarnings } = computeSupersetRuns(day.exercises, day.name);
      warnings.push(...runWarnings);
      const groupIdByRun = new Map<number, number>();
      day.exercises.forEach((ex, j) => {
        let supersetGroupId: number | undefined;
        const run = runOf[j];
        if (run != null) {
          if (!groupIdByRun.has(run)) groupIdByRun.set(run, groupBase + groupSeq++);
          supersetGroupId = groupIdByRun.get(run);
        }
        flatRows.push({
          dayId, exerciseId: resolveExerciseId(ex.name), order: j,
          sets: ex.sets, repLow: ex.repLow, repHigh: ex.repHigh, weightKg: ex.weightKg, restSec: ex.restSec,
          supersetGroupId,
        });
      });
    });
    if (flatRows.length) await db.dayExercises.bulkAdd(flatRows);

    // Step 5 — schedule (≤7 entries — fine to use the existing setWeekday helper).
    if (plan.schedule) {
      for (const key of SCHEDULE_KEYS) {
        const value = plan.schedule[key];
        if (!value) continue;
        const resolved = resolveScheduleDayId(key, value, dayIdByName);
        if ("warning" in resolved) { warnings.push(resolved.warning); continue; }
        await setWeekday(SCHEDULE_KEY_TO_WEEKDAY[key], resolved.dayId);
      }
    }

    return { daysCreated: plan.days.length, exercisesCreated: newIds.length, warnings };
  });
}
