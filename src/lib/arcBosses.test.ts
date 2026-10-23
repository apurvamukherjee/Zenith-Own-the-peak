import { test } from "node:test";
import assert from "node:assert/strict";
import { BOSSES, bossFor } from "./arcBosses.ts";

test("one boss per chapter except Trials week and the deload", () => {
  assert.equal(bossFor("2026-11-03"), undefined);
  assert.equal(bossFor("2026-11-08")?.id, "lights-out-deck");
  assert.equal(bossFor("2026-11-14")?.id, "lights-out-deck");
  assert.equal(bossFor("2026-11-29"), undefined);
  assert.equal(bossFor("2026-12-31")?.id, "big-3");
  assert.equal(new Set(BOSSES.map((b) => b.chapter)).size, BOSSES.length);
  for (const b of BOSSES) if (b.rematchOf && !b.rematchOf.startsWith("trial:")) assert.ok(BOSSES.some((x) => x.id === b.rematchOf));
});
