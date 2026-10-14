export type MoveKind =
  | "streak" | "idle" | "water" | "sleep" | "protein" | "study" | "review" | "summit" | "steady";

export interface Move {
  kind: MoveKind;
  title: string;
  detail: string;
}

export interface MoveContext {
  hour: number;
  /** Any stable per-day integer — picks the idle callout so it doesn't reshuffle on re-render. */
  daySeed: number;
  score: number;
  streak: number;
  hasAnyWriteToday: boolean;
  trainedToday: boolean;
  waterMl: number;
  waterGoal: number;
  waterExpected: number;
  sleepLogged: boolean;
  proteinG: number;
  proteinTarget: number;
  studyNext: string | null;
  studyMinToday: number;
  reviewNudge: boolean;
}

const IDLE_LINES = [
  "Zero water. Zero protein. Zero sets. What exactly did you do today?",
  "It's night. The scoreboard says nothing happened. That's on you.",
  "Tomorrow you'll say you'll do better. You said that yesterday too.",
  "Nothing logged, nothing done. That's not a rest day, that's a skip.",
];

const L = (ml: number) => `${(ml / 1000).toFixed(1)}L`;

// Ordered by urgency: whatever can still be lost tonight beats whatever is
// merely behind pace. Each rule is independent so several can surface at once
// and the deck shows them as a swipeable stack, most urgent first. Training
// is deliberately absent — the training card directly below is its CTA.
export function buildMoves(c: MoveContext): Move[] {
  const moves: Move[] = [];
  const idle = c.hour >= 21 && c.waterMl === 0 && !c.trainedToday && c.proteinG === 0;
  const idleLine = IDLE_LINES[Math.abs(c.daySeed) % IDLE_LINES.length];

  if (c.hour >= 21 && !c.hasAnyWriteToday && c.streak > 0) {
    moves.push({
      kind: "streak",
      title: `${c.streak}-day streak at risk`,
      detail: idle ? idleLine : "It breaks at midnight. One log keeps it alive.",
    });
  } else if (idle) {
    moves.push({ kind: "idle", title: "Nothing logged yet", detail: idleLine });
  }

  const behind = c.waterExpected - c.waterMl;
  if (c.waterMl < c.waterGoal && behind >= 250) {
    moves.push({
      kind: "water",
      title: `${Math.round(behind / 50) * 50}ml behind pace`,
      detail: `${L(c.waterMl)} of ${L(c.waterGoal)} so far`,
    });
  }

  if (!c.sleepLogged && c.hour >= 5 && c.hour < 14) {
    moves.push({ kind: "sleep", title: "Log last night's sleep", detail: "A quarter of today's score rides on it" });
  }

  if (c.proteinTarget > 0 && c.proteinG < c.proteinTarget && c.hour >= 12) {
    const paceFraction = Math.min(1, (c.hour - 8) / 14);
    if (c.proteinG < c.proteinTarget * paceFraction * 0.85) {
      moves.push({
        kind: "protein",
        title: `${Math.round(c.proteinTarget - c.proteinG)}g protein to go`,
        detail: `${Math.round(c.proteinG)}g of ${c.proteinTarget}g logged`,
      });
    }
  }

  if (c.studyNext && c.studyMinToday === 0 && c.hour >= 16 && c.hour < 23) {
    moves.push({ kind: "study", title: c.studyNext, detail: "No study time logged today" });
  }

  if (c.reviewNudge) {
    moves.push({ kind: "review", title: "A week in — targets still right?", detail: "Water, protein and sleep goals are one tap away" });
  }

  if (moves.every((m) => m.kind === "review")) {
    moves.unshift(c.score >= 100
      ? { kind: "summit", title: "Peak conquered", detail: "Every pillar closed today. Rest easy." }
      : { kind: "steady", title: "On pace", detail: "Nothing urgent right now. Keep the rhythm." });
  }

  return moves;
}
