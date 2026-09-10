import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import type { ExpenseDto, ExpenseItemDto, ExpensePresetDto, CategoryBudgetDto } from "../../db/types";
import { monthKey, todayKey } from "../../lib/date.utils";

export function useExpenseCategories() {
  return useLiveQuery(() => db.expenseCategories.orderBy("order").toArray(), []) ?? [];
}

export function useExpenseItems(categoryId?: string) {
  return useLiveQuery(() => {
    const q = categoryId ? db.expenseItems.where("categoryId").equals(categoryId) : db.expenseItems.toCollection();
    return q.sortBy("name");
  }, [categoryId]) ?? [];
}

export function useFavoriteExpenseItems() {
  return useLiveQuery(() => db.expenseItems.where("favorite").equals(1).sortBy("name"), []) ?? [];
}

// Recent expense items actually logged (from expenses with itemId), most-recent N, distinct.
export function useRecentExpenseItems(limit = 6) {
  return useLiveQuery(async () => {
    const rows = await db.expenses.orderBy("date").reverse().limit(150).toArray();
    const seen = new Set<number>();
    const out: ExpenseItemDto[] = [];
    for (const r of rows) {
      if (!r.itemId || seen.has(r.itemId)) continue;
      seen.add(r.itemId);
      const it = await db.expenseItems.get(r.itemId);
      if (it) out.push(it);
      if (out.length >= limit) break;
    }
    return out;
  }, [limit]) ?? [];
}

export function useExpensesForMonth(mKey?: string) {
  const key = mKey ?? monthKey(todayKey());
  return useLiveQuery(() => db.expenses.filter((e) => monthKey(e.date) === key).toArray(), [key]) ?? [];
}

export function useAllExpenses() {
  return useLiveQuery(() => db.expenses.orderBy("date").reverse().toArray(), []) ?? [];
}

export function useCategoryBudgets() {
  return useLiveQuery(() => db.categoryBudgets.toArray(), []) ?? [];
}

// Read-only rollup of this month's bike fuel spend. Deliberately not stored
// in `expenses` — Fuel (`db.fuel`) already owns that data; duplicating it
// here would risk double-entry. War Chest just folds the total into its
// stat tiles and links out to /fuel for actual entry.
export function useFuelSpendThisMonth() {
  return useLiveQuery(async () => {
    const key = monthKey(todayKey());
    const rows = await db.fuel.filter((f) => monthKey(f.date) === key).toArray();
    return rows.reduce((s, r) => s + r.cost, 0);
  }, []) ?? 0;
}

export async function addExpense(entry: Omit<ExpenseDto, "id" | "createdAt">) {
  return db.expenses.add({ ...entry, createdAt: Date.now() });
}
export async function deleteExpense(id: number) {
  await db.expenses.delete(id);
}

export async function addExpenseItem(item: Omit<ExpenseItemDto, "id" | "createdAt" | "favorite" | "isCustom">) {
  return db.expenseItems.add({ ...item, favorite: 0, isCustom: 1, createdAt: Date.now() });
}
export async function deleteExpenseItem(id: number) {
  await db.expenseItems.delete(id);
}
export async function toggleExpenseItemFavorite(id: number) {
  const it = await db.expenseItems.get(id);
  if (!it) return;
  await db.expenseItems.update(id, { favorite: it.favorite ? 0 : 1 });
}

// Save a quick-add amount preset onto an expense item (mirrors nutrition's
// food presets — see useFoods.ts's savePreset/removePreset).
export async function savePreset(itemId: number, preset: ExpensePresetDto) {
  const it = await db.expenseItems.get(itemId);
  if (!it) return;
  const existing = it.presets ?? [];
  if (existing.some((p) => p.amount === preset.amount && p.label === preset.label)) return;
  await db.expenseItems.update(itemId, { presets: [...existing, preset] });
}
export async function removePreset(itemId: number, presetIndex: number) {
  const it = await db.expenseItems.get(itemId);
  if (!it) return;
  const next = [...(it.presets ?? [])];
  next.splice(presetIndex, 1);
  await db.expenseItems.update(itemId, { presets: next });
}

export async function setCategoryBudget(categoryId: string, monthlyBudget: number) {
  await db.categoryBudgets.put({ categoryId, monthlyBudget });
}

export interface ExpenseStats {
  total: number;
  byCategory: Record<string, number>;
  totalBudget: number;
  remaining: number;
}
export function expenseStats(rows: ExpenseDto[], budgets: CategoryBudgetDto[]): ExpenseStats {
  const byCategory: Record<string, number> = {};
  let total = 0;
  for (const r of rows) {
    byCategory[r.categoryId] = (byCategory[r.categoryId] ?? 0) + r.amount;
    total += r.amount;
  }
  const totalBudget = budgets.reduce((s, b) => s + b.monthlyBudget, 0);
  return { total, byCategory, totalBudget, remaining: totalBudget - total };
}
