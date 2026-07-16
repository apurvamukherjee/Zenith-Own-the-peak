import { Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Spin } from "antd";
import { DashboardPage } from "../features/dashboard/DashboardPage";

const SessionLogger = lazy(() => import("../features/gym/SessionLogger").then((m) => ({ default: m.SessionLogger })));
const WorkoutPlanner = lazy(() => import("../features/gym/WorkoutPlanner").then((m) => ({ default: m.WorkoutPlanner })));
const WorkoutProgressPage = lazy(() => import("../features/workout/WorkoutProgressPage").then((m) => ({ default: m.WorkoutProgressPage })));
const QuotesPage = lazy(() => import("../features/quotes/QuotesPage").then((m) => ({ default: m.QuotesPage })));
const NutritionPage = lazy(() => import("../features/nutrition/NutritionPage").then((m) => ({ default: m.NutritionPage })));
const WaterPage = lazy(() => import("../features/water/WaterPage").then((m) => ({ default: m.WaterPage })));
const SleepPage = lazy(() => import("../features/sleep/SleepPage").then((m) => ({ default: m.SleepPage })));
const StudyPage = lazy(() => import("../features/study/StudyPage").then((m) => ({ default: m.StudyPage })));
const FuelPage = lazy(() => import("../features/fuel/FuelPage").then((m) => ({ default: m.FuelPage })));
const CalendarPage = lazy(() => import("../features/calendar/CalendarPage").then((m) => ({ default: m.CalendarPage })));
const GlancePage = lazy(() => import("../features/glance/GlancePage").then((m) => ({ default: m.GlancePage })));
const ProfilePage = lazy(() => import("../features/profile/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const HallOfFrame = lazy(() => import("../features/achievements/HallOfFrame").then((m) => ({ default: m.HallOfFrame })));

const Fallback = <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><Spin /></div>;

export function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={location.pathname}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
        <Suspense fallback={Fallback}>
          <Routes location={location}>
            <Route index element={<DashboardPage />} />
            <Route path="workout" element={<SessionLogger />} />
            <Route path="planner" element={<WorkoutPlanner />} />
            <Route path="progress" element={<WorkoutProgressPage />} />
            <Route path="quotes" element={<QuotesPage />} />
            <Route path="nutrition" element={<NutritionPage />} />
            <Route path="water" element={<WaterPage />} />
            <Route path="sleep" element={<SleepPage />} />
            <Route path="study" element={<StudyPage />} />
            <Route path="fuel" element={<FuelPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="glance" element={<GlancePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="hall" element={<HallOfFrame />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
