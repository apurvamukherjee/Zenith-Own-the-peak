import { useCallback, useEffect, useRef, useState } from "react";
import { App } from "antd";

// Simple optimistic-write helper for additive numeric UIs (water total, etc.).
// Consumer displays `optimisticTotal = liveTotal + pending`. When the real
// live value ticks past our expected commit, `pending` decays back to 0.
// On a failed write, we roll back and toast an actionable error.
export function useOptimisticNumber(liveTotal: number) {
  const { message } = App.useApp();
  const [pending, setPending] = useState(0);
  const expectedRef = useRef<number>(liveTotal);

  // When live catches up to or exceeds what we expected, absorb the pending.
  useEffect(() => {
    if (liveTotal >= expectedRef.current) {
      expectedRef.current = liveTotal;
      setPending(0);
    }
  }, [liveTotal]);

  const commit = useCallback(async (
    delta: number,
    action: () => Promise<unknown>,
    label = "action",
  ): Promise<boolean> => {
    setPending((p) => p + delta);
    expectedRef.current = liveTotal + delta;
    try {
      await action();
      return true;
    } catch (err) {
      setPending((p) => p - delta);
      expectedRef.current = liveTotal;
      message.error({
        content: `Couldn't save this ${label}. Tap to retry.`,
        duration: 5,
        onClick: () => { void commit(delta, action, label); },
      });
      // Surface the reason to console for anyone debugging.
      console.warn("[useOptimisticNumber] write failed:", err);
      return false;
    }
  }, [liveTotal, message]);

  return { optimistic: liveTotal + pending, pending, commit };
}
