import { Link } from "react-router-dom";
import { Card, Row, Col, Statistic, Progress, Button, App, Avatar, Empty } from "antd";
import {
  TbBolt, TbBook2, TbBulb, TbClipboardList, TbDroplet,
  TbFlame, TbGasStation, TbMoon, TbTrendingUp, TbTrendingDown, TbTrophy,
} from "react-icons/tb";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";
import { PageTransition } from "../../components/PageTransition";
import { AnimatedNumber } from "../../components/AnimatedNumber";
import { SectionTitle } from "../../components/SectionTitle";
import { useProfileStats, logBodyweight } from "./useProfile";
import { YearHeatmap } from "./YearHeatmap";
import { PhotoTimeline } from "./PhotoTimeline";
import { EfficiencyCard } from "./EfficiencyCard";
import { BodyComposition } from "./BodyComposition";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { useSetting } from "../../hooks/useSettings";
import { fmtDuration } from "../../lib/date.utils";
import { useWeeklyReview } from "../review/useWeeklyReview";
import { VIOLET, TEAL, GOLD } from "../../theme";
import { useTokens } from "../../hooks/useTokens";
import { useAchievements, useUnseenAchievements } from "../achievements/useAchievements";

export function ProfilePage() {
  const t = useTokens();
  const { message, modal } = App.useApp();
  const stats = useProfileStats();
  const review = useWeeklyReview();
  const { unlockedCount, total } = useAchievements();
  const unseen = useUnseenAchievements();
  const name = useSetting("name");
  const profilePic = useSetting("profilePic");

  async function logBw() {
    const cur = stats?.bodyweight.latest || 50;
    let val = cur;
    modal.confirm({
      title: "Log bodyweight",
      content: (
        <input type="number" defaultValue={cur} step="0.1"
          onChange={(e) => (val = parseFloat(e.target.value))}
          style={{ width: "100%", padding: 8, fontSize: 16, borderRadius: 8, border: "1px solid var(--border)", marginTop: 8 }} />
      ),
      okText: "Save",
      onOk: async () => { if (val > 0) { await logBodyweight(val); message.success(`Logged ${val} kg`); } },
    });
  }

  if (!stats) return <PageTransition><Empty description="Loading…" /></PageTransition>;
  const { gym, study, sleep, water, fuel, bodyweight } = stats;

  return (
    <PageTransition>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <Avatar size={56} src={profilePic || undefined} className="avatar-grad" style={{ fontWeight: 800, fontSize: 22 }}>
          {String(name).charAt(0)}
        </Avatar>
        <div>
          <h2 className="display" style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{name}</h2>
          <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>Own the peak.</div>
        </div>
      </div>

      {/* Hall of Frame entry */}
      <Link to="/hall" style={{ textDecoration: "none" }}>
        <Card size="small" hoverable style={{ marginBottom: 16, overflow: "hidden" }}
          styles={{ body: { padding: 0 } }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, background: "var(--hero)", color: "#fff" }}>
            <div style={{ position: "relative", width: 46, height: 46, borderRadius: 13, background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <TbTrophy size={24} />
              {unseen > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 9, background: "#fff", color: "var(--accent)", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                  {unseen}
                </span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="display" style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.1 }}>Hall of Frame</div>
              <div style={{ fontSize: 12.5, opacity: 0.9 }}>
                {unseen > 0 ? `${unseen} new — go claim ${unseen === 1 ? "it" : "them"}` : `${unlockedCount} of ${total} conquered`}
              </div>
            </div>
            <span style={{ fontSize: 20, opacity: 0.8 }}>→</span>
          </div>
        </Card>
      </Link>

      {/* Year heatmap */}
      <YearHeatmap />
      <PhotoTimeline />
      <BeforeAfterSlider />
      <EfficiencyCard />
      <BodyComposition />

      {/* Bodyweight */}
      <Card size="small" style={{ marginBottom: 16 }}
        title={<span><TbTrendingUp /> Bodyweight</span>}
        extra={<Button size="small" type="primary" onClick={logBw}>Log</Button>}>
        <Row gutter={12} style={{ marginBottom: 8 }}>
          <Col span={12}><Statistic title="Current" value={bodyweight.latest || "–"} suffix="kg" valueStyle={{ color: VIOLET, fontWeight: 800 }} /></Col>
          <Col span={12}><Statistic title="30-day change" value={bodyweight.change30} suffix="kg"
            valueStyle={{ color: bodyweight.change30 >= 0 ? TEAL : "#ff5c7a", fontWeight: 800 }}
            prefix={bodyweight.change30 > 0 ? "+" : ""} /></Col>
        </Row>
        {bodyweight.series.length > 1 && (
          <div style={{ width: "100%", height: 120 }}>
            <ResponsiveContainer>
              <LineChart data={bodyweight.series} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip formatter={(v: number) => [`${v} kg`, "Weight"]} />
                <Line type="monotone" dataKey="kg" stroke={t.accent} strokeWidth={3} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Weekly Review */}
      {review && (
        <Card size="small" style={{ marginBottom: 16 }}
          title={<span><TbTrendingUp /> This week</span>}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            {review.stats.slice(0, 6).map((s) => (
              <div key={s.key} style={{ padding: "8px 10px", background: "var(--bg)", borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>{s.label}</div>
                <div className="display" style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>
                  {s.prefix}<AnimatedNumber value={s.value} decimals={s.decimals} />{s.suffix}
                  {s.deltaPct != null && (
                    <span style={{ fontSize: 11, marginLeft: 4, color: s.deltaPct >= 0 ? "var(--teal)" : "#ff5c7a" }}>
                      {s.deltaPct >= 0 ? <TbTrendingUp style={{ verticalAlign: "-2px" }} /> : <TbTrendingDown style={{ verticalAlign: "-2px" }} />}{Math.abs(s.deltaPct)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {review.insights.length > 0 && (
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}><TbBulb /> Insights</div>
              {review.insights.slice(0, 3).map((ins, i) => (
                <div key={i} style={{ fontSize: 13, color: "var(--ink)", marginBottom: 6, paddingLeft: 8, borderLeft: `2px solid ${ins.good ? "var(--teal)" : "#ff5c7a"}` }}>
                  {ins.text}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <SectionTitle title="Everything, measured" />

      {/* Gym */}
      <Card size="small" style={{ marginBottom: 12 }} title={<span style={{ color: VIOLET }}><TbBolt /> Gym</span>}>
        <Row gutter={[12, 12]}>
          <Col span={8}><Statistic title="Sessions" value={gym.sessions} /></Col>
          <Col span={8}><Statistic title="Total sets" value={gym.totalSets} /></Col>
          <Col span={8}><Statistic title="Streak" value={gym.streak} suffix="d" valueStyle={{ color: GOLD }} prefix={<TbFlame />} /></Col>
          <Col span={8}><Statistic title="Volume" value={gym.volume} suffix="kg" /></Col>
          <Col span={8}><Statistic title="PRs" value={gym.prs} valueStyle={{ color: GOLD }} prefix={<TbTrophy />} /></Col>
          <Col span={8}><Statistic title="Best e1RM" value={gym.bestE1rm} suffix="kg" valueStyle={{ color: VIOLET }} /></Col>
        </Row>
      </Card>

      {/* Study */}
      <Card size="small" style={{ marginBottom: 12 }} title={<span style={{ color: VIOLET }}><TbBook2 /> Study</span>}>
        <Progress percent={study.pct} strokeColor={t.accent} />
        <Row gutter={12} style={{ marginTop: 8 }}>
          <Col span={8}><Statistic title="Topics" value={`${study.topicsDone}/${study.topicsTotal}`} /></Col>
          <Col span={8}><Statistic title="Paths" value={study.paths} /></Col>
          <Col span={8}><Statistic title="Minutes" value={study.totalMin} valueStyle={{ color: TEAL }} /></Col>
        </Row>
      </Card>

      {/* Sleep + Water */}
      <Row gutter={12} style={{ marginBottom: 12 }}>
        <Col span={12}>
          <Card size="small" title={<span style={{ color: VIOLET }}><TbMoon /> Sleep</span>}>
            <Statistic title="7-day avg" value={sleep.avgMin ? fmtDuration(sleep.avgMin) : "–"} valueStyle={{ fontSize: 18, fontWeight: 800, color: VIOLET }} />
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 6 }}>
              Quality {sleep.avgQuality || "–"}/5 · debt {fmtDuration(sleep.debtMin)}
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" title={<span style={{ color: TEAL }}><TbDroplet style={{ verticalAlign: "-2px" }} /> Water</span>}>
            <Statistic title="Today" value={water.todayPct} suffix="%" valueStyle={{ fontSize: 18, fontWeight: 800, color: TEAL }} />
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 6 }}>
              7-day {water.adherence}% · streak {water.streak}d
            </div>
          </Card>
        </Col>
      </Row>

      {/* Fuel */}
      <Card size="small" style={{ marginBottom: 20 }} title={<span style={{ color: VIOLET }}><TbGasStation style={{ verticalAlign: "-2px" }} /> Bike fuel</span>}>
        <Row gutter={12}>
          <Col span={6}><Statistic title="Avg" value={fuel.avgMileage} suffix="km/L" valueStyle={{ fontSize: 16 }} /></Col>
          <Col span={6}><Statistic title="₹/km" value={fuel.costPerKm} valueStyle={{ fontSize: 16 }} /></Col>
          <Col span={6}><Statistic title="Month" value={fuel.monthSpend} prefix="₹" valueStyle={{ fontSize: 16, color: GOLD }} /></Col>
          <Col span={6}><Statistic title="Total km" value={fuel.totalKm} valueStyle={{ fontSize: 16 }} /></Col>
        </Row>
      </Card>

      {/* Workout planner */}
      <Link to="/planner">
        <Card size="small" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <TbClipboardList size={20} style={{ color: "var(--accent)" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>Workout planner</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Edit exercises, days & weekly schedule</div>
            </div>
          </div>
        </Card>
      </Link>
    </PageTransition>
  );
}
