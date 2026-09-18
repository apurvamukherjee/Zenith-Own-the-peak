import { useSetting } from "./useSettings";
import { useMediaQuery } from "./useMediaQuery";

// Reduce animation intensity when:
//  • the OS reports prefers-reduced-motion, OR
//  • the user explicitly toggled "Reduce motion" in Settings.
// Returned boolean is intentionally simple — components should treat any
// truthy value as "skip flourishes, keep functionality".
export function useReducedMotion(): boolean {
  const settingFlag = Number(useSetting("reduceMotion")) === 1;
  const osReduce = useMediaQuery("(prefers-reduced-motion: reduce)");
  return settingFlag || osReduce;
}
