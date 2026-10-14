import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMoves, type MoveContext } from "./nextMoves.ts";

const base: MoveContext = {
  hour: 10, daySeed: 0, score: 40, streak: 5, hasAnyWriteToday: true,
  trainedToday: false,
  waterMl: 1500, waterGoal: 3500, waterExpected: 1500,
  sleepLogged: true, proteinG: 50, proteinTarget: 100,
  studyNext: null, studyMinToday: 0, reviewNudge: false,
};
const kinds = (c: Partial<MoveContext>) => buildMoves({ ...base, ...c }).map((m) => m.kind);

test("streak danger outranks everything at night", () => {
  const k = kinds({ hour: 22, hasAnyWriteToday: false, waterMl: 0, proteinG: 0 });
  assert.equal(k[0], "streak");
  assert.ok(!k.includes("idle"));
});

test("idle callout fires without a streak to protect", () => {
  assert.equal(kinds({ hour: 22, streak: 0, hasAnyWriteToday: false, waterMl: 0, proteinG: 0 })[0], "idle");
});

test("a logged session means the night isn't idle", () => {
  assert.ok(!kinds({ hour: 22, streak: 0, hasAnyWriteToday: true, waterMl: 0, proteinG: 0, trainedToday: true }).includes("idle"));
});

test("water only nags when ≥250ml behind pace", () => {
  assert.ok(!kinds({ waterExpected: 1700 }).includes("water"));
  assert.ok(kinds({ waterExpected: 1800 }).includes("water"));
  assert.ok(!kinds({ waterMl: 3500, waterExpected: 3500 }).includes("water"));
});

test("sleep prompt is a morning thing", () => {
  assert.ok(kinds({ sleepLogged: false, hour: 7 }).includes("sleep"));
  assert.ok(!kinds({ sleepLogged: false, hour: 15 }).includes("sleep"));
});

test("protein pace kicks in after noon", () => {
  assert.ok(!kinds({ hour: 11, proteinG: 0 }).includes("protein"));
  assert.ok(kinds({ hour: 18, proteinG: 20 }).includes("protein"));
});

test("fallback card when nothing is urgent", () => {
  assert.deepEqual(kinds({}), ["steady"]);
  assert.deepEqual(kinds({ score: 100 }), ["summit"]);
  assert.deepEqual(kinds({ reviewNudge: true }), ["steady", "review"]);
});
