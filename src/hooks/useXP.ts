import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { xpToLevel, nextLevel, levelProgress } from "../lib/xp";
import { weekKey } from "../lib/date.utils";

// Live XP state — re-renders any subscriber when xpEvents changes.
// Used by the level badge on Home and the XP bar in Hall of Frame.
export function useXP() {
  const events = useLiveQuery(() => db.xpEvents.toArray(), []) ?? [];
  const totalXP = events.reduce((s, e) => s + e.xp, 0);
  const thisWeek = weekKey();
  const weekXP = events.filter((e) => e.weekKey === thisWeek).reduce((s, e) => s + e.xp, 0);
  const level = xpToLevel(totalXP);
  const next = nextLevel(level);
  const progress = levelProgress(totalXP);
  return { totalXP, weekXP, level, next, progress };
}
