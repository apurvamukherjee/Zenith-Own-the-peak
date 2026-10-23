import { test } from "node:test";
import assert from "node:assert/strict";
import { BOSSES, bossFor, trialOpen, murphPlan, wraithHp, WRAITH_HP } from "./arcBosses.ts";

test("one boss per chapter except Trials week and the deload", () => {
  assert.equal(bossFor("2026-11-03"), undefined);
  assert.equal(bossFor("2026-11-08")?.id, "lights-out-deck");
  assert.equal(bossFor("2026-11-14")?.id, "lights-out-deck");
  assert.equal(bossFor("2026-11-29"), undefined);
  assert.equal(bossFor("2026-12-31")?.id, "big-3");
  assert.equal(new Set(BOSSES.map((b) => b.chapter)).size, BOSSES.length);
  for (const b of BOSSES) if (b.rematchOf && !b.rematchOf.startsWith("trial:")) assert.ok(BOSSES.some((x) => x.id === b.rematchOf));
});

test("trials open on Day 1, Day 31 and Dec 30", () => {
  assert.equal(trialOpen("2026-11-01")?.n, 1);
  assert.equal(trialOpen("2026-11-08"), undefined);
  assert.equal(trialOpen("2026-12-05")?.n, 2);
  assert.equal(trialOpen("2026-12-31")?.n, 3);
});

test("hostel Murph scales by tier and swaps squats after leg day", () => {
  assert.deepEqual(murphPlan("half", false).map((m) => m.amount), ["50", "100", "25"]);
  assert.equal(murphPlan("full", true)[1].move, "Plank (any split)");
});

test("the Wraith: kept days and bosses hit it, scars heal it", () => {
  assert.equal(wraithHp(0, 0, 0), WRAITH_HP);
  assert.equal(wraithHp(55, 6, 0), 0);
  assert.equal(wraithHp(10, 1, 3), 53);
  assert.equal(wraithHp(0, 0, 5), WRAITH_HP + 5);
});
