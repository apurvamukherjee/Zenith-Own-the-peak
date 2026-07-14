// Tiny mutation bus so cloud auto-backup knows when local data changed,
// without every hook needing to import the sync layer.
let last = 0;
let suppressed = false;
const listeners = new Set<() => void>();

export function bumpMutation() {
  if (suppressed) return;
  last = Date.now();
  listeners.forEach((l) => l());
}
export function lastMutation() { return last; }
export function suppressMutations(on: boolean) { suppressed = on; }
export function onMutation(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
