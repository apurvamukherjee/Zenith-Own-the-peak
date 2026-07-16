import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import type { FoodDto, FoodPresetDto, MealDto } from "../../db/types";

export function useFoods() {
  return useLiveQuery(() => db.foods.orderBy("name").toArray(), []) ?? [];
}

export function useFavoriteFoods() {
  return useLiveQuery(() => db.foods.where("favorite").equals(1).sortBy("name"), []) ?? [];
}

// Recent foods actually logged (from meals with foodId), most-recent 5, distinct.
export function useRecentFoods(limit = 5) {
  return useLiveQuery(async () => {
    const meals = await db.meals.orderBy("date").reverse().limit(150).toArray();
    const seen = new Set<number>();
    const out: FoodDto[] = [];
    for (const m of meals) {
      if (!m.foodId || seen.has(m.foodId)) continue;
      seen.add(m.foodId);
      const f = await db.foods.get(m.foodId);
      if (f) out.push(f);
      if (out.length >= limit) break;
    }
    return out;
  }, [limit]) ?? [];
}

export async function addCustomFood(food: Omit<FoodDto, "id" | "createdAt" | "favorite" | "isCustom">) {
  return db.foods.add({ ...food, favorite: 0, isCustom: 1, createdAt: Date.now() });
}

export async function toggleFoodFavorite(id: number) {
  const f = await db.foods.get(id);
  if (!f) return;
  await db.foods.update(id, { favorite: f.favorite ? 0 : 1 });
}

export async function deleteFood(id: number) {
  await db.foods.delete(id);
}

// Compute macros for a food at a given amount.
// unit "g"/"ml" ⇒ base = per-100; unit "piece"/"scoop"/"tbsp"/"slice" ⇒ base = per-1.
export interface MacroPreview { protein: number; fat: number; carbs: number; kcal: number; }
export function computeMacros(food: FoodDto, amount: number): MacroPreview {
  const isPer100 = food.unit === "g" || food.unit === "ml";
  const factor = isPer100 ? amount / 100 : amount;
  return {
    protein: round1(food.protein * factor),
    fat: round1(food.fat * factor),
    carbs: round1(food.carbs * factor),
    kcal: Math.round(food.kcal * factor),
  };
}
function round1(n: number) { return Math.round(n * 10) / 10; }

// Human portion label from unit + amount.
export function portionLabel(food: FoodDto, amount: number): string {
  switch (food.unit) {
    case "g": return `${amount}g`;
    case "ml": return `${amount}ml`;
    case "piece": return `${amount} pc`;
    case "scoop": return `${amount} scoop${amount === 1 ? "" : "s"}`;
    case "tbsp": return `${amount} tbsp`;
    case "slice": return `${amount} slice${amount === 1 ? "" : "s"}`;
  }
}

// Default portion presets when a food has none (fallback safety).
export function defaultPresets(food: FoodDto): FoodPresetDto[] {
  if (food.presets && food.presets.length) return food.presets;
  const isPer100 = food.unit === "g" || food.unit === "ml";
  if (isPer100) return [{ label: "50", amount: 50 }, { label: "100", amount: 100 }, { label: "150", amount: 150 }];
  return [{ label: "1", amount: 1 }, { label: "2", amount: 2 }];
}

// Save a portion preset onto a food (add-on #1).
export async function savePreset(foodId: number, preset: FoodPresetDto) {
  const f = await db.foods.get(foodId);
  if (!f) return;
  const existing = f.presets ?? [];
  // De-dupe by amount + label
  if (existing.some((p) => p.amount === preset.amount && p.label === preset.label)) return;
  await db.foods.update(foodId, { presets: [...existing, preset] });
}

export async function removePreset(foodId: number, presetIndex: number) {
  const f = await db.foods.get(foodId);
  if (!f) return;
  const next = [...(f.presets ?? [])];
  next.splice(presetIndex, 1);
  await db.foods.update(foodId, { presets: next });
}

// Build a MealDto from food+amount and add it.
export async function logFood(food: FoodDto, amount: number, mealType: MealDto["mealType"], date: string, time: string) {
  const macros = computeMacros(food, amount);
  return db.meals.add({
    date, time,
    name: `${food.name} · ${portionLabel(food, amount)}`,
    mealType,
    protein: macros.protein,
    calories: macros.kcal,
    fatG: macros.fat,
    carbsG: macros.carbs,
    foodId: food.id,
    grams: amount,
  });
}
