
// Weekly bosses: one per chapter, doable any day of it — fixed-time windows
// punish people with classes and jobs. Rematches put last time's score up as
// the boss's HP. No randomization claims here: formats rotate for novelty only.
export type BossKind = "deck" | "deathby" | "amrap" | "max" | "quality" | "murph";
export interface BossDef {
  id: string; chapter: number; title: string; kind: BossKind;
  rules: string; scoreLabel: string;
  minutes?: number;      // countdown for deck / amrap; deathby counts up by the minute
  legs?: boolean;        // squat volume — guarded within 48h of a leg day
  rematchOf?: string;
}

