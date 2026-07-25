import { db } from "../db/db";
import type { TaskListDto } from "../db/types";

const DEFAULT_LISTS: Omit<TaskListDto, "createdAt">[] = [
  { id: "work",       name: "Work",       color: "#3b82f6", icon: "TbBriefcase",     order: 0, isDefault: 1 },
  { id: "daily",      name: "Daily Life", color: "#22c55e", icon: "TbHome",          order: 1, isDefault: 1 },
  { id: "gym",        name: "Gym",        color: "#ff2740", icon: "TbBarbell",       order: 2, isDefault: 1 },
  { id: "grocery",    name: "Grocery",    color: "#f59e0b", icon: "TbShoppingCart",  order: 3, isDefault: 1 },
  { id: "bike",       name: "Bike",       color: "#8b5cf6", icon: "TbMotorbike",     order: 4, isDefault: 1 },
  { id: "finance",    name: "Finance",    color: "#06b6d4", icon: "TbCash",          order: 5, isDefault: 1 },
  { id: "shopping",   name: "Shopping",   color: "#ec4899", icon: "TbShoppingBag",   order: 6, isDefault: 1 },
  { id: "health",     name: "Health",     color: "#14b8a6", icon: "TbPill",          order: 7, isDefault: 1 },
  // Phase 7 — dedicated calendar-facing lists for the unified schedule system
  // (medicine/supplement/meal reminders). Colors mirror the old KIND_META.
  { id: "medicine",   name: "Medicine",   color: "#ff5c7a", icon: "TbPill",          order: 8, isDefault: 1 },
  { id: "supplement", name: "Supplement", color: "#f6b93b", icon: "TbCapsule",       order: 9, isDefault: 1 },
  { id: "mealtime",   name: "Meal",       color: "#12b3a1", icon: "TbToolsKitchen2", order: 10, isDefault: 1 },
  // Phase 8 — FocusMode already special-cases a "study"/"learn" list id for its
  // "Start studying" CTA; this was never actually seeded until now.
  { id: "study",      name: "Study",      color: "#a855f7", icon: "TbBook2",         order: 11, isDefault: 1 },
];

// Ensures every default list exists; additive only, safe to call on every
// launch (also backfills newly-added defaults for existing installs, unlike
// a one-shot "only if table empty" seed which would miss them).
export async function seedTaskLists(): Promise<void> {
  const now = Date.now();
  for (const l of DEFAULT_LISTS) {
    const exists = await db.taskLists.get(l.id);
    if (!exists) await db.taskLists.add({ ...l, createdAt: now });
  }
}

const KIND_TO_LIST: Record<string, string> = { med: "medicine", supplement: "supplement", meal: "mealtime" };

// Auto-migrate existing ScheduleDto (med/supplement/meal times) into recurring
// tasks on the dedicated medicine/supplement/mealtime lists, so they become
// real calendar events (Phase 7). Guarded by "tasksMigratedV2" — a v1 of this
// migration shipped earlier (undocumented) and dumped everything into the
// generic "health" list with dose baked into the title string; this pass
// first removes anything that looks like v1 output before redoing it cleanly.
export async function migrateSchedulesToTasks(): Promise<void> {
  const migrated = await db.settings.get("tasksMigratedV2");
  if (Number(migrated?.value) === 1) return;

  const schedules = await db.schedules.toArray();

  // Clean up v1 leftovers: daily "health"-list rules whose title exactly
  // matches `${label}${dose ? ' (dose)' : ''}` for a still-existing schedule.
  const staleRules = await db.recurringRules
    .filter((r) => r.templateListId === "health" && r.frequency === "daily")
    .toArray();
  for (const s of schedules) {
    const v1Title = `${s.label}${s.dose ? ` (${s.dose})` : ""}`;
    const stale = staleRules.find((r) => r.templateTitle === v1Title);
    if (stale?.id) {
      await db.tasks.where("recurringRuleId").equals(stale.id).delete();
      await db.recurringRules.delete(stale.id);
    }
  }

  const now = Date.now();
  for (const s of schedules) {
    if (!s.active) continue;
    await db.recurringRules.add({
      frequency: "daily",
      interval: 1,
      active: 1,
      templateTitle: s.label,
      templateListId: KIND_TO_LIST[s.kind] ?? "medicine",
      templatePriority: 2,
      templateTime: s.time,
      templateDose: s.dose,
      createdAt: now,
    });
  }
  await db.settings.put({ key: "tasksMigratedV2" as any, value: 1 });
}
