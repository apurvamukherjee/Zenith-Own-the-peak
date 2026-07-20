import { db } from "../db/db";
import type { TaskListDto } from "../db/types";

const DEFAULT_LISTS: Omit<TaskListDto, "createdAt">[] = [
  { id: "work",     name: "Work",       color: "#3b82f6", icon: "TbBriefcase",    order: 0, isDefault: 1 },
  { id: "daily",    name: "Daily Life",  color: "#22c55e", icon: "TbHome",         order: 1, isDefault: 1 },
  { id: "gym",      name: "Gym",        color: "#ff2740", icon: "TbBarbell",      order: 2, isDefault: 1 },
  { id: "grocery",  name: "Grocery",    color: "#f59e0b", icon: "TbShoppingCart", order: 3, isDefault: 1 },
  { id: "bike",     name: "Bike",       color: "#8b5cf6", icon: "TbMotorbike",   order: 4, isDefault: 1 },
  { id: "finance",  name: "Finance",    color: "#06b6d4", icon: "TbCash",        order: 5, isDefault: 1 },
  { id: "shopping", name: "Shopping",   color: "#ec4899", icon: "TbShoppingBag", order: 6, isDefault: 1 },
  { id: "health",   name: "Health",     color: "#14b8a6", icon: "TbPill",        order: 7, isDefault: 1 },
];

export async function seedTaskLists(): Promise<void> {
  const count = await db.taskLists.count();
  if (count > 0) return; // already seeded
  const now = Date.now();
  await db.taskLists.bulkAdd(DEFAULT_LISTS.map((l) => ({ ...l, createdAt: now })));
}

// Auto-migrate existing ScheduleDto (med/supplement times) into recurring Health tasks.
export async function migrateSchedulesToTasks(): Promise<void> {
  const migrated = await db.settings.get("tasksMigrated");
  if (Number(migrated?.value) === 1) return;

  const schedules = await db.schedules.toArray();
  const now = Date.now();
  for (const s of schedules) {
    if (!s.active) continue;
    // Create a recurring daily task in the Health list
    void await db.recurringRules.add({
      frequency: "daily",
      interval: 1,
      active: 1,
      templateTitle: `${s.label}${s.dose ? ` (${s.dose})` : ""}`,
      templateListId: "health",
      templatePriority: 2,
      templateTime: s.time,
      createdAt: now,
    });
  }
  await db.settings.put({ key: "tasksMigrated" as any, value: 1 });
}
