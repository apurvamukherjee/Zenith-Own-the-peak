import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, App as AntApp } from "antd";
import { AnimatePresence } from "framer-motion";
import { getTheme, type Mode } from "./theme";
import { useSetting } from "./hooks/useSettings";
import { AppShell } from "./components/AppShell";
import { SplashScreen } from "./components/SplashScreen";
import { BloodDrop } from "./components/BloodDrop";
import { OnboardingFlow } from "./features/onboarding/OnboardingFlow";
import { seedIfEmpty } from "./config/seedProgram";
import { seedTaskLists, migrateSchedulesToTasks } from "./config/seedTaskLists";
import { seedExpenseCategories } from "./config/expenseCategories";
import { useAdaptiveTheme } from "./hooks/useAdaptiveTheme";
import { accentById, DEFAULT_ACCENT } from "./lib/rewardVault";

export default function App() {
  const [ready, setReady] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const mode = useSetting("themeMode") as Mode;
  const onboarded = useSetting("onboarded");
  const highContrast = Number(useSetting("highContrast")) === 1;
  const reduceMotion = Number(useSetting("reduceMotion")) === 1;
  const [showOnboarding, setShowOnboarding] = useState(false);
  const resolved: Mode = mode === "light" ? "light" : "dark";
  const adaptive = useAdaptiveTheme();
  const equippedAccent = String(useSetting("equippedAccent")) || DEFAULT_ACCENT;
  const accentHex = equippedAccent === DEFAULT_ACCENT ? undefined : accentById(equippedAccent)[resolved];

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolved);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", resolved === "dark" ? "#0d0608" : "#c8112a");
    // Paint-cache only (Dexie stays the source of truth): lets the inline script
    // in index.html set the right theme before React mounts, killing the flash.
    try { localStorage.setItem("zenith-theme", resolved); } catch { /* ignore */ }
  }, [resolved]);

  // Reward Vault — equipped accent theme. Only ever touches --accent (never
  // --hero, which stays gothic dark always — see the adaptive-theme effect
  // below). Clearing the inline override for the default lets the stylesheet's
  // :root / [data-theme=dark] values apply normally again.
  useEffect(() => {
    if (accentHex) document.documentElement.style.setProperty("--accent", accentHex);
    else document.documentElement.style.removeProperty("--accent");
  }, [accentHex]);

  // Mirror accessibility flags onto <html> so CSS can key on them.
  useEffect(() => {
    if (highContrast) document.documentElement.setAttribute("data-contrast", "high");
    else document.documentElement.removeAttribute("data-contrast");
  }, [highContrast]);
  useEffect(() => {
    if (reduceMotion) document.documentElement.setAttribute("data-motion", "reduce");
    else document.documentElement.removeAttribute("data-motion");
  }, [reduceMotion]);

  // Adaptive theme: publish the time-of-day gradient as --time-grad.
  // We deliberately do NOT override --hero here — that variable drives all
  // hero cards (.hero-grad), the Hall of Frame entry, glance card, etc.
  // Overriding it with the morning orange gradient was making every dark card
  // go orange/pink (the "AI slop" look). --hero stays gothic dark always.
  // Components that WANT the time colour can use var(--time-grad) directly.
  useEffect(() => {
    document.documentElement.style.setProperty("--time-grad", adaptive.grad);
  }, [adaptive.grad]);

  // Enable theme-transition CSS only after first paint, so initial load never fades in.
  useEffect(() => {
    const t = requestAnimationFrame(() => document.documentElement.classList.add("theme-ready"));
    return () => cancelAnimationFrame(t);
  }, []);

  // Seed exercise library + default PPL on first launch — MUST complete before rendering
  useEffect(() => {
    Promise.all([seedIfEmpty(), seedTaskLists(), seedExpenseCategories()])
      .then(() => migrateSchedulesToTasks())
      .then(() => setSeeded(true))
      .catch(() => setSeeded(true));
  }, []);

  // Show onboarding after splash+seed if not yet onboarded
  useEffect(() => {
    if (ready && seeded && Number(onboarded) !== 1) setShowOnboarding(true);
  }, [ready, seeded, onboarded]);

  return (
    <ConfigProvider theme={getTheme(resolved, accentHex)}>
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
            <BloodDrop size={44} />
          </div>
        )}
      </AntApp>
    </ConfigProvider>
  );
}
