import { useEffect, useState } from "react";

// Detect narrow viewports (phones + phablets). Used to switch antd Modals
// into bottom-sheet mode and toggle a few compact layouts. SSR-safe.
export function useIsMobile(breakpoint = 640): boolean {
  const query = `(max-width: ${breakpoint}px)`;
  const [is, setIs] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setIs(e.matches);
    // Modern browsers: addEventListener; Safari <14: addListener.
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, [query]);
  return is;
}
