import type { ComponentType } from "react";
import type { IconBaseProps } from "react-icons";
import { TbSun, TbMoon, TbDroplet, TbBook2, TbBarbell, TbHeart, TbBolt, TbFlame } from "react-icons/tb";

// Small fixed icon set for habits, resolved by string name — same
// string-name + ICON_MAP resolver pattern already used for expense
// categories (expenseIcons.ts) and task lists (TasksPage.tsx's ICON_MAP).
export const HABIT_ICON_NAMES = ["TbSun", "TbMoon", "TbDroplet", "TbBook2", "TbBarbell", "TbHeart", "TbBolt", "TbFlame"] as const;

export const HABIT_ICON_MAP: Record<string, ComponentType<IconBaseProps>> = {
  TbSun, TbMoon, TbDroplet, TbBook2, TbBarbell, TbHeart, TbBolt, TbFlame,
};

export function habitIconFor(icon: string): ComponentType<IconBaseProps> {
  return HABIT_ICON_MAP[icon] ?? TbFlame;
}
