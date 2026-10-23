
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

