import { useState } from "react";
import { Button, Input, Popconfirm, App } from "antd";
import { TbFlag, TbTrash, TbCheck, TbPlus } from "react-icons/tb";
import { Sheet } from "../../components/Sheet";
import { useBackClose } from "../../hooks/useBackClose";
import { hapticLight, hapticSuccess } from "../../lib/haptics";
import { useMilestonesForGoal, addMilestone, daysUntil, deleteGoalDay } from "./useGoalDays";
import { updateTask, deleteTask } from "../tasks/useTasks";
import type { GoalDayDto, TaskDto } from "../../db/types";

interface Props {
  open: boolean;
  onClose: () => void;
  goal: GoalDayDto | null;
}

export function GoalDetailSheet({ open, onClose, goal }: Props) {
  useBackClose(open, onClose);
  const { message } = App.useApp();
  const milestones = useMilestonesForGoal(goal?.id);
  const [newTitle, setNewTitle] = useState("");

  const done = milestones.filter((m) => m.status === "done").length;
  const total = milestones.length;

  async function addOne() {
    if (!newTitle.trim() || !goal?.id) return;
    await addMilestone(goal.id, newTitle.trim());
    setNewTitle("");
    hapticLight();
  }

  function toggle(m: TaskDto) {
    if (!m.id) return;
    const next = m.status === "done" ? "todo" : "done";
    updateTask(m.id, { status: next, completedAt: next === "done" ? Date.now() : undefined });
    if (next === "done") hapticSuccess();
  }

  async function handleDeleteGoal() {
    if (!goal?.id) return;
    await deleteGoalDay(goal.id);
    message.success("Goal deleted");
    onClose();
  }

  if (!goal) return null;
  const days = daysUntil(goal.date);

  return (
    <Sheet open={open} onCancel={onClose} title="Goal" footer={null} destroyOnHidden>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <TbFlag size={20} style={{ color: "var(--accent)", flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div className="display" style={{ fontSize: 18, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{goal.title}</div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{goal.date}</div>
        </div>
      </div>
      <div style={{ fontWeight: 800, color: "var(--accent)", fontSize: 22, margin: "6px 0 14px" }}>
        {days === 0 ? "Today!" : days > 0 ? `${days} days away` : `${Math.abs(days)} days ago`}
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>
        Milestones {total > 0 && `(${done}/${total})`}
      </div>

      {milestones.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 10 }}>
          No milestones yet — break this goal into steps below.
        </div>
      ) : (
        <div style={{ marginBottom: 10 }}>
          {milestones.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
              <button onClick={() => toggle(m)} aria-label={m.status === "done" ? "Mark not done" : "Mark done"}
                style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0, cursor: "pointer",
                  border: `1.5px solid ${m.status === "done" ? "var(--teal)" : "var(--border)"}`,
                  background: m.status === "done" ? "var(--teal)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                {m.status === "done" && <TbCheck size={14} color="#fff" />}
              </button>
              <span style={{
                flex: 1, fontSize: 13.5,
                textDecoration: m.status === "done" ? "line-through" : "none",
                color: m.status === "done" ? "var(--ink-soft)" : "var(--ink)",
              }}>{m.title}</span>
              <Popconfirm title="Delete this milestone?" okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }}
                onConfirm={() => m.id && deleteTask(m.id)}>
                <Button type="text" size="small" icon={<TbTrash />} aria-label="Delete milestone" />
              </Popconfirm>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <Input placeholder="Add a milestone" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
          onPressEnter={addOne} />
        <Button icon={<TbPlus />} onClick={addOne} disabled={!newTitle.trim()} />
      </div>

      <Popconfirm title="Delete this goal?" description="Its milestones stay in your Tasks list." okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }}
        onConfirm={handleDeleteGoal}>
        <Button danger block icon={<TbTrash />}>Delete goal</Button>
      </Popconfirm>
    </Sheet>
  );
}
