import type { FoodDto } from "../db/types";
import { db } from "../db/db";

// Seed food catalog — macros exactly as the user specified.
// unit "g"/"ml" ⇒ values are per 100 units; unit "piece"/"scoop"/"tbsp"/"slice" ⇒ per 1 unit.
type Seed = Omit<FoodDto, "id" | "createdAt" | "favorite" | "isCustom">;

export const FOOD_CATALOG: Seed[] = [
  // 🥩 Primary proteins
  { name: "Chicken Breast (cooked)", category: "protein", unit: "g",
    protein: 31, fat: 3.6, carbs: 0, kcal: 165,
    presets: [{ label: "100g", amount: 100 }, { label: "150g", amount: 150 }, { label: "200g", amount: 200 }] },
  { name: "Egg (whole, large)", category: "protein", unit: "piece",
    protein: 6.3, fat: 4.8, carbs: 0.4, kcal: 72,
    presets: [{ label: "1", amount: 1 }, { label: "2", amount: 2 }, { label: "3", amount: 3 }, { label: "4", amount: 4 }] },
  { name: "Egg White (large)", category: "protein", unit: "piece",
    protein: 3.6, fat: 0.1, carbs: 0.2, kcal: 17,
    presets: [{ label: "2", amount: 2 }, { label: "3", amount: 3 }, { label: "5", amount: 5 }] },
  { name: "Paneer", category: "protein", unit: "g",
    protein: 18, fat: 20, carbs: 1.2, kcal: 265,
    presets: [{ label: "50g", amount: 50 }, { label: "100g", amount: 100 }, { label: "150g", amount: 150 }] },
  { name: "Tofu (firm)", category: "protein", unit: "g",
    protein: 8, fat: 5, carbs: 2, kcal: 76,
    presets: [{ label: "100g", amount: 100 }, { label: "150g", amount: 150 }] },
  { name: "Greek Yogurt (plain)", category: "protein", unit: "g",
    protein: 10, fat: 0.4, carbs: 3.6, kcal: 59,
    presets: [{ label: "100g", amount: 100 }, { label: "150g", amount: 150 }, { label: "200g", amount: 200 }] },
  { name: "Curd (dahi)", category: "protein", unit: "g",
    protein: 3.5, fat: 3.3, carbs: 4.7, kcal: 61,
    presets: [{ label: "100g", amount: 100 }, { label: "150g", amount: 150 }, { label: "1 bowl (200g)", amount: 200 }] },
  { name: "Soya Chunks (dry)", category: "protein", unit: "g",
    protein: 52, fat: 0.5, carbs: 33, kcal: 345,
    presets: [{ label: "25g", amount: 25 }, { label: "50g", amount: 50 }] },
  { name: "Whey Protein (1 scoop, 30g)", category: "protein", unit: "scoop",
    protein: 25, fat: 1, carbs: 2, kcal: 120,
    presets: [{ label: "1 scoop", amount: 1 }, { label: "2 scoops", amount: 2 }] },
  { name: "Fish — Salmon/Rohu (cooked)", category: "protein", unit: "g",
    protein: 22, fat: 13, carbs: 0, kcal: 208,
    presets: [{ label: "100g", amount: 100 }, { label: "150g", amount: 150 }] },

  // 🍚 Primary carbs
  { name: "White Rice (cooked)", category: "carb", unit: "g",
    protein: 2.7, fat: 0.3, carbs: 28, kcal: 130,
    presets: [{ label: "1 katori (100g)", amount: 100 }, { label: "150g", amount: 150 }, { label: "200g", amount: 200 }] },
  { name: "Brown Rice (cooked)", category: "carb", unit: "g",
    protein: 2.6, fat: 0.9, carbs: 23, kcal: 111,
    presets: [{ label: "100g", amount: 100 }, { label: "150g", amount: 150 }] },
  { name: "Oats (raw)", category: "carb", unit: "g",
    protein: 13, fat: 7, carbs: 68, kcal: 389,
    presets: [{ label: "30g", amount: 30 }, { label: "40g", amount: 40 }, { label: "50g", amount: 50 }] },
  { name: "Roti (whole wheat)", category: "carb", unit: "piece",
    protein: 3, fat: 0.5, carbs: 15, kcal: 80,
    presets: [{ label: "1", amount: 1 }, { label: "2", amount: 2 }, { label: "3", amount: 3 }, { label: "4", amount: 4 }] },
  { name: "Bread (slice)", category: "carb", unit: "slice",
    protein: 3, fat: 1, carbs: 13, kcal: 75,
    presets: [{ label: "1 slice", amount: 1 }, { label: "2 slices", amount: 2 }, { label: "3 slices", amount: 3 }] },
  { name: "Potato (boiled)", category: "carb", unit: "g",
    protein: 2, fat: 0.1, carbs: 17, kcal: 77,
    presets: [{ label: "100g", amount: 100 }, { label: "150g", amount: 150 }] },
  { name: "Sweet Potato (boiled)", category: "carb", unit: "g",
    protein: 1.6, fat: 0.1, carbs: 20, kcal: 86,
    presets: [{ label: "100g", amount: 100 }, { label: "150g", amount: 150 }] },
  { name: "Banana (medium)", category: "carb", unit: "piece",
    protein: 1.3, fat: 0.3, carbs: 27, kcal: 105,
    presets: [{ label: "1", amount: 1 }, { label: "2", amount: 2 }] },
  { name: "Apple (medium)", category: "carb", unit: "piece",
    protein: 0.3, fat: 0.2, carbs: 14, kcal: 52,
    presets: [{ label: "1", amount: 1 }, { label: "2", amount: 2 }] },

  // 🥑 Primary fats
  { name: "Oil — olive/mustard/coconut", category: "fat", unit: "tbsp",
    protein: 0, fat: 14, carbs: 0, kcal: 120,
    presets: [{ label: "1 tbsp", amount: 1 }, { label: "2 tbsp", amount: 2 }] },
  { name: "Ghee", category: "fat", unit: "tbsp",
    protein: 0, fat: 14, carbs: 0, kcal: 120,
    presets: [{ label: "1 tsp (0.33)", amount: 0.33 }, { label: "1 tbsp", amount: 1 }] },
  { name: "Butter", category: "fat", unit: "tbsp",
    protein: 0.1, fat: 11.5, carbs: 0.1, kcal: 102,
    presets: [{ label: "1 tbsp", amount: 1 }, { label: "2 tbsp", amount: 2 }] },
  { name: "Almonds", category: "fat", unit: "g",
    protein: 21, fat: 49, carbs: 22, kcal: 579,
    presets: [{ label: "10g (~8)", amount: 10 }, { label: "20g (~16)", amount: 20 }, { label: "30g", amount: 30 }] },
  { name: "Walnuts", category: "fat", unit: "g",
    protein: 15, fat: 65, carbs: 14, kcal: 654,
    presets: [{ label: "15g (~4)", amount: 15 }, { label: "30g", amount: 30 }] },
  { name: "Peanut Butter", category: "fat", unit: "tbsp",
    protein: 3.5, fat: 8, carbs: 3, kcal: 94,
    presets: [{ label: "1 tbsp", amount: 1 }, { label: "2 tbsp", amount: 2 }] },
  { name: "Avocado", category: "fat", unit: "g",
    protein: 2, fat: 15, carbs: 9, kcal: 160,
    presets: [{ label: "50g (¼)", amount: 50 }, { label: "100g (½)", amount: 100 }] },
  { name: "Chia Seeds", category: "fat", unit: "g",
    protein: 16.5, fat: 30.7, carbs: 42.1, kcal: 486,
    presets: [{ label: "10g (1 tbsp)", amount: 10 }, { label: "20g", amount: 20 }] },

  // 🫘 Hybrid — carbs + protein
  { name: "Dal / Lentils (cooked)", category: "hybrid", unit: "g",
    protein: 9, fat: 0.4, carbs: 20, kcal: 116,
    presets: [{ label: "1 katori (150g)", amount: 150 }, { label: "200g", amount: 200 }] },
  { name: "Chickpeas / Chana (cooked)", category: "hybrid", unit: "g",
    protein: 9, fat: 2.6, carbs: 27, kcal: 164,
    presets: [{ label: "100g", amount: 100 }, { label: "150g", amount: 150 }] },
  { name: "Rajma / Kidney Beans (cooked)", category: "hybrid", unit: "g",
    protein: 9, fat: 0.5, carbs: 23, kcal: 127,
    presets: [{ label: "100g", amount: 100 }, { label: "150g", amount: 150 }] },
  { name: "Milk (double toned)", category: "beverage", unit: "ml",
    protein: 3.3, fat: 1.5, carbs: 4.8, kcal: 47,
    presets: [{ label: "100ml", amount: 100 }, { label: "200ml", amount: 200 }, { label: "1 glass (250ml)", amount: 250 }] },
];

export async function seedFoodsIfEmpty() {
  const count = await db.foods.count();
  if (count > 0) return;
  const now = Date.now();
  await db.foods.bulkAdd(
    FOOD_CATALOG.map((f) => ({ ...f, favorite: 0, isCustom: 0, createdAt: now })),
  );
}
