import { useCallback, useRef, useState } from "react";
import { hapticMedium } from "../lib/haptics";

// Hook that lets a list adopt long-press → checkbox-mode → batch-delete UX.
// Caller receives:
//   isSelecting    - true when the checkbox mode is on
//   selected       - Set<id> of currently-picked items
//   toggle(id)     - flips membership
//   clear()        - exits selection mode
//   onItemPress    - attach to each row's onPointerDown for long-press entry
//   onItemUp       - attach to each row's onPointerUp (cancels timer)
export function useBulkSelect<T extends number | string>() {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<T>>(new Set());
  const timerRef = useRef<number | null>(null);
  const pressingIdRef = useRef<T | null>(null);

  const clear = useCallback(() => {
    setSelected(new Set());
    setIsSelecting(false);
  }, []);

  const toggle = useCallback((id: T) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      // Leaving selection mode when nothing remains is a nicer default.
      if (next.size === 0) setIsSelecting(false);
      return next;
    });
  }, []);

  const onItemPress = useCallback((id: T) => {
    // In selection mode, a tap should toggle. We don't fight it with a timer.
    if (isSelecting) return;
    pressingIdRef.current = id;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      // Enter selection mode with THIS item pre-selected.
      void hapticMedium();
      setIsSelecting(true);
      setSelected(new Set([id]));
      timerRef.current = null;
    }, 500);
  }, [isSelecting]);

  const onItemUp = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pressingIdRef.current = null;
  }, []);

  return { isSelecting, selected, toggle, clear, onItemPress, onItemUp };
}
