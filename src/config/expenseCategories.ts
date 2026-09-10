import { db } from "../db/db";
import type { ExpenseCategoryDto } from "../db/types";

// Bike fuel already has its own tracker (`/fuel`, `db.fuel`, with its own
// `cost` field) — deliberately no "Fuel" category here to avoid double-entry.
// War Chest folds this month's fuel spend into its stat tiles as a read-only
// rollup queried directly from `db.fuel` instead (see useExpenses.ts).
const DEFAULT_CATEGORIES: Omit<ExpenseCategoryDto, "createdAt">[] = [
  { id: "food",      name: "Food & Mess",   color: "#f59e0b", icon: "TbToolsKitchen2",      order: 0, isDefault: 1 },
  { id: "snacks",    name: "Chai & Snacks", color: "#d97706", icon: "TbCoffee",              order: 1, isDefault: 1 },
  { id: "transport", name: "Transport",     color: "#06b6d4", icon: "TbBus",                 order: 2, isDefault: 1 },
  { id: "subs",      name: "Subscriptions", color: "#8b5cf6", icon: "TbRepeat",               order: 3, isDefault: 1 },
  { id: "gym",       name: "Gym & Supps",   color: "#ff2740", icon: "TbBarbell",              order: 4, isDefault: 1 },
  { id: "personal",  name: "Personal Care", color: "#ec4899", icon: "TbSparkles",             order: 5, isDefault: 1 },
  { id: "misc",      name: "Misc",          color: "#6b7280", icon: "TbDotsCircleHorizontal", order: 6, isDefault: 1 },
];

// Ensures every default category exists; additive only, safe to call on every
// launch (also backfills newly-added defaults for existing installs), same
// pattern as seedTaskLists().
export async function seedExpenseCategories(): Promise<void> {
  const now = Date.now();
  for (const c of DEFAULT_CATEGORIES) {
    const exists = await db.expenseCategories.get(c.id);
    if (!exists) await db.expenseCategories.add({ ...c, createdAt: now });
  }
}
