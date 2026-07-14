import { useState } from "react";
import { Card, Button, Input, Switch, App, Tag } from "antd";
import { TbCloud, TbCloudUpload, TbCloudDownload, TbCloudCheck, TbMail, TbLogout } from "react-icons/tb";
import { useSync } from "./useSync";
import dayjs from "dayjs";

// Cloud backup & multi-device restore. Degrades gracefully when Supabase
// isn't configured (the app stays fully usable offline with local export).
export function SyncCard() {
  const { message, modal } = App.useApp();
  const s = useSync();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!s.configured) {
    return (
      <Card size="small" style={{ marginBottom: 12 }} title={<span><TbCloud style={{ verticalAlign: "-2px" }} /> Cloud sync</span>}>
        <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          Not configured yet. Add your Supabase URL and key (see DEPLOYMENT.md) to enable
          cloud backup and multi-device restore. Local export/import below always works.
        </div>
      </Card>
    );
  }

  async function send() {
    if (!email.trim()) return;
    setBusy(true);
    const res = await s.sendCode(email.trim());
    setBusy(false);
    if (res?.error) message.error(res.error.message);
    else { setCodeSent(true); message.success("Check your email for a 6-digit code"); }
  }
  async function verify() {
    setBusy(true);
    const res = await s.verifyCode(email.trim(), code.trim());
    setBusy(false);
    if (res?.error) message.error(res.error.message);
    else { message.success("Signed in"); setCode(""); setCodeSent(false); }
  }
  function doRestore() {
    modal.confirm({
      title: "Restore from cloud?",
      content: "This replaces everything on this device with your latest cloud backup.",
      okText: "Restore", okButtonProps: { danger: true },
      onOk: async () => {
        const r = await s.restore();
        if (r === "ok") message.success("Restored from cloud");
        else if (r === "empty") message.info("No cloud backup found yet");
        else message.error("Restore failed");
      },
    });
  }

  return (
    <Card size="small" style={{ marginBottom: 12 }}
      title={<span><TbCloud style={{ verticalAlign: "-2px" }} /> Cloud sync</span>}
      extra={s.session ? <Tag color="green" style={{ borderRadius: 8 }}>Signed in</Tag> : null}>
      {!s.session ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Sign in with your email to back up to the cloud.</div>
          <Input prefix={<TbMail />} placeholder="you@email.com" value={email}
            onChange={(e) => setEmail(e.target.value)} disabled={codeSent} inputMode="email" />
          {codeSent && (
            <Input placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" />
          )}
          {!codeSent
            ? <Button type="primary" loading={busy} onClick={send}>Send code</Button>
            : <div style={{ display: "flex", gap: 8 }}>
                <Button type="primary" loading={busy} onClick={verify} style={{ flex: 1 }}>Verify & sign in</Button>
                <Button onClick={() => setCodeSent(false)}>Back</Button>
              </div>}
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{s.session.user.email}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                {s.status === "syncing" ? "Syncing…"
                  : s.lastBackupAt ? <span><TbCloudCheck style={{ verticalAlign: "-2px" }} /> Backed up {dayjs(s.lastBackupAt).format("HH:mm")}</span>
                  : "Not backed up yet"}
              </div>
            </div>
            <Button type="text" icon={<TbLogout />} onClick={() => s.signOut()} aria-label="Sign out" />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontWeight: 600 }}>Auto-backup on change</span>
            <Switch checked={s.autoBackup} onChange={s.setAutoBackup} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button block icon={<TbCloudUpload />} loading={s.status === "syncing"} onClick={() => s.backupNow()}>Back up now</Button>
            <Button block icon={<TbCloudDownload />} onClick={doRestore}>Restore</Button>
          </div>
        </>
      )}
    </Card>
  );
}
