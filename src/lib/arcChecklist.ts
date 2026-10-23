import { ARC_DAYS, dayIndex } from "./winterArc.ts";

// Cold Rules are measurable on purpose: "skip social events" / "cut people"
// are deliberately absent — in Bengal's festival season they guarantee
// isolation and failure. Auto rules tick themselves from real logs, which is
// the one thing the Notion/PDF Winter Arc trackers can't do.
export interface RuleDef { id: string; label: string; auto: boolean; note?: string }
export const RULE_PRESETS: RuleDef[] = [
  { id: "sunrise", label: "Up before sunrise", auto: true },
  { id: "study", label: "Study 60+ min", auto: true },
  { id: "social", label: "≤ 1h social media", auto: false },
  { id: "cold", label: "Cold shower", auto: false, note: "Not right after lifting — it blunts strength and muscle gains. Skip it if you have a heart condition." },
  { id: "nojunk", label: "No junk or added sugar", auto: false },
  { id: "read", label: "Read 10 pages", auto: false },
  { id: "steps", label: "8k steps", auto: false },
  { id: "nophone", label: "No phone in bed", auto: false },
];
export const MAX_RULES = 3;

export interface ArcFacts {
  drill: boolean;      // drill done (any kind) or day paused
  training: boolean;   // logged a session, or today is a planned rest day
  protein: boolean;
  water: boolean;
  sleep: boolean;      // last night ≥ sleep target
  wakeMin?: number;    // minutes after midnight you got up, from today's sleep log
  studyMin: number;
}

// Kolkata sunrise drifts ~5:40 → ~6:16 across the arc.
// ponytail: linear fit, off by a few minutes mid-arc; swap in a real solar table if it matters.
export function sunriseMin(date: string): number {
  const t = Math.max(0, Math.min(1, dayIndex(date) / (ARC_DAYS - 1)));
  return Math.round(340 + 36 * t);
}

export interface ChecklistItem { id: string; label: string; done: boolean; auto: boolean; note?: string }

export function checklist(date: string, facts: ArcFacts, rules: string[], ticks: string[]): { items: ChecklistItem[]; score: number } {
  const items: ChecklistItem[] = [
    { id: "drill", label: "Arc drill", done: facts.drill, auto: true },
    { id: "training", label: "Training (or planned rest)", done: facts.training, auto: true },
    { id: "protein", label: "Protein target", done: facts.protein, auto: true },
    { id: "water", label: "Water goal", done: facts.water, auto: true },
    { id: "sleep", label: "Slept your target", done: facts.sleep, auto: true },
  ];
  for (const id of rules.slice(0, MAX_RULES)) {
    const def = RULE_PRESETS.find((r) => r.id === id);
    if (!def) continue;
    const done = id === "sunrise" ? facts.wakeMin != null && facts.wakeMin < sunriseMin(date)
      : id === "study" ? facts.studyMin >= 60
      : ticks.includes(id);
    items.push({ id, label: def.label, done, auto: def.auto, note: def.note });
  }
  const score = Math.round(items.filter((i) => i.done).length / items.length * 100);
  return { items, score };
}

export const parseList = (raw: string) => raw.split(",").filter(Boolean);

/** arcTicks setting: JSON `{ "YYYY-MM-DD": ["cold", ...] }`. */
export function parseTicks(raw: string): Record<string, string[]> {
  try {
    const v: unknown = JSON.parse(raw || "{}");
    return typeof v === "object" && v !== null && !Array.isArray(v) ? v as Record<string, string[]> : {};
  } catch (e) {
    if (e instanceof SyntaxError) return {};
    throw e;
  }
}

export function toggleTick(raw: string, date: string, id: string): string {
  const all = parseTicks(raw);
  const day = new Set(all[date] ?? []);
  if (day.has(id)) day.delete(id); else day.add(id);
  all[date] = [...day];
  return JSON.stringify(all);
}

export interface Vow { goal: string; when: string; where: string; ifThen: string; signedAt: number }
export function parseVow(raw: string): Vow | null {
  try {
    const v = JSON.parse(raw || "null") as Partial<Vow> | null;
    return v && typeof v.goal === "string" && typeof v.signedAt === "number"
      ? { goal: v.goal, when: v.when ?? "", where: v.where ?? "", ifThen: v.ifThen ?? "", signedAt: v.signedAt }
      : null;
  } catch (e) {
    if (e instanceof SyntaxError) return null;
    throw e;
  }
}
