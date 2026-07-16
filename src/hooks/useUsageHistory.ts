import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { suppressMutations } from "../lib/mutations";

// Predictive-input helpers. Values are per-key numbers — no complex shapes.
// Keys use a "<kind>:<itemId>" convention so different domains can share
// the table without namespace collisions.
export type UsageKey =
  | `weight:${number}`
  | `reps:${number}`
  | `grams:${number}`;

/** Read the last known value for a key. `undefined` if never recorded. */
export function useUsageValue(key: UsageKey | null): number | undefined {
  return useLiveQuery(
    () => (key ? db.usageHistory.get(key) : undefined),
    [key],
  )?.value;
}

/** Fire-and-forget write. Skips the mutation bus so we don't spam auto-backup. */
export async function recordUsage(key: UsageKey, value: number): Promise<void> {
  if (!isFinite(value)) return;
  // Prevent predictive-input writes from firing cloud-backup pushes.
  // Usage history is a cache; it doesn't need to sync.
  suppressMutations(true);
  try {
    await db.usageHistory.put({ key, value, updatedAt: Date.now() });
  } finally {
    suppressMutations(false);
  }
}
