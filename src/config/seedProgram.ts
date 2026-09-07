import { db } from "../db/db";
import { EXERCISE_LIBRARY } from "./exerciseLibrary";
import { seedFoodsIfEmpty } from "./foodCatalog";
import { seedQuotesIfEmpty } from "./quoteSeed";
import { BUILT_IN_PLANS } from "./plans/builtInPlans";
import { importWorkoutPlan, exportWorkoutPlan } from "../lib/workoutPlanFile";
import { setSetting } from "../hooks/useSettings";

// Seeds the exercise library + default PPL split + food catalog on first launch. Idempotent.
//
// React 19 StrictMode double-invokes effects in dev, and App.tsx calls this
// from a plain useEffect — two concurrent calls would both read an empty
// `db.exercises` count before either finishes writing, doubling every seeded
// row (days, exercises, schedule). A module-level in-flight-promise guard
// makes the second caller just await the first call's result instead of
// re-running the read-then-write race.
let inFlight: Promise<void> | null = null;
export function seedIfEmpty(): Promise<void> {
  if (!inFlight) inFlight = seedIfEmptyInner().finally(() => { inFlight = null; });
  return inFlight;
}

async function seedIfEmptyInner() {
  // Foods seed runs independently — it can grow later without invalidating gym seed.
  await seedFoodsIfEmpty();
  // Quotes seed runs independently too — Home's shuffle card needs at least
  // one row on day 1 to feel intentional.
  await seedQuotesIfEmpty();

  const count = await db.exercises.count();
  const isFreshInstall = count === 0;
  if (!isFreshInstall) {
    await syncExerciseLibrary();
  } else {
    // 1. Seed exercise library
    await db.exercises.bulkAdd(EXERCISE_LIBRARY.map((e) => ({ ...e, isCustom: 0 })));

    // 2. Install the default Classic PPL split as the live plan (days +
    // day-exercises + weekly schedule) via the same import path every other
    // plan uses — exercise names above all match EXERCISE_LIBRARY exactly, so
    // this resolves against the library instead of creating custom entries.
    const classicPpl = BUILT_IN_PLANS.find((p) => p.key === "classic-ppl")!;
    await importWorkoutPlan(classicPpl.file, "replace");
  }

  await ensurePlansSeeded(isFreshInstall);
}

// Populates the `workoutPlans` catalog (once) so the plan switcher has
// something to show. Cheap no-op on every launch after the first.
async function ensurePlansSeeded(isFreshInstall: boolean) {
  if (await db.workoutPlans.count() > 0) return;

  const now = Date.now();
  const builtInIds = await db.workoutPlans.bulkAdd(
    BUILT_IN_PLANS.map((p) => ({
      name: p.name, isBuiltIn: 1 as const, builtInKey: p.key,
      snapshot: p.file, createdAt: now, updatedAt: now,
    })),
    { allKeys: true },
  );

  if (isFreshInstall) {
    // Live tables were just built from classic-ppl above — point the active
    // plan straight at that catalog row.
    const classicPplIdx = BUILT_IN_PLANS.findIndex((p) => p.key === "classic-ppl");
    await setSetting("activeWorkoutPlanId", builtInIds[classicPplIdx]);
  } else {
    // Existing user upgrading: their live tables are whatever they already
    // built by hand — snapshot that exactly, name it, and make it active.
    // The 2 new built-ins are now available to switch to, but nothing about
    // their current setup was touched.
    const snapshot = await exportWorkoutPlan();
    const myPlanId = await db.workoutPlans.add({
      name: "My Plan", isBuiltIn: 0, snapshot, createdAt: now, updatedAt: now,
    });
    await setSetting("activeWorkoutPlanId", myPlanId);
  }
}

// Adds any exercises present in EXERCISE_LIBRARY (new app updates) that aren't
// already in this install's db, matched by name. Runs on every launch after
// the initial seed, so existing users' pre-made list stays current without
// touching their custom exercises or day assignments.
async function syncExerciseLibrary() {
  const existingNames = new Set((await db.exercises.toArray()).map((e) => e.name));
  const missing = EXERCISE_LIBRARY.filter((e) => !existingNames.has(e.name));
  if (missing.length === 0) return;
  await db.exercises.bulkAdd(missing.map((e) => ({ ...e, isCustom: 0 })));
}
