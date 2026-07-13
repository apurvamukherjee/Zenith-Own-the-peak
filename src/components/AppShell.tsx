import { AppBar } from "./AppBar";
import { BottomNav } from "./BottomNav";
import { AnimatedRoutes } from "./AnimatedRoutes";

export function AppShell() {
  return (
    <div
      style={{
        maxWidth: 480, margin: "0 auto", minHeight: "100dvh",
        display: "flex", flexDirection: "column", background: "var(--bg)",
        position: "relative",
      }}
    >
      <AppBar />
      <main style={{ flex: 1 }}>
        <AnimatedRoutes />
      </main>
      <BottomNav />
    </div>
  );
}
