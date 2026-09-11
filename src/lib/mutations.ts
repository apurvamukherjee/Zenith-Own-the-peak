// Tiny mutation bus so cloud auto-backup knows when local data changed,
// without every hook needing to import the sync layer.
let last = 0;
let suppressed = false;
type Listener = (table?: string) => void;
const listeners = new Set<Listener>();

export function bumpMutation(table?: string) {
  if (suppressed) return;
  last = Date.now();
  // Dispatched via a fresh macrotask, not inline: bumpMutation() itself runs
  // from inside a Dexie table hook (creating/updating/deleting), which fires
  // synchronously inside that write's own IndexedDB transaction — scoped only
  // to the table(s) it touched. Listeners here query other, unrelated tables
  // (XP engine reads workoutSets/water/sleep, achievements reads nearly
  // everything); calling them inline lets their first query inherit that
  // narrower transaction and throw "object store not found". A setTimeout
  // lets the triggering transaction commit first so each listener starts its
  // own, correctly-scoped transaction.
  setTimeout(() => listeners.forEach((l) => l(table)), 0);
}
export function lastMutation() { return last; }
export function suppressMutations(on: boolean) { suppressed = on; }

/**
 * Subscribe to the mutation bus. Pass `tables` to only fire `cb` when the
 * write that triggered it touched one of those tables — use this for any
 * listener whose reads are scoped to a known, fixed set of tables (see
 * GAMEPLAY_TABLES below), so an edit somewhere unrelated (a task, a quote,
 * an expense) doesn't trigger a recompute it has no way of needing. A bump
 * with no table name (legacy call sites) always passes the filter, since an
 * unknown source can't be safely assumed irrelevant.
 */
export function onMutation(cb: () => void, tables?: readonly string[]): () => void {
  const listener: Listener = (table) => {
    if (tables && table !== undefined && !tables.includes(table)) return;
    cb();
  };
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Tables actually read — directly, or via lib/dayScore.ts, lib/streak.utils.ts,
// lib/todayScore.ts — by the gamification engines (XP, achievements, reward
// vault). A write to any table NOT in this list cannot change XP, an
// achievement, or a vault unlock, so it's safe for those engines to ignore.
// Keep this in sync with lib/achievements.ts buildContext(), lib/xp.ts, and
// lib/rewardVault.ts buildVaultContext() if their table reads ever change.
export const GAMEPLAY_TABLES = [
  "workoutSets", "workoutSessions", "water", "sleep", "studySessions", "meals",
  "streakFreezes", "fuel", "bodyweight", "bodyMeasurements", "dayPhotos",
  "scheduleLogs", "studyItems", "settings", "xpEvents", "achievements", "weekSchedule",
] as const;
