import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { xpToLevel, nextLevel, levelProgress, isoWeek } from "../lib/xp";

// Live XP state — re-renders any subscriber when xpEvents changes.
// Used by the level badge on Home and the XP bar in Hall of Frame.
export function useXP() {
  const events = useLiveQuery(() => db.xpEvents.toArray(), []) ?? [];
  const totalXP = events.reduce((s, e) => s + e.xp, 0);
  const weekKey = isoWeek();
  const weekXP = events.filter((e) => e.weekKey === weekKey).reduce((s, e) => s + e.xp, 0);
  const level = xpToLevel(totalXP);
  const next = nextLevel(level);
  const progress = levelProgress(totalXP);
  return { totalXP, weekXP, level, next, progress };
}
