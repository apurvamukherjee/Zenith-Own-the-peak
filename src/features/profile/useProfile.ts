import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { consecutiveStreak, lastNDates, todayKey } from "../../lib/date.utils";
import { volumeLoad } from "../../lib/workout.utils";
import { DEFAULTS } from "../../hooks/useSettings";

export function useProfileStats() {
  return useLiveQuery(async () => {
    const [sessions, sets, water, sleep, items, sessionsStudy, fuel, bw, settings] =
      await Promise.all([
        db.workoutSessions.toArray(), db.workoutSets.toArray(), db.water.toArray(),
        db.sleep.toArray(), db.studyItems.toArray(), db.studySessions.toArray(),
        db.fuel.toArray(), db.bodyweight.toArray(), db.settings.toArray(),
      ]);

    const setting = (k: string, d: number) => Number(settings.find((s) => s.key === k)?.value ?? d);
    const waterGoal = setting("waterGoalMl", DEFAULTS.waterGoalMl);
    const sleepTarget = setting("sleepTargetMin", DEFAULTS.sleepTargetMin);

    // Gym
    const workoutDates = [...new Set(sets.map((s) => s.date))];
    const gym = {
      sessions: sessions.length,
      totalSets: sets.length,
      volume: volumeLoad(sets),
      prs: sets.filter((s) => s.isPR).length,
      streak: consecutiveStreak(workoutDates),
      bestE1rm: sets.reduce((m, s) => Math.max(m, s.e1rm), 0),
    };

    // Study
    const study = {
      paths: new Set(items.map((i) => i.pathId)).size,
      topicsDone: items.filter((i) => i.status === "done").length,
      topicsTotal: items.length,
      pct: items.length ? Math.round((items.filter((i) => i.status === "done").length / items.length) * 100) : 0,
      totalMin: sessionsStudy.reduce((s, x) => s + x.minutes, 0),
    };

    // Sleep (7-day)
    const week = lastNDates(7);
    const wk = sleep.filter((s) => week.includes(s.date));
    const sleepStats = {
      avgMin: wk.length ? Math.round(wk.reduce((s, e) => s + e.durationMin, 0) / wk.length) : 0,
      avgQuality: wk.length ? +(wk.reduce((s, e) => s + e.quality, 0) / wk.length).toFixed(1) : 0,
      debtMin: wk.reduce((s, e) => s + Math.max(0, sleepTarget - e.durationMin), 0),
      logged: wk.length,
    };

    // Water (7-day adherence + today + streak)
    const byDate = (d: string) => water.filter((w) => w.date === d).reduce((s, w) => s + w.amountMl, 0);
    const goalDates = week.filter((d) => byDate(d) >= waterGoal);
    const waterStats = {
      todayPct: Math.min(100, Math.round((byDate(todayKey()) / waterGoal) * 100)),
      adherence: Math.round((goalDates.length / 7) * 100),
      streak: consecutiveStreak(goalDates),
    };

    // Fuel
    const sortedFuel = [...fuel].sort((a, b) => a.odometer - b.odometer);
    const mileages: number[] = [];
    for (let i = 1; i < sortedFuel.length; i++) {
      const dist = sortedFuel[i].odometer - sortedFuel[i - 1].odometer;
      if (sortedFuel[i].litres > 0) mileages.push(dist / sortedFuel[i].litres);
    }
    const totalKm = sortedFuel.length > 1 ? sortedFuel[sortedFuel.length - 1].odometer - sortedFuel[0].odometer : 0;
    const totalCost = fuel.reduce((s, f) => s + f.cost, 0);
    const thisMonth = todayKey().slice(0, 7);
    const fuelStats = {
      avgMileage: mileages.length ? +(mileages.reduce((a, b) => a + b, 0) / mileages.length).toFixed(1) : 0,
      monthSpend: fuel.filter((f) => f.date.slice(0, 7) === thisMonth).reduce((s, f) => s + f.cost, 0),
      costPerKm: totalKm > 0 ? +(totalCost / totalKm).toFixed(2) : 0,
      totalKm,
    };

    // Bodyweight
    const bwSorted = [...bw].sort((a, b) => a.date.localeCompare(b.date));
    const bodyweight = {
      latest: bwSorted.length ? bwSorted[bwSorted.length - 1].kg : 0,
      change30: change30d(bwSorted),
      series: bwSorted.map((b) => ({ label: b.date.slice(5), kg: b.kg })),
    };

    return { gym, study, sleep: sleepStats, water: waterStats, fuel: fuelStats, bodyweight };
  }, []);
}

function change30d(bw: { date: string; kg: number }[]): number {
  if (bw.length < 2) return 0;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const key = cutoff.toISOString().slice(0, 10);
  const past = bw.filter((b) => b.date <= key).pop() ?? bw[0];
  return +(bw[bw.length - 1].kg - past.kg).toFixed(1);
}

export async function logBodyweight(kg: number) {
  await db.bodyweight.put({ date: todayKey(), kg });
}
