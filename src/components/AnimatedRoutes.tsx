import { useRef } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Suspense, lazy } from "react";
import { Spin } from "antd";
import { metaFor } from "../lib/routes";
import { DashboardPage } from "../features/dashboard/DashboardPage";

const WorkoutLogPage = lazy(() => import("../features/workout/WorkoutLogPage").then((m) => ({ default: m.WorkoutLogPage })));
const WorkoutProgressPage = lazy(() => import("../features/workout/WorkoutProgressPage").then((m) => ({ default: m.WorkoutProgressPage })));
const WaterPage = lazy(() => import("../features/water/WaterPage").then((m) => ({ default: m.WaterPage })));
const SleepPage = lazy(() => import("../features/sleep/SleepPage").then((m) => ({ default: m.SleepPage })));
const StudyPage = lazy(() => import("../features/study/StudyPage").then((m) => ({ default: m.StudyPage })));
const FuelPage = lazy(() => import("../features/fuel/FuelPage").then((m) => ({ default: m.FuelPage })));
const ProfilePage = lazy(() => import("../features/profile/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const NutritionPage = lazy(() => import("../features/nutrition/NutritionPage").then((m) => ({ default: m.NutritionPage })));

const variants = {
  enter: (d: number) => ({ x: d > 0 ? 36 : d < 0 ? -36 : 0, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -24 : d < 0 ? 24 : 0, opacity: 0 }),
};

export function AnimatedRoutes() {
  const location = useLocation();
  const prevRank = useRef(0);
  const rank = metaFor(location.pathname).rank;
  const direction = Math.sign(rank - prevRank.current);
  prevRank.current = rank;

  return (
    <AnimatePresence mode="wait" custom={direction} initial={false}>
      <motion.div
        key={location.pathname}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", padding: 48 }}><Spin /></div>}>
          <Routes location={location}>
            <Route index element={<DashboardPage />} />
            <Route path="workout" element={<WorkoutLogPage />} />
            <Route path="progress" element={<WorkoutProgressPage />} />
            <Route path="water" element={<WaterPage />} />
            <Route path="sleep" element={<SleepPage />} />
            <Route path="study" element={<StudyPage />} />
            <Route path="fuel" element={<FuelPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="nutrition" element={<NutritionPage />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
