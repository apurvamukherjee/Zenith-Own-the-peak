import { useRef } from "react";
import { Card, Row, Col, Statistic, Progress, Button, App, Avatar, Empty, Segmented, Slider } from "antd";
import {
  ThunderboltFilled, ReadFilled, MoonFilled, TrophyFilled, RiseOutlined,
  DownloadOutlined, UploadOutlined, FireFilled, BgColorsOutlined, PictureOutlined, UserOutlined, BulbOutlined,
} from "@ant-design/icons";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { useProfileStats, logBodyweight } from "./useProfile";
import { useSetting, setSetting } from "../../hooks/useSettings";
import { exportAll, importAll } from "../../db/db";
import { fmtDuration } from "../../lib/date.utils";
import { fileToDataURL } from "../../lib/image.utils";
import { SyncCard } from "../sync/SyncCard";
import { RemindersCard } from "../reminders/RemindersCard";
import { VIOLET, TEAL, GOLD } from "../../theme";
import { useTokens } from "../../hooks/useTokens";

export function ProfilePage() {
  const t = useTokens();
  const { message, modal } = App.useApp();
  const stats = useProfileStats();
  const name = useSetting("name");
  const fileRef = useRef<HTMLInputElement>(null);
  const themeMode = useSetting("themeMode");
  const profilePic = useSetting("profilePic");
  const bgImage = useSetting("bgImage");
  const bgBlur = useSetting("bgBlur");
  const bgOpacity = useSetting("bgOpacity");
  const picRef = useRef<HTMLInputElement>(null);
  const bgRef = useRef<HTMLInputElement>(null);

  async function pickImage(file: File, key: "profilePic" | "bgImage") {
    try {
      const dataUrl = await fileToDataURL(file, key === "profilePic" ? 400 : 1400, key === "profilePic" ? 0.85 : 0.8);
      await setSetting(key, dataUrl);
    } catch { message.error("Couldn't read that image"); }
  }

  async function handleExport() {
    const json = await exportAll();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zenith-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success("Backup downloaded");
  }

  function handleImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      modal.confirm({
        title: "Restore from backup?",
        content: "This replaces all current data on this device.",
        okText: "Restore", okButtonProps: { danger: true },
        onOk: async () => {
          try { await importAll(String(reader.result)); message.success("Data restored"); }
          catch { message.error("Invalid backup file"); }
        },
      });
    };
    reader.readAsText(file);
  }

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

      {/* Bodyweight */}
      <Card size="small" style={{ marginBottom: 16 }}
        title={<span><RiseOutlined /> Bodyweight</span>}
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

      <SectionTitle title="Everything, measured" />

      {/* Gym */}
      <Card size="small" style={{ marginBottom: 12 }} title={<span style={{ color: VIOLET }}><ThunderboltFilled /> Gym</span>}>
        <Row gutter={[12, 12]}>
          <Col span={8}><Statistic title="Sessions" value={gym.sessions} /></Col>
          <Col span={8}><Statistic title="Total sets" value={gym.totalSets} /></Col>
          <Col span={8}><Statistic title="Streak" value={gym.streak} suffix="d" valueStyle={{ color: GOLD }} prefix={<FireFilled />} /></Col>
          <Col span={8}><Statistic title="Volume" value={gym.volume} suffix="kg" /></Col>
          <Col span={8}><Statistic title="PRs" value={gym.prs} valueStyle={{ color: GOLD }} prefix={<TrophyFilled />} /></Col>
          <Col span={8}><Statistic title="Best e1RM" value={gym.bestE1rm} suffix="kg" valueStyle={{ color: VIOLET }} /></Col>
        </Row>
      </Card>

      {/* Study */}
      <Card size="small" style={{ marginBottom: 12 }} title={<span style={{ color: VIOLET }}><ReadFilled /> Study</span>}>
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
          <Card size="small" title={<span style={{ color: VIOLET }}><MoonFilled /> Sleep</span>}>
            <Statistic title="7-day avg" value={sleep.avgMin ? fmtDuration(sleep.avgMin) : "–"} valueStyle={{ fontSize: 18, fontWeight: 800, color: VIOLET }} />
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 6 }}>
              Quality {sleep.avgQuality || "–"}/5 · debt {fmtDuration(sleep.debtMin)}
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" title={<span style={{ color: TEAL }}>💧 Water</span>}>
            <Statistic title="Today" value={water.todayPct} suffix="%" valueStyle={{ fontSize: 18, fontWeight: 800, color: TEAL }} />
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 6 }}>
              7-day {water.adherence}% · streak {water.streak}d
            </div>
          </Card>
        </Col>
      </Row>

      {/* Fuel */}
      <Card size="small" style={{ marginBottom: 20 }} title={<span style={{ color: VIOLET }}>🏍️ Bike fuel</span>}>
        <Row gutter={12}>
          <Col span={6}><Statistic title="Avg" value={fuel.avgMileage} suffix="km/L" valueStyle={{ fontSize: 16 }} /></Col>
          <Col span={6}><Statistic title="₹/km" value={fuel.costPerKm} valueStyle={{ fontSize: 16 }} /></Col>
          <Col span={6}><Statistic title="Month" value={fuel.monthSpend} prefix="₹" valueStyle={{ fontSize: 16, color: GOLD }} /></Col>
          <Col span={6}><Statistic title="Total km" value={fuel.totalKm} valueStyle={{ fontSize: 16 }} /></Col>
        </Row>
      </Card>

      {/* Appearance */}
      <Card size="small" style={{ marginBottom: 12 }} title={<span><BgColorsOutlined /> Appearance</span>}>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 6 }}><BulbOutlined /> Theme</div>
        <Segmented
          block value={themeMode}
          onChange={(v) => setSetting("themeMode", v as string)}
          options={[{ label: "🖤 Dark", value: "dark" }, { label: "☀️ Light", value: "light" }]}
          style={{ marginBottom: 16 }}
        />

        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 8 }}><UserOutlined /> Profile picture</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <Avatar size={48} src={profilePic || undefined} className="avatar-grad">{String(name).charAt(0)}</Avatar>
          <Button icon={<PictureOutlined />} onClick={() => picRef.current?.click()}>Choose</Button>
          {profilePic && <Button danger type="text" onClick={() => setSetting("profilePic", "")}>Remove</Button>}
        </div>

        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 8 }}><PictureOutlined /> Background image</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Button icon={<PictureOutlined />} onClick={() => bgRef.current?.click()}>{bgImage ? "Replace" : "Choose"}</Button>
          {bgImage && <Button danger type="text" onClick={() => setSetting("bgImage", "")}>Remove</Button>}
        </div>
        {bgImage && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Blur — {bgBlur}px</div>
            <Slider min={0} max={24} value={bgBlur} onChange={(v) => setSetting("bgBlur", v)} />
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Opacity — {bgOpacity}%</div>
            <Slider min={0} max={100} value={bgOpacity} onChange={(v) => setSetting("bgOpacity", v)} />
          </div>
        )}
        <input ref={picRef} type="file" accept="image/*" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) pickImage(f, "profilePic"); e.target.value = ""; }} />
        <input ref={bgRef} type="file" accept="image/*" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) pickImage(f, "bgImage"); e.target.value = ""; }} />
      </Card>

      <RemindersCard />
      <SyncCard />

      {/* Backup */}
      <Card size="small" title="Data backup">
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 12 }}>
          Everything is stored only on this device. Export regularly so you never lose it.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button block icon={<DownloadOutlined />} onClick={handleExport}>Export</Button>
          <Button block icon={<UploadOutlined />} onClick={() => fileRef.current?.click()}>Import</Button>
        </div>
        <input ref={fileRef} type="file" accept="application/json" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportFile(f); e.target.value = ""; }} />
        <Button type="link" size="small" style={{ marginTop: 8, padding: 0 }}
          onClick={() => setSetting("name", prompt("Your name", String(name)) || String(name))}>Edit name</Button>
      </Card>
    </PageTransition>
  );
}
