import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Button, Progress, App } from "antd";
import { TbFlame, TbChevronRight, TbReportAnalytics, TbDroplet, TbMoon, TbBarbell, TbBook2, TbPlus, TbSettings } from "react-icons/tb";
import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
import { PageTransition } from "../../components/PageTransition";
import { AnimatedNumber } from "../../components/AnimatedNumber";
import { db } from "../../db/db";
import { useTokens } from "../../hooks/useTokens";
import { useSetting } from "../../hooks/useSettings";
import { useTodayWater, useWorkoutToday, addWater } from "../water/useWater";
import { useRecentSleep } from "../sleep/useSleep";
import { computeUnifiedStreak } from "../../lib/streak.utils";
import { computeTodayScore } from "../../lib/todayScore";
import { fmtDuration } from "../../lib/date.utils";
import { hapticLight } from "../../lib/haptics";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const { message } = App.useApp();
  const t = useTokens();
  const name = useSetting("name");
  const waterGoal = useSetting("waterGoalMl");
  const proteinTarget = useSetting("proteinTargetG");
  const { total: waterMl } = useTodayWater();
  const trained = useWorkoutToday();
  const sleep = useRecentSleep(2);
  const lastSleep = [...sleep].reverse().find(Boolean);

  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState({ score: 0, waterPct: 0, sessionDone: false, sleepLogged: false, proteinPct: 0 });

  // Recompute on each render tick (live queries cause rerender)
  useEffect(() => { computeUnifiedStreak().then(setStreak); }, [waterMl, trained]);
  useEffect(() => { computeTodayScore(waterGoal, proteinTarget).then(setScore); }, [waterMl, waterGoal, proteinTarget]);

  const todayDay = useLiveQuery(async () => {
    const wd = new Date().getDay();
    const entry = await db.weekSchedule.where({ weekday: wd }).first();
    if (!entry?.dayId) return null;
    return db.workoutDays.get(entry.dayId);
  }, []);

  const upNext = useLiveQuery(async () => {
    const items = await db.studyItems.where("status").notEqual("done").sortBy("order");
    return items[0]?.title ?? null;
  }, []);

  async function quickWater(ml: number) {
    await addWater(ml);
    hapticLight();
    message.success(`+${ml}ml 💧`);
  }

  return (
    <PageTransition>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 600 }}>{greeting()}</div>
          <h2 className="display" style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>{name}</h2>
        </div>
        <Link to="/profile"><Button type="text" icon={<TbSettings size={20} />} aria-label="Settings" /></Link>
      </div>

      {/* Today discipline ring */}
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ textAlign: "center", marginBottom: 16 }}>
        <Progress type="dashboard" percent={score.score} size={160} strokeColor={t.accent} strokeWidth={10}
          format={() => (
            <div>
              <div className="display" style={{ fontSize: 36, fontWeight: 800 }}><AnimatedNumber value={score.score} />%</div>
              <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>today's discipline</div>
            </div>
          )} />
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 10 }}>
          <Pill done={score.waterPct >= 100} label="Water" icon={<TbDroplet />} />
          <Pill done={score.sessionDone} label="Train" icon={<TbBarbell />} />
          <Pill done={score.sleepLogged} label="Sleep" icon={<TbMoon />} />
          <Pill done={score.proteinPct >= 100} label="Protein" icon={<span>🍗</span>} />
        </div>
      </motion.div>

      {/* Streak + session card */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Card size="small" style={{ flex: 1 }} styles={{ body: { padding: 14, textAlign: "center" } }}>
          <TbFlame style={{ color: t.gold, fontSize: 22 }} />
          <div className="display" style={{ fontSize: 24, fontWeight: 800, color: t.gold }}><AnimatedNumber value={streak} /></div>
          <div style={{ fontSize: 10, color: "var(--ink-soft)" }}>day streak</div>
        </Card>
        <Link to="/workout" style={{ flex: 2, color: "inherit" }}>
          <Card className="hero-grad" size="small" style={{ border: "none", height: "100%" }} styles={{ body: { padding: 14 } }}>
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600 }}>
              {todayDay ? "Today's training" : "Rest day"}
            </div>
            <div className="display" style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "2px 0" }}>
              {todayDay?.name ?? "Recovery"} <TbChevronRight style={{ verticalAlign: "-2px" }} />
            </div>
          </Card>
        </Link>
      </div>

      {/* Water quick-add */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Progress type="circle" percent={score.waterPct} size={48} strokeColor={score.waterPct >= 100 ? t.teal : t.accent}
            format={() => <span style={{ fontSize: 10, fontWeight: 700 }}>{score.waterPct}%</span>} />
          <Link to="/water" style={{ flex: 1, color: "inherit" }}>
            <div style={{ fontWeight: 700 }}>💧 Water <TbChevronRight style={{ fontSize: 12, color: "var(--ink-soft)" }} /></div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{(waterMl / 1000).toFixed(1)}L of {(waterGoal / 1000).toFixed(1)}L</div>
          </Link>
          <Button size="small" icon={<TbPlus />} onClick={() => quickWater(250)}>250</Button>
          <Button size="small" icon={<TbPlus />} onClick={() => quickWater(500)}>500</Button>
        </div>
      </Card>

      {/* Sleep + study */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Link to="/sleep" style={{ flex: 1, color: "inherit" }}>
          <Card size="small" styles={{ body: { padding: 14 } }}>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}><TbMoon /> Last sleep</div>
            <div className="display" style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)", marginTop: 4 }}>
              {lastSleep ? fmtDuration(lastSleep.durationMin) : "–"}
            </div>
          </Card>
        </Link>
        <Link to="/study" style={{ flex: 1, color: "inherit" }}>
          <Card size="small" styles={{ body: { padding: 14 } }}>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}><TbBook2 /> Study up next</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {upNext ?? "Add a path"}
            </div>
          </Card>
        </Link>
      </div>

      {/* Weekly review */}
      <Link to="/review" style={{ color: "inherit" }}>
        <Card size="small" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <TbReportAnalytics style={{ fontSize: 20, color: t.gold }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>Weekly review</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>See how your week stacked up</div>
            </div>
            <TbChevronRight style={{ color: "var(--ink-soft)" }} />
          </div>
        </Card>
      </Link>

      {/* Planner link */}
      <Link to="/planner" style={{ color: "inherit" }}>
        <Card size="small">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>📋</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>Workout planner</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Edit your program, exercises & schedule</div>
            </div>
            <TbChevronRight style={{ color: "var(--ink-soft)" }} />
          </div>
        </Card>
      </Link>
    </PageTransition>
  );
}

function Pill({ done, label, icon }: { done: boolean; label: string; icon: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600,
      color: done ? "var(--teal)" : "var(--ink-soft)", opacity: done ? 1 : 0.6 }}>
      {icon} {label} {done && "✓"}
    </div>
  );
}
