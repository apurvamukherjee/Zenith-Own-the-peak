import { useEffect } from "react";

// Locks the app's real scroll container while a fullscreen overlay (Focus
// Mode, Gym Focus Mode) is open. `<main>` (AppShell) is what actually
// scrolls — html/body never do, they're fixed at height:100%. A `fixed,
// inset:0` overlay doesn't stop iOS Safari from scroll-chaining a touch to
// that ancestor anyway (chaining follows DOM ancestry, not visual z-order),
// which is what shows its scrollbar/rubber-bands the page behind the
// overlay. Toggling a `data-focus-lock` attribute on `<html>` (index.css)
// instead of mutating `main`'s style directly survives AppShell re-renders,
// which would otherwise stomp a direct style mutation back to
// `overflowY:"auto"` on their own reconciliation pass.
export function useLockScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;
    document.documentElement.setAttribute("data-focus-lock", "1");
    return () => { document.documentElement.removeAttribute("data-focus-lock"); };
  }, [active]);
}
