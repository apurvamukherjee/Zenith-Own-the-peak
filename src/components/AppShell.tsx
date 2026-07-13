import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";

export function AppShell() {
  return (
    <div
      style={{
        maxWidth: 480, margin: "0 auto", minHeight: "100dvh",
        display: "flex", flexDirection: "column",
        background: "var(--bg)",
      }}
    >
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
