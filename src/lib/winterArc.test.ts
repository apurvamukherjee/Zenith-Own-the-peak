import { test } from "node:test";
import assert from "node:assert/strict";
import { ARC_DAYS, DRILLS, drillFor, inArc, dayIndex, phaseOf } from "./winterArc.ts";

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
