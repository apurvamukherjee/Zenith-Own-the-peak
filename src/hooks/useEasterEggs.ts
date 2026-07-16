import { useEffect, useRef, useState } from "react";
import { App } from "antd";
import { db } from "../db/db";
import { useSetting, setSetting } from "./useSettings";
import { KONAMI_SEQUENCE } from "../lib/easterEggs";
import { hapticSuccess } from "../lib/haptics";
import { unlockAudio } from "../lib/audio";

// -----------------------------------------------------------------------------
// Master easter-egg orchestrator. Mounted ONCE at the top of AppShell so the
// listeners are always alive but only cost one keydown handler and one focus
// handler on the whole document.
//
// Returned state:
//   peakFlash — pulses to a truthy timestamp each time the user types "peak".
//               Renders a full-screen gradient fade via <PeakFlash/>.
//   showDebug — controls the IDDQD debug panel (lazy-mounted by consumer).
// -----------------------------------------------------------------------------
export interface EasterEggState {
  peakFlash: number;   // rerender key; 0 means idle
  showDebug: boolean;
  closeDebug: () => void;
}

export function useEasterEggs(): EasterEggState {
  const { message } = App.useApp();
  const eggKonami = useSetting("eggKonami");
  const eggIddqd = useSetting("eggIddqd");
  const hardcoreUntil = Number(useSetting("hardcoreUntil"));
  const sabbathUntil = Number(useSetting("sabbathUntil"));

  const [peakFlash, setPeakFlash] = useState(0);
  const [showDebug, setShowDebug] = useState(false);

  // Rolling buffer for the Konami sequence.
  const konamiBufRef = useRef<string[]>([]);
  // Rolling buffer for "peak" and "iddqd" — same handler.
  const wordBufRef = useRef<string>("");

  useEffect(() => {
    function onKeydown(ev: KeyboardEvent) {
      // Warm up audio on first meaningful gesture so bell/trumpets can play
      // later without a suspended-context surprise.
      unlockAudio();

      const raw = ev.key ?? "";
      const key = raw.toUpperCase();

      // ---- Konami sequence detection ----
      if (KONAMI_SEQUENCE.includes(key)) {
        konamiBufRef.current.push(key);
        // Trim to the last N keys where N = sequence length.
        if (konamiBufRef.current.length > KONAMI_SEQUENCE.length) {
          konamiBufRef.current.shift();
        }
        if (
          konamiBufRef.current.length === KONAMI_SEQUENCE.length &&
          konamiBufRef.current.every((k, i) => k === KONAMI_SEQUENCE[i])
        ) {
          konamiBufRef.current = [];
          void handleKonami(message);
        }
      } else if (key.length > 1 && key !== "SHIFT" && key !== "CONTROL" && key !== "META" && key !== "ALT") {
        // Non-arrow, non-letter special keys break the sequence.
        konamiBufRef.current = [];
      }

      // ---- Word buffers ("peak", "iddqd") ----
      if (raw.length === 1 && /[a-zA-Z]/.test(raw)) {
        wordBufRef.current = (wordBufRef.current + raw.toLowerCase()).slice(-8);
        if (wordBufRef.current.endsWith("peak")) {
          setPeakFlash(Date.now());
          void setSetting("eggPeak", 1);
        }
        if (wordBufRef.current.endsWith("iddqd")) {
          setShowDebug(true);
          void setSetting("eggIddqd", 1);
        }
      }
    }
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [message]);

  // ---- Auto-expire Hardcore / Sabbath windows when the ms elapses. ----
  useEffect(() => {
    const now = Date.now();
    const nextExpiry = Math.min(
      hardcoreUntil > now ? hardcoreUntil : Infinity,
      sabbathUntil > now ? sabbathUntil : Infinity,
    );
    if (!isFinite(nextExpiry)) return;
    const t = window.setTimeout(() => {
      // Poke the settings so `useSetting` subscribers refresh.
      void db.settings.get("hardcoreUntil").then((row) => {
        if (Number(row?.value ?? 0) <= Date.now()) void setSetting("hardcoreUntil", 0);
      });
      void db.settings.get("sabbathUntil").then((row) => {
        if (Number(row?.value ?? 0) <= Date.now()) void setSetting("sabbathUntil", 0);
      });
    }, nextExpiry - now + 200);
    return () => window.clearTimeout(t);
  }, [hardcoreUntil, sabbathUntil]);

  // Void suppresses "unused" warnings — the state itself matters, not the settings.
  void eggKonami; void eggIddqd;

  return {
    peakFlash,
    showDebug,
    closeDebug: () => setShowDebug(false),
  };
}

// -----------------------------------------------------------------------------
// Konami handling — plain function so the effect stays tidy. Time-based variants:
//   • 4:00-6:00 AM local → activates Hardcore Mode for 24 h.
//   • Sunday             → activates Sabbath Mode until end of day.
//   • Otherwise          → plain unlock (Contra badge).
// Always sets eggKonami=1 so the "Contra" achievement resolves.
// -----------------------------------------------------------------------------
async function handleKonami(message: ReturnType<typeof App.useApp>["message"]): Promise<void> {
  void hapticSuccess();
  await setSetting("eggKonami", 1);

  const now = new Date();
  const hour = now.getHours();
  const dow = now.getDay(); // 0 = Sunday

  if (hour >= 4 && hour < 6) {
    const until = Date.now() + 24 * 60 * 60 * 1000;
    await setSetting("hardcoreUntil", until);
    message.success({ content: "🔥 Hardcore Mode engaged — 24 hours.", duration: 4 });
    return;
  }
  if (dow === 0) {
    // Sabbath until end of Sunday.
    const eod = new Date(now); eod.setHours(23, 59, 59, 999);
    await setSetting("sabbathUntil", eod.getTime());
    message.success({ content: "🕊 Sabbath Mode engaged — rest well.", duration: 4 });
    return;
  }
  message.success({ content: "🎮 Contra unlocked.", duration: 3 });
}
