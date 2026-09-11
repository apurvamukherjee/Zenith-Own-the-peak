import { useRef, useState } from "react";
import { Card, Button, App, Avatar, Segmented, Slider, Input, InputNumber, Row, Col, Switch } from "antd";
import {
  TbPalette, TbBulb, TbUser, TbPhoto, TbMoonStars, TbSun,
  TbDownload, TbUpload, TbLock, TbTarget, TbAccessible, TbInfoCircle, TbCake,
} from "react-icons/tb";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { MountainGrows } from "../../components/MountainGrows";
import { AvatarFrame } from "../../components/AvatarFrame";
import { useSetting, setSetting } from "../../hooks/useSettings";
import { exportAll, importAll } from "../../db/db";
import { encryptString } from "../../lib/encryptedExport";
import { fileToDataURL } from "../../lib/image.utils";
import { RemindersCard } from "../reminders/RemindersCard";
import { SyncCard } from "../sync/SyncCard";
import { GoogleCalendarCard } from "../googleCalendar/GoogleCalendarCard";
import { PlanImportCard } from "../gym/PlanImportCard";

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
  // Phase-3 additions
  const birthday = String(useSetting("birthday") ?? "");
  const highContrast = Number(useSetting("highContrast")) === 1;
  const reduceMotion = Number(useSetting("reduceMotion")) === 1;
  const equippedFrame = String(useSetting("equippedFrame"));

  const picRef = useRef<HTMLInputElement>(null);
  const bgRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Local mirrors for the blur/opacity sliders — antd's Slider fires onChange
  // on every drag tick, and writing to Dexie that often floods the mutation
  // bus (every write re-triggers the XP + achievement engines app-wide, see
  // lib/mutations.ts). Track the live value locally for instant label/handle
  // feedback, and only persist once the drag ends.
  const [liveBgBlur, setLiveBgBlur] = useState<number | null>(null);
  const [liveBgOpacity, setLiveBgOpacity] = useState<number | null>(null);

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
      <InputNumber inputMode="decimal" value={val} min={min} step={step} suffix={suffix}
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
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>
          <TbCake style={{ verticalAlign: "-2px" }} /> Birthday <span style={{ opacity: 0.6 }}>· MM-DD, optional</span>
        </div>
        <Input
          value={birthday} maxLength={5} placeholder="04-25"
          onChange={(e) => {
            const v = e.target.value.replace(/[^\d-]/g, "").slice(0, 5);
            void setSetting("birthday", v);
          }}
          style={{ marginBottom: 14, width: 120 }}
          inputMode="numeric"
        />
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
          <AvatarFrame frameId={equippedFrame}>
            <Avatar size={48} src={profilePic || undefined} className="avatar-grad">{String(name).charAt(0)}</Avatar>
          </AvatarFrame>
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
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Blur — {liveBgBlur ?? Number(bgBlur)}px</div>
            <Slider min={0} max={24} value={liveBgBlur ?? Number(bgBlur)}
              onChange={setLiveBgBlur}
              onChangeComplete={(v) => { setLiveBgBlur(null); void setSetting("bgBlur", v); }} />
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Opacity — {liveBgOpacity ?? Number(bgOpacity)}%</div>
            <Slider min={0} max={100} value={liveBgOpacity ?? Number(bgOpacity)}
              onChange={setLiveBgOpacity}
              onChangeComplete={(v) => { setLiveBgOpacity(null); void setSetting("bgOpacity", v); }} />
          </div>
        )}
        <input ref={picRef} type="file" accept="image/*" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) pickImage(f, "profilePic"); e.target.value = ""; }} />
        <input ref={bgRef} type="file" accept="image/*" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) pickImage(f, "bgImage"); e.target.value = ""; }} />
      </Card>

      <RemindersCard />
      <SyncCard />
      <GoogleCalendarCard />

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

      <PlanImportCard />

      {/* Accessibility */}
      <Card size="small" style={{ marginBottom: 12 }} title={<span><TbAccessible /> Accessibility</span>}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>High contrast</div>
            <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
              WCAG-AAA text, no gradients. Better for low-vision use.
            </div>
          </div>
          <Switch checked={highContrast} onChange={(v) => setSetting("highContrast", v ? 1 : 0)} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Reduce motion</div>
            <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
              Turns off ember pulse, page slides, and celebratory flourishes.
            </div>
          </div>
          <Switch checked={reduceMotion} onChange={(v) => setSetting("reduceMotion", v ? 1 : 0)} />
        </div>
      </Card>

      {/* About — Zenith mountain grows quietly with each mythic unlock */}
      <Card size="small" style={{ marginBottom: 20 }} title={<span><TbInfoCircle /> About</span>}>
        <MountainGrows />
        <div style={{ textAlign: "center", fontSize: 11, color: "var(--ink-soft)", marginTop: 10 }}>
          <div style={{ fontWeight: 700, letterSpacing: 0.3 }}>Zenith · Own the peak</div>
          <div style={{ opacity: 0.7 }}>by Apurva</div>
        </div>
      </Card>
    </PageTransition>
  );
}
