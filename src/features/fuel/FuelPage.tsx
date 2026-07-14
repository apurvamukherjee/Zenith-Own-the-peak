import { TbGasStation } from "react-icons/tb";
import { useState } from "react";
import { Card, InputNumber, DatePicker, Button, Statistic, Row, Col, App, Alert } from "antd";
import { TbPlus, TbTrash } from "react-icons/tb";
import dayjs from "dayjs";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { useFuel, addFuel, deleteFuel, computeRows, fuelStats } from "./useFuel";
import { VIOLET, TEAL, GOLD } from "../../theme";
import { useTokens } from "../../hooks/useTokens";
import { prettyDate } from "../../lib/date.utils";

export function FuelPage() {
  const t = useTokens();
  const { message } = App.useApp();
  const fills = useFuel();
  const rows = computeRows(fills);
  const stats = fuelStats(rows);
  const [odo, setOdo] = useState<number>();
  const [litres, setLitres] = useState<number>();
  const [cost, setCost] = useState<number>();
  const [date, setDate] = useState(dayjs());

  const chart = rows.filter((r) => r.mileage !== null).map((r) => ({ label: r.date.slice(5), mileage: r.mileage }));

  async function submit() {
    if (!odo || !litres || !cost) { message.warning("Fill odometer, litres and cost"); return; }
    await addFuel({ date: date.format("YYYY-MM-DD"), odometer: odo, litres, cost });
    setOdo(undefined); setLitres(undefined); setCost(undefined); setDate(dayjs());
    message.success("Fill-up logged");
  }

  return (
    <PageTransition>
      <SectionTitle eyebrow="Bike" title="Fuel & mileage" />

      <Row gutter={12} style={{ marginBottom: 12 }}>
        <Col span={12}><Card size="small"><Statistic title="Latest mileage" value={stats.latestMileage} suffix="km/L" valueStyle={{ color: VIOLET, fontWeight: 800 }} /></Card></Col>
        <Col span={12}><Card size="small"><Statistic title="Avg mileage" value={stats.avgMileage} suffix="km/L" valueStyle={{ color: TEAL, fontWeight: 800 }} /></Card></Col>
      </Row>
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={12}><Card size="small"><Statistic title="This month" value={stats.monthSpend} prefix="₹" valueStyle={{ color: GOLD, fontWeight: 800 }} /></Card></Col>
        <Col span={12}><Card size="small"><Statistic title="Cost / km" value={stats.costPerKm} prefix="₹" valueStyle={{ fontWeight: 800 }} /></Card></Col>
      </Row>

      <Card title="Log a fill-up" size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <DatePicker inputReadOnly value={date} onChange={(v) => v && setDate(v)} style={{ width: "100%" }} format="DD MMM YYYY" allowClear={false} />
          <InputNumber value={odo} onChange={(v) => setOdo(v ?? undefined)} placeholder="Odometer (km)" style={{ width: "100%" }} controls={false} min={0} />
          <div style={{ display: "flex", gap: 10 }}>
            <InputNumber value={litres} onChange={(v) => setLitres(v ?? undefined)} placeholder="Litres" style={{ flex: 1 }} controls={false} min={0} />
            <InputNumber value={cost} onChange={(v) => setCost(v ?? undefined)} placeholder="Cost ₹" style={{ flex: 1 }} controls={false} min={0} />
          </div>
          <Button type="primary" size="large" icon={<TbPlus />} onClick={submit} style={{ fontWeight: 700 }}>Add fill-up</Button>
        </div>
        <Alert type="info" showIcon style={{ marginTop: 12, borderRadius: 10 }}
          message="Fill to full each time — that's how mileage stays accurate. The first fill has no mileage (no prior reading)." />
      </Card>

      {chart.length > 0 && (
        <Card title="Mileage trend" size="small" style={{ marginBottom: 16 }}>
          <div style={{ width: "100%", height: 170 }}>
            <ResponsiveContainer>
              <LineChart data={chart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [`${v} km/L`, "Mileage"]} />
                <Line type="monotone" dataKey="mileage" stroke={t.accent} strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card title="History" size="small">
        {rows.length === 0 ? <div style={{ textAlign: "center", padding: 24 }}>
            <div style={{ marginBottom: 8 }}><TbGasStation size={40} style={{ color: "var(--accent)" }} /></div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>No fill-ups logged</div>
            <div style={{ color: "var(--ink-soft)", fontSize: 13 }}>Log your first full-tank fill above. Mileage starts from the second fill.</div>
          </div> : (
          [...rows].reverse().map((r) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{r.odometer.toLocaleString()} km</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{prettyDate(r.date)} · {r.litres} L · ₹{r.cost}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: r.mileage ? VIOLET : "var(--ink-soft)" }}>{r.mileage ? `${r.mileage} km/L` : "—"}</div>
                {r.distanceKm !== null && <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{r.distanceKm} km</div>}
              </div>
              <Button type="text" danger size="small" icon={<TbTrash />} onClick={() => r.id && deleteFuel(r.id)} aria-label="Delete" />
            </div>
          ))
        )}
      </Card>
    </PageTransition>
  );
}

