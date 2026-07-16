import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Progress, Button, App } from "antd";
import { TbFlame, TbChevronRight, TbDroplet, TbMoon, TbBarbell, TbBook2, TbPlus, TbSettings, TbShare2, TbMeat, TbGasStation, TbCalendar, TbSun, TbSunrise, TbSunset, TbMoonStars, TbCoffee } from "react-icons/tb";
import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
import { AnimatedNumber } from "../../components/AnimatedNumber";
import { db } from "../../db/db";
import { useTokens } from "../../hooks/useTokens";
import { useSetting } from "../../hooks/useSettings";
import { useTodayWater, useWorkoutToday, addWater } from "../water/useWater";
import { useRecentSleep } from "../sleep/useSleep";
import { computeUnifiedStreak, isFreezeAvailable, useStreakFreeze as useFreezeAction } from "../../lib/streak.utils";
import { computeTodayScore } from "../../lib/todayScore";
import { useMonthScores } from "../calendar/useCalendar";
import { fmtDuration, todayKey } from "../../lib/date.utils";
import { hapticLight } from "../../lib/haptics";

// Time-aware greeting: text, icon, tagline, and a gradient accent that
// evolves through the day — dawn amber, day peak violet, dusk red, night indigo.
function greeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 8) return {
    text: "Rise & shine", icon: TbSunrise, tagline: "Fresh day, fresh peak",
    grad: "linear-gradient(135deg, #f6b93b, #ff6b3d)",
  };
  if (h >= 8 && h < 12) return {
    text: "Good morning", icon: TbCoffee, tagline: "Fuel up, own the day",
    grad: "linear-gradient(135deg, #ff6b3d, #ff2740)",
  };
  if (h >= 12 && h < 15) return {
    text: "Good afternoon", icon: TbSun, tagline: "Push through the middle",
    grad: "linear-gradient(135deg, #ff2740, #d81f34)",
  };
  if (h >= 15 && h < 18) return {
    text: "Steady on", icon: TbSun, tagline: "Second wind time",
    grad: "linear-gradient(135deg, #d81f34, #7c5cfc)",
  };
  if (h >= 18 && h < 21) return {
    text: "Good evening", icon: TbSunset, tagline: "Finish strong",
    grad: "linear-gradient(135deg, #7c5cfc, #6e0f1c)",
  };
  if (h >= 21 && h < 24) return {
    text: "Wind down", icon: TbMoon, tagline: "Recovery is where growth happens",
    grad: "linear-gradient(135deg, #6e0f1c, #1a0509)",
  };
  return {
    text: "Late night", icon: TbMoonStars, tagline: "Sleep is your edge",
    grad: "linear-gradient(135deg, #1a0509, #08060a)",
  };
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
  const [freezeAvailable, setFreezeAvailable] = useState(false);

  useEffect(() => { computeUnifiedStreak().then(setStreak); }, [waterMl, trained]);
  useEffect(() => { computeTodayScore(waterGoal, proteinTarget).then(setScore); }, [waterMl, waterGoal, proteinTarget]);
  useEffect(() => { isFreezeAvailable(todayKey()).then(setFreezeAvailable); }, [waterMl, trained]);

  const hour = new Date().getHours();
  const streakInDanger = hour >= 21 && score.score === 0 && streak > 0;

  async function protectStreak() {
    await addWater(500);
    hapticLight();
    message.success("Streak protected — 500ml logged");
  }
  async function protectWithFreeze() {
    const ok = await useFreezeAction(todayKey());
    if (ok) { message.success("Streak freeze used for today"); setFreezeAvailable(false); }
    else message.info("Freeze already used this week");
  }

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

  const g = greeting();
  const GIcon = g.icon;

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 10,
      padding: "12px 16px 8px", minHeight: "calc(100dvh - 100px)", maxHeight: "calc(100dvh - 100px)",
      overflow: "hidden",
    }}>
      {/* Header row: greeting + streak + settings */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <motion.div
            key={g.text}
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 22, height: 22, borderRadius: 7,
              background: g.grad, color: "#fff",
            }}>
              <GIcon size={13} />
            </span>
            <span style={{
              fontSize: 12, fontWeight: 700, letterSpacing: 0.3,
              background: g.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>{g.text}</span>
          </motion.div>
          <h2 className="display" style={{ margin: 0, fontSize: 22, fontWeight: 800, lineHeight: 1.05 }}>
            {name}
          </h2>
          <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 2, fontStyle: "italic" }}>
            {g.tagline}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ textAlign: "center" }}>
            <div className="display" style={{ fontSize: 20, fontWeight: 800, color: t.gold, lineHeight: 1 }}>
              <TbFlame style={{ verticalAlign: "-2px" }} /><AnimatedNumber value={streak} />
            </div>
            <div style={{ fontSize: 9, color: "var(--ink-soft)" }}>streak</div>
          </div>
          <Link to="/glance"><Button type="text" size="small" icon={<TbShare2 size={18} />} aria-label="Share card" /></Link>
          <Link to="/settings"><Button type="text" size="small" icon={<TbSettings size={18} />} aria-label="Settings" /></Link>
        </div>
      </div>

      {/* Streak-in-danger banner */}
      {streakInDanger && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: "linear-gradient(135deg, #ff2740, #6e0f1c)", borderRadius: 12,
            padding: "10px 12px", color: "#fff" }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <TbFlame /> Streak at risk — protect it now
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Button size="small" onClick={protectStreak} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", flex: 1 }}>
              +500ml water
            </Button>
            {freezeAvailable && (
              <Button size="small" onClick={protectWithFreeze} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", flex: 1 }}>
                Use freeze
              </Button>
            )}
          </div>
        </motion.div>
      )}

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

      {/* Mini calendar streak strip — last 7 days */}
      <MiniWeekStrip />

      {/* Training hero card */}
      <Link to="/workout" style={{ color: "inherit", display: "block", flex: "0 0 auto" }}>
        <div className="hero-grad" style={{
          borderRadius: 16, padding: "12px 16px", position: "relative", overflow: "hidden",
        }}>
          <svg viewBox="0 0 120 120" width="80" height="80" style={{ position: "absolute", right: -4, bottom: -10, opacity: 0.1 }}>
            <rect x="10" y="42" width="20" height="36" rx="4" fill="#fff"/>
            <rect x="90" y="42" width="20" height="36" rx="4" fill="#fff"/>
            <rect x="22" y="48" width="12" height="24" rx="3" fill="#fff"/>
            <rect x="86" y="48" width="12" height="24" rx="3" fill="#fff"/>
            <rect x="34" y="54" width="52" height="12" rx="3" fill="#fff"/>
          </svg>
          <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 600 }}>
                {todayDay ? "Today's training" : "Rest day"}
              </div>
              <div className="display" style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>
                {todayDay?.name ?? "Recovery"}
              </div>
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

        {/* Nutrition */}
        <Link to="/nutrition" style={{ color: "inherit" }}>
          <div style={{ background: "var(--surface)", borderRadius: 14, padding: "10px 12px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 3 }}>
              <TbMeat size={13} /> Nutrition
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
              {score.proteinPct >= 100 ? "On target" : `${score.proteinPct}% protein`}
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
