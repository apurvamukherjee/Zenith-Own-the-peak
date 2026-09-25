import { Rate, Input, Button, App, Popconfirm } from "antd";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { TimeSelect } from "../../components/TimeSelect";
import { upsertSleep, getSleep, deleteSleep } from "./useSleep";
import { fmtDuration, sleepDurationMin } from "../../lib/date.utils";
import { VIOLET } from "../../theme";
import { hapticSuccess } from "../../lib/haptics";
import { playBellDing } from "../../lib/audio";
import type { SleepDto } from "../../db/types";

// Shared log/edit form for one night, used by SleepPage and the Calendar backfill bar.
export function SleepForm({ date, onDone }: { date: string; onDone?: () => void }) {
  const entry = useLiveQuery(async () => (await getSleep(date)) ?? null, [date]);
  if (entry === undefined) return null;
  // Remount on date/row change so field state re-seeds from the stored entry.
  return <Fields key={`${date}:${entry?.id ?? "new"}`} date={date} entry={entry} onDone={onDone} />;
}

function Fields({ date, entry, onDone }: { date: string; entry: SleepDto | null; onDone?: () => void }) {
  const { message } = App.useApp();
  const [sleepAt, setSleepAt] = useState(entry?.sleepAt ?? "23:30");
  const [wakeAt, setWakeAt] = useState(entry?.wakeAt ?? "07:00");
  const [quality, setQuality] = useState(entry?.quality ?? 3);
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const preview = sleepDurationMin(sleepAt, wakeAt);

  async function save() {
    await upsertSleep({ date, sleepAt, wakeAt, quality, notes });
    void hapticSuccess();
    playBellDing();
    message.success(`${entry ? "Updated" : "Logged"} ${fmtDuration(preview)}`);
    onDone?.();
  }

  async function remove() {
    await deleteSleep(date);
    message.success("Night deleted");
    onDone?.();
  }

  return (
    <>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>Slept at</div>
          <TimeSelect value={sleepAt} onChange={setSleepAt} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>Woke at</div>
          <TimeSelect value={wakeAt} onChange={setWakeAt} />
        </div>
      </div>
      <div style={{ textAlign: "center", marginBottom: 12, fontWeight: 700, color: VIOLET }}>{fmtDuration(preview)}</div>
      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>Quality</div>
      <Rate value={quality} onChange={setQuality} style={{ marginBottom: 12 }} />
      <Input.TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2} style={{ marginBottom: 12 }} />
      <Button type="primary" block size="large" onClick={() => void save()} style={{ fontWeight: 700 }}>{entry ? "Update night" : "Save night"}</Button>
      {entry && (
        <Popconfirm title="Delete this night?" okText="Yes" cancelText="No" onConfirm={() => void remove()}>
          <Button danger block type="text" style={{ marginTop: 8 }}>Delete night</Button>
        </Popconfirm>
      )}
    </>
  );
}
