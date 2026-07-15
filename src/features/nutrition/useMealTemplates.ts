import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { todayKey } from "../../lib/date.utils";
import type { MealDto, MealTemplateDto, MealType } from "../../db/types";
import dayjs from "dayjs";

export function useMealTemplates() {
  return useLiveQuery(() => db.mealTemplates.orderBy("createdAt").toArray(), []) ?? [];
}

export async function saveMealAsTemplate(meal: MealDto, name: string) {
  return db.mealTemplates.add({
    name: name.trim(),
    mealType: meal.mealType,
    protein: meal.protein,
    calories: meal.calories,
    createdAt: Date.now(),
  });
}

export async function logFromTemplate(tpl: MealTemplateDto) {
  return db.meals.add({
    date: todayKey(),
    time: dayjs().format("HH:mm"),
    name: tpl.name,
    mealType: tpl.mealType,
    protein: tpl.protein,
    calories: tpl.calories,
  });
}

export async function deleteMealTemplate(id: number) {
  await db.mealTemplates.delete(id);
}

export async function addMealTemplateDirect(name: string, mealType: MealType, protein: number, calories: number) {
  return db.mealTemplates.add({ name: name.trim(), mealType, protein, calories, createdAt: Date.now() });
}
