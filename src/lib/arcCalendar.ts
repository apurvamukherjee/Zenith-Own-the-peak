import { ARC_START, ARC_END, dayIndex, shiftDate } from "./winterArc.ts";
import type { ArcDayKind } from "../db/types";

// Kolkata 2026 dates from panchang aggregators — can differ by a day from a
// Bengali panjika. Bhoot Chaturdashi (Nov 7) and UGC NET (Dec 14–19) are the
// least certain. ponytail: pinned to 2026, like the arc window itself.
export interface ArcDayTheme {
  date: string;
  title: string;
  copy: string;
  indoor?: boolean;          // AQI / fog — keep the drill inside
  excuseSunrise?: boolean;   // midnight puja → the sunrise rule passes itself
  quest?: { id: string; label: string };
  examPrompt?: boolean;
}

export const ARC_THEMES: ArcDayTheme[] = [
  { date: "2026-11-01", title: "First Frost", copy: "The final 61 starts today. Sign the vow, clear Day 1." },
  { date: "2026-11-07", title: "Choddo Shaak", copy: "Bhoot Chaturdashi — fourteen greens, or at least one with every meal.", quest: { id: "q-greens", label: "Greens with every meal" } },
  { date: "2026-11-08", title: "Lights Out", copy: "Kali Puja. Air quality tanks tonight — drill indoors, and before evening.", indoor: true },
  { date: "2026-11-09", title: "The Morning After", copy: "Midnight puja. The sunrise rule is excused — the drill isn't.", excuseSunrise: true },
  { date: "2026-11-11", title: "Bhai Phonta Feast", copy: "Eat. Calories are uncapped today; protein still counts. Log it honestly.", quest: { id: "q-feast", label: "Logged the feast honestly" } },
  { date: "2026-11-14", title: "Sugar Check", copy: "World Diabetes Day. One day, no added sugar.", quest: { id: "q-sugar", label: "No added sugar" } },
  { date: "2026-11-15", title: "Sunday Ride", copy: "Chhath evening. Morning ride or a brisk walk before the ghats get busy.", quest: { id: "q-ride", label: "Morning ride or brisk walk" } },
  { date: "2026-11-18", title: "Jagaddhatri", copy: "Chandannagar's lights are out tonight. Drill first, pandals after." },
  { date: "2026-11-19", title: "Gauntlet Closes", copy: "Last day of the festival stretch. 9 of 12 survives it." },
  { date: "2026-11-21", title: "Slump Guard", copy: "Day 21. This is where arcs die quietly. 40 to go." },
  { date: "2026-11-23", title: "CAT Week", copy: "CAT is Sunday. Exam Mode trims the noise.", examPrompt: true },
  { date: "2026-11-24", title: "Long Session", copy: "Guru Nanak Jayanti holiday — a bonus session or a long study block.", quest: { id: "q-long", label: "Bonus session or study block" } },
  { date: "2026-11-29", title: "CAT Day · Deload", copy: "Deload week opens. Half the drill, all of the habit." },
  { date: "2026-11-30", title: "Phase 1 Closes", copy: "Thirty days in. Tomorrow is a clean slate." },
  { date: "2026-12-01", title: "Second Wind", copy: "Phase 2. Old scars archived, three fresh reserves. Moa season — sweets get a budget, not a ban." },
  { date: "2026-12-14", title: "UGC NET Window", copy: "Exam week (dates tentative). Turn on Exam Mode if it's yours.", examPrompt: true },
  { date: "2026-12-16", title: "KIFF Week", copy: "Film festival evenings — drill in the morning." },
  { date: "2026-12-20", title: "Final 11", copy: "Late-December fog. Keep the drill indoors.", indoor: true },
  { date: "2026-12-24", title: "Cake Week", copy: "Cake is in the budget. So is the drill." },
  { date: "2026-12-25", title: "Park Street Pump", copy: "Christmas. Drill before you go out.", quest: { id: "q-pump", label: "Drill before going out" } },
  { date: "2026-12-27", title: "Taper", copy: "Volume halves. Intensity stays." },
  { date: "2026-12-30", title: "Final Trials", copy: "Retest everything. Compare with Day 1." },
  { date: "2026-12-31", title: "Close the Arc", copy: "Finish it before you go out tonight." },
];
export const themeFor = (date: string) => ARC_THEMES.find((t) => t.date === date);

// Nine Sunday-start chapters (Nov 1 2026 is a Sunday); the ninth runs 5 days.
export function chapterOf(date: string): { n: number; start: string; end: string } {
  const n = Math.floor(dayIndex(date) / 7) + 1;
  const start = shiftDate(ARC_START, (n - 1) * 7);
  const end = shiftDate(start, 6) > ARC_END ? ARC_END : shiftDate(start, 6);
  return { n, start, end };
}

// Dec 1 is exactly Day 31 — a fresh-start landmark (Dai, Milkman & Riis 2014):
// scars and reserves are counted per half.
export const SECOND_WIND = "2026-12-01";
export const halfStart = (date: string) => date >= SECOND_WIND ? SECOND_WIND : ARC_START;

// Early milestones are weighted heavier: 2→3 days is +50%, 200→201 is noise.
export const MILESTONES = [3, 7, 14, 21, 30, 45, 61];

export const GAUNTLET = { start: "2026-11-08", end: "2026-11-19", need: 9 };

export type ArcCellState = ArcDayKind | "owed" | "scar";
/** Frost-layer state for every arc day up to today: misses inside the open streak are still owed, older ones are scars. */
export function arcDayStates(rows: { date: string; kind: ArcDayKind }[], joined: string, today: string): Map<string, ArcCellState> {
  const out = new Map<string, ArcCellState>(rows.map((r) => [r.date, r.kind]));
  if (!joined) return out;
  const from = joined > ARC_START ? joined : ARC_START;
  let owed = true;
  for (let d = shiftDate(today, -1); d >= from; d = shiftDate(d, -1)) {
    if (out.has(d)) { owed = false; continue; }
    out.set(d, owed ? "owed" : "scar");
  }
  return out;
}

/** Exam Mode: a one-week window you arm yourself — WB exam dates slip too often to hardcode. */
export const inExam = (date: string, until: string) => !!until && date <= until;

export interface ArcBadgeFacts {
  kept: number; comebacks: number; clearedTwoDayDebt: boolean; gauntlet: number;
  lightsOut: boolean; secondWind: boolean; parkStreet: boolean; closed: boolean;
  decemberClean: boolean; wholeWinter: boolean; reservesUsed: number; blackIce: boolean; scars: number;
}

type BadgeRow = { date: string; kind: ArcDayKind; at: number };
/** Everything the Winter Arc badges read, from arcDays alone — so an unlock can't drift from what the calendar shows. */
export function arcBadgeFacts(rows: BadgeRow[], joined: string, reserves: number): ArcBadgeFacts {
  const by = new Map(rows.map((r) => [r.date, r]));
  const done = (d: string) => by.get(d)?.kind === "done";
  const from = joined > ARC_START ? joined : ARC_START;
  const isKept = (r: BadgeRow) => r.kind === "done" || r.kind === "repaired";
  let comebacks = 0, clearedTwoDayDebt = false;
  for (const r of rows) {
    if (r.kind !== "done") continue;
    const prev = shiftDate(r.date, -1);
    const p = by.get(prev);
    if (prev >= from && (!p || (p.kind !== "done" && p.kind !== "exempt" && p.at === r.at))) comebacks++;
    if (rows.filter((x) => x.kind === "repaired" && x.at === r.at).length >= 2) clearedTwoDayDebt = true;
  }
  const between = (a: string, b: string) => rows.filter((r) => r.date >= a && r.date <= b);
  const nov8 = by.get("2026-11-08");
  const states = arcDayStates(rows, joined, shiftDate(ARC_END, 1));
  return {
    kept: rows.filter(isKept).length,
    comebacks, clearedTwoDayDebt,
    gauntlet: between(GAUNTLET.start, GAUNTLET.end).filter(isKept).length,
    lightsOut: nov8?.kind === "done" && new Date(nov8.at).getHours() < 18,
    secondWind: done(SECOND_WIND),
    parkStreet: done("2026-12-25"),
    closed: done(ARC_END),
    decemberClean: between(SECOND_WIND, ARC_END).filter((r) => r.kind === "done" || r.kind === "exempt").length === 31,
    wholeWinter: between(ARC_START, ARC_END).filter((r) => r.kind !== "reserve").length === 61,
    reservesUsed: rows.filter((r) => r.kind === "reserve").length,
    blackIce: reserves === 0,
    scars: [...states.values()].filter((s) => s === "scar").length,
  };
}
