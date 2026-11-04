import "@ant-design/v5-patch-for-react-19";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./components/ui/ui.css";
import App from "./App";
import { convexConfigured } from "./lib/convexClient";
import { initStatusBar } from "./lib/nativeShell";
import { inject } from "@vercel/analytics";
import { installDevClock } from "./lib/devClock";
if (import.meta.env.DEV) installDevClock();
inject();
initStatusBar();
// Without this, IndexedDB is "best effort" and the OS may clear it under storage
// pressure — the one way data disappears without an uninstall.
void navigator.storage?.persist?.();
if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js");

const container = document.getElementById("root")!;
if (convexConfigured) {
  // Convex + auth (~200 kB) load only for installs that use the cloud.
  void import("./lib/convexRoot").then(({ ConvexRoot }) => {
    createRoot(container).render(<StrictMode><ConvexRoot><App /></ConvexRoot></StrictMode>);
  });
} else {
  createRoot(container).render(<StrictMode><App /></StrictMode>);
}
