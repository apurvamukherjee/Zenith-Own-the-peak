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
const HabitsPage = lazy(() => import("../features/habits/HabitsPage").then((m) => ({ default: m.HabitsPage })));
const CalendarPage = lazy(() => import("../features/calendar/CalendarPage").then((m) => ({ default: m.CalendarPage })));
const GlancePage = lazy(() => import("../features/glance/GlancePage").then((m) => ({ default: m.GlancePage })));
const ProfilePage = lazy(() => import("../features/profile/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const HallOfFrame = lazy(() => import("../features/achievements/HallOfFrame").then((m) => ({ default: m.HallOfFrame })));
const VaultPage = lazy(() => import("../features/vault/VaultPage").then((m) => ({ default: m.VaultPage })));
const SettingsPage = lazy(() => import("../features/settings/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const QuickLogPage = lazy(() => import("../features/quick/QuickLogPage").then((m) => ({ default: m.QuickLogPage })));
const LeaderboardPage = lazy(() => import("../features/leaderboard/LeaderboardPage").then((m) => ({ default: m.LeaderboardPage })));
const ArcPage = lazy(() => import("../features/winterArc/ArcPage").then((m) => ({ default: m.ArcPage })));
const TasksPage = lazy(() => import("../features/tasks/TasksPage").then((m) => ({ default: m.TasksPage })));

const Fallback = <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><BloodDrop size={32} /></div>;

function NotFound() {
  return (
    <div className="z-page" style={{ paddingTop: 48 }}>
      <div className="z-hero" style={{ textAlign: "center", padding: "36px 20px" }}>
        <div className="z-aura z-aura--a" aria-hidden />
        <div className="z-aura z-aura--b" aria-hidden />
        <img src="/logo-mark.png" alt="" width={44} height={44} style={{ objectFit: "contain", marginBottom: 10, filter: "drop-shadow(0 0 14px var(--ember-glow))" }} />
        <div className="display" style={{ fontSize: 64, fontWeight: 800, color: "var(--accent)", lineHeight: 1, letterSpacing: "-0.04em" }}>404</div>
        <div style={{ fontSize: 15, color: "var(--ink-soft)", margin: "12px 0 22px" }}>There's no peak here. That path doesn't exist.</div>
        <Link to="/" className="z-btn z-btn--solid">Back to Home</Link>
      </div>
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
            <Route path="habits" element={<HabitsPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="glance" element={<GlancePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="hall" element={<HallOfFrame />} />
            <Route path="vault" element={<VaultPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="quick" element={<QuickLogPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="arc" element={<ArcPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
