import { db } from "../../db/db";
import type { TaskDto } from "../../db/types";
import dayjs from "dayjs";

// Spawn-on-view: when a date range becomes visible, create real TaskDto rows
// for any recurring rules that should have instances in that range.
// Each instance is a real row (editable, completable) linked back via recurringRuleId.
// Idempotent: checks for existing instances before creating.
export async function spawnRecurring(startDate: string, endDate: string): Promise<void> {
  const rules = await db.recurringRules.where("active").equals(1).toArray();
  if (!rules.length) return;

  const start = dayjs(startDate);
  const end = dayjs(endDate);

  for (const rule of rules) {
    // Generate all dates this rule should fire within the range
    const dates: string[] = [];
    let cursor = start;
    while (cursor.isBefore(end) || cursor.isSame(end, "day")) {
      let shouldSpawn = false;
      if (rule.frequency === "daily") {
        shouldSpawn = true;
      } else if (rule.frequency === "weekly" && rule.weekdays) {
        const wd = cursor.day(); // 0=Sun
        shouldSpawn = rule.weekdays.split(",").map(Number).includes(wd);
      } else if (rule.frequency === "monthly") {
        // Same day-of-month as creation date
        const createdDay = dayjs(rule.createdAt).date();
        shouldSpawn = cursor.date() === createdDay;
      }

      if (shouldSpawn && (!rule.endDate || cursor.format("YYYY-MM-DD") <= rule.endDate)) {
        dates.push(cursor.format("YYYY-MM-DD"));
      }
      cursor = cursor.add(rule.interval || 1, rule.frequency === "monthly" ? "month" : rule.frequency === "weekly" ? "week" : "day");
      // Safety cap — never generate more than 60 instances at once
      if (dates.length > 60) break;
    }

    // For each date, check if instance already exists
    for (const date of dates) {
      const existing = await db.tasks
        .where("recurringRuleId").equals(rule.id!)
        .filter((t) => t.date === date)
        .first();
      if (existing) continue;

      const now = Date.now();
      await db.tasks.add({
        title: rule.templateTitle,
        status: "todo",
        priority: rule.templatePriority,
        listId: rule.templateListId,
        date,
        time: rule.templateTime,
        endTime: rule.templateEndTime,
        recurringRuleId: rule.id,
        isRecurringInstance: 1,
        createdAt: now,
        updatedAt: now,
      } as TaskDto);
    }
  }
}
