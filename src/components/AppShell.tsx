import { useRef, lazy, Suspense } from "react";
import { AppBar } from "./AppBar";
import { BottomNav } from "./BottomNav";
import { AnimatedRoutes } from "./AnimatedRoutes";
import { NavStrip } from "./NavStrip";
import { QuickLogFab } from "./QuickLogFab";
import { PwaInstallPrompt } from "./PwaInstallPrompt";
import { GlobalRestChip } from "./GlobalRestChip";
import { PRCelebration } from "./PRCelebration";
import { PeakFlash } from "./PeakFlash";
import { BirthdayConfetti } from "./BirthdayConfetti";
import { DramaticIntro } from "./DramaticIntro";
import { CommandPaletteHost } from "./CommandPalette";
import { useSetting } from "../hooks/useSettings";
import { useReminderEngine } from "../features/reminders/useReminderEngine";
import { useAchievementEngine } from "../features/achievements/useAchievements";
import { useScrollRestore } from "../hooks/useScrollRestore";
import { useEasterEggs } from "../hooks/useEasterEggs";

// The DebugPanel is fenced behind IDDQD entry so we can afford to
// lazy-load it — zero cost for the 99% of users who never trigger it.
const DebugPanel = lazy(() => import("./DebugPanel").then((m) => ({ default: m.DebugPanel })));

export function AppShell() {
  useReminderEngine();
  useAchievementEngine();
  const bgImage = useSetting("bgImage");
  const bgBlur = useSetting("bgBlur");
  const bgOpacity = useSetting("bgOpacity");

  const mainRef = useRef<HTMLElement | null>(null);
  useScrollRestore(mainRef);

  // Master easter-egg orchestrator: one global keydown listener, one focus
  // handler, and a couple of state slots we surface as overlays below.
  const eggs = useEasterEggs();

  return (
    <div className="app-root" style={{ position: "relative", background: "var(--bg)" }}>
      {bgImage && (
        <div aria-hidden style={{
          position: "fixed", inset: 0, zIndex: 0,
          backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center",
          filter: `blur(${bgBlur}px)`, opacity: bgOpacity / 100, transform: "scale(1.1)",
        }} />
      )}
      <div style={{ position: "relative", zIndex: 2, maxWidth: 480, margin: "0 auto",
        minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        <AppBar />
        <NavStrip />
        <main ref={mainRef} style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          <AnimatedRoutes />
        </main>
        <QuickLogFab />
        <GlobalRestChip />
        <PwaInstallPrompt />
        <BottomNav />
      </div>
      <PRCelebration />
      <PeakFlash triggerKey={eggs.peakFlash} />
      <BirthdayConfetti />
      <DramaticIntro />
      <CommandPaletteHost />
      {eggs.showDebug && (
        <Suspense fallback={null}>
          <DebugPanel open={eggs.showDebug} onClose={eggs.closeDebug} />
        </Suspense>
      )}
    </div>
  );
}
