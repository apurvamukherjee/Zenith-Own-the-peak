import { useMediaQuery } from "./useMediaQuery";

// Detect narrow viewports (phones + phablets). Used to switch antd Modals
// into bottom-sheet mode and toggle a few compact layouts. SSR-safe.
export function useIsMobile(breakpoint = 640): boolean {
  return useMediaQuery(`(max-width: ${breakpoint}px)`);
}
