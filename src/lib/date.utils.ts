import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(isoWeek);
dayjs.extend(customParseFormat);

export function todayKey(d: Date = new Date()): string {
  return dayjs(d).format("YYYY-MM-DD");
}

// ISO week key like 2026-W28, used to group sessions by training week.
export function weekKey(d: Date = new Date()): string {
  const dj = dayjs(d);
  return `${dj.isoWeekYear()}-W${String(dj.isoWeek()).padStart(2, "0")}`;
}

export function prettyDate(iso: string): string {
  return dayjs(iso).format("ddd, D MMM");
}

// Minutes between a bedtime and wake time (handles crossing midnight).
export function sleepDurationMin(sleepAt: string, wakeAt: string): number {
  const [sh, sm] = sleepAt.split(":").map(Number);
  const [wh, wm] = wakeAt.split(":").map(Number);
  let start = sh * 60 + sm;
  let end = wh * 60 + wm;
  if (end <= start) end += 24 * 60; // slept past midnight
  return end - start;
}

export function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function lastNDates(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    out.push(todayKey(x));
  }
  return out;
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7); // YYYY-MM
}

// Consecutive-day streak ending today (or yesterday, as grace) from a set of dates.
export function consecutiveStreak(dates: string[]): number {
  const set = new Set(dates);
  let streak = 0;
  const d = new Date();
  if (!set.has(todayKey(d))) d.setDate(d.getDate() - 1);
  while (set.has(todayKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
