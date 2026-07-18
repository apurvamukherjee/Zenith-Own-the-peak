import { useEffect, useState } from "react";

// Returns `"decimal"` on touch-first devices, `undefined` on hover-capable
// ones. On desktop with a real keyboard, forcing inputMode="decimal" pops the
// on-screen software keyboard even when unnecessary, obscuring form validation.
// The `(hover: hover)` media query is the standard signal for "pointer device
// present" — laptops with attached trackpads/mice match, phones/tablets don't.
//
// Usage: `<InputNumber inputMode={useNumericInputMode()} ... />`
export function useNumericInputMode(): "decimal" | undefined {
  const [mode, setMode] = useState<"decimal" | undefined>(() => {
    if (typeof window === "undefined") return "decimal";
    return window.matchMedia("(hover: hover)").matches ? undefined : "decimal";
  });
  useEffect(() => {
    const m = window.matchMedia("(hover: hover)");
    const on = () => setMode(m.matches ? undefined : "decimal");
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return mode;
}
