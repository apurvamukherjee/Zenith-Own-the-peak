// Tiny mutation bus so cloud auto-backup knows when local data changed,
// without every hook needing to import the sync layer.
let last = 0;
let suppressed = false;
const listeners = new Set<() => void>();

export function bumpMutation() {
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
  setTimeout(() => listeners.forEach((l) => l()), 0);
}
export function lastMutation() { return last; }
export function suppressMutations(on: boolean) { suppressed = on; }
export function onMutation(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
