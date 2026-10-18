import { useEffect, useRef, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, App as AntApp } from "antd";
import { AnimatePresence, MotionConfig } from "framer-motion";
import { getTheme, type Mode } from "./theme";
import { useSetting } from "./hooks/useSettings";
import { AppShell } from "./components/AppShell";
import { SplashScreen } from "./components/SplashScreen";
import { BloodDrop } from "./components/BloodDrop";
import { OnboardingFlow } from "./features/onboarding/OnboardingFlow";
import { seedIfEmpty } from "./config/seedProgram";
import { seedTaskLists, migrateSchedulesToTasks } from "./config/seedTaskLists";
import { seedExpenseCategories } from "./config/expenseCategories";
import { accentById, DEFAULT_ACCENT } from "./lib/rewardVault";
import { hideNativeSplash } from "./lib/nativeShell";

export default function App() {
  // Splash's own cinematic timer (glitch beats, wordmark reveal) always runs
  // its full ~3.8s on a fast device — that's the intended minimum brand
  // moment, not something to cut short. But gating `ready` on the timer
  // ALONE meant that if seeding (below) ever took longer than 3.8s on a slow
  // device, splash would unmount into a bare loading spinner instead of
  // straight into the app — a visible "stuck screen" hop. Requiring both
  // flags keeps splash mounted (on its final, static frame — no re-loop)
  // until seeding actually catches up, so the gap can never show.
  // Cinematic splash plays once per app open (sessionStorage dies with the
  // tab / app process), never on refresh or pull-to-refresh.
  const [splashTimerDone, setSplashTimerDone] = useState(() => {
    try { return sessionStorage.getItem("zenith:splash-session") === "1"; } catch { return false; }
  });
  const [seeded, setSeeded] = useState(false);
  const ready = splashTimerDone && seeded;
  const mode = useSetting("themeMode") as Mode;
  const onboarded = useSetting("onboarded");
  const highContrast = Number(useSetting("highContrast")) === 1;
  const reduceMotion = Number(useSetting("reduceMotion")) === 1;
  const [showOnboarding, setShowOnboarding] = useState(false);
  const resolved: Mode = mode === "light" ? "light" : "dark";
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
  // --hero, which stays gothic dark always). Clearing the inline override for
  // the default lets the stylesheet's :root / [data-theme=dark] values apply
  // normally again.
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

  // Transition class lives ~450ms around a theme change only: a permanent
  // `*` transition re-animates every color change app-wide and janks mid-range Android.
  const firstTheme = useRef(true);
  useEffect(() => {
    if (firstTheme.current) { firstTheme.current = false; return; }
    const root = document.documentElement;
    root.classList.add("theme-ready");
    const t = window.setTimeout(() => root.classList.remove("theme-ready"), 450);
    return () => window.clearTimeout(t);
  }, [resolved]);

  // Seed exercise library + default PPL on first launch — MUST complete before rendering
  useEffect(() => {
    Promise.all([seedIfEmpty(), seedTaskLists(), seedExpenseCategories()])
      .then(() => migrateSchedulesToTasks())
      .then(() => setSeeded(true))
      .catch(() => setSeeded(true));
  }, []);

  // Show onboarding after splash+seed if not yet onboarded
  useEffect(() => {
    if (ready && Number(onboarded) !== 1) setShowOnboarding(true);
  }, [ready, onboarded]);

  // Native shell: the OS launch image stays up (launchAutoHide: false) until
  // the in-app splash+seed gate is actually ready, so there's never a native
  // splash -> blank frame -> in-app splash double-hop.
  useEffect(() => {
    if (ready) hideNativeSplash();
  }, [ready]);

  return (
    <MotionConfig reducedMotion="user">
    <ConfigProvider theme={getTheme(resolved, accentHex)}>
      <AntApp>
        <AnimatePresence>
          {!ready && <SplashScreen key="splash" onDone={() => {
            try { sessionStorage.setItem("zenith:splash-session", "1"); } catch { /* storage blocked: splash replays */ }
            setSplashTimerDone(true);
          }} />}
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
    </MotionConfig>
  );
}
