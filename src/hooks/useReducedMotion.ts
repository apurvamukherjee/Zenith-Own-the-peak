import { useEffect, useState } from "react";
import { useSetting } from "./useSettings";

// Reduce animation intensity when:
//  • the OS reports prefers-reduced-motion, OR
//  • the user explicitly toggled "Reduce motion" in Settings.
// Returned boolean is intentionally simple — components should treat any
// truthy value as "skip flourishes, keep functionality".
export function useReducedMotion(): boolean {
  const settingFlag = Number(useSetting("reduceMotion")) === 1;
  const [osReduce, setOsReduce] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setOsReduce(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, []);
  return settingFlag || osReduce;
}
