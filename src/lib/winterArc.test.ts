import { test } from "node:test";
import assert from "node:assert/strict";
import { ARC_DAYS, inArc, dayIndex, phaseOf } from "./winterArc.ts";

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
