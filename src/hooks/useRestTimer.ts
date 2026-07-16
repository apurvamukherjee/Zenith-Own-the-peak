import { useSyncExternalStore } from "react";
import { getRestState, subscribeRest, type RestTimerState } from "../lib/restTimerStore";

// React binding for the rest-timer singleton. `useSyncExternalStore` is the
// idiomatic React 18/19 hook for external mutable stores — safer than a manual
// effect + setState (no tearing, works with concurrent rendering).
export function useRestTimer(): RestTimerState {
  return useSyncExternalStore(subscribeRest, getRestState, getRestState);
}
