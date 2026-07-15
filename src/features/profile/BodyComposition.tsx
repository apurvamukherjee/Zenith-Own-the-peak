import { useState } from "react";
import { Card, Button, Modal, InputNumber, Segmented, App } from "antd";
import { useLiveQuery } from "dexie-react-hooks";
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis } from "recharts";
import { TbRuler2, TbPlus } from "react-icons/tb";
import { db } from "../../db/db";
import { useTokens } from "../../hooks/useTokens";
import { todayKey } from "../../lib/date.utils";
import type { BodyMetric } from "../../db/types";

const METRICS: { label: string; value: BodyMetric }[] = [
  { label: "Waist", value: "waist" }, { label: "Chest", value: "chest" },
  { label: "Arm", value: "arm" }, { label: "Thigh", value: "thigh" }, { label: "Hip", value: "hip" },
];

// Optional body measurements. Uses its own bodyMeasurements table (indexed on
// [metric+date]) so we can plot each metric independently without loading all rows.
export function BodyComposition() {
  const t = useTokens();
  const { message } = App.useApp();
  const [metric, setMetric] = useState<BodyMetric>("waist");
  const [addOpen, setAddOpen] = useState(false);
  const [cm, setCm] = useState<number>();

  const rows = useLiveQuery(
    () => db.bodyMeasurements.where("metric").equals(metric).sortBy("date"),
    [metric],
  ) ?? [];

  async function submit() {
    if (!cm) return;
    await db.bodyMeasurements.add({ date: todayKey(), metric, cm });
    message.success("Measurement logged");
    setCm(undefined); setAddOpen(false);
  }

  const latest = rows[rows.length - 1];
  const chart = rows.map((r) => ({ label: r.date.slice(5), cm: r.cm }));

  return (
    <Card size="small" style={{ marginBottom: 12 }}
      title={<span><TbRuler2 /> Body composition</span>}
      extra={<Button size="small" icon={<TbPlus />} onClick={() => setAddOpen(true)}>Log</Button>}>
      <Segmented block size="small" value={metric} onChange={(v) => setMetric(v as BodyMetric)}
        options={METRICS} style={{ marginBottom: 10 }} />
      {rows.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--ink-soft)", textAlign: "center", padding: 8 }}>
          No measurements yet — tap Log to start tracking.
        </div>
      ) : (
        <>
          <div className="display" style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)" }}>
            {latest.cm} cm
          </div>
          {rows.length >= 2 && (
            <div style={{ width: "100%", height: 80 }}>
              <ResponsiveContainer>
                <LineChart data={chart}>
                  <XAxis dataKey="label" hide />
                  <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
                  <Line type="monotone" dataKey="cm" stroke={t.accent} strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
      <Modal open={addOpen} onCancel={() => setAddOpen(false)} title={`Log ${metric}`} onOk={submit} okText="Save">
        <InputNumber autoFocus value={cm} onChange={(v) => setCm(v ?? undefined)} step={0.5} min={10} max={200}
          addonAfter="cm" style={{ width: "100%", marginTop: 8 }} />
      </Modal>
    </Card>
  );
}
