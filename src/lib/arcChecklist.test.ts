import { test } from "node:test";
import assert from "node:assert/strict";
import { checklist, sunriseMin, type ArcFacts } from "./arcChecklist.ts";

const none: ArcFacts = { drill: false, training: false, protein: false, water: false, sleep: false, studyMin: 0 };
const all: ArcFacts = { drill: true, training: true, protein: true, water: true, sleep: true, wakeMin: 300, studyMin: 90 };

test("sunrise drifts 5:40 → 6:16 across the arc", () => {
  assert.equal(sunriseMin("2026-11-01"), 340);
  assert.equal(sunriseMin("2026-12-31"), 376);
  assert.ok(sunriseMin("2026-12-01") > 340 && sunriseMin("2026-12-01") < 376);
});

test("five auto items plus up to three rules, scored 0–100", () => {
  assert.equal(checklist("2026-11-05", none, [], []).score, 0);
  assert.equal(checklist("2026-11-05", all, [], []).score, 100);
  const c = checklist("2026-11-05", all, ["sunrise", "study", "cold", "read"], []);
  assert.equal(c.items.length, 8);
  assert.equal(c.score, 88); // 7/8, cold not ticked; "read" is past the 3-rule cap
});

test("auto rules tick from logs; manual rules from ticks", () => {
  const late = { ...all, wakeMin: 400, studyMin: 30 };
  const c = checklist("2026-11-05", late, ["sunrise", "study", "cold"], ["cold"]);
  assert.deepEqual(c.items.slice(5).map((i) => i.done), [false, false, true]);
  assert.equal(checklist("2026-11-05", { ...all, wakeMin: undefined }, ["sunrise"], []).items[5].done, false);
});
