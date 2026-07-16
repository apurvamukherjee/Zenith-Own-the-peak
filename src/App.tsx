import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, App as AntApp, Spin } from "antd";
import { AnimatePresence } from "framer-motion";
import { getTheme, type Mode } from "./theme";
import { useSetting } from "./hooks/useSettings";
import { AppShell } from "./components/AppShell";
import { SplashScreen } from "./components/SplashScreen";
import { OnboardingFlow } from "./features/onboarding/OnboardingFlow";
import { seedIfEmpty } from "./config/seedProgram";
import { useAdaptiveTheme } from "./hooks/useAdaptiveTheme";

export default function App() {
  const [ready, setReady] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const mode = useSetting("themeMode") as Mode;
  const onboarded = useSetting("onboarded");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const resolved: Mode = mode === "light" ? "light" : "dark";
  const adaptive = useAdaptiveTheme();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolved);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", resolved === "dark" ? "#08080a" : "#c8112a");
    // Paint-cache only (Dexie stays the source of truth): lets the inline script
    // in index.html set the right theme before React mounts, killing the flash.
    try { localStorage.setItem("zenith-theme", resolved); } catch { /* ignore */ }
  }, [resolved]);

  // Adaptive theme: publish the time-of-day gradient as --hero so hero-grad
  // surfaces (training card, avatars, glance card) breathe with the day.
  // Light mode keeps the static crimson-black hero — adaptive only applies in dark mode.
  useEffect(() => {
    if (resolved === "dark") {
      document.documentElement.style.setProperty("--hero", adaptive.grad);
    } else {
      document.documentElement.style.removeProperty("--hero");
    }
  }, [adaptive.grad, resolved]);

  // Enable theme-transition CSS only after first paint, so initial load never fades in.
  useEffect(() => {
    const t = requestAnimationFrame(() => document.documentElement.classList.add("theme-ready"));
    return () => cancelAnimationFrame(t);
  }, []);

  // Seed exercise library + default PPL on first launch — MUST complete before rendering
  useEffect(() => { seedIfEmpty().then(() => setSeeded(true)).catch(() => setSeeded(true)); }, []);

  // Show onboarding after splash+seed if not yet onboarded
  useEffect(() => {
    if (ready && seeded && Number(onboarded) !== 1) setShowOnboarding(true);
  }, [ready, seeded, onboarded]);

  return (
    <ConfigProvider theme={getTheme(resolved)}>
      <AntApp>
        <AnimatePresence>
          {!ready && <SplashScreen key="splash" onDone={() => setReady(true)} />}
        </AnimatePresence>
        {showOnboarding && <OnboardingFlow onDone={() => setShowOnboarding(false)} />}
        {/* Gate routing behind seed completion so hooks don't query empty tables */}
        {seeded ? (
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppShell />
          </BrowserRouter>
        ) : (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100dvh" }}>
            <Spin size="large" />
          </div>
        )}
      </AntApp>
    </ConfigProvider>
  );
}
