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

