import { useState } from "react";
import { Card, Select, Empty, Statistic, Row, Col } from "antd";
import { TrophyFilled } from "@ant-design/icons";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { useExerciseHistory, useLoggedExercises, useRecentPRs } from "../../hooks/useWorkout";
import { progressionByDate, volumeLoad } from "../../lib/workout.utils";
import { prettyDate } from "../../lib/date.utils";
import { GOLD, VIOLET, TEAL } from "../../theme";
import { useTokens } from "../../hooks/useTokens";

export function WorkoutProgressPage() {
  const t = useTokens();
  const exercises = useLoggedExercises() ?? [];
  const [selected, setSelected] = useState<string>();
  const active = selected ?? exercises[0];
  const history = useExerciseHistory(active) ?? [];
  const prs = useRecentPRs() ?? [];

  const points = progressionByDate(history).map((p) => ({ ...p, label: prettyDate(p.date) }));
  const first = points[0]?.topE1rm ?? 0;
  const latest = points[points.length - 1]?.topE1rm ?? 0;
  const gain = first ? Math.round(((latest - first) / first) * 100) : 0;

  return (
    <PageTransition>
      <SectionTitle eyebrow="Progress" title="Getting stronger" />

      {exercises.length === 0 ? (
        <Empty description="Log a few sessions and your strength curves show up here." />
      ) : (
        <>
          <Select
            style={{ width: "100%", marginBottom: 16 }}
            value={active}
            onChange={setSelected}
            options={exercises.map((e) => ({ label: e, value: e }))}
            placeholder="Choose an exercise"
          />

          <Row gutter={12} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Card size="small"><Statistic title="Best e1RM" value={latest} suffix="kg" valueStyle={{ color: VIOLET, fontWeight: 800 }} /></Card>
            </Col>
            <Col span={8}>
              <Card size="small"><Statistic title="Since start" value={gain} suffix="%" valueStyle={{ color: gain >= 0 ? TEAL : "#ff5c7a", fontWeight: 800 }} /></Card>
            </Col>
            <Col span={8}>
              <Card size="small"><Statistic title="Volume" value={volumeLoad(history)} suffix="kg" valueStyle={{ fontWeight: 800 }} /></Card>
            </Col>
          </Row>

          <Card title="Estimated 1RM over time" size="small" style={{ marginBottom: 16 }}>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={points} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: number, _n, p) => [`${v} kg (top set ${p.payload.topWeight}×${p.payload.topReps})`, "e1RM"]}
                  />
                  <Line type="monotone" dataKey="topE1rm" stroke={t.accent} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 6 }}>
              Rises when you add weight <em>or</em> reps — beat last week either way.
            </div>
          </Card>
        </>
      )}

      <Card title="Recent PRs" size="small">
        {prs.length === 0 ? (
          <div style={{ color: "var(--ink-soft)", fontSize: 13 }}>No PRs yet — your first logged set of each lift counts.</div>
        ) : (
          prs.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <TrophyFilled style={{ color: GOLD }} />
              <span style={{ flex: 1, fontWeight: 600 }}>{p.exercise}</span>
              <span>{p.weightKg} × {p.reps}</span>
              <span style={{ fontSize: 12, color: "var(--ink-soft)", width: 78, textAlign: "right" }}>{prettyDate(p.date)}</span>
            </div>
          ))
        )}
      </Card>
    </PageTransition>
  );
}
