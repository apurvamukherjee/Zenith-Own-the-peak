import { useCallback, useSyncExternalStore } from "react";

// Single subscribe/getSnapshot pair for every matchMedia-backed hook.
// `serverValue` is what SSR / a matchMedia-less environment should report.
export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    if (typeof window === "undefined" || !window.matchMedia) return () => {};
    const mq = window.matchMedia(query);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined" || !window.matchMedia) return serverValue;
    return window.matchMedia(query).matches;
  }, [query, serverValue]);

  return useSyncExternalStore(subscribe, getSnapshot, () => serverValue);
}
