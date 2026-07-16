import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Module-level cache: pathname → last scrollTop of the main scroller.
// Survives across route changes without needing a Context. Reset on hard reload.
const scrollCache = new Map<string, number>();

/**
 * Mount once inside AppShell. Snapshots the main scroller's scrollTop when
 * leaving a route and restores it on POP (browser back/forward). On PUSH we
 * scroll to top — that's normal SPA behavior for a fresh navigation.
 *
 * The main scroller is the <main> element inside AppShell. We look it up via
 * the passed ref (or fall back to first <main>) each effect run so it works
 * even if AppShell later swaps trees.
 */
export function useScrollRestore(scrollerRef: React.RefObject<HTMLElement | null>) {
  const location = useLocation();
  const navType = useNavigationType(); // "POP" | "PUSH" | "REPLACE"
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const el = scrollerRef.current ?? document.querySelector("main");
    if (!el) return;
    const prev = prevPathRef.current;
    // Save the OUTGOING route's scroll before restoring the incoming one.
    if (prev && prev !== location.pathname) {
      scrollCache.set(prev, el.scrollTop);
    }
    if (navType === "POP") {
      const saved = scrollCache.get(location.pathname) ?? 0;
      // Restore after layout — a rAF handles most cases; two rAFs handle
      // lazy-loaded routes where Suspense swaps content on the next frame.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { el.scrollTop = saved; });
      });
    } else {
      el.scrollTop = 0;
    }
    prevPathRef.current = location.pathname;
  }, [location.pathname, navType, scrollerRef]);
}
