import type { ArcBadgeFacts } from "./arcCalendar.ts";
import type { TrialScore } from "./arcBosses.ts";
import { ARC_START, ARC_END, shiftDate } from "./winterArc.ts";

// Wrapped leads with a persona, not a rank: Duolingo's top 10% made over half
// of all Year-in-Review shares until persona cards gave everyone a card worth
// posting. The order below is most-specific first.
export interface Persona { id: string; title: string; line: string }
export function personaFor(f: ArcBadgeFacts, repaired: number, novKept: number, decKept: number): Persona {
  if (f.closed && f.blackIce) return { id: "black-ice", title: "Black Ice", line: "Zero reserves. By choice. Every day of it." };
  if (f.kept >= 55 && f.scars === 0) return { id: "iron-monk", title: "Iron Monk", line: "Quiet, relentless, not one scar." };
  if (repaired >= 5) return { id: "repairman", title: "The Repairman", line: "Broke the chain. Fixed it. Again. That's the whole skill." };
  if (f.gauntlet >= 9) return { id: "festival-survivor", title: "Festival Survivor", line: "Kali Puja, Bhai Phonta, Jagaddhatri — and still kept the arc." };
  if (decKept >= novKept + 5) return { id: "late-bloomer", title: "Late Bloomer", line: "December you would scare November you." };
  if (f.comebacks >= 5) return { id: "comeback", title: "The Comeback", line: "Knocked down five times. Got back up five times." };
  return { id: "winter-walker", title: "Winter Walker", line: "You walked through the whole winter. Most people stop in week two." };
}

export interface TrialDelta { label: string; first: number; last: number; delta: number; unit: string }
/** Day 1 vs the latest Trials logged after it (Dec 30 if there, else Day 31). */
export function trialDeltas(trials: Record<string, TrialScore>): TrialDelta[] {
  const first = trials["1"];
  const last = trials["3"] ?? trials["2"];
  if (!first || !last) return [];
  const row = (label: string, k: keyof TrialScore, unit: string) => ({ label, first: first[k], last: last[k], delta: last[k] - first[k], unit });
  return [row("Max push-ups", "pushups", ""), row("Plank", "plank", "s"), row("Death by push-ups", "deathBy", " min")];
}

/** Longest run of kept (done or repaired) days. */
export function bestRun(kept: ReadonlySet<string>): number {
  let best = 0, cur = 0;
  for (let d = ARC_START; d <= ARC_END; d = shiftDate(d, 1)) {
    cur = kept.has(d) ? cur + 1 : 0;
    best = Math.max(best, cur);
  }
  return best;
}
