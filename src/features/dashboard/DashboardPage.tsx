import { Link } from "react-router-dom";
import { Card, Button, Progress } from "antd";
import {
  ThunderboltFilled, FireFilled, MoonFilled, ReadFilled, RightOutlined, PlusOutlined,
} from "@ant-design/icons";
import { useLiveQuery } from "dexie-react-hooks";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { db } from "../../db/db";
import { PPL_PROGRAM, dayTypeForDate } from "../../config/pplProgram";
import { useTodayWater, useWorkoutToday, addWater } from "../water/useWater";
import { useRecentSleep } from "../sleep/useSleep";
import { useSchedules, useTodayLogs, useTodayMeals, slotStatus } from "../nutrition/useNutrition";
import { useSetting } from "../../hooks/useSettings";
import { consecutiveStreak, fmtDuration, todayKey } from "../../lib/date.utils";
import { VIOLET, GOLD } from "../../theme";
import { useTokens } from "../../hooks/useTokens";
import { TbReportAnalytics, TbChevronRight } from "react-icons/tb";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const t = useTokens();
  const name = useSetting("name");
  const autoDay = dayTypeForDate(new Date());
  const plan = autoDay !== "Rest" ? PPL_PROGRAM[autoDay] : null;

  const { total: water } = useTodayWater();
  const trained = useWorkoutToday();
  const base = useSetting("waterGoalMl");
  const bump = useSetting("workoutBumpMl");
  const goal = base + (trained ? bump : 0);
  const waterPct = Math.min(100, Math.round((water / goal) * 100));

  const setsToday = useLiveQuery(() => db.workoutSets.where("date").equals(todayKey()).count(), []) ?? 0;
  const workoutDates = useLiveQuery(async () => (await db.workoutSets.orderBy("date").uniqueKeys()) as string[], []) ?? [];
  const streak = consecutiveStreak(workoutDates);

  const sleep = useRecentSleep(2);
  const lastSleep = [...sleep].reverse().find(Boolean);

  const upNext = useLiveQuery(async () => {
    const items = await db.studyItems.where("status").notEqual("done").sortBy("order");
    return items[0]?.title ?? null;
  }, []);

  // Nutrition
  const meals = useTodayMeals();
  const schedules = useSchedules();
  const logs = useTodayLogs();
  const proteinDefault = useSetting("proteinTargetG");
  const latestBw = useLiveQuery(async () => (await db.bodyweight.orderBy("date").last())?.kg, []);
  const proteinTarget = latestBw ? Math.round(latestBw * 1.8) : proteinDefault;
  const protein = meals.reduce((s, m) => s + m.protein, 0);
  const doneIds = new Set(logs.map((l) => l.scheduleId));
  const nextDose = schedules.find((s) => s.id && !doneIds.has(s.id) && slotStatus(s.time, false) !== "upcoming")
    ?? schedules.find((s) => s.id && !doneIds.has(s.id));

  // Fuel
  const latestMileage = useLiveQuery(async () => {
    const fills = await db.fuel.orderBy("odometer").toArray();
    if (fills.length < 2) return 0;
    const last = fills[fills.length - 1];
    const prev = fills[fills.length - 2];
    return last.litres > 0 ? +((last.odometer - prev.odometer) / last.litres).toFixed(1) : 0;
  }, []) ?? 0;

  return (
    <PageTransition>
      <SectionTitle eyebrow={greeting()} title={String(name)} />

      <Card className="hero-grad" style={{ marginBottom: 16, border: "none" }}
        styles={{ body: { padding: 20 } }}>
        <div style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: 13 }}>{plan ? "Today's training" : "Recovery day"}</div>
        <div className="display" style={{ color: "#fff", fontSize: 30, fontWeight: 800, margin: "4px 0 2px" }}>{plan ? plan.label : "Rest"}</div>
        <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginBottom: 16 }}>{plan ? plan.focus : "Eat, sleep, grow."}</div>
        <Link to="/workout"><Button size="large" icon={<ThunderboltFilled />} style={{ fontWeight: 700 }}>{setsToday > 0 ? `Continue (${setsToday} sets)` : "Start session"}</Button></Link>
      </Card>

      {/* Weekly review */}
      <Link to="/review" style={{ color: "inherit" }}>
        <Card size="small" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <TbReportAnalytics style={{ fontSize: 22, color: t.gold }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>Weekly review</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>See how your week stacked up</div>
            </div>
            <TbChevronRight style={{ color: "var(--ink-soft)" }} />
          </div>
        </Card>
      </Link>

      {/* Nutrition */}
      <Link to="/nutrition" style={{ color: "inherit" }}>
        <Card size="small" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Progress type="circle" percent={Math.min(100, Math.round((protein / proteinTarget) * 100))} size={56} strokeColor={t.accent}
              format={() => <span style={{ fontSize: 11, fontWeight: 700 }}>{protein}g</span>} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>🍽️ Nutrition <RightOutlined style={{ fontSize: 10, color: "var(--ink-soft)" }} /></div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                {protein}g / {proteinTarget}g protein{nextDose ? ` · next: ${nextDose.label} ${nextDose.time}` : ""}
              </div>
            </div>
          </div>
        </Card>
      </Link>

      {/* Water */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Progress type="circle" percent={waterPct} size={56} strokeColor={waterPct >= 100 ? t.teal : t.accent}
            format={() => <span style={{ fontSize: 11, fontWeight: 700 }}>{waterPct}%</span>} />
          <div style={{ flex: 1 }}>
            <Link to="/water" style={{ color: "inherit" }}><div style={{ fontWeight: 700 }}>💧 Water <RightOutlined style={{ fontSize: 10, color: "var(--ink-soft)" }} /></div></Link>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{(water / 1000).toFixed(2)}L of {(goal / 1000).toFixed(1)}L</div>
          </div>
          <Button size="small" icon={<PlusOutlined />} onClick={() => addWater(250)}>250</Button>
          <Button size="small" icon={<PlusOutlined />} onClick={() => addWater(500)}>500</Button>
        </div>
      </Card>

      {/* Sleep + streak */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Link to="/sleep" style={{ flex: 1, color: "inherit" }}>
          <Card size="small" styles={{ body: { padding: 14 } }}>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}><MoonFilled /> Last sleep</div>
            <div className="display" style={{ fontSize: 22, fontWeight: 800, color: VIOLET, marginTop: 4 }}>{lastSleep ? fmtDuration(lastSleep.durationMin) : "–"}</div>
          </Card>
        </Link>
        <Card size="small" style={{ flex: 1 }} styles={{ body: { padding: 14 } }}>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}><FireFilled style={{ color: GOLD }} /> Gym streak</div>
          <div className="display" style={{ fontSize: 22, fontWeight: 800, color: GOLD, marginTop: 4 }}>{streak}d</div>
        </Card>
      </div>

      {/* Study */}
      <Link to="/study" style={{ color: "inherit" }}>
        <Card size="small" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ReadFilled style={{ color: VIOLET, fontSize: 18 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>Study up next</div>
              <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>{upNext ?? "Add a learning path to begin"}</div>
            </div>
            <RightOutlined style={{ color: "var(--ink-soft)" }} />
          </div>
        </Card>
      </Link>

      {/* Fuel */}
      <Link to="/fuel" style={{ color: "inherit" }}>
        <Card size="small">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>🏍️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>Bike mileage</div>
              <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>{latestMileage ? `${latestMileage} km/L last tank` : "Log a fill-up to start"}</div>
            </div>
            <RightOutlined style={{ color: "var(--ink-soft)" }} />
          </div>
        </Card>
      </Link>
    </PageTransition>
  );
}
