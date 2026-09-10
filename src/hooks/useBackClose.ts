import { useEffect, useRef } from "react";

// When an overlay is `open`, push a throwaway history entry so the device /
// browser Back button (and the AppBar back arrow, which calls history.back)
// dismisses the overlay instead of navigating away from the page underneath.
// If the overlay is closed via its own UI, we quietly pop the entry we added.
//
// `onClose` is read through a ref rather than being an effect dependency.
// Most callers pass an inline `() => setOpen(false)`, a fresh closure every
// render — and the app's global mutation bus re-renders the whole tree
// (via AppShell's XP/achievement engines) on every Dexie write anywhere,
// not just ones related to this overlay. If `onClose` were a dependency,
// any such write while the overlay is open would tear the effect down
// (calling history.back(), since poppedByUser is still false) and rebuild
// it, and the resulting async popstate could invoke onClose and close the
// overlay for no reason the user caused. Depending on `open` alone avoids
// that entirely while still always calling the latest onClose.
export function useBackClose(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    let poppedByUser = false;
    window.history.pushState({ zModal: true }, "");
    const onPop = () => { poppedByUser = true; onCloseRef.current(); };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      // Closed programmatically (not via Back) → remove our extra entry.
      if (!poppedByUser && (window.history.state as { zModal?: boolean } | null)?.zModal) {
        window.history.back();
      }
    };
  }, [open]);
}
