import { useEffect, useRef } from "react";
import { onMutation, GAMEPLAY_TABLES } from "../lib/mutations";
import { grantXP, getTotalXP, xpToLevel } from "../lib/xp";
import { db } from "../db/db";
import { todayKey } from "../lib/date.utils";
import { computeUnifiedStreak } from "../lib/streak.utils";
import { computeTodayScore } from "../lib/todayScore";
import { inArc } from "../lib/winterArc";
import { loadArcChecklist } from "../features/winterArc/useArcChecklist";
import { settleArcWager } from "../features/winterArc/useArcBosses";

// ─────────────────────────────────────────────────────────────────────────────
// XP ENGINE — mounted once in AppShell (next to achievement engine).
// Listens to the mutation bus and grants XP for meaningful actions.
// Each action uses a dedup guard so the same event never double-grants.
// ─────────────────────────────────────────────────────────────────────────────
export function useXPEngine(onLevelUp?: (level: number, name: string) => void) {
  const lastTotalRef = useRef<number | null>(null);

  useEffect(() => {
    const run = async () => {
      const today = todayKey();
      // Today's grants are the dedup source: they survive app restarts, unlike
      // in-memory flags, which re-granted every once-a-day action on launch.
      const grantedToday = await db.xpEvents.where("createdAt").aboveOrEqual(new Date().setHours(0, 0, 0, 0)).toArray();
      const granted = (action: string) => grantedToday.filter((e) => e.action === action).length;

      // ── Sets: +2 per set logged today, PR bonus for the fresh ones ────────
      // Counting grants (not current sets) means deleting and re-logging a
      // set can't farm XP.
      const todaySets = await db.workoutSets.where("date").equals(today).toArray();
      const setsGranted = granted("set");
      if (todaySets.length > setsGranted) {
        for (let i = setsGranted; i < todaySets.length; i++) await grantXP("set");
        for (const s of todaySets.slice(setsGranted)) if (s.isPR) await grantXP("pr");
      }

      // ── Session done (first set of the day) ───────────────────────────────
      if (todaySets.length > 0 && !granted("session_done")) await grantXP("session_done");

      // ── Water goal ────────────────────────────────────────────────────────
      if (!granted("water_goal")) {
        const waterRows = await db.water.where("date").equals(today).toArray();
        const totalMl = waterRows.reduce((s, r) => s + r.amountMl, 0);
        const goal = Number((await db.settings.get("waterGoalMl"))?.value ?? 3500);
        if (totalMl >= goal) await grantXP("water_goal");
      }

      // ── Sleep ──────────────────────────────────────────────────────────────
      if (!granted("sleep") && await db.sleep.where("date").equals(today).first()) await grantXP("sleep");

      // ── Meals (capped at 5 per day) ────────────────────────────────────────
      const mealsToday = await db.meals.where("date").equals(today).count();
      for (let i = granted("meal"); i < Math.min(mealsToday, 5); i++) await grantXP("meal");

      // ── Streak day: once per calendar day while the streak is ≥1 ──────────
      if (!granted("streak_day") && await computeUnifiedStreak() > 0) await grantXP("streak_day");

      // ── Discipline 80 / 100: once per day per threshold ───────────────────
      const waterGoal = Number((await db.settings.get("waterGoalMl"))?.value ?? 3500);
      const proteinTarget = Number((await db.settings.get("proteinTargetG"))?.value ?? 100);
      const { score } = await computeTodayScore(waterGoal, proteinTarget);
      if (score >= 100 && !granted("discipline_100")) await grantXP("discipline_100");
      else if (score >= 80 && !granted("discipline_80") && !granted("discipline_100")) await grantXP("discipline_80");

      // ── Winter Arc: drill + full checklist, once per day each ─────────────
      if (inArc(today) && (await db.settings.get("arcJoined"))?.value) {
        if (!granted("arc_drill") && (await db.arcDays.get(today))?.kind === "done") await grantXP("arc_drill");
        if (!granted("arc_checklist") && (await loadArcChecklist(today)).score >= 100) await grantXP("arc_checklist");
      }
      await settleArcWager(today);

      // ── Level-up check ────────────────────────────────────────────────────
      const totalXP = await getTotalXP();
      const newLevel = xpToLevel(totalXP);
      if (lastTotalRef.current !== null) {
        const oldLevel = xpToLevel(lastTotalRef.current);
        if (newLevel.level > oldLevel.level && onLevelUp) {
          onLevelUp(newLevel.level, newLevel.name);
        }
      }
      lastTotalRef.current = totalXP;
    };
    // One run at a time: every guard above is check-then-grant across awaits,
    // and a single user action bumps several tables at once, so overlapping
    // runs would each pass the same guard and grant twice.
    let queue = Promise.resolve();
    return onMutation(() => {
      queue = queue.then(run).catch((err: unknown) => { console.error("XP engine run failed", err); });
    }, GAMEPLAY_TABLES);
  }, [onLevelUp]);
}

// ─────────────────────────────────────────────────────────────────────────────
// GRANT XP FROM ACHIEVEMENTS ENGINE
// Called by useAchievements when a badge unlocks. Maps tier → action.
// ─────────────────────────────────────────────────────────────────────────────
export async function grantBadgeXP(tier: string): Promise<void> {
  const map: Record<string, Parameters<typeof grantXP>[0]> = {
    bronze:  "badge_bronze",
    silver:  "badge_silver",
    gold:    "badge_gold",
    platinum:"badge_iron",
    mythic:  "badge_mythic",
  };
  const action = map[tier];
  if (action) await grantXP(action);
}
