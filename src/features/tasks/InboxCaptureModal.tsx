import { useState } from "react";
import { Button, Input } from "antd";
import {
  TbInbox, TbCheck, TbCalendar, TbClock, TbAlertTriangle, TbArrowDown, TbMapPin, TbRepeat,
} from "react-icons/tb";
import type { IconType } from "react-icons";
import { Sheet } from "../../components/Sheet";
import { useBackClose } from "../../hooks/useBackClose";
import { addTask } from "./useTasks";
import { parseTaskInput } from "../../lib/taskParser";
import { hapticSuccess } from "../../lib/haptics";

// Basecamp Inbox — a single frictionless global capture field, reachable
// from the FAB on every screen. Reuses the exact parse-preview quick-add
// interaction already proven in TasksPage/TaskListView (parseTaskInput +
// addTask), but stays open after each submit so a whole brain-dump session
// (several items in a row) doesn't require reopening the sheet each time.
export function InboxCaptureModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useBackClose(open, onClose);
  const [text, setText] = useState("");
  const [justCaptured, setJustCaptured] = useState<string[]>([]);

  const parsed = text.trim().length > 2 ? parseTaskInput(text) : null;

  async function submit() {
    const raw = text.trim();
    if (!raw) return;
    const p = parseTaskInput(raw);
    const title = p.title || raw;
    await addTask({
      title, listId: "inbox", priority: p.priority ?? 2,
      date: p.date, time: p.time, endTime: p.endTime, location: p.location,
    });
    hapticSuccess();
    setJustCaptured((prev) => [title, ...prev].slice(0, 8));
    setText("");
  }

  function handleClose() {
    setJustCaptured([]);
    onClose();
  }

  return (
    <Sheet open={open} onCancel={handleClose} title="Quick capture" footer={null} destroyOnHidden>
      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 10 }}>
        Brain-dump anything — a task, an errand, a thought. Add a date/time
        if you know it ("gym tomorrow 7am"), or leave it dateless for later.
      </div>
      <Input.TextArea
        autoFocus autoSize={{ minRows: 2, maxRows: 5 }}
        placeholder="Buy notebook, call the vet tomorrow, gym 7am…"
        value={text} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); submit(); }
        }}
        style={{ marginBottom: 8 }}
      />
      {parsed && (() => {
        const parts: { Icon: IconType; text: string; color?: string }[] = [];
        if (parsed.date) parts.push({ Icon: TbCalendar, text: parsed.date });
        if (parsed.time) parts.push({ Icon: TbClock, text: `${parsed.time}${parsed.endTime ? `–${parsed.endTime}` : ""}` });
        if (parsed.priority === 1) parts.push({ Icon: TbAlertTriangle, text: "urgent", color: "var(--accent)" });
        if (parsed.priority === 3) parts.push({ Icon: TbArrowDown, text: "low", color: "var(--teal)" });
        if (parsed.location) parts.push({ Icon: TbMapPin, text: parsed.location });
        if (parsed.recurring) parts.push({ Icon: TbRepeat, text: parsed.recurring.frequency });
        return parts.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 11, color: "var(--ink-soft)", marginBottom: 10 }}>
            <span>Parsed: <strong>{parsed.title || "..."}</strong></span>
            {parts.map((p, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 3, color: p.color ?? "var(--ink-soft)" }}>
                <p.Icon size={11} /> {p.text}
              </span>
            ))}
          </div>
        ) : <div style={{ marginBottom: 10 }} />;
      })()}

      <Button type="primary" block size="large" icon={<TbInbox />} onClick={submit}
        disabled={!text.trim()} style={{ fontWeight: 700, marginBottom: 12 }}>
        Capture
      </Button>

      {justCaptured.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, marginBottom: 4 }}>
          {justCaptured.map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-soft)", padding: "3px 0" }}>
              <TbCheck style={{ color: "var(--teal)", flexShrink: 0 }} /> {t}
            </div>
          ))}
        </div>
      )}

      <Button block onClick={handleClose} style={{ marginTop: 4 }}>Done</Button>
    </Sheet>
  );
}
