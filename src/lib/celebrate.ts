import { hapticSuccess } from "./haptics";

// Fire-and-forget imperative event bus for "moment of" celebrations
// (currently PRs; easy to extend to streak milestones, perfect days, etc).
// Any component that wants to react to a celebration subscribes via
// `subscribeCelebrate`. The overlay lives once at the App root, so callers
// never worry about which route they're on.
export type CelebrationKind = "pr";
export interface CelebrationPayload {
  kind: CelebrationKind;
  title: string;      // headline shown on the overlay
  subtitle?: string;  // secondary line ("Bench Press · 62.5kg × 6 · e1RM 75")
}
type Listener = (p: CelebrationPayload) => void;

const listeners = new Set<Listener>();

export function celebrate(payload: CelebrationPayload): void {
  hapticSuccess();
  listeners.forEach((l) => l(payload));
}

export function subscribeCelebrate(l: Listener): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
