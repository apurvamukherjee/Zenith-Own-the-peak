import { Card, TimePicker, Rate, Input, Button, Statistic, Row, Col, App } from "antd";
import { useState } from "react";
import dayjs from "dayjs";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { useRecentSleep, upsertSleep } from "./useSleep";
import { useSetting } from "../../hooks/useSettings";
import { fmtDuration, sleepDurationMin, todayKey } from "../../lib/date.utils";
import { VIOLET, TEAL, GOLD } from "../../theme";

export function SleepPage() {
  const { message } = App.useApp();
  const recent = useRecentSleep(14);
  const target = useSetting("sleepTargetMin");
  const [sleepAt, setSleepAt] = useState(dayjs("23:30", "HH:mm"));
  const [wakeAt, setWakeAt] = useState(dayjs("07:00", "HH:mm"));
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState("");

  const logged = recent.filter(Boolean) as NonNullable<(typeof recent)[number]>[];
  const last = logged[logged.length - 1];
  const avg7 = logged.slice(-7);
  const avgMin = avg7.length ? Math.round(avg7.reduce((s, e) => s + e.durationMin, 0) / avg7.length) : 0;
  const avgQual = avg7.length ? (avg7.reduce((s, e) => s + e.quality, 0) / avg7.length).toFixed(1) : "–";
  const debtMin = avg7.reduce((s, e) => s + (target - e.durationMin), 0);

  const preview = sleepDurationMin(sleepAt.format("HH:mm"), wakeAt.format("HH:mm"));
  const chart = recent.map((e, i) => ({
    label: e ? e.date.slice(5) : lastLabel(i),
    hours: e ? +(e.durationMin / 60).toFixed(1) : null,
  }));

  async function save() {
    await upsertSleep({
      date: todayKey(),
      sleepAt: sleepAt.format("HH:mm"),
      wakeAt: wakeAt.format("HH:mm"),
      quality, notes,
    });
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
            <TimePicker value={sleepAt} onChange={(v) => v && setSleepAt(v)} format="HH:mm" style={{ width: "100%" }} needConfirm={false} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>Woke at</div>
            <TimePicker value={wakeAt} onChange={(v) => v && setWakeAt(v)} format="HH:mm" style={{ width: "100%" }} needConfirm={false} />
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
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 10]} />
              <Tooltip formatter={(v: number) => [`${v} h`, "Sleep"]} />
              <Line type="monotone" dataKey="hours" stroke={VIOLET} strokeWidth={3} connectNulls dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </PageTransition>
  );
}

function lastLabel(i: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (13 - i));
  return `${d.getMonth() + 1}-${d.getDate()}`;
}
