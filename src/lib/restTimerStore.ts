import { hapticMedium } from "./haptics";

// -----------------------------------------------------------------------------
// Global rest-timer state.
//
// Historically the rest timer was owned by SessionLogger's ExerciseBlock, which
// meant navigating away lost the countdown. This module lifts it to a singleton
// so:
//   • The in-card RestTimer (on /workout) subscribes to it → same UX, no
//     duplicate ticker.
//   • A floating chip mounted in AppShell subscribes and renders whenever the
//     store is active AND the user is not on /workout.
//
// One active timer at a time — starting a new rest replaces any running one
// (the desired behavior in supersets and manual re-triggers alike).
// -----------------------------------------------------------------------------

export interface RestTimerState {
  active: boolean;
  totalSec: number;
  remaining: number;   // seconds, rounded down for display
  paused: boolean;
  color: string;
  label?: string;      // e.g. "Bench Press" — shown on the floating chip
}

type Listener = (s: RestTimerState) => void;

let state: RestTimerState = {
  active: false, totalSec: 0, remaining: 0, paused: false, color: "#ff2740",
};
const listeners = new Set<Listener>();
let endsAt = 0;             // epoch ms when the timer will hit zero (drift-safe)
let pausedRemaining = 0;    // seconds banked while paused
let tickHandle: number | null = null;
let firedZero = false;

function publish() {
  listeners.forEach((l) => l(state));
}

function computeRemaining(): number {
  if (!state.active) return 0;
  if (state.paused) return pausedRemaining;
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
}

function tick() {
  const rem = computeRemaining();
  if (state.remaining !== rem) {
    state = { ...state, remaining: rem };
    publish();
  }
  if (rem <= 0 && state.active && !state.paused) {
    if (!firedZero) {
      firedZero = true;
      // fire haptic + reset. Consumers just observe `active` flipping false.
      hapticMedium();
      stop();
    }
  }
}

function ensureTicking() {
  if (tickHandle != null) return;
  // 250 ms cadence — smooth-looking, cheap. Not a battery drain.
  tickHandle = window.setInterval(tick, 250);
}
function stopTicking() {
  if (tickHandle != null) { window.clearInterval(tickHandle); tickHandle = null; }
}

// ---- Public API ------------------------------------------------------------

export function startRest(seconds: number, color: string, label?: string): void {
  if (seconds <= 0) return;
  firedZero = false;
  endsAt = Date.now() + seconds * 1000;
  pausedRemaining = seconds;
  state = { active: true, totalSec: seconds, remaining: seconds, paused: false, color, label };
  ensureTicking();
  publish();
}

export function pauseRest(): void {
  if (!state.active || state.paused) return;
  pausedRemaining = computeRemaining();
  state = { ...state, paused: true, remaining: pausedRemaining };
  publish();
}

export function resumeRest(): void {
  if (!state.active || !state.paused) return;
  endsAt = Date.now() + pausedRemaining * 1000;
  state = { ...state, paused: false };
  publish();
}

export function stop(): void {
  state = { ...state, active: false, remaining: 0, paused: false };
  stopTicking();
  publish();
}
// Alias — semantically nicer at call sites where the user is skipping.
export const skipRest = stop;

export function getRestState(): RestTimerState { return state; }

export function subscribeRest(l: Listener): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
