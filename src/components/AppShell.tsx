import { useRef } from "react";
import { AppBar } from "./AppBar";
import { BottomNav } from "./BottomNav";
import { AnimatedRoutes } from "./AnimatedRoutes";
import { NavStrip } from "./NavStrip";
import { QuickLogFab } from "./QuickLogFab";
import { PwaInstallPrompt } from "./PwaInstallPrompt";
import { GlobalRestChip } from "./GlobalRestChip";
import { PRCelebration } from "./PRCelebration";
import { useSetting } from "../hooks/useSettings";
import { useReminderEngine } from "../features/reminders/useReminderEngine";
import { useAchievementEngine } from "../features/achievements/useAchievements";
import { useScrollRestore } from "../hooks/useScrollRestore";

export function AppShell() {
  useReminderEngine();
  useAchievementEngine();
  const bgImage = useSetting("bgImage");
  const bgBlur = useSetting("bgBlur");
  const bgOpacity = useSetting("bgOpacity");

  // Preserve scroll position on browser Back/Forward.
  const mainRef = useRef<HTMLElement | null>(null);
  useScrollRestore(mainRef);

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
    </div>
  );
}
