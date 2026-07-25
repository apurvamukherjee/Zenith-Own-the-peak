import { Modal, Checkbox } from "antd";
import type { TaskListDto } from "../../db/types";

interface Props {
  open: boolean;
  onClose: () => void;
  lists: TaskListDto[];
  visibleLists: Set<string>;
  onToggleList: (id: string) => void;
  showGym: boolean;
  onToggleGym: () => void;
  showScore: boolean;
  onToggleScore: () => void;
}

// Independent show/hide toggles per "layer" — the discipline-score tint, the
// synthetic gym overlay, and each real task list — so a cluttered calendar
// can be narrowed down to just what matters right now.
export function CalendarLayersSheet({
  open, onClose, lists, visibleLists, onToggleList, showGym, onToggleGym, showScore, onToggleScore,
}: Props) {
  return (
    <Modal open={open} onCancel={onClose} footer={null} title="Layers">
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: "pointer" }}>
          <Checkbox checked={showScore} onChange={onToggleScore} />
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--gold)", flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13 }}>Discipline score</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: "pointer" }}>
          <Checkbox checked={showGym} onChange={onToggleGym} />
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--accent)", flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13 }}>Gym days</span>
        </label>
        <div style={{ borderTop: "1px solid var(--border)", margin: "6px 0" }} />
        {lists.map((l) => (
          <label key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: "pointer" }}>
            <Checkbox checked={visibleLists.has(l.id)} onChange={() => onToggleList(l.id)} />
            <span style={{ width: 10, height: 10, borderRadius: 3, background: l.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13 }}>{l.name}</span>
          </label>
        ))}
      </div>
    </Modal>
  );
}
