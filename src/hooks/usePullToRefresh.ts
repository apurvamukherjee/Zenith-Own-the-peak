import { useEffect, useRef, useState } from "react";
import { hapticLight } from "../lib/haptics";

// Attach to a scrollable element ref. When the user pulls down at scrollTop==0
// past THRESHOLD pixels and releases, `onRefresh()` fires. `pullPx` is exposed
// so consumers can render a matching visual (spinner, progress bar).
const THRESHOLD = 70;
const MAX = 110;

export function usePullToRefresh(
  ref: React.RefObject<HTMLElement | null>,
  onRefresh: () => Promise<void> | void,
) {
  const [pullPx, setPullPx] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const primedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onTouchStart(e: TouchEvent) {
      if (!el) return;
      if (el.scrollTop > 0) return;
      startYRef.current = e.touches[0].clientY;
      primedRef.current = false;
    }
    function onTouchMove(e: TouchEvent) {
      if (!el) return;
      if (startYRef.current === null) return;
      if (el.scrollTop > 0) { startYRef.current = null; setPullPx(0); return; }
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy <= 0) { setPullPx(0); return; }
      const damped = Math.min(MAX, dy * 0.5);
      setPullPx(damped);
      if (!primedRef.current && damped >= THRESHOLD) {
        primedRef.current = true;
        void hapticLight();
      }
    }
    async function onTouchEnd() {
      if (startYRef.current === null) return;
      startYRef.current = null;
      if (primedRef.current && !refreshing) {
        setRefreshing(true);
        try { await onRefresh(); } catch { /* ignore */ }
        setRefreshing(false);
      }
      setPullPx(0);
      primedRef.current = false;
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [ref, onRefresh, refreshing]);

  return { pullPx, refreshing, primed: pullPx >= THRESHOLD, threshold: THRESHOLD };
}
