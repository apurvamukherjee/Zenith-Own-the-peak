import { useMediaQuery } from "./useMediaQuery";

// Returns `"decimal"` on touch-first devices, `undefined` on hover-capable
// ones. On desktop with a real keyboard, forcing inputMode="decimal" pops the
// on-screen software keyboard even when unnecessary, obscuring form validation.
// The `(hover: hover)` media query is the standard signal for "pointer device
// present" — laptops with attached trackpads/mice match, phones/tablets don't.
//
// Usage: `<InputNumber inputMode={useNumericInputMode()} ... />`
export function useNumericInputMode(): "decimal" | undefined {
  // No matchMedia (SSR) → assume touch, matching the pre-hook default.
  return useMediaQuery("(hover: hover)", false) ? undefined : "decimal";
}
