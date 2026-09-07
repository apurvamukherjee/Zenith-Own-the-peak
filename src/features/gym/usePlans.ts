// Multiple switchable workout plans. `db.workoutDays`/`dayExercises`/
// `weekSchedule` always represent only the currently active plan, live — see
// db/types.ts's WorkoutPlanRowDto doc comment. Switching = snapshot the
// outgoing plan's live tables, then replace-import the incoming plan's
// snapshot, reusing the exact machinery lib/workoutPlanFile.ts already built
// for the "Plan file (advanced)" Settings feature.
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { useSetting, setSetting } from "../../hooks/useSettings";
import { importWorkoutPlan, exportWorkoutPlan, type WorkoutPlanFile } from "../../lib/workoutPlanFile";
import { BUILT_IN_PLANS, builtInPlanByKey } from "../../config/plans/builtInPlans";
import type { WorkoutPlanRowDto } from "../../db/types";

const BUILT_IN_ORDER = new Map(BUILT_IN_PLANS.map((p, i) => [p.key, i]));

export function useWorkoutPlans(): WorkoutPlanRowDto[] {
  const rows = useLiveQuery(() => db.workoutPlans.toArray(), []) ?? [];
  return [...rows].sort((a, b) => {
    if (a.isBuiltIn !== b.isBuiltIn) return b.isBuiltIn - a.isBuiltIn; // built-ins first
    if (a.isBuiltIn) return (BUILT_IN_ORDER.get(a.builtInKey!) ?? 0) - (BUILT_IN_ORDER.get(b.builtInKey!) ?? 0);
    return a.createdAt - b.createdAt;
  });
}

export function useActivePlanId(): number {
  return Number(useSetting("activeWorkoutPlanId"));
}

export function useActivePlan(): WorkoutPlanRowDto | undefined {
  const plans = useWorkoutPlans();
  const activeId = useActivePlanId();
  return plans.find((p) => p.id === activeId);
}

async function snapshotActivePlanIfAny(): Promise<void> {
  const activeId = Number((await db.settings.get("activeWorkoutPlanId"))?.value ?? 0);
  if (!activeId) return;
  const row = await db.workoutPlans.get(activeId);
  if (!row) return;
  const snapshot = await exportWorkoutPlan();
  await db.workoutPlans.update(activeId, { snapshot, updatedAt: Date.now() });
}

export async function switchToPlan(targetId: number): Promise<void> {
  const activeId = Number((await db.settings.get("activeWorkoutPlanId"))?.value ?? 0);
  if (activeId === targetId) return;
  const target = await db.workoutPlans.get(targetId);
  if (!target) throw new Error("Plan not found");
  await snapshotActivePlanIfAny();
  await importWorkoutPlan(target.snapshot, "replace");
  await setSetting("activeWorkoutPlanId", targetId);
}

// A blank plan (or a duplicate of another plan) can only be edited once it's
// active — the Planner always edits the live tables — so creating one
// immediately switches to it.
export async function createCustomPlan(name: string, duplicateFromId?: number): Promise<number> {
  const now = Date.now();
  let snapshot: WorkoutPlanFile = { type: "zenith-workout-plan", version: 1, days: [] };
  if (duplicateFromId) {
    const src = await db.workoutPlans.get(duplicateFromId);
    if (src) snapshot = src.snapshot;
  }
  const id = await db.workoutPlans.add({ name: name.trim() || "New plan", isBuiltIn: 0, snapshot, createdAt: now, updatedAt: now });
  await switchToPlan(id);
  return id;
}

export async function renamePlan(id: number, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  await db.workoutPlans.update(id, { name: trimmed, updatedAt: Date.now() });
}

export async function deletePlan(id: number): Promise<void> {
  const activeId = Number((await db.settings.get("activeWorkoutPlanId"))?.value ?? 0);
  if (id === activeId) throw new Error("Can't delete the active plan — switch to another one first.");
  const row = await db.workoutPlans.get(id);
  if (row?.isBuiltIn) throw new Error("Built-in plans can't be deleted — use Reset to default instead.");
  await db.workoutPlans.delete(id);
}

// Restores a built-in plan's snapshot to its hardcoded default. If it's the
// currently active plan, also re-imports it into the live tables right away.
export async function resetBuiltInPlan(id: number): Promise<void> {
  const row = await db.workoutPlans.get(id);
  if (!row?.isBuiltIn || !row.builtInKey) throw new Error("Not a built-in plan");
  const def = builtInPlanByKey(row.builtInKey);
  await db.workoutPlans.update(id, { snapshot: def.file, updatedAt: Date.now() });
  const activeId = Number((await db.settings.get("activeWorkoutPlanId"))?.value ?? 0);
  if (activeId === id) await importWorkoutPlan(def.file, "replace");
}

export function planDayNames(plan: WorkoutPlanRowDto): string[] {
  return plan.snapshot.days.map((d) => d.name);
}

export function planExerciseCount(plan: WorkoutPlanRowDto): number {
  return plan.snapshot.days.reduce((sum, d) => sum + d.exercises.length, 0);
}
