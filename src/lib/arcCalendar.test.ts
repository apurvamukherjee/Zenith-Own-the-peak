import { test } from "node:test";
import assert from "node:assert/strict";
import { ARC_THEMES, chapterOf, halfStart, themeFor } from "./arcCalendar.ts";
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
