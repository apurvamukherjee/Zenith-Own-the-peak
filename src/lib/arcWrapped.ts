import type { ArcBadgeFacts } from "./arcCalendar.ts";

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
