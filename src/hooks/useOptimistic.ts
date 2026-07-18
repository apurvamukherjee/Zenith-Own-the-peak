import { useCallback, useEffect, useRef, useState } from "react";
import { App } from "antd";

// Module-level pending cache. Keyed by a caller-supplied string (e.g. "water"),
// this survives route unmounts so an optimistic +500ml still shows on Home
// even if the user tapped Water then navigated back before the write flushed.
// Absorbed automatically when live catches up (see effect below).
const CACHE = new Map<string, { pending: number; expected: number }>();

// Simple optimistic-write helper for additive numeric UIs (water total, etc.).
// Consumer displays `optimisticTotal = liveTotal + pending`. When the real
// live value ticks past our expected commit, `pending` decays back to 0.
// On a failed write, we roll back and toast an actionable error.
//
// Optional `cacheKey` opts into the module-level cache — pass "water" (or any
// stable string) to persist pending across route unmounts.
export function useOptimisticNumber(liveTotal: number, cacheKey?: string) {
  const { message } = App.useApp();
  const cached = cacheKey ? CACHE.get(cacheKey) : undefined;
  const [pending, setPending] = useState<number>(cached?.pending ?? 0);
  const expectedRef = useRef<number>(cached?.expected ?? liveTotal);

  // Absorb once live catches up to what we expected. Also clear the cache
  // entry so a fresh mount doesn't reuse a stale expected value.
  useEffect(() => {
    if (liveTotal >= expectedRef.current) {
      expectedRef.current = liveTotal;
      setPending(0);
      if (cacheKey) CACHE.delete(cacheKey);
    }
  }, [liveTotal, cacheKey]);

  const commit = useCallback(async (
    delta: number,
    action: () => Promise<unknown>,
    label = "action",
  ): Promise<boolean> => {
    const nextPending = pending + delta;
    const nextExpected = liveTotal + delta;
    setPending(nextPending);
    expectedRef.current = nextExpected;
    if (cacheKey) CACHE.set(cacheKey, { pending: nextPending, expected: nextExpected });
    try {
      await action();
      return true;
    } catch (err) {
      setPending((p) => p - delta);
      expectedRef.current = liveTotal;
      if (cacheKey) CACHE.delete(cacheKey);
      message.error({
        content: `Couldn't save this ${label}. Tap to retry.`,
        duration: 5,
        onClick: () => { void commit(delta, action, label); },
      });
      // Surface the reason to console for anyone debugging.
      console.warn("[useOptimisticNumber] write failed:", err);
      return false;
    }
  }, [liveTotal, message, pending, cacheKey]);

  return { optimistic: liveTotal + pending, pending, commit };
}
