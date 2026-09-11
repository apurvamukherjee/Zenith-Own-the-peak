import { Card, Rate, Input, Button, Statistic, Row, Col, App } from "antd";
import { TimeSelect } from "../../components/TimeSelect";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { useRecentSleep, upsertSleep } from "./useSleep";
import { useSetting } from "../../hooks/useSettings";
import { fmtDuration, sleepDurationMin, todayKey } from "../../lib/date.utils";
import { VIOLET, TEAL, GOLD } from "../../theme";
import { useTokens } from "../../hooks/useTokens";
import { hapticSuccess } from "../../lib/haptics";
import { playBellDing } from "../../lib/audio";

export function SleepPage() {
  const t = useTokens();
  const { message } = App.useApp();
  const recent = useRecentSleep(14);
  const target = useSetting("sleepTargetMin");
  const [sleepAt, setSleepAt] = useState("23:30");
  const [wakeAt, setWakeAt] = useState("07:00");
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState("");

  const logged = recent.filter(Boolean) as NonNullable<(typeof recent)[number]>[];
  const last = logged[logged.length - 1];
  const avg7 = logged.slice(-7);
  const avgMin = avg7.length ? Math.round(avg7.reduce((s, e) => s + e.durationMin, 0) / avg7.length) : 0;
  const avgQual = avg7.length ? (avg7.reduce((s, e) => s + e.quality, 0) / avg7.length).toFixed(1) : "–";
  const debtMin = avg7.reduce((s, e) => s + (target - e.durationMin), 0);

  const preview = sleepDurationMin(sleepAt, wakeAt);
  const chart = recent.map((e, i) => ({
    label: e ? e.date.slice(5) : lastLabel(i),
    hours: e ? +(e.durationMin / 60).toFixed(1) : null,
  }));

  async function save() {
    await upsertSleep({
      date: todayKey(),
      sleepAt,
      wakeAt,
      quality, notes,
    });
    void hapticSuccess();
    playBellDing();
    message.success(`Logged ${fmtDuration(preview)}`);
    setNotes("");
  }

  return (
    <PageTransition>
      <SectionTitle eyebrow="Recovery" title="Sleep" />

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={8}><Card size="small"><Statistic title="Last night" value={last ? fmtDuration(last.durationMin) : "–"} valueStyle={{ color: VIOLET, fontWeight: 800, fontSize: 20 }} /></Card></Col>
        <Col span={8}><Card size="small"><Statistic title="7-day avg" value={avgMin ? fmtDuration(avgMin) : "–"} valueStyle={{ color: TEAL, fontWeight: 800, fontSize: 20 }} /></Card></Col>
        <Col span={8}><Card size="small"><Statistic title="Avg quality" value={avgQual} suffix="/5" valueStyle={{ color: GOLD, fontWeight: 800, fontSize: 20 }} /></Card></Col>
      </Row>

      {debtMin > 60 && (
        <Card size="small" style={{ marginBottom: 16, background: "rgba(255,92,122,0.08)", border: "none" }}>
          <span style={{ fontWeight: 600 }}>Sleep debt this week: {fmtDuration(debtMin)}.</span>{" "}
          <span style={{ color: "var(--ink-soft)" }}>Muscle is built asleep — this is the biggest lever.</span>
        </Card>
      )}

      <Card title="Log last night" size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>Slept at</div>
            <TimeSelect value={sleepAt} onChange={setSleepAt} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>Woke at</div>
            <TimeSelect value={wakeAt} onChange={setWakeAt} />
          </div>
        </div>
        <div style={{ textAlign: "center", marginBottom: 12, fontWeight: 700, color: VIOLET }}>{fmtDuration(preview)}</div>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>Quality</div>
        <Rate value={quality} onChange={setQuality} style={{ marginBottom: 12 }} />
        <Input.TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2} style={{ marginBottom: 12 }} />
        <Button type="primary" block size="large" onClick={save} style={{ fontWeight: 700 }}>Save night</Button>
      </Card>

      <Card title="Duration — last 14 nights" size="small">
        <div style={{ width: "100%", height: 180 }}>
          <ResponsiveContainer>
            <LineChart data={chart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 10]} />
              <Tooltip formatter={(v: number) => [`${v} h`, "Sleep"]} />
              <Line type="monotone" dataKey="hours" stroke={t.accent} strokeWidth={3} connectNulls dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <SleepDebtCard />
    </PageTransition>
  );
}

function SleepDebtCard() {
  const target = useSetting("sleepTargetMin");
  const recent = useRecentSleep(7);
  if (!recent || recent.length < 3) return null;
  const totalDebt = recent.reduce((sum, s) => sum + Math.max(0, target - (s?.durationMin ?? target)), 0);
  if (totalDebt === 0) return (
    <Card size="small" style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 700, color: "var(--teal)" }}>You're caught up on sleep — nice.</div>
    </Card>
  );
  const nightsToRecover = Math.ceil(totalDebt / 30);
  const recoverPerNight = Math.round((target + totalDebt / nightsToRecover) / 60 * 10) / 10;
  return (
    <Card size="small" style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}>Sleep debt (last 7 nights)</div>
      <div className="display" style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)", marginTop: 2 }}>
        {Math.floor(totalDebt / 60)}h {totalDebt % 60}m
      </div>
      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>
        Get {recoverPerNight}h for {nightsToRecover} nights to zero it out.
      </div>
    </Card>
  );
}

function lastLabel(i: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (13 - i));
  return `${d.getMonth() + 1}-${d.getDate()}`;
}
