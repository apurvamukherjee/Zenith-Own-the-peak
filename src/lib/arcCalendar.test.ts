import { test } from "node:test";
import assert from "node:assert/strict";
import { ARC_THEMES, chapterOf, halfStart, arcDayStates, inExam, themeFor, arcBadgeFacts } from "./arcCalendar.ts";
import { inArc } from "./winterArc.ts";

test("themes are unique, sorted and inside the arc", () => {
  const dates = ARC_THEMES.map((t) => t.date);
  assert.deepEqual(dates, [...dates].sort());
  assert.equal(new Set(dates).size, dates.length);
  assert.ok(dates.every(inArc));
  assert.ok(themeFor("2026-11-08")?.indoor);
  assert.ok(themeFor("2026-11-09")?.excuseSunrise);
});

test("nine Sunday-start chapters, the last one 5 days", () => {
  assert.deepEqual(chapterOf("2026-11-01"), { n: 1, start: "2026-11-01", end: "2026-11-07" });
  assert.deepEqual(chapterOf("2026-11-08"), { n: 2, start: "2026-11-08", end: "2026-11-14" });
  assert.deepEqual(chapterOf("2026-12-31"), { n: 9, start: "2026-12-27", end: "2026-12-31" });
});

test("Second Wind splits the arc on Dec 1", () => {
  assert.equal(halfStart("2026-11-30"), "2026-11-01");
  assert.equal(halfStart("2026-12-01"), "2026-12-01");
});

test("frost states: open misses are owed, older ones scars, nothing before joining", () => {
  const rows = [{ date: "2026-11-03", kind: "done" as const }, { date: "2026-11-06", kind: "exempt" as const }];
  const s = arcDayStates(rows, "2026-11-02", "2026-11-09");
  assert.equal(s.get("2026-11-01"), undefined);
  assert.equal(s.get("2026-11-02"), "scar");
  assert.equal(s.get("2026-11-04"), "scar");
  assert.equal(s.get("2026-11-06"), "exempt");
  assert.equal(s.get("2026-11-07"), "owed");
  assert.equal(s.get("2026-11-08"), "owed");
  assert.equal(s.get("2026-11-09"), undefined);
  assert.equal(arcDayStates(rows, "", "2026-11-09").get("2026-11-04"), undefined);
});

test("exam mode runs through its end date", () => {
  assert.ok(inExam("2026-11-25", "2026-11-29"));
  assert.ok(!inExam("2026-11-30", "2026-11-29"));
  assert.ok(!inExam("2026-11-25", ""));
});

test("badge facts: comebacks, two-day debt, gauntlet, Kali Puja before evening", () => {
  const at = (d: string, h: number) => new Date(`${d}T${String(h).padStart(2, "0")}:00`).getTime();
  const t = at("2026-11-10", 9);
  const rows = [
    { date: "2026-11-01", kind: "done" as const, at: at("2026-11-01", 8) },
    { date: "2026-11-03", kind: "done" as const, at: at("2026-11-03", 8) },   // after a scar → comeback
    { date: "2026-11-08", kind: "done" as const, at: at("2026-11-08", 17) },  // after scars → comeback
    { date: "2026-11-09", kind: "repaired" as const, at: t },
    { date: "2026-11-10", kind: "done" as const, at: t },                     // repaired yesterday → comeback
  ];
  const f = arcBadgeFacts(rows, "2026-10-28", 3);
  assert.equal(f.kept, 5);
  assert.equal(f.comebacks, 3);
  assert.equal(f.lightsOut, true);
  assert.equal(f.gauntlet, 3);
  assert.equal(f.clearedTwoDayDebt, false);
  const twoDay = rows.map((r) => r.date === "2026-11-08" ? { ...r, kind: "repaired" as const, at: t } : r);
  assert.equal(arcBadgeFacts(twoDay, "2026-10-28", 3).clearedTwoDayDebt, true);
  assert.equal(f.blackIce, false);
  assert.ok(f.scars > 0 && !f.closed && !f.wholeWinter);
});
