import { useMemo, useState } from "react";
import { Input } from "antd";
import { useLiveQuery } from "dexie-react-hooks";
import dayjs from "dayjs";
import { TbSearch } from "react-icons/tb";
import { Sheet } from "../../components/Sheet";
import { useBackClose } from "../../hooks/useBackClose";
import { useTaskLists } from "../tasks/useTasks";
import { db } from "../../db/db";
import type { TaskDto } from "../../db/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onJumpTo: (task: TaskDto) => void;
}

// Searches title/location/notes across every task, not just the visible
// range — Month/Week/Day only ever query a narrow date window, so this is
// the one surface that can find "that thing I scheduled months ago."
export function CalendarSearchSheet({ open, onClose, onJumpTo }: Props) {
  useBackClose(open, onClose);
  const [q, setQ] = useState("");
  const lists = useTaskLists();
  const listMap = useMemo(() => new Map(lists.map((l) => [l.id, l])), [lists]);

  const results = useLiveQuery(async () => {
    const query = q.trim().toLowerCase();
    if (query.length < 2) return [] as TaskDto[];
    const all = await db.tasks.where("status").notEqual("cancelled").toArray();
    return all
      .filter((t) =>
        t.title.toLowerCase().includes(query) ||
        t.location?.toLowerCase().includes(query) ||
        t.notes?.toLowerCase().includes(query))
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
      .slice(0, 50);
  }, [q]) ?? [];

  return (
    <Sheet open={open} onCancel={onClose} footer={null} title="Search events">
      <div style={{ marginTop: 8 }}>
        <Input placeholder="Search title, location, notes…" prefix={<TbSearch size={14} style={{ color: "var(--ink-soft)" }} />}
          value={q} onChange={(e) => setQ(e.target.value)} autoFocus allowClear />

        <div style={{ marginTop: 12, maxHeight: "50vh", overflowY: "auto" }}>
          {q.trim().length >= 2 && results.length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 0", color: "var(--ink-soft)", fontSize: 13 }}>
              No matches
            </div>
          )}
          {results.map((t) => {
            const list = listMap.get(t.listId);
            return (
              <button key={t.id} onClick={() => onJumpTo(t)} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                padding: "9px 10px", marginBottom: 4, borderRadius: 10,
                background: "var(--bg)", border: "1px solid var(--border)",
                borderLeft: `3px solid ${list?.color ?? "var(--border)"}`, cursor: "pointer",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                    {t.date ? dayjs(t.date).format("ddd, D MMM YYYY") : "No date"}{t.time ? ` · ${t.time}` : ""}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}
