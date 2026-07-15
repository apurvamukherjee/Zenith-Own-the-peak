import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Progress, Button, App } from "antd";
import { TbFlame, TbChevronRight, TbDroplet, TbMoon, TbBarbell, TbBook2, TbPlus, TbSettings, TbMeat, TbGasStation, TbCalendar } from "react-icons/tb";
import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
import { AnimatedNumber } from "../../components/AnimatedNumber";
import { db } from "../../db/db";
import { useTokens } from "../../hooks/useTokens";
import { useSetting } from "../../hooks/useSettings";
import { useTodayWater, useWorkoutToday, addWater } from "../water/useWater";
import { useRecentSleep } from "../sleep/useSleep";
import { computeUnifiedStreak } from "../../lib/streak.utils";
import { computeTodayScore } from "../../lib/todayScore";
import { useMonthScores } from "../calendar/useCalendar";
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
    message.success(`+${ml}ml`);
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 10,
      padding: "12px 16px 8px", minHeight: "calc(100dvh - 100px)", maxHeight: "calc(100dvh - 100px)",
      overflow: "hidden",
    }}>
      {/* Header row: greeting + streak + settings */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}>{greeting()}</div>
          <h2 className="display" style={{ margin: 0, fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>{name}</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "center" }}>
            <div className="display" style={{ fontSize: 20, fontWeight: 800, color: t.gold, lineHeight: 1 }}>
              <TbFlame style={{ verticalAlign: "-2px" }} /><AnimatedNumber value={streak} />
            </div>
            <div style={{ fontSize: 9, color: "var(--ink-soft)" }}>streak</div>
          </div>
          <Link to="/profile"><Button type="text" size="small" icon={<TbSettings size={18} />} aria-label="Settings" /></Link>
        </div>
      </div>

      {/* Center: discipline ring */}
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ textAlign: "center", flex: "0 0 auto", padding: "8px 0" }}>
        <Progress type="dashboard" percent={score.score} size={120} strokeColor={t.accent} strokeWidth={8}
          format={() => (
            <div>
              <div className="display" style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}><AnimatedNumber value={score.score} />%</div>
              <div style={{ fontSize: 9, color: "var(--ink-soft)", marginTop: 1 }}>discipline</div>
            </div>
          )} />
        <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 6 }}>
          <Pill done={score.waterPct >= 100} label="Water" icon={<TbDroplet size={12} />} />
          <Pill done={score.sessionDone} label="Train" icon={<TbBarbell size={12} />} />
          <Pill done={score.sleepLogged} label="Sleep" icon={<TbMoon size={12} />} />
          <Pill done={score.proteinPct >= 100} label="Protein" icon={<TbMeat size={12} />} />
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
          <Card className="hero-grad" size="small" style={{ border: "none", height: "100%", overflow: "hidden", position: "relative" }} styles={{ body: { padding: 14, position: "relative", zIndex: 1 } }}>
            {/* Faded dumbbell SVG background */}
            <svg viewBox="0 0 120 120" width="100" height="100" style={{ position: "absolute", right: -8, bottom: -12, opacity: 0.12 }}>
              <rect x="10" y="42" width="20" height="36" rx="4" fill="#fff"/>
              <rect x="90" y="42" width="20" height="36" rx="4" fill="#fff"/>
              <rect x="22" y="48" width="12" height="24" rx="3" fill="#fff"/>
              <rect x="86" y="48" width="12" height="24" rx="3" fill="#fff"/>
              <rect x="34" y="54" width="52" height="12" rx="3" fill="#fff"/>
            </svg>
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600 }}>
              {todayDay ? "Today's training" : "Rest day"}
            </div>
            <div className="display" style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "2px 0" }}>
              {todayDay?.name ?? "Recovery"} <TbChevronRight style={{ verticalAlign: "-2px" }} />
            </div>
            <TbChevronRight size={20} style={{ color: "rgba(255,255,255,0.7)" }} />
          </div>
        </div>
      </Link>

      {/* 2x2 compact grid: water, sleep, study, protein */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flex: "0 0 auto", marginTop: 8 }}>
        {/* Water */}
        <div style={{ background: "var(--surface)", borderRadius: 14, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <Progress type="circle" percent={score.waterPct} size={38} strokeColor={score.waterPct >= 100 ? t.teal : t.accent} strokeWidth={10}
            format={() => <span style={{ fontSize: 8, fontWeight: 700 }}>{score.waterPct}%</span>} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link to="/water" style={{ color: "inherit" }}>
              <div style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 3 }}>
                <TbDroplet size={13} /> Water
              </div>
            </Link>
            <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>{(waterMl / 1000).toFixed(1)}L</div>
          </div>
          <Button size="small" type="text" icon={<TbPlus size={14} />} onClick={() => quickWater(500)} style={{ padding: "0 6px" }} />
        </div>

        {/* Sleep */}
        <Link to="/sleep" style={{ color: "inherit" }}>
          <div style={{ background: "var(--surface)", borderRadius: 14, padding: "10px 12px", height: "100%" }}>
            <div style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 3 }}>
              <TbMoon size={13} /> Sleep
            </div>
            <div className="display" style={{ fontSize: 18, fontWeight: 800, color: "var(--accent)", marginTop: 2 }}>
              {lastSleep ? fmtDuration(lastSleep.durationMin) : "–"}
            </div>
          </div>
        </Link>

        {/* Study */}
        <Link to="/study" style={{ color: "inherit" }}>
          <div style={{ background: "var(--surface)", borderRadius: 14, padding: "10px 12px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 3 }}>
              <TbBook2 size={13} /> Study
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {upNext ?? "Add a path"}
            </div>
          </div>
        </Link>

      {/* Weekly review */}
      <Link to="/profile" style={{ color: "inherit" }}>
        <Card size="small" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <TbReportAnalytics style={{ fontSize: 20, color: t.gold }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>Weekly review</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>See how your week stacked up</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Fuel + Calendar quick links */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Link to="/fuel" style={{ color: "inherit" }}>
          <div style={{ background: "var(--surface)", borderRadius: 14, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <TbGasStation size={16} style={{ color: "var(--accent)" }} />
            <span style={{ fontWeight: 700, fontSize: 13 }}>Fuel</span>
          </div>
        </Link>
        <Link to="/calendar" style={{ color: "inherit" }}>
          <div style={{ background: "var(--surface)", borderRadius: 14, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <TbCalendar size={16} style={{ color: "var(--accent)" }} />
            <span style={{ fontWeight: 700, fontSize: 13 }}>Calendar</span>
          </div>
        </Link>
      </div>
    </div>
  );
}

// Last 7 days as small dots, colored by discipline score — a glanceable
// streak strip that links to the full calendar for detail/edit.
function MiniWeekStrip() {
  const t = useTokens();
  const waterGoal = useSetting("waterGoalMl");
  const proteinTarget = useSetting("proteinTargetG");
  const now = new Date();
  const cells = useMonthScores(now.getFullYear(), now.getMonth(), waterGoal, proteinTarget);
  const todayNum = now.getDate();
  const last7 = cells.filter((c) => {
    const n = Number(c.date.slice(-2));
    return n <= todayNum && n > todayNum - 7;
  });

  return (
    <Link to="/calendar" style={{ color: "inherit" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface)", borderRadius: 12, padding: "8px 12px" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)" }}>Last 7 days</span>
        <div style={{ display: "flex", gap: 5 }}>
          {last7.map((c) => (
            <div key={c.date} title={c.date} style={{
              width: 16, height: 16, borderRadius: 5,
              background: c.hasAny ? (c.score >= 75 ? t.teal : c.score >= 40 ? t.gold : "#ff5c7a") : "var(--border)",
              border: c.isToday ? `2px solid ${t.accent}` : "none",
            }} />
          ))}
        </div>
        <TbChevronRight size={14} style={{ color: "var(--ink-soft)" }} />
      </div>
    </Link>
  );
}

function Pill({ done, label, icon }: { done: boolean; label: string; icon: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600,
      color: done ? "var(--teal)" : "var(--ink-soft)", opacity: done ? 1 : 0.6 }}>
      {icon} {label} {done && "✓"}
    </div>
  );
}
