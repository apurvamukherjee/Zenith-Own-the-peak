import { db } from "../../db/db";
import { setSetting } from "../../hooks/useSettings";
import { todayKey } from "../../lib/date.utils";
import { ARC_START, ARC_END } from "../../lib/winterArc";
import type { Vow } from "../../lib/arcChecklist";
import { spawnRecurring } from "../tasks/useRecurringSpawner";

const DRILL_TASK = "Winter Arc drill";

// An if-then plan tied to a time and place is one of the best-supported cheap
// techniques (Gollwitzer & Sheeran 2006, d = 0.65), so the vow's "when" becomes
// a real daily block on the calendar. No `remindBefore`: the arc's own pushes
// already cover reminding, and a second alert would double up.
export async function saveVow(vow: Omit<Vow, "signedAt">, rules: string[], signedAt?: number): Promise<void> {
  await setSetting("arcVow", JSON.stringify({ ...vow, signedAt: signedAt ?? Date.now() }));
  await setSetting("arcRules", rules.join(","));
  if (!vow.when) return;

  const today = todayKey();
  const startDate = today > ARC_START ? today : ARC_START;
  const ruleId = Number((await db.settings.get("arcVowRuleId"))?.value ?? 0);
  const existing = ruleId ? await db.recurringRules.get(ruleId) : undefined;
  if (existing?.id) {
    await db.recurringRules.update(existing.id, { templateTime: vow.when });
    await db.tasks.where("recurringRuleId").equals(existing.id)
      .filter((t) => (t.date ?? "") >= today && t.status !== "done")
      .modify({ time: vow.when, location: vow.where || undefined, updatedAt: Date.now() });
  } else {
    const id = await db.recurringRules.add({
      frequency: "daily", interval: 1, active: 1, templateTitle: DRILL_TASK, templateListId: "gym",
      templatePriority: 2, templateTime: vow.when, startDate, endDate: ARC_END, createdAt: Date.now(),
    });
    await setSetting("arcVowRuleId", id);
  }
  await spawnRecurring(startDate, ARC_END);
}

/** Keeps the calendar block in step with the drill. */
export async function markDrillTaskDone(date: string): Promise<void> {
  const ruleId = Number((await db.settings.get("arcVowRuleId"))?.value ?? 0);
  if (!ruleId) return;
  const now = Date.now();
  await db.tasks.where("recurringRuleId").equals(ruleId).filter((t) => t.date === date && t.status !== "done")
    .modify({ status: "done", completedAt: now, updatedAt: now });
}
