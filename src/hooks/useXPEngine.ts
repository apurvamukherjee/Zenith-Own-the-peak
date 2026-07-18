import { useEffect, useRef } from "react";
import { onMutation } from "../lib/mutations";
import { grantXP, xpToLevel } from "../lib/xp";
import { db } from "../db/db";
import { todayKey } from "../lib/date.utils";

// ─────────────────────────────────────────────────────────────────────────────
// XP ENGINE — mounted once in AppShell (next to achievement engine).
// Listens to the mutation bus and grants XP for meaningful actions.
// Each action uses a dedup guard so the same event never double-grants.
// ─────────────────────────────────────────────────────────────────────────────
export function useXPEngine(onLevelUp?: (level: number, name: string) => void) {
  const lastTotalRef = useRef<number | null>(null);
  const lastSetDateRef = useRef<string>("");
  const lastWaterDateRef = useRef<string>("");
  const lastSleepDateRef = useRef<string>("");
  const lastDiscipline80Ref = useRef<string>("");
  const lastDiscipline100Ref = useRef<string>("");
  const lastMealCountRef = useRef<{ date: string; count: number }>({ date: "", count: 0 });

  useEffect(() => {
    const unsub = onMutation(async () => {
      const today = todayKey();

      // ── Sets ──────────────────────────────────────────────────────────────
      // Grant +2 XP per set logged today (capped check: count how many today,
      // compare to last-known count, grant delta).
      const todaySets = await db.workoutSets.where("date").equals(today).toArray();
      const lastSetCount = parseInt(localStorage.getItem(`xp-sets-${today}`) ?? "0", 10);
      const newSets = todaySets.length - lastSetCount;
      if (newSets > 0) {
        localStorage.setItem(`xp-sets-${today}`, String(todaySets.length));
        for (let i = 0; i < newSets; i++) await grantXP("set");
        // Check for PR in the newest sets (isPR flag)
        const freshSets = todaySets.slice(lastSetCount);
        for (const s of freshSets) {
          if (s.isPR) await grantXP("pr");
        }
      }

      // ── Session done (first set of a new session) ─────────────────────────
      if (lastSetDateRef.current !== today && todaySets.length > 0) {
        lastSetDateRef.current = today;
        await grantXP("session_done");
      }

      // ── Water goal ────────────────────────────────────────────────────────
      if (lastWaterDateRef.current !== today) {
        const waterRows = await db.water.where("date").equals(today).toArray();
        const totalMl = waterRows.reduce((s, r) => s + r.amountMl, 0);
        const goal = Number((await db.settings.get("waterGoalMl"))?.value ?? 3500);
        if (totalMl >= goal) {
          lastWaterDateRef.current = today;
          await grantXP("water_goal");
        }
      }

      // ── Sleep ──────────────────────────────────────────────────────────────
      if (lastSleepDateRef.current !== today) {
        const sleepToday = await db.sleep.where("date").equals(today).first();
        if (sleepToday) {
          lastSleepDateRef.current = today;
          await grantXP("sleep");
        }
      }

      // ── Meals (capped at 5 per day) ────────────────────────────────────────
      const mealsToday = await db.meals.where("date").equals(today).toArray();
      const prevMealState = lastMealCountRef.current;
      const cappedNew = Math.min(mealsToday.length, 5) - (prevMealState.date === today ? prevMealState.count : 0);
      if (cappedNew > 0) {
        lastMealCountRef.current = { date: today, count: Math.min(mealsToday.length, 5) };
        for (let i = 0; i < cappedNew; i++) await grantXP("meal");
      }

      // ── Streak day ────────────────────────────────────────────────────────
      // Grant once per calendar day when the streak is ≥1.
      const streakGrantedKey = `xp-streak-${today}`;
      if (!localStorage.getItem(streakGrantedKey)) {
        const { computeUnifiedStreak } = await import("../lib/streak.utils");
        const streak = await computeUnifiedStreak();
        if (streak > 0) {
          localStorage.setItem(streakGrantedKey, "1");
          await grantXP("streak_day");
        }
      }

      // ── Discipline 80 / 100 ───────────────────────────────────────────────
      // Read from the dayScore cache — only grant once per day per threshold.
      try {
        const { computeTodayScore } = await import("../lib/todayScore");
        const waterGoal = Number((await db.settings.get("waterGoalMl"))?.value ?? 3500);
        const proteinTarget = Number((await db.settings.get("proteinTargetG"))?.value ?? 100);
        const scoreResult = await computeTodayScore(waterGoal, proteinTarget);
        if (scoreResult.score >= 100 && lastDiscipline100Ref.current !== today) {
          lastDiscipline100Ref.current = today;
          lastDiscipline80Ref.current = today; // also marks 80 so we don't double-grant
          await grantXP("discipline_100");
        } else if (scoreResult.score >= 80 && lastDiscipline80Ref.current !== today) {
          lastDiscipline80Ref.current = today;
          await grantXP("discipline_80");
        }
      } catch { /* computeTodayScore optional */ }

      // ── Level-up check ────────────────────────────────────────────────────
      const allEvents = await db.xpEvents.toArray();
      const totalXP = allEvents.reduce((s, e) => s + e.xp, 0);
      const newLevel = xpToLevel(totalXP);
      if (lastTotalRef.current !== null) {
        const oldLevel = xpToLevel(lastTotalRef.current);
        if (newLevel.level > oldLevel.level && onLevelUp) {
          onLevelUp(newLevel.level, newLevel.name);
        }
      }
      lastTotalRef.current = totalXP;
    });
    return unsub;
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
