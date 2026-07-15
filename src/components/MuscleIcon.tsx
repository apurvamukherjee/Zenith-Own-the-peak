import type { MuscleGroup } from "../db/types";
import {
  TbStretching, TbArrowBack, TbMountain, TbHandGrab,
  TbWalk, TbArrowBigDown, TbCircle, TbShoe,
  TbTarget, TbHandFinger, TbAnchor, TbBarbell,
} from "react-icons/tb";
import type { IconType } from "react-icons";

const MUSCLE_ICON: Record<MuscleGroup, IconType> = {
  chest: TbStretching, back: TbArrowBack, shoulders: TbMountain, biceps: TbHandGrab,
  triceps: TbHandGrab, quads: TbWalk, hamstrings: TbArrowBigDown, glutes: TbCircle,
  calves: TbShoe, abs: TbTarget, forearms: TbHandFinger, traps: TbAnchor,
};

export function MuscleIcon({ muscle, size = 16, color }: { muscle: MuscleGroup; size?: number; color?: string }) {
  const Icon = MUSCLE_ICON[muscle] ?? TbBarbell;
  return <Icon size={size} style={{ color }} />;
}
