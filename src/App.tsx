import { Suspense, lazy, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider, App as AntApp, Spin } from "antd";
import { AnimatePresence } from "framer-motion";
import { appTheme } from "./theme";
import { AppShell } from "./components/AppShell";
import { SplashScreen } from "./components/SplashScreen";
import { DashboardPage } from "./features/dashboard/DashboardPage";

// Heavier / chart pages are lazy so recharts loads only when visited.
const WorkoutLogPage = lazy(() => import("./features/workout/WorkoutLogPage").then((m) => ({ default: m.WorkoutLogPage })));
const WorkoutProgressPage = lazy(() => import("./features/workout/WorkoutProgressPage").then((m) => ({ default: m.WorkoutProgressPage })));
const WaterPage = lazy(() => import("./features/water/WaterPage").then((m) => ({ default: m.WaterPage })));
const SleepPage = lazy(() => import("./features/sleep/SleepPage").then((m) => ({ default: m.SleepPage })));
const StudyPage = lazy(() => import("./features/study/StudyPage").then((m) => ({ default: m.StudyPage })));
const FuelPage = lazy(() => import("./features/fuel/FuelPage").then((m) => ({ default: m.FuelPage })));
const ProfilePage = lazy(() => import("./features/profile/ProfilePage").then((m) => ({ default: m.ProfilePage })));

const Fallback = (
  <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><Spin /></div>
);

export default function App() {
  const [ready, setReady] = useState(false);

  return (
    <ConfigProvider theme={appTheme}>
      <AntApp>
        <AnimatePresence>
          {!ready && <SplashScreen key="splash" onDone={() => setReady(true)} />}
        </AnimatePresence>
        <BrowserRouter>
          <Suspense fallback={Fallback}>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<DashboardPage />} />
                <Route path="workout" element={<WorkoutLogPage />} />
                <Route path="progress" element={<WorkoutProgressPage />} />
                <Route path="water" element={<WaterPage />} />
                <Route path="sleep" element={<SleepPage />} />
                <Route path="study" element={<StudyPage />} />
                <Route path="fuel" element={<FuelPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}
