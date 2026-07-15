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

export default function App() {
  const [ready, setReady] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const mode = useSetting("themeMode") as Mode;
  const onboarded = useSetting("onboarded");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const resolved: Mode = mode === "light" ? "light" : "dark";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolved);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", resolved === "dark" ? "#08080a" : "#7c5cfc");
  }, [resolved]);

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
          <BrowserRouter>
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
