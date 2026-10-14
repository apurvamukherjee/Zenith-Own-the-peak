import { useEffect, useRef, useState } from "react";
import { App, Input, Modal } from "antd";
import { TbDownload, TbLock, TbUpload, TbShieldCheck, TbShield } from "react-icons/tb";
import { ListGroup, ListRow } from "../../components/ui/List";
import { exportAll, importAll } from "../../db/db";
import { encryptString, decryptString } from "../../lib/encryptedExport";
import { hapticSuccess } from "../../lib/haptics";
import { saveFile } from "../../lib/saveFile";

const stamp = () => new Date().toISOString().slice(0, 10);

function fmtBytes(n: number) {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

type PwPrompt = { mode: "encrypt" } | { mode: "decrypt"; raw: string };

export function BackupPane() {
  const { message, modal } = App.useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [usage, setUsage] = useState<number | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [pw, setPw] = useState<PwPrompt | null>(null);
  const [pwValue, setPwValue] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void navigator.storage?.estimate?.().then((e) => { if (alive) setUsage(e.usage ?? null); });
    void navigator.storage?.persisted?.().then((p) => { if (alive) setPersisted(p); });
    return () => { alive = false; };
  }, []);

  async function protect() {
    const ok = await navigator.storage?.persist?.();
    setPersisted(!!ok);
    if (ok) { void hapticSuccess(); message.success("Storage protected from automatic cleanup"); }
    else message.info("The browser declined — install Zenith or use it more often, then try again");
  }

  async function exportPlain() {
    try {
      if (await saveFile(`zenith-backup-${stamp()}.json`, await exportAll(), "application/json") === "done") message.success("Backup exported");
    } catch (err) {
      message.error(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function restore(json: string) {
    modal.confirm({
      title: "Restore from backup?",
      content: "This replaces all current data on this device.",
      okText: "Restore", okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await importAll(json);
          void hapticSuccess();
          message.success("Data restored");
        } catch {
          message.error("That file isn't a valid Zenith backup");
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
        if (await saveFile(`zenith-encrypted-${stamp()}.txt`, sealed, "text/plain") === "done") message.success("Encrypted backup exported");
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
      <div className="zs-storage" data-row="storage">
        <span className="z-ico z-ico--lg" style={{ "--c": persisted ? "var(--success)" : "var(--warn)" } as React.CSSProperties}>
          {persisted ? <TbShieldCheck size={22} /> : <TbShield size={22} />}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="zs-perm__title">{usage !== null ? `${fmtBytes(usage)} on this device` : "Stored on this device"}</div>
          <div className="zs-perm__hint">
            {persisted ? "Protected — the system won't clear it to free space." : "Not protected yet — the browser may clear it if space runs low."}
          </div>
        </div>
        {persisted === false && <button type="button" className="z-btn z-btn--solid" onClick={protect}>Protect</button>}
      </div>

      <ListGroup title="Backup" footer="Zenith is local-first: nothing leaves this device unless you export it or turn on Cloud sync.">
        <ListRow rowKey="export" icon={<TbDownload size={16} />} color="var(--success)" label="Export backup" hint="Everything, as a JSON file" onClick={exportPlain} />
        <ListRow rowKey="encrypted" icon={<TbLock size={16} />} color="var(--gold)" label="Encrypted export" hint="AES-256, unlocked only with your password"
          onClick={() => { setPwValue(""); setPw({ mode: "encrypt" }); }} />
      </ListGroup>

      <ListGroup title="Restore" footer="Restoring replaces everything on this device — export first if you want to keep it.">
        <ListRow rowKey="import" icon={<TbUpload size={16} />} color="var(--info)" label="Restore from file" hint="Plain or encrypted backups" onClick={() => fileRef.current?.click()} />
      </ListGroup>

      <input ref={fileRef} type="file" accept="application/json,text/plain,.json,.txt" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />

      <Modal open={!!pw} title={pw?.mode === "decrypt" ? "Unlock backup" : "Encrypt backup"}
        okText={pw?.mode === "decrypt" ? "Unlock" : "Encrypt & download"} confirmLoading={busy}
        okButtonProps={{ disabled: !pwValue }} onOk={submitPassword} onCancel={() => setPw(null)} destroyOnClose>
        <p style={{ color: "var(--ink-soft)", fontSize: 13, marginTop: 0 }}>
          {pw?.mode === "decrypt" ? "This backup is encrypted. Enter the password it was made with." : "There's no recovery if you forget this password."}
        </p>
        <Input.Password autoFocus value={pwValue} placeholder="Password" onChange={(e) => setPwValue(e.target.value)} onPressEnter={submitPassword} />
      </Modal>
    </>
  );
}
