import { Card, Button, Progress, Alert, InputNumber, App } from "antd";
import { PlusOutlined, UndoOutlined } from "@ant-design/icons";
import { useState } from "react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from "recharts";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { useTodayWater, useWeeklyWater, useWorkoutToday, addWater, undoLastWater, computeStatus } from "./useWater";
import { useSetting } from "../../hooks/useSettings";
import { TEAL, VIOLET } from "../../theme";

const QUICK = [250, 500, 1000];

export function WaterPage() {
  const { message } = App.useApp();
  const { total } = useTodayWater();
  const weekly = useWeeklyWater();
  const trained = useWorkoutToday();
  const base = useSetting("waterGoalMl");
  const bump = useSetting("workoutBumpMl");
  const wakeHour = useSetting("wakeHour");
  const windowH = useSetting("wakingWindowH");
  const [custom, setCustom] = useState<number>();

  const goal = base + (trained ? bump : 0);
  const { status, deltaMl } = computeStatus(total, goal, wakeHour, windowH);
  const pct = Math.min(100, Math.round((total / goal) * 100));

  const banner = {
    "done": { type: "success" as const, msg: "Goal smashed — nice work staying hydrated." },
    "on-track": { type: "info" as const, msg: "On track. Keep sipping through the day." },
    "behind": { type: "warning" as const, msg: `A bit behind — about ${Math.abs(deltaMl)} ml under where you should be by now.` },
    "way-behind": { type: "error" as const, msg: `Way behind — you're ${Math.abs(deltaMl)} ml short. Drink up.` },
  }[status];

  async function log(ml: number) {
    await addWater(ml);
    if (total + ml >= goal && total < goal) message.success("Daily goal reached! 🎉");
  }

  return (
    <PageTransition>
      <SectionTitle eyebrow="Hydration" title="Water" />

      <Card style={{ marginBottom: 16, textAlign: "center" }} styles={{ body: { padding: 24 } }}>
        <Progress
          type="dashboard" percent={pct} size={180} strokeColor={status === "done" ? TEAL : VIOLET}
          strokeWidth={10}
          format={() => (
            <div>
              <div className="display" style={{ fontSize: 30, fontWeight: 800 }}>{(total / 1000).toFixed(2)}L</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>of {(goal / 1000).toFixed(1)}L{trained ? " (gym +)" : ""}</div>
            </div>
          )}
        />
      </Card>

      <Alert type={banner.type} message={banner.msg} showIcon style={{ marginBottom: 16, borderRadius: 12 }} />

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        {QUICK.map((ml) => (
          <Button key={ml} size="large" block icon={<PlusOutlined />} onClick={() => log(ml)} style={{ fontWeight: 700 }}>
            {ml}
          </Button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <InputNumber placeholder="custom ml" value={custom} onChange={(v) => setCustom(v ?? undefined)} min={1} style={{ flex: 1 }} controls={false} />
        <Button type="primary" onClick={() => { if (custom) { log(custom); setCustom(undefined); } }}>Add</Button>
        <Button icon={<UndoOutlined />} onClick={undoLastWater} aria-label="Undo last" />
      </div>

      <Card title="Last 7 days" size="small">
        <div style={{ width: "100%", height: 150 }}>
          <ResponsiveContainer>
            <BarChart data={weekly} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <Bar dataKey="ml" radius={[6, 6, 0, 0]}>
                {weekly.map((d, i) => (
                  <Cell key={i} fill={d.ml >= goal ? TEAL : "#d9d5ec"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </PageTransition>
  );
}
