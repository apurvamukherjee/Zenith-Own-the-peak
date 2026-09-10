// The Compass — deterministic, non-AI correlation insights over already-
// computed daily metrics. Every rule requires a minimum sample size per
// bucket before it's allowed to surface (no misleading small-N stats), and
// nothing here calls an LLM or any network service — it's fixed statistics
// over local data, same spirit as the hand-rolled sleep→lift insight in
// useWeeklyReview.ts, just generalized and run over a longer window.

export interface CompassInsight { text: string; good: boolean; }

export interface CompassRow {
  date: string;
  score: number; waterPct: number; proteinPct: number; sessionDone: boolean;
  sleepAt?: string;   // "HH:mm", absent if sleep wasn't logged that day
  hasFuel: boolean;   // a fuel/fill-up was logged that day (proxy for a travel/errand day)
}

const MIN_BUCKET = 5;      // minimum days per side of a comparison
const MIN_DELTA_PCT = 3;   // ignore noise below this magnitude

function mean(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

// Same percentage-difference-of-means formula useWeeklyReview.ts already
// uses for its sleep→lift insight, for consistency of tone.
function pctDiff(a: number, b: number): number {
  if (b <= 0) return 0;
  return Math.round(((a - b) / b) * 100);
}

type Rule = (rows: CompassRow[]) => { insight: CompassInsight; magnitude: number } | null;

const sleepTimeRule: Rule = (rows) => {
  const early: number[] = [], late: number[] = [];
  for (const r of rows) {
    if (!r.sleepAt) continue;
    (r.sleepAt <= "23:00" ? early : late).push(r.score);
  }
  if (early.length < MIN_BUCKET || late.length < MIN_BUCKET) return null;
  const diff = pctDiff(mean(early), mean(late));
  if (Math.abs(diff) < MIN_DELTA_PCT) return null;
  const insight = diff > 0
    ? { text: `Your discipline score runs ~${diff}% higher on days you're asleep by 11pm.`, good: true }
    : { text: `Discipline dips ~${Math.abs(diff)}% on nights you sleep after 11pm.`, good: false };
  return { insight, magnitude: Math.abs(diff) };
};

const fuelDayRule: Rule = (rows) => {
  const fuelDays: number[] = [], normalDays: number[] = [];
  for (const r of rows) (r.hasFuel ? fuelDays : normalDays).push(r.proteinPct);
  if (fuelDays.length < MIN_BUCKET || normalDays.length < MIN_BUCKET) return null;
  const diff = pctDiff(mean(fuelDays), mean(normalDays));
  if (diff >= -MIN_DELTA_PCT) return null; // only surface a genuine miss pattern
  return {
    insight: { text: `Protein runs ~${Math.abs(diff)}% lower on days you fill up on fuel — worth planning a meal around those errands.`, good: false },
    magnitude: Math.abs(diff),
  };
};

const trainingDayRule: Rule = (rows) => {
  const train: number[] = [], rest: number[] = [];
  for (const r of rows) (r.sessionDone ? train : rest).push(r.waterPct);
  if (train.length < MIN_BUCKET || rest.length < MIN_BUCKET) return null;
  const diff = pctDiff(mean(train), mean(rest));
  if (Math.abs(diff) < MIN_DELTA_PCT) return null;
  const insight = diff > 0
    ? { text: `You hydrate ~${diff}% better on training days than rest days.`, good: true }
    : { text: `Water intake drops ~${Math.abs(diff)}% on rest days — training seems to be what reminds you to drink.`, good: false };
  return { insight, magnitude: Math.abs(diff) };
};

const weekdayWeekendRule: Rule = (rows) => {
  const weekday: number[] = [], weekend: number[] = [];
  for (const r of rows) {
    const dow = new Date(r.date + "T00:00").getDay();
    (dow === 0 || dow === 6 ? weekend : weekday).push(r.score);
  }
  if (weekday.length < MIN_BUCKET || weekend.length < MIN_BUCKET) return null;
  const diff = pctDiff(mean(weekday), mean(weekend));
  if (Math.abs(diff) < MIN_DELTA_PCT) return null;
  const insight = diff > 0
    ? { text: `Weekday discipline runs ~${diff}% higher than weekends — worth a lighter weekend routine to close the gap.`, good: false }
    : { text: `Weekends run ~${Math.abs(diff)}% higher discipline than weekdays.`, good: true };
  return { insight, magnitude: Math.abs(diff) };
};

const RULES: Rule[] = [sleepTimeRule, fuelDayRule, trainingDayRule, weekdayWeekendRule];

// Runs every rule, drops ones without enough data, returns up to `limit`
// insights ranked by effect size (largest first).
export function computeCompassInsights(rows: CompassRow[], limit = 3): CompassInsight[] {
  const hits = RULES.map((rule) => rule(rows)).filter((h): h is NonNullable<typeof h> => h !== null);
  hits.sort((a, b) => b.magnitude - a.magnitude);
  return hits.slice(0, limit).map((h) => h.insight);
}
