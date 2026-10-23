import { test } from "node:test";
import assert from "node:assert/strict";
import { personaFor, trialDeltas } from "./arcWrapped.ts";
import type { ArcBadgeFacts } from "./arcCalendar.ts";

const facts: ArcBadgeFacts = {
  kept: 40, comebacks: 2, clearedTwoDayDebt: false, gauntlet: 6, lightsOut: false, secondWind: true, parkStreet: false,
  closed: true, decemberClean: false, wholeWinter: false, reservesUsed: 1, blackIce: false, scars: 4,
};

test("persona: most specific wins", () => {
  assert.equal(personaFor({ ...facts, blackIce: true }, 0, 20, 20).id, "black-ice");
  assert.equal(personaFor({ ...facts, kept: 58, scars: 0 }, 0, 29, 29).id, "iron-monk");
  assert.equal(personaFor(facts, 6, 20, 20).id, "repairman");
  assert.equal(personaFor({ ...facts, gauntlet: 10 }, 0, 20, 20).id, "festival-survivor");
  assert.equal(personaFor(facts, 0, 12, 20).id, "late-bloomer");
  assert.equal(personaFor({ ...facts, comebacks: 6 }, 0, 20, 20).id, "comeback");
  assert.equal(personaFor(facts, 0, 20, 20).id, "winter-walker");
});

test("trial deltas compare Day 1 with the latest Trials", () => {
  assert.deepEqual(trialDeltas({}), []);
  assert.deepEqual(trialDeltas({ "1": { pushups: 22, plank: 60, deathBy: 9 } }), []);
  const d = trialDeltas({ "1": { pushups: 22, plank: 60, deathBy: 9 }, "2": { pushups: 30, plank: 90, deathBy: 11 }, "3": { pushups: 41, plank: 120, deathBy: 13 } });
  assert.deepEqual(d.map((x) => x.delta), [19, 60, 4]);
});
