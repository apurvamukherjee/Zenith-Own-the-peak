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
import { useSetting } from "../../hooks/useSettings";
import { consecutiveStreak, fmtDuration, todayKey } from "../../lib/date.utils";
import { VIOLET, TEAL, GOLD } from "../../theme";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
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

  return (
    <PageTransition>
      <SectionTitle eyebrow={greeting()} title={String(name)} />

      {/* Hero: today's training */}
      <Card style={{ marginBottom: 16, background: "linear-gradient(135deg,#7c5cfc,#9d7bff)", border: "none" }}
        styles={{ body: { padding: 20 } }}>
        <div style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: 13 }}>
          {plan ? "Today's training" : "Recovery day"}
        </div>
        <div className="display" style={{ color: "#fff", fontSize: 30, fontWeight: 800, margin: "4px 0 2px" }}>
          {plan ? plan.label : "Rest"}
        </div>
        <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginBottom: 16 }}>
          {plan ? plan.focus : "Eat, sleep, grow."}
        </div>
        <Link to="/workout">
          <Button size="large" icon={<ThunderboltFilled />} style={{ fontWeight: 700 }}>
            {setsToday > 0 ? `Continue (${setsToday} sets)` : "Start session"}
          </Button>
        </Link>
      </Card>

      {/* Water quick */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Progress type="circle" percent={waterPct} size={56} strokeColor={waterPct >= 100 ? TEAL : VIOLET}
            format={() => <span style={{ fontSize: 11, fontWeight: 700 }}>{waterPct}%</span>} />
          <div style={{ flex: 1 }}>
            <Link to="/water" style={{ color: "inherit" }}>
              <div style={{ fontWeight: 700 }}>💧 Water <RightOutlined style={{ fontSize: 10, color: "var(--ink-soft)" }} /></div>
            </Link>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{(water / 1000).toFixed(2)}L of {(goal / 1000).toFixed(1)}L</div>
          </div>
          <Button size="small" icon={<PlusOutlined />} onClick={() => addWater(250)}>250</Button>
          <Button size="small" icon={<PlusOutlined />} onClick={() => addWater(500)}>500</Button>
        </div>
      </Card>

      {/* Sleep + streak row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Link to="/sleep" style={{ flex: 1, color: "inherit" }}>
          <Card size="small" styles={{ body: { padding: 14 } }}>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}><MoonFilled /> Last sleep</div>
            <div className="display" style={{ fontSize: 22, fontWeight: 800, color: VIOLET, marginTop: 4 }}>
              {lastSleep ? fmtDuration(lastSleep.durationMin) : "–"}
            </div>
          </Card>
        </Link>
        <Card size="small" style={{ flex: 1 }} styles={{ body: { padding: 14 } }}>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}><FireFilled style={{ color: GOLD }} /> Gym streak</div>
          <div className="display" style={{ fontSize: 22, fontWeight: 800, color: GOLD, marginTop: 4 }}>{streak}d</div>
        </Card>
      </div>

      {/* Study up-next */}
      <Link to="/study" style={{ color: "inherit" }}>
        <Card size="small">
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
    </PageTransition>
  );
}
