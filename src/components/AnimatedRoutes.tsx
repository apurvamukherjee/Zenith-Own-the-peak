import { Suspense, lazy } from "react";
import { Routes, Route, useLocation, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BloodDrop } from "./BloodDrop";
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
const ExpensesPage = lazy(() => import("../features/expenses/ExpensesPage").then((m) => ({ default: m.ExpensesPage })));
const CalendarPage = lazy(() => import("../features/calendar/CalendarPage").then((m) => ({ default: m.CalendarPage })));
const GlancePage = lazy(() => import("../features/glance/GlancePage").then((m) => ({ default: m.GlancePage })));
const ProfilePage = lazy(() => import("../features/profile/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const HallOfFrame = lazy(() => import("../features/achievements/HallOfFrame").then((m) => ({ default: m.HallOfFrame })));
const VaultPage = lazy(() => import("../features/vault/VaultPage").then((m) => ({ default: m.VaultPage })));
const SettingsPage = lazy(() => import("../features/settings/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const QuickLogPage = lazy(() => import("../features/quick/QuickLogPage").then((m) => ({ default: m.QuickLogPage })));
const LeaderboardPage = lazy(() => import("../features/leaderboard/LeaderboardPage").then((m) => ({ default: m.LeaderboardPage })));
const TasksPage = lazy(() => import("../features/tasks/TasksPage").then((m) => ({ default: m.TasksPage })));

const Fallback = <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><BloodDrop size={32} /></div>;

function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "64px 24px" }}>
      <img src="/logo-mark.png" alt="" width={40} height={40} style={{ objectFit: "contain", marginBottom: 8, opacity: 0.85 }} />
      <div className="display" style={{ fontSize: 52, fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>404</div>
      <div style={{ fontSize: 15, color: "var(--ink-soft)", margin: "10px 0 20px" }}>
        There's no peak here. That path doesn't exist.
      </div>
      <Link to="/" style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}>← Back to Home</Link>
    </div>
  );
}

export function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={location.pathname}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18, ease: "easeOut" }}>
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
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="glance" element={<GlancePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="hall" element={<HallOfFrame />} />
            <Route path="vault" element={<VaultPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="quick" element={<QuickLogPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
