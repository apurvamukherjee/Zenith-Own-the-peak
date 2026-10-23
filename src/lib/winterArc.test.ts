import { test } from "node:test";
import assert from "node:assert/strict";
import { ARC_DAYS, DRILLS, RECOVERY, drillFor, minimumOf, missedStreak, settle, inArc, dayIndex, phaseOf } from "./winterArc.ts";

const def = (name: string) => DRILLS.find((x) => x.name === name)!;
const nov = (d: number) => `2026-11-${String(d).padStart(2, "0")}`;

test("arc runs Nov 1 → Dec 31", () => {
  assert.equal(ARC_DAYS, 61);
  assert.ok(inArc("2026-11-01") && inArc("2026-12-31"));
  assert.ok(!inArc("2026-10-31") && !inArc("2027-01-01"));
  assert.equal(dayIndex("2026-12-01"), 30);
});

test("phases: deload days 29–35, taper 57–60, finale 61", () => {
  assert.equal(phaseOf(nov(1)), "calibration");
  assert.equal(phaseOf(nov(28)), "build");
  assert.equal(phaseOf(nov(29)), "deload");
  assert.equal(phaseOf("2026-12-05"), "deload");
  assert.equal(phaseOf("2026-12-27"), "taper");
  assert.equal(phaseOf("2026-12-31"), "finale");
});

test("same date → same drill; first cycle never repeats", () => {
  assert.deepEqual(drillFor(nov(7)), drillFor(nov(7)));
  const names = Array.from({ length: DRILLS.length }, (_, i) => drillFor(nov(i + 1)).name);
  assert.equal(new Set(names).size, DRILLS.length);
});

test("target ramps from → to; deload halves it", () => {
  assert.equal(drillFor(nov(1)).base, def(drillFor(nov(1)).name).from);
  assert.equal(drillFor("2026-12-31").base, def(drillFor("2026-12-31").name).to);
  const d = drillFor(nov(30));
  const ramp = def(d.name).from + (def(d.name).to - def(d.name).from) * 29 / 60;
  assert.ok(d.base <= Math.ceil(ramp / 2) + 5);
});

test("avoids muscles trained today", () => {
  for (let i = 1; i <= 30; i++) {
    const m = def(drillFor(nov(i), 0, ["chest", "triceps", "shoulders"]).name).muscle;
    assert.ok(!["chest", "triceps", "shoulders"].includes(m), nov(i));
  }
});

test("debt adds 50% per missed day, capped at 2 days and 1.5× the peak", () => {
  for (let i = 4; i <= 28; i++) {
    const d0 = drillFor(nov(i));
    const d9 = drillFor(nov(i), 9);
    assert.equal(d9.debtDays, 2);
    assert.ok(d9.target <= Math.round(def(d0.name).to * 1.5 / 5) * 5 + 5);
    assert.ok(d9.target >= d0.base);
  }
});

test("sore/wrecked swap to recovery; minimum is half base and repays nothing", () => {
  assert.deepEqual(drillFor(nov(10), 2, [], "sore"), RECOVERY);
  const m = minimumOf(drillFor(nov(10), 2));
  assert.equal(m.debtDays, 0);
  assert.equal(m.kind, "minimum");
  assert.ok(m.target <= drillFor(nov(10)).base);
});

test("missed streak counts back to the last covered day, never before join/start", () => {
  const covered = new Set([nov(3)]);
  assert.equal(missedStreak(nov(6), covered, "2026-10-25"), 2);
  assert.equal(missedStreak(nov(3), covered, "2026-10-25"), 2);
  assert.equal(missedStreak(nov(6), new Set(), nov(5)), 1);
  assert.equal(missedStreak(nov(6), new Set(), nov(6)), 0);
  assert.equal(missedStreak(nov(1), new Set(), "2026-10-20"), 0);
});

test("settle: debt repairs nearest days, reserves cover next, rest are scars", () => {
  assert.deepEqual(settle(nov(10), 4, 2, 1), [
    { date: nov(9), kind: "repaired" }, { date: nov(8), kind: "repaired" }, { date: nov(7), kind: "reserve" },
  ]);
  assert.deepEqual(settle(nov(10), 1, 0, 0), []);
  assert.deepEqual(settle(nov(10), 2, 0, 3), [{ date: nov(9), kind: "reserve" }, { date: nov(8), kind: "reserve" }]);
});
