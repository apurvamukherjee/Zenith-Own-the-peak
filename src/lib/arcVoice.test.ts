import { test } from "node:test";
import assert from "node:assert/strict";
import { planArcPushes, LINES, COMEBACK, ARC_PUSH_ID_BASE, type VoiceInput, type ArcPush } from "./arcVoice.ts";

const base: VoiceInput = {
  today: "2026-11-10", now: new Date(2026, 10, 10, 6, 0).getTime(), joined: "2026-10-25",
  todayCovered: false, missed: 0, drill: { name: "Push-Ups", amount: "30 reps", minimum: "15 reps" },
  wakeHour: 7, bedtime: "23:30", ceiling: 3, profanity: false,
};
const onDay = (p: ArcPush[], d: number) => p.filter((x) => x.at.getDate() === d && x.at.getMonth() === 10);

test("5 pushes a day, inside waking hours, escalating tiers", () => {
  const today = onDay(planArcPushes(base), 10);
  assert.equal(today.length, 5);
  assert.equal(today[0].at.getHours(), 8);
  assert.ok(today[4].at.getHours() * 60 + today[4].at.getMinutes() <= 23 * 60);
  today.forEach((p, slot) => assert.ok(LINES[Math.min(slot, 3) as 0].some((l) => p.body.startsWith(l)), p.body));
  assert.ok(today[0].body.includes("Push-Ups · 30 reps"));
  assert.ok(today[3].body.includes("Minimum counts: 15 reps"));
});

test("never pushes once today is covered; skips past slots", () => {
  assert.equal(onDay(planArcPushes({ ...base, todayCovered: true }), 10).length, 0);
  const late = planArcPushes({ ...base, now: new Date(2026, 10, 10, 20, 0).getTime() });
  assert.ok(onDay(late, 10).length < 5);
});

test("morning after a miss is a comeback line, never a roast", () => {
  const [morning] = onDay(planArcPushes({ ...base, missed: 1 }), 10);
  assert.ok(COMEBACK.some((l) => morning.body.startsWith(l)));
  assert.ok(morning.body.includes("Debt: 1 day."));
  // Today not done → tomorrow's pre-scheduled morning assumes the miss.
  assert.ok(onDay(planArcPushes(base), 11)[0].body.includes("Debt: 1 day."));
  assert.ok(!onDay(planArcPushes({ ...base, todayCovered: true }), 11)[0].body.includes("Debt"));
});

test("dial-down ceiling and opt-in profanity", () => {
  const coach = onDay(planArcPushes({ ...base, ceiling: 0 }), 10);
  coach.forEach((p) => assert.ok(LINES[0].some((l) => p.body.startsWith(l))));
  const raw = onDay(planArcPushes({ ...base, profanity: true }), 10);
  assert.ok(LINES[4].some((l) => raw[4].body.startsWith(l)));
  assert.equal(raw[4].channelId, "arc-private");
  assert.equal(raw[3].channelId, undefined);
  assert.ok(!onDay(planArcPushes(base), 10).some((p) => LINES[4].some((l) => p.body.startsWith(l))));
});

test("nothing before the arc, before joining, or when not joined; ids unique", () => {
  assert.equal(planArcPushes({ ...base, joined: "" }).length, 0);
  const pre = planArcPushes({ ...base, today: "2026-10-28", now: new Date(2026, 9, 28).getTime(), missed: 0 });
  assert.ok(pre.every((p) => p.at >= new Date(2026, 10, 1)));
  assert.ok(!onDay(pre, 1)[0].body.includes("Debt"));
  const all = planArcPushes(base);
  assert.equal(new Set(all.map((p) => p.id)).size, all.length);
  assert.ok(all.every((p) => p.id >= ARC_PUSH_ID_BASE));
});
