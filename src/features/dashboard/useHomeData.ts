import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import type { TaskDto, TaskListDto, WorkoutDayDto } from "../../db/types";
import { computeTodayScore } from "../../lib/todayScore";
import { computeUnifiedStreak, isFreezeAvailable } from "../../lib/streak.utils";
import { computeScoresForMonth, type DayMetrics } from "../../lib/dayScore";
import { lastNDates, todayKey } from "../../lib/date.utils";

// Home stays mounted for hours on a phone; time-of-day copy, the agenda's
// "now" line and the pace math all need a tick, not just data changes.
export function useClock(ms = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
}

export function useSetsTodayCount() {
  const date = todayKey();
  return useLiveQuery(() => db.workoutSets.where("date").equals(date).count(), [date]) ?? 0;
}

// computeTodayScore only reads Dexie, so wrapping it in a live query keeps the
// ring current on every meal/sleep/set write — not just the water writes the
// old effect-based version happened to depend on. Undefined while loading.
export function useTodayScore(waterGoal: number, proteinTarget: number) {
  return useLiveQuery(() => computeTodayScore(waterGoal, proteinTarget), [waterGoal, proteinTarget]);
}

export function useStreak() {
  return useLiveQuery(() => computeUnifiedStreak(), []) ?? 0;
}

export function useFreezeAvailable() {
  const today = todayKey();
  return useLiveQuery(() => isFreezeAvailable(today), [today]) ?? false;
}

export interface WeekDot extends DayMetrics { date: string; isToday: boolean }

export function useLast7(waterGoal: number, proteinTarget: number): WeekDot[] {
  const dates = lastNDates(7);
  const today = dates[dates.length - 1];
  return useLiveQuery(async () => {
    const map = await computeScoresForMonth(dates, waterGoal, proteinTarget);
    return dates.map((date) => {
      const m = map.get(date);
      return {
        date, isToday: date === today,
        score: m?.score ?? 0, hasAny: m?.hasAny ?? false, waterPct: m?.waterPct ?? 0,
        sessionDone: m?.sessionDone ?? false, sleepLogged: m?.sleepLogged ?? false, proteinPct: m?.proteinPct ?? 0,
      };
    });
  }, [today, waterGoal, proteinTarget]) ?? [];
}

export interface TrainingToday {
  day: WorkoutDayDto | null;
  exercises: number;
  totalSets: number;
  doneSets: number;
  estMin: number;
  /** Next scheduled training day when today is rest. */
  next: { name: string; weekday: number } | null;
}

export function useTrainingToday(): TrainingToday | undefined {
  const date = todayKey();
  return useLiveQuery(async () => {
    const wd = new Date().getDay();
    const schedule = await db.weekSchedule.toArray();
    const dayId = schedule.find((s) => s.weekday === wd)?.dayId;
    const day = dayId ? (await db.workoutDays.get(dayId)) ?? null : null;
    if (!day?.id) {
      let next: TrainingToday["next"] = null;
      for (let i = 1; i <= 7 && !next; i++) {
        const w = (wd + i) % 7;
        const id = schedule.find((s) => s.weekday === w)?.dayId;
        const d = id ? await db.workoutDays.get(id) : undefined;
        if (d) next = { name: d.name, weekday: w };
      }
      return { day: null, exercises: 0, totalSets: 0, doneSets: 0, estMin: 0, next };
    }
    const [plan, session] = await Promise.all([
      db.dayExercises.where({ dayId: day.id }).toArray(),
      db.workoutSessions.where({ date, dayId: day.id }).first(),
    ]);
    const doneSets = session?.id ? await db.workoutSets.where({ sessionId: session.id }).count() : 0;
    const totalSets = plan.reduce((s, e) => s + e.sets, 0);
    // ~40s under the bar per set plus its programmed rest.
    const estMin = Math.round(plan.reduce((s, e) => s + e.sets * (40 + e.restSec), 0) / 60);
    return { day, exercises: plan.length, totalSets, doneSets, estMin, next: null };
  }, [date]);
}

export function useTodayMacros() {
  const date = todayKey();
  return useLiveQuery(async () => {
    const meals = await db.meals.where({ date }).toArray();
    return meals.reduce(
      (a, m) => ({ protein: a.protein + m.protein, carbs: a.carbs + (m.carbsG ?? 0), fat: a.fat + (m.fatG ?? 0), kcal: a.kcal + m.calories }),
      { protein: 0, carbs: 0, fat: 0, kcal: 0 },
    );
  }, [date]) ?? { protein: 0, carbs: 0, fat: 0, kcal: 0 };
}

export function useLastSleep() {
  return useLiveQuery(() => db.sleep.orderBy("date").last(), []);
}

export function useStudyToday() {
  const date = todayKey();
  return useLiveQuery(async () => {
    const [sessions, items] = await Promise.all([
      db.studySessions.where("date").equals(date).toArray(),
      db.studyItems.where("status").notEqual("done").sortBy("order"),
    ]);
    return { minutes: sessions.reduce((s, x) => s + x.minutes, 0), next: items[0]?.title ?? null };
  }, [date]) ?? { minutes: 0, next: null };
}

export interface AgendaItem extends TaskDto { list?: TaskListDto }

export function useTodayAgenda() {
  const date = todayKey();
  return useLiveQuery(async () => {
    const [rows, lists] = await Promise.all([
      db.tasks.where("date").equals(date).toArray(),
      db.taskLists.toArray(),
    ]);
    const byId = new Map(lists.map((l) => [l.id, l]));
    return rows
      .filter((r) => r.status !== "cancelled")
      .map((r): AgendaItem => ({ ...r, list: byId.get(r.listId) }))
      .sort((a, b) => (a.allDay ? "" : a.time ?? "99:99").localeCompare(b.allDay ? "" : b.time ?? "99:99"));
  }, [date]);
}
