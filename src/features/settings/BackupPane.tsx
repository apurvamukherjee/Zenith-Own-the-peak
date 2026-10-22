import { useEffect, useRef, useState } from "react";
import { App, Input, Modal } from "antd";
import { TbDownload, TbLock, TbUpload, TbShieldCheck, TbShield, TbCloudCheck, TbAlertTriangle } from "react-icons/tb";
import { Hero } from "../../components/ui/Hero";
import { ListGroup, ListRow } from "../../components/ui/List";
import { countRecords, exportAll, importAll, peekBackup } from "../../db/db";
import { useSetting, setSetting } from "../../hooks/useSettings";
import { encryptString, decryptString } from "../../lib/encryptedExport";
import { hapticSuccess } from "../../lib/haptics";
import { saveFile } from "../../lib/saveFile";
import { todayKey } from "../../lib/date.utils";

const DAY = 86_400_000;
// A week of lost logs is the most we let someone risk without nagging.
const STALE_AFTER = 7 * DAY;

function fmtBytes(n: number) {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function ago(ms: number) {
  const d = Math.floor((Date.now() - ms) / DAY);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  return `${d} days ago`;
}

const errText = (err: unknown) => (err instanceof Error ? err.message : String(err));

type PwPrompt = { mode: "encrypt" } | { mode: "decrypt"; raw: string };

export function BackupPane() {
  const { message, modal } = App.useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const lastBackupAt = useSetting("lastBackupAt");
  const [usage, setUsage] = useState<number | null>(null);
  const [records, setRecords] = useState<number | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [pw, setPw] = useState<PwPrompt | null>(null);
  const [pwValue, setPwValue] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void navigator.storage?.estimate?.().then((e) => { if (alive) setUsage(e.usage ?? null); });
    void navigator.storage?.persisted?.().then((p) => { if (alive) setPersisted(p); });
    void countRecords().then((n) => { if (alive) setRecords(n); });
    return () => { alive = false; };
  }, []);

  const stale = !lastBackupAt || Date.now() - lastBackupAt > STALE_AFTER;
  const tone = stale ? "var(--warn)" : "var(--success)";

  async function protect() {
    const ok = await navigator.storage?.persist?.();
    setPersisted(!!ok);
    if (ok) { void hapticSuccess(); message.success("Storage protected from automatic cleanup"); }
    else message.info("The browser declined — install Zenith or use it more often, then try again");
  }

  async function markBackedUp() {
    await setSetting("lastBackupAt", Date.now());
    void hapticSuccess();
  }

  async function exportPlain() {
    setBusy(true);
    try {
      if (await saveFile(`zenith-backup-${todayKey()}.json`, await exportAll(), "application/json") === "done") {
        await markBackedUp();
        message.success("Backup saved — keep a copy somewhere off this phone");
      }
    } catch (err) {
      message.error(`Export failed: ${errText(err)}`);
    } finally {
      setBusy(false);
    }
  }

  function restore(json: string) {
    const summary = peekBackup(json);
    if (!summary) { message.error("That file isn't a valid Zenith backup"); return; }
    const made = new Date(summary.exportedAt);
    modal.confirm({
      title: "Restore this backup?",
      content: (
        <div className="zs-restore">
          <div className="zs-restore__row"><span>Made</span><b>{made.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</b></div>
          <div className="zs-restore__row"><span>Records</span><b>{summary.records.toLocaleString()}</b></div>
          <p>Everything currently on this device{records !== null ? ` (${records.toLocaleString()} records)` : ""} will be replaced.</p>
        </div>
      ),
      okText: "Replace & restore", okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await importAll(json);
          // The backup's own settings row came in with it; stamp when it was actually made.
          await setSetting("lastBackupAt", made.getTime());
          setRecords(summary.records);
          void hapticSuccess();
          message.success("Data restored");
        } catch (err) {
          message.error(`Restore failed: ${errText(err)}`);
        }
      },
    });
  }

  function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result).trim();
      if (raw.startsWith("zn1.")) { setPwValue(""); setPw({ mode: "decrypt", raw }); }
      else restore(raw);
    };
    reader.readAsText(file);
  }

  async function submitPassword() {
    if (!pw || !pwValue) return;
    setBusy(true);
    try {
      if (pw.mode === "encrypt") {
        const sealed = await encryptString(await exportAll(), pwValue);
        setPw(null);
        if (await saveFile(`zenith-encrypted-${todayKey()}.txt`, sealed, "text/plain") === "done") {
          await markBackedUp();
          message.success("Encrypted backup saved");
        }
      } else {
        const json = await decryptString(pw.raw, pwValue);
        setPw(null);
        restore(json);
      }
    } catch {
      message.error(pw.mode === "decrypt" ? "Wrong password" : "Couldn't encrypt the backup");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Hero color={tone} className="zs-backup" eyebrow="Your data">
        <div className="zs-backup__head">
          <span className="z-ico z-ico--lg" style={{ "--c": tone } as React.CSSProperties}>
            {stale ? <TbAlertTriangle size={22} /> : <TbCloudCheck size={22} />}
          </span>
          <div style={{ minWidth: 0 }}>
            <div className="zs-backup__title">{lastBackupAt ? `Backed up ${ago(lastBackupAt)}` : "Never backed up"}</div>
            <div className="zs-perm__hint">
              {stale ? "App updates keep your data. A lost or reset phone doesn't — save a copy." : "You're covered. Back up again after big changes."}
            </div>
          </div>
        </div>
        <div className="zs-backup__stats">
          <div><b>{records?.toLocaleString() ?? "—"}</b><span>records</span></div>
          <div><b>{usage !== null ? fmtBytes(usage) : "—"}</b><span>on device</span></div>
          <div><b>{persisted ? "On" : "Off"}</b><span>protection</span></div>
        </div>
        <button type="button" className="z-btn z-btn--solid z-btn--block zs-backup__cta" style={{ "--c": tone } as React.CSSProperties}
          onClick={exportPlain} disabled={busy}>
          <TbDownload size={18} /> Back up now
        </button>
      </Hero>

      {persisted === false && (
        <div className="zs-storage" data-row="storage">
          <span className="z-ico z-ico--lg" style={{ "--c": "var(--warn)" } as React.CSSProperties}><TbShield size={22} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="zs-perm__title">Storage not protected</div>
            <div className="zs-perm__hint">The system may clear it if space runs low.</div>
          </div>
          <button type="button" className="z-btn z-btn--solid" onClick={protect}>Protect</button>
        </div>
      )}

      <ListGroup title="More ways to back up" footer="Zenith is local-first: nothing leaves this device unless you export it or turn on Cloud sync.">
        <ListRow rowKey="encrypted" icon={<TbLock size={16} />} color="var(--gold)" label="Encrypted backup" hint="AES-256, unlocked only with your password"
          onClick={() => { setPwValue(""); setPw({ mode: "encrypt" }); }} />
        {persisted && <ListRow rowKey="storage" icon={<TbShieldCheck size={16} />} color="var(--success)" label="Storage protected" hint="The system won't clear it to free space" />}
      </ListGroup>

      <ListGroup title="Restore" footer="You'll see what's in the file before anything is replaced.">
        <ListRow rowKey="import" icon={<TbUpload size={16} />} color="var(--info)" label="Restore from file" hint="Plain or encrypted backups" onClick={() => fileRef.current?.click()} />
      </ListGroup>

      <input ref={fileRef} type="file" accept="application/json,text/plain,.json,.txt" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />

      <Modal open={!!pw} title={pw?.mode === "decrypt" ? "Unlock backup" : "Encrypt backup"}
        okText={pw?.mode === "decrypt" ? "Unlock" : "Encrypt & save"} confirmLoading={busy}
        okButtonProps={{ disabled: !pwValue }} onOk={submitPassword} onCancel={() => setPw(null)} destroyOnHidden>
        <p style={{ color: "var(--ink-soft)", fontSize: 13, marginTop: 0 }}>
          {pw?.mode === "decrypt" ? "This backup is encrypted. Enter the password it was made with." : "There's no recovery if you forget this password."}
        </p>
        <Input.Password autoFocus value={pwValue} placeholder="Password" onChange={(e) => setPwValue(e.target.value)} onPressEnter={submitPassword} />
      </Modal>
    </>
  );
}
