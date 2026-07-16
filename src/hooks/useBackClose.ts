import { useEffect } from "react";

// When an overlay is `open`, push a throwaway history entry so the device /
// browser Back button (and the AppBar back arrow, which calls history.back)
// dismisses the overlay instead of navigating away from the page underneath.
// If the overlay is closed via its own UI, we quietly pop the entry we added.
export function useBackClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    let poppedByUser = false;
    window.history.pushState({ zModal: true }, "");
    const onPop = () => { poppedByUser = true; onClose(); };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      // Closed programmatically (not via Back) → remove our extra entry.
      if (!poppedByUser && (window.history.state as { zModal?: boolean } | null)?.zModal) {
        window.history.back();
      }
    };
  }, [open, onClose]);
}
