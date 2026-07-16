import { useEffect, useState } from "react";
import { Modal, Tag } from "antd";
import { db } from "../db/db";
import { onMutation } from "../lib/mutations";
import { useBackClose } from "../hooks/useBackClose";

// Egg #8 — the IDDQD dev panel. Lazy-mounted from AppShell so its cost is
// zero until triggered. Shows raw table counts, mutation events per second,
// and current adaptive-theme tick. No writes, purely diagnostic.
export function DebugPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  useBackClose(open, onClose);

  const [counts, setCounts] = useState<Record<string, number>>({});
  const [eventsPerSec, setEventsPerSec] = useState(0);
  const [tick, setTick] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    if (!open) return;
    let alive = true;
    let events = 0;
    const off = onMutation(() => { events++; });
    const secTimer = window.setInterval(() => {
      if (!alive) return;
      setEventsPerSec(events);
      events = 0;
      setTick(new Date().toLocaleTimeString());
    }, 1000);
    const refresh = async () => {
      const table = db.tables;
      const out: Record<string, number> = {};
      for (const t of table) out[t.name] = await t.count();
      if (alive) setCounts(out);
    };
    void refresh();
    const refreshTimer = window.setInterval(refresh, 3000);
    return () => {
      alive = false; off();
      window.clearInterval(secTimer);
      window.clearInterval(refreshTimer);
    };
  }, [open]);

  return (
    <Modal
      open={open} onCancel={onClose} title="IDDQD · dev view" footer={null}
      styles={{ content: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" } }}
    >
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <Tag color="red">events/s: {eventsPerSec}</Tag>
        <Tag>tick: {tick}</Tag>
      </div>
      <div style={{ maxHeight: 340, overflowY: "auto", fontSize: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left" style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>Table</th>
              <th align="right" style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>Rows</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(counts)
              .sort((a, b) => b[1] - a[1])
              .map(([name, n]) => (
                <tr key={name}>
                  <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--border)" }}>{name}</td>
                  <td align="right" style={{ padding: "4px 8px", borderBottom: "1px solid var(--border)", color: n > 0 ? "var(--accent)" : "var(--ink-soft)" }}>
                    {n.toLocaleString()}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
