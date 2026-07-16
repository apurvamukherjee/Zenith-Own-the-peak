import { useRef } from "react";
import { Card, Button, App, Avatar, Segmented, Slider, Input, InputNumber, Row, Col } from "antd";
import {
  TbPalette, TbBulb, TbUser, TbPhoto, TbMoonStars, TbSun,
  TbDownload, TbUpload, TbLock, TbTarget,
} from "react-icons/tb";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { useSetting, setSetting } from "../../hooks/useSettings";
import { exportAll, importAll } from "../../db/db";
import { encryptString } from "../../lib/encryptedExport";
import { fileToDataURL } from "../../lib/image.utils";
import { RemindersCard } from "../reminders/RemindersCard";
import { SyncCard } from "../sync/SyncCard";

export function SettingsPage() {
  const { message, modal } = App.useApp();
  const name = useSetting("name");
  const themeMode = useSetting("themeMode");
  const profilePic = useSetting("profilePic");
  const bgImage = useSetting("bgImage");
  const bgBlur = useSetting("bgBlur");
  const bgOpacity = useSetting("bgOpacity");
  const wakeHour = useSetting("wakeHour");
  const waterGoalMl = useSetting("waterGoalMl");
  const proteinTargetG = useSetting("proteinTargetG");
  const calorieTargetKcal = useSetting("calorieTargetKcal");
  const carbTargetG = useSetting("carbTargetG");
  const fatTargetG = useSetting("fatTargetG");
  const sleepTargetMin = useSetting("sleepTargetMin");

  const picRef = useRef<HTMLInputElement>(null);
  const bgRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const num = (label: string, val: number, key: Parameters<typeof setSetting>[0], suffix?: string, step = 1, min = 0) => (
    <Col span={12} style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>{label}</div>
      <InputNumber inputMode="decimal" value={val} min={min} step={step} addonAfter={suffix}
        style={{ width: "100%" }} onChange={(v) => v != null && setSetting(key, v)} />
    </Col>
  );

  return (
    <PageTransition>
      <SectionTitle title="Settings" />

      {/* Profile & targets */}
      <Card size="small" style={{ marginBottom: 12 }} title={<span><TbUser /> Profile</span>}>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>Name</div>
        <Input value={String(name)} onChange={(e) => setSetting("name", e.target.value)} style={{ marginBottom: 14 }} />
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--violet)", marginBottom: 8 }}><TbTarget style={{ verticalAlign: "-2px" }} /> Daily targets</div>
        <Row gutter={12}>
          {num("Wake hour", Number(wakeHour), "wakeHour", ":00", 1, 0)}
          {num("Water goal", Number(waterGoalMl), "waterGoalMl", "ml", 250)}
          {num("Protein", Number(proteinTargetG), "proteinTargetG", "g", 5)}
          {num("Calories", Number(calorieTargetKcal), "calorieTargetKcal", "kcal", 50)}
          {num("Carbs", Number(carbTargetG), "carbTargetG", "g", 10)}
          {num("Fat", Number(fatTargetG), "fatTargetG", "g", 5)}
          {num("Sleep target", Number(sleepTargetMin), "sleepTargetMin", "min", 15, 60)}
        </Row>
      </Card>

      {/* Appearance */}
      <Card size="small" style={{ marginBottom: 12 }} title={<span><TbPalette /> Appearance</span>}>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 6 }}><TbBulb /> Theme</div>
        <Segmented
          block value={themeMode}
          onChange={(v) => setSetting("themeMode", v as string)}
          options={[
            { label: "Dark", value: "dark", icon: <TbMoonStars /> },
            { label: "Light", value: "light", icon: <TbSun /> },
          ]}
          style={{ marginBottom: 16 }}
        />

        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 8 }}><TbUser /> Profile picture</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <Avatar size={48} src={profilePic || undefined} className="avatar-grad">{String(name).charAt(0)}</Avatar>
          <Button icon={<TbPhoto />} onClick={() => picRef.current?.click()}>Choose</Button>
          {profilePic && <Button danger type="text" onClick={() => setSetting("profilePic", "")}>Remove</Button>}
        </div>

        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 8 }}><TbPhoto /> Background image</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Button icon={<TbPhoto />} onClick={() => bgRef.current?.click()}>{bgImage ? "Replace" : "Choose"}</Button>
          {bgImage && <Button danger type="text" onClick={() => setSetting("bgImage", "")}>Remove</Button>}
        </div>
        {bgImage && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Blur — {bgBlur}px</div>
            <Slider min={0} max={24} value={Number(bgBlur)} onChange={(v) => setSetting("bgBlur", v)} />
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Opacity — {bgOpacity}%</div>
            <Slider min={0} max={100} value={Number(bgOpacity)} onChange={(v) => setSetting("bgOpacity", v)} />
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
      <Card size="small" style={{ marginBottom: 20 }} title="Data backup">
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 12 }}>
          Everything is stored only on this device. Export regularly so you never lose it.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button block icon={<TbDownload />} onClick={handleExport}>Export</Button>
          <Button block icon={<TbUpload />} onClick={() => fileRef.current?.click()}>Import</Button>
        </div>
        <Button block icon={<TbLock />} style={{ marginTop: 8 }} onClick={async () => {
          const pw = prompt("Password to encrypt with (remember this!):");
          if (!pw) return;
          const json = await exportAll();
          const blob = await encryptString(json, pw);
          const dl = new Blob([blob], { type: "text/plain" });
          const url = URL.createObjectURL(dl);
          const a = document.createElement("a");
          a.href = url; a.download = `zenith-encrypted-${new Date().toISOString().slice(0, 10)}.txt`;
          a.click(); URL.revokeObjectURL(url);
          message.success("Encrypted backup downloaded");
        }}>Encrypted export</Button>
        <input ref={fileRef} type="file" accept="application/json" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportFile(f); e.target.value = ""; }} />
      </Card>
    </PageTransition>
  );
}
