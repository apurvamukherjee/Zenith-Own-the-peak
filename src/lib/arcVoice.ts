import { ARC_START, dayIndex, inArc, shiftDate, MAX_DEBT_DAYS } from "./winterArc.ts";

// Tiers escalate *within* a day as the midnight deadline nears, then reset to
// a comeback line the next morning. Harshest-after-a-lapse is exactly when
// self-blame tips into quitting, so the morning never roasts. Every line hits
// the skipped drill, not the person, and an action is always appended.
// 0 Coach · 1 Nag · 2 Roast · 3 Savage · 4 Unhinged (swearing, opt-in)
export type Tier = 0 | 1 | 2 | 3 | 4;

// "Lyadh" (Bengali: resting before you're tired) lines — ponytail: have a
// native speaker vet these before any Bengali beyond this one word goes in.
export const LINES: Record<Tier, string[]> = {
  0: [
    "Drill's up — knock it out before the day gets loud.",
    "Fresh day. A few minutes on the floor and today's sealed.",
    "The drill is small on purpose. Do it while it's small.",
    "Easiest rep of the day is the first one. Start there.",
    "Get the drill done early and coast the rest of the day.",
    "Drill first, everything else after.",
    "Quiet start, strong finish. Drill's waiting.",
  ],
  1: [
    "Drill's still sitting there. It's not doing itself.",
    "Half the day's gone and the drill hasn't moved.",
    "Still not done. Floor, now — five minutes counts.",
    "That drill isn't getting smaller by waiting.",
    "You've opened Instagram more times than you've done today's drill.",
    "The drill takes less time than this scroll session.",
    "Reminder you were planning to ignore: the drill.",
  ],
  2: [
    "The drill is undefeated today. Fix that.",
    "Lyadh is winning. Get up and prove it wrong.",
    "Your bed has logged more reps than you today.",
    "Even the drill's getting bored waiting.",
    "Big talk on Nov 1. Zero reps today.",
    "Today's score: Lyadh 1, You 0. Equalise.",
    "That's a lot of rest for a drill you haven't started.",
  ],
  3: [
    "Last call. Skip it and you owe it tomorrow — with interest.",
    "This is the part where arcs die quietly. Not this one.",
    "Clock's running out. The drill doesn't care about excuses.",
    "Winter Arc or winter nap? Decide in the next hour.",
    "Tomorrow-you is already paying for this. Do it now.",
    "Nobody's coming to do this for you. Floor. Now.",
    "One drill between you and a scar on the calendar.",
  ],
  4: [
    "Get your ass on the floor. Drill. Now.",
    "Lyadh is a choice. Make a different fucking one.",
    "Holy shit, it's still not done? Move.",
    "No more bullshit. Five minutes, then sleep.",
    "The drill is laughing at you. Shut it the fuck up.",
  ],
};

export const COMEBACK: string[] = [
  "Yesterday slipped. Clear today's drill and the chain re-links.",
  "New day. Yesterday's drill is owed — pay it today and it's like it never broke.",
  "One miss is a blip. Two is a pattern. Today decides which.",
  "Missed one. Doesn't matter. Today's drill repairs it.",
  "The arc forgives repaid debt. Today's the day to pay.",
];

export interface VoiceInput {
  today: string;
  now: number;
  joined: string;          // "" = not in the arc → no pushes
  todayCovered: boolean;   // done or paused — never push once done
  quietToday?: boolean;    // skipped via the gate: still a miss, but no more nagging today
  plan?: { date: string; text: string }; // if-then plan, quoted on that day's morning push
  missed: number;          // open missed streak before today
  drill?: { name: string; amount: string; minimum: string };
  wakeHour: number;
  bedtime: string;         // HH:mm — quiet hours start 30 min before
  ceiling: 0 | 1 | 2 | 3;  // "dial it down"
  profanity: boolean;
  horizonDays?: number;
}
export interface ArcPush { id: number; title: string; body: string; at: Date; channelId?: string }

// Android channel with private lock-screen visibility, so the swearing push
// shows only "Zenith" until unlocked. iOS has no per-notification equivalent.
export const ARC_PRIVATE_CHANNEL = "arc-private";

export const ARC_PUSH_ID_BASE = 1_000_000;
const SLOT_FRACTIONS = [0, 0.4, 0.65, 0.85, 1]; // 5 pushes/day max

const atLocal = (date: string, minutes: number) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, 0, minutes);
};

// Future days are pre-scheduled on the assumption you never open the app
// again — any open re-plans from real data, and completing a drill always
// happens with the app open.
function missedOn(date: string, i: VoiceInput, from: string): number {
  let m = i.missed;
  for (let x = i.today; x < date; x = shiftDate(x, 1)) {
    if (x < from) continue;
    m = x === i.today && i.todayCovered ? 0 : m + 1;
  }
  return m;
}

export function planArcPushes(i: VoiceInput): ArcPush[] {
  if (!i.joined) return [];
  const from = i.joined > ARC_START ? i.joined : ARC_START;
  const [bh, bm] = i.bedtime.split(":").map(Number);
  let bedMin = bh * 60 + bm;
  if (bedMin < i.wakeHour * 60) bedMin += 24 * 60;
  const first = (i.wakeHour + 1) * 60;
  const last = Math.min(bedMin - 30, 23 * 60 + 30);
  if (last <= first) return [];

  const out: ArcPush[] = [];
  for (let k = 0; k < (i.horizonDays ?? 7); k++) {
    const date = shiftDate(i.today, k);
    if (!inArc(date) || date < from) continue;
    if (date === i.today && (i.todayCovered || i.quietToday)) continue;
    const day = dayIndex(date);
    const missed = missedOn(date, i, from);
    const action = date === i.today && i.drill
      ? `${i.drill.name} · ${i.drill.amount}`
      : "Open Zenith and clear today's drill.";

    SLOT_FRACTIONS.forEach((f, slot) => {
      const at = atLocal(date, Math.round(first + (last - first) * f));
      if (at.getTime() <= i.now) return;
      const tier = (slot === 4 && i.profanity ? 4 : Math.min(slot, i.ceiling)) as Tier;
      let line: string;
      if (slot === 0 && missed > 0) {
        const debt = Math.min(missed, MAX_DEBT_DAYS);
        line = `${COMEBACK[day % COMEBACK.length]} Debt: ${debt} day${debt === 1 ? "" : "s"}.`;
      } else {
        const pool = LINES[tier];
        line = pool[(day + slot) % pool.length];
      }
      if (slot === 0 && i.plan?.date === date) line += ` Your plan: “${i.plan.text}”`;
      const tail = slot >= 2 && i.drill && date === i.today ? ` Minimum counts: ${i.drill.minimum}.` : "";
      out.push({
        id: ARC_PUSH_ID_BASE + day * 10 + slot, title: `Winter Arc · Day ${day + 1}`, body: `${line} ${action}${tail}`, at,
        ...(tier === 4 && { channelId: ARC_PRIVATE_CHANNEL }),
      });
    });
  }
  return out;
}
