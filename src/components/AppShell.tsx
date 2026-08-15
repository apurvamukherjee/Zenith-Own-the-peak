import { useRef, lazy, Suspense, useEffect, useState, useCallback } from "react";
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
import { LevelUpOverlay } from "./LevelUpOverlay";
import { useSetting } from "../hooks/useSettings";
import { useReminderEngine } from "../features/reminders/useReminderEngine";
import { useTaskReminderSync } from "../features/reminders/useTaskReminderSync";
import { useAchievementEngine } from "../features/achievements/useAchievements";
import { useRewardVaultEngine } from "../features/vault/useRewardVault";
import { useScrollRestore } from "../hooks/useScrollRestore";
import { useEasterEggs } from "../hooks/useEasterEggs";
import { useXPEngine } from "../hooks/useXPEngine";
import { unlockAudio } from "../lib/audio";
import { convexConfigured } from "../lib/convexClient";
import { GoogleCalendarSyncEngine } from "../features/googleCalendar/useGoogleCalendarSync";

const DebugPanel = lazy(() => import("./DebugPanel").then((m) => ({ default: m.DebugPanel })));

export function AppShell() {
  useReminderEngine();
  useTaskReminderSync();
  useAchievementEngine();
  useRewardVaultEngine();

  // Phase 5 XP engine — grants XP on every mutation, fires level-up callback.
  const [levelUp, setLevelUp] = useState<{ level: number; name: string } | null>(null);
  const onLevelUp = useCallback((level: number, name: string) => {
    setLevelUp({ level, name });
  }, []);
  useXPEngine(onLevelUp);

  // WebAudio warm-up on first gesture.
  useEffect(() => {
    const on = () => { unlockAudio(); };
    window.addEventListener("pointerdown", on, { once: true });
    return () => window.removeEventListener("pointerdown", on);
  }, []);

  const bgImage = useSetting("bgImage");
  const bgBlur = useSetting("bgBlur");
  const bgOpacity = useSetting("bgOpacity");
  const mainRef = useRef<HTMLElement | null>(null);
  useScrollRestore(mainRef);
  const eggs = useEasterEggs();

  return (
    <div className="app-root" style={{ position: "relative", background: "var(--bg)" }}>
      {/* Desktop/wide-viewport only: the app column stays a fixed phone width
          (see maxWidth:480 below) by design — on a wide monitor that leaves
          bare gutters either side. A faint centered glow keeps that space
          feeling intentional instead of like an unfinished mobile page. Pure
          CSS (index.css ".app-gutter-glow"), zero-cost/invisible on mobile
          since the column already fills the viewport there. */}
      <div className="app-gutter-glow" aria-hidden />
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
      {/* Google Calendar sync's background half (debounced push + pull-on-
          connect) — gated behind convexConfigured the same way every other
          Convex-dependent piece is, since main.tsx only mounts
          ConvexAuthProvider when configured. */}
      {convexConfigured && <GoogleCalendarSyncEngine />}
      <PRCelebration />
      <PeakFlash triggerKey={eggs.peakFlash} />
      <BirthdayConfetti />
      <DramaticIntro />
      <CommandPaletteHost />
      {levelUp && (
        <LevelUpOverlay
          level={levelUp.level}
          name={levelUp.name}
          onDone={() => setLevelUp(null)}
        />
      )}
      {eggs.showDebug && (
        <Suspense fallback={null}>
          <DebugPanel open={eggs.showDebug} onClose={eggs.closeDebug} />
        </Suspense>
      )}
    </div>
  );
}
