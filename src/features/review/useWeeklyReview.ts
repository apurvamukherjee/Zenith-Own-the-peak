import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { useSetting } from "../../hooks/useSettings";
import { lastNDates } from "../../lib/date.utils";

export interface Insight { emoji: string; text: string; good: boolean; }
export interface ReviewStat { key: string; label: string; value: number; decimals: number; suffix?: string; prefix?: string; deltaPct: number | null; }

function pctDelta(cur: number, prev: number): number | null {
  if (prev <= 0) return cur > 0 ? 100 : null;
  return Math.round(((cur - prev) / prev) * 100);
}

export function useWeeklyReview() {
  const proteinDefault = useSetting("proteinTargetG");
  const waterGoal = useSetting("waterGoalMl");
  const sleepTarget = useSetting("sleepTargetMin");

  return useLiveQuery(async () => {
    const d14 = lastNDates(14);
    const prev = new Set(d14.slice(0, 7));
    const cur = new Set(d14.slice(7));
    const inCur = (date: string) => cur.has(date);
    const inPrev = (date: string) => prev.has(date);

    const [sets, sessions, meals, sleep, study, fuel, water, bw] = await Promise.all([
      db.workoutSets.toArray(), db.workoutSessions.toArray(), db.meals.toArray(),
      db.sleep.toArray(), db.studySessions.toArray(), db.fuel.toArray(),
      db.water.toArray(), db.bodyweight.orderBy("date").last(),
    ]);
    const proteinTarget = bw?.kg ? Math.round(bw.kg * 1.8) : proteinDefault;

    const vol = (pred: (d: string) => boolean) =>
      sets.filter((s) => pred(s.date)).reduce((sum, s) => sum + s.weightKg * s.reps, 0);
    const studyMin = (pred: (d: string) => boolean) =>
      study.filter((s) => pred(s.date)).reduce((sum, s) => sum + s.minutes, 0);
    const spent = (pred: (d: string) => boolean) =>
      fuel.filter((f) => pred(f.date)).reduce((sum, f) => sum + f.cost, 0);

    // protein hit-rate this week
    const curDates = d14.slice(7);
    const proteinByDay = curDates.map((day) => meals.filter((m) => m.date === day).reduce((s, m) => s + m.protein, 0));
    const daysWithMeals = proteinByDay.filter((p) => p > 0).length;
    const proteinHits = proteinByDay.filter((p) => p >= proteinTarget).length;

    // sleep this/prev week
    const avgSleepFor = (pred: (d: string) => boolean) => {
      const rows = sleep.filter((s) => pred(s.date));
      return rows.length ? Math.round(rows.reduce((s, e) => s + e.durationMin, 0) / rows.length) : 0;
    };
    const avgSleepCur = avgSleepFor(inCur);
    const nightsLogged = sleep.filter((s) => inCur(s.date)).length;

    // water adherence
    const waterHitDays = curDates.filter((day) =>
      water.filter((w) => w.date === day).reduce((s, w) => s + w.amountMl, 0) >= waterGoal).length;

    const stats: ReviewStat[] = [
      { key: "volume", label: "Training volume", value: vol(inCur), decimals: 0, suffix: " kg", deltaPct: pctDelta(vol(inCur), vol(inPrev)) },
      { key: "sessions", label: "Sessions", value: sessions.filter((s) => inCur(s.date)).length, decimals: 0, deltaPct: pctDelta(sessions.filter((s) => inCur(s.date)).length, sessions.filter((s) => inPrev(s.date)).length) },
      { key: "prs", label: "New PRs", value: sets.filter((s) => inCur(s.date) && s.isPR).length, decimals: 0, deltaPct: null },
      { key: "protein", label: "Protein days hit", value: proteinHits, decimals: 0, suffix: `/${daysWithMeals || 7}`, deltaPct: null },
      { key: "sleep", label: "Avg sleep", value: avgSleepCur / 60, decimals: 1, suffix: " h", deltaPct: pctDelta(avgSleepCur, avgSleepFor(inPrev)) },
      { key: "study", label: "Study time", value: studyMin(inCur), decimals: 0, suffix: " min", deltaPct: pctDelta(studyMin(inCur), studyMin(inPrev)) },
      { key: "water", label: "Water goal days", value: waterHitDays, decimals: 0, suffix: "/7", deltaPct: null },
      { key: "spent", label: "Fuel spend", value: spent(inCur), decimals: 0, prefix: "₹", deltaPct: pctDelta(spent(inCur), spent(inPrev)) },
    ];

    // ---- Insights (guarded) ----
    const insights: Insight[] = [];

    // 1) sleep -> lifting performance
    const topByDate = new Map<string, number>();
    for (const s of sets) topByDate.set(s.date, Math.max(topByDate.get(s.date) ?? 0, s.e1rm));
    const sleepByDate = new Map(sleep.map((s) => [s.date, s.durationMin]));
    const well: number[] = [], poor: number[] = [];
    for (const [date, e1rm] of topByDate) {
      const slept = sleepByDate.get(date);
      if (slept == null) continue;
      (slept >= 420 ? well : poor).push(e1rm);
    }
    if (well.length >= 2 && poor.length >= 2) {
      const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
      const diff = Math.round(((avg(well) - avg(poor)) / avg(poor)) * 100);
      if (diff >= 3) insights.push({ emoji: "😴", text: `Your top lifts run ~${diff}% heavier on 7h+ sleep nights. Sleep is a lever, not a luxury.`, good: true });
      else if (diff <= -3) insights.push({ emoji: "🤔", text: `Oddly, recent lifts didn't drop on short-sleep nights — but the trend usually catches up. Protect your sleep.`, good: false });
    }

    // 2) protein consistency
    if (daysWithMeals > 0) {
      const good = proteinHits >= Math.ceil(daysWithMeals * 0.7);
      insights.push({ emoji: good ? "💪" : "🍗", good,
        text: good
          ? `You hit ~${proteinTarget}g protein on ${proteinHits}/${daysWithMeals} logged days. That's the growth foundation.`
          : `Protein target hit only ${proteinHits}/${daysWithMeals} days. At ~50kg building mass, this is your #1 fix.` });
    }

    // 3) sleep debt
    if (nightsLogged >= 3 && avgSleepCur > 0 && avgSleepCur < sleepTarget - 30) {
      const shortM = sleepTarget - avgSleepCur;
      insights.push({ emoji: "🌙", good: false, text: `Averaging ${(avgSleepCur / 60).toFixed(1)}h — about ${Math.round(shortM)} min under target most nights. Recovery is capping your gains.` });
    }

    // 4) study consistency
    const studyDays = new Set(study.filter((s) => inCur(s.date)).map((s) => s.date)).size;
    if (studyDays > 0) insights.push({ emoji: "📚", good: studyDays >= 4, text: `You studied on ${studyDays} of 7 days. ${studyDays >= 4 ? "Consistency compounds." : "Aim for one more day next week."}` });

    // 5) training trend
    const vDelta = pctDelta(vol(inCur), vol(inPrev));
    if (vDelta != null && Math.abs(vDelta) >= 8)
      insights.push({ emoji: vDelta > 0 ? "📈" : "📉", good: vDelta > 0,
        text: vDelta > 0 ? `Training volume up ${vDelta}% on last week — progressive overload is working.` : `Volume down ${Math.abs(vDelta)}% vs last week. A deload is fine if intended — otherwise push.` });

    if (insights.length === 0)
      insights.push({ emoji: "🌱", good: true, text: "Log a few more days and Zenith will start surfacing patterns across your sleep, food and lifts." });

    return { stats, insights, proteinTarget };
  }, [proteinDefault, waterGoal, sleepTarget]);
}
