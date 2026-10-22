import "@ant-design/v5-patch-for-react-19";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import "./index.css";
import "./components/ui/ui.css";
import App from "./App";
import { convexClient } from "./lib/convexClient";
import { initStatusBar } from "./lib/nativeShell";
import { inject } from "@vercel/analytics";
inject();
initStatusBar();
// Without this, IndexedDB is "best effort" and the OS may clear it under storage
// pressure — the one way data disappears without an uninstall.
void navigator.storage?.persist?.();
if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js");

const root = convexClient ? (
  <ConvexAuthProvider client={convexClient}>
    <App />
  </ConvexAuthProvider>
) : (
  <App />
);

createRoot(document.getElementById("root")!).render(<StrictMode>{root}</StrictMode>);
