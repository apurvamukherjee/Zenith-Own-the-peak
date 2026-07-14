import { AppBar } from "./AppBar";
import { BottomNav } from "./BottomNav";
import { AnimatedRoutes } from "./AnimatedRoutes";
import { NavStrip } from "./NavStrip";
import { QuickLogFab } from "./QuickLogFab";
import { useSetting } from "../hooks/useSettings";
import { useReminderEngine } from "../features/reminders/useReminderEngine";

export function AppShell() {
  useReminderEngine();
  const bgImage = useSetting("bgImage");
  const bgBlur = useSetting("bgBlur");
  const bgOpacity = useSetting("bgOpacity");

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
        <main style={{ flex: 1 }}>
          <AnimatedRoutes />
        </main>
        <QuickLogFab />
        <BottomNav />
      </div>
    </div>
  );
}
