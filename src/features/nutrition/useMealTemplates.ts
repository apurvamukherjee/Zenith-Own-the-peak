import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { todayKey } from "../../lib/date.utils";
import type { MealDto, MealTemplateDto, MealTemplateItemDto, MealType } from "../../db/types";
import dayjs from "dayjs";
import { computeMacros } from "./useFoods";

export function useMealTemplates() {
  return useLiveQuery(() => db.mealTemplates.orderBy("createdAt").toArray(), []) ?? [];
}

export function useTemplateItems(templateId: number | undefined) {
  return useLiveQuery(async () => {
    if (!templateId) return [] as MealTemplateItemDto[];
    return db.mealTemplateItems.where({ templateId }).sortBy("order");
  }, [templateId]) ?? [];
}

export async function saveMealAsTemplate(meal: MealDto, name: string) {
  return db.mealTemplates.add({
    name: name.trim(),
    mealType: meal.mealType,
    protein: meal.protein,
    calories: meal.calories,
    fatG: meal.fatG,
    carbsG: meal.carbsG,
    createdAt: Date.now(),
  });
}

// Legacy single-line template log (no items).
async function logSingleTemplate(tpl: MealTemplateDto) {
  return db.meals.add({
    date: todayKey(),
    time: dayjs().format("HH:mm"),
    name: tpl.name,
    mealType: tpl.mealType,
    protein: tpl.protein,
    calories: tpl.calories,
    fatG: tpl.fatG,
    carbsG: tpl.carbsG,
  });
}

// Combo template — replays each food item as its own meal row.
export async function logFromTemplate(tpl: MealTemplateDto) {
  if (!tpl.id) return;
  const items = await db.mealTemplateItems.where({ templateId: tpl.id }).sortBy("order");
  if (!tpl.isCombo || items.length === 0) return logSingleTemplate(tpl);

  const date = todayKey();
  const time = dayjs().format("HH:mm");
  for (const it of items) {
    const food = await db.foods.get(it.foodId);
    if (!food) continue;
    const m = computeMacros(food, it.amount);
    await db.meals.add({
      date, time,
      name: `${tpl.name}: ${food.name}`,
      mealType: tpl.mealType,
      protein: m.protein,
      calories: m.kcal,
      fatG: m.fat,
      carbsG: m.carbs,
      foodId: food.id,
      grams: it.amount,
    });
  }
}

export async function deleteMealTemplate(id: number) {
  await db.mealTemplates.delete(id);
  await db.mealTemplateItems.where({ templateId: id }).delete();
}

export async function createCombo(name: string, mealType: MealType, items: { foodId: number; amount: number }[]) {
  // Compute totals from items so template still shows sensible chip text
  let protein = 0, fat = 0, carbs = 0, kcal = 0;
  for (const it of items) {
    const food = await db.foods.get(it.foodId);
    if (!food) continue;
    const m = computeMacros(food, it.amount);
    protein += m.protein; fat += m.fat; carbs += m.carbs; kcal += m.kcal;
  }
  const id = await db.mealTemplates.add({
    name: name.trim(),
    mealType,
    protein: round1(protein),
    calories: Math.round(kcal),
    fatG: round1(fat),
    carbsG: round1(carbs),
    isCombo: 1,
    createdAt: Date.now(),
  });
  await db.mealTemplateItems.bulkAdd(
    items.map((it, i) => ({ templateId: id, foodId: it.foodId, amount: it.amount, order: i })),
  );
  return id;
}

function round1(n: number) { return Math.round(n * 10) / 10; }

// Add-on #8 — copy every meal from yesterday into today with fresh timestamps.
export async function copyYesterdayMeals(): Promise<number> {
  const today = todayKey();
  const yest = dayjs().subtract(1, "day").format("YYYY-MM-DD");
  const rows = await db.meals.where({ date: yest }).toArray();
  if (rows.length === 0) return 0;
  const time = dayjs().format("HH:mm");
  await db.meals.bulkAdd(
    rows.map((r) => ({
      date: today,
      time: r.time || time,
      name: r.name,
      mealType: r.mealType,
      protein: r.protein,
      calories: r.calories,
      fatG: r.fatG,
      carbsG: r.carbsG,
      foodId: r.foodId,
      grams: r.grams,
    })),
  );
  return rows.length;
}
