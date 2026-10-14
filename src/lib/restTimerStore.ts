import { useSyncExternalStore } from "react";
import { hapticMedium } from "./haptics";
import { playRockyFanfare } from "./audio";
import { notify, isNativeNotifications, scheduleRestNotification, cancelRestNotification } from "./notifications";

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

interface RestTimerState {
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

function restBody(): string { return state.label ? `Back to ${state.label}` : "Next set — go."; }

// Native: the OS owns the "Rest over" alert so it lands with the app backgrounded.
function armNative() {
  if (isNativeNotifications()) void scheduleRestNotification("Rest over", restBody(), new Date(endsAt));
}
function disarmNative() {
  if (isNativeNotifications()) void cancelRestNotification();
}

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
      hapticMedium();
      if (!isNativeNotifications()) void notify("Rest over", restBody());
      // Egg #9: Rocky trumpets on completion of a rest that started at
      // *exactly* 3:20 (200 s). Not 3:19, not 3:21.
      if (state.totalSec === 200) playRockyFanfare();
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
  armNative();
  ensureTicking();
  publish();
}

export function pauseRest(): void {
  if (!state.active || state.paused) return;
  pausedRemaining = computeRemaining();
  state = { ...state, paused: true, remaining: pausedRemaining };
  disarmNative();
  publish();
}

export function resumeRest(): void {
  if (!state.active || !state.paused) return;
  endsAt = Date.now() + pausedRemaining * 1000;
  state = { ...state, paused: false };
  armNative();
  publish();
}

export function stop(): void {
  state = { ...state, active: false, remaining: 0, paused: false };
  stopTicking();
  publish();
}
// User-initiated skip also withdraws the pending OS alert; the natural
// zero-hit stop() above must not, or it would cancel the alert as it lands.
export function skipRest(): void {
  disarmNative();
  stop();
}

function getRestState(): RestTimerState { return state; }

function subscribeRest(l: Listener): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

export function useRestTimer(): RestTimerState {
  return useSyncExternalStore(subscribeRest, getRestState, getRestState);
}
