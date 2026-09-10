import type { ComponentType } from "react";
import type { IconBaseProps } from "react-icons";
import {
  TbToolsKitchen2, TbCoffee, TbBus, TbRepeat, TbBarbell, TbSparkles,
  TbDotsCircleHorizontal, TbFlag,
} from "react-icons/tb";

// Mirrors TasksPage.tsx's ICON_MAP pattern — category icon stored as a
// string name on ExpenseCategoryDto, resolved here at render time. Shared
// between ExpensesPage and QuickLogFab's inline quick-spend modal so both
// stay in sync with a single map.
export const EXPENSE_ICON_MAP: Record<string, ComponentType<IconBaseProps>> = {
  TbToolsKitchen2, TbCoffee, TbBus, TbRepeat, TbBarbell, TbSparkles, TbDotsCircleHorizontal,
};

export function expenseIconFor(icon: string): ComponentType<IconBaseProps> {
  return EXPENSE_ICON_MAP[icon] ?? TbFlag;
}
