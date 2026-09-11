import { useMemo } from "react";
import { motion } from "framer-motion";
import { TbClock, TbCheck } from "react-icons/tb";
import { updateTask } from "./useTasks";
import type { TaskDto, TaskListDto } from "../../db/types";
import { hapticLight } from "../../lib/haptics";

// Kanban board: 3 columns (Todo → In Progress → Done).
// Drag between columns changes status. "In Progress" shows elapsed time.
interface Props { tasks: TaskDto[]; list: TaskListDto; }

export function KanbanView({ tasks, list }: Props) {
  const columns: { key: TaskDto["status"]; label: string; tasks: TaskDto[] }[] = useMemo(() => [
    { key: "todo", label: "To Do", tasks: tasks.filter((t) => t.status === "todo").sort((a, b) => a.priority - b.priority) },
    { key: "in_progress", label: "In Progress", tasks: tasks.filter((t) => t.status === "in_progress").sort((a, b) => a.priority - b.priority) },
    { key: "done", label: "Done", tasks: tasks.filter((t) => t.status === "done").sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)).slice(0, 20) },
  ], [tasks]);

  async function moveToColumn(taskId: number, newStatus: TaskDto["status"]) {
    hapticLight();
    const updates: Partial<TaskDto> = { status: newStatus };
    if (newStatus === "in_progress") updates.startedAt = Date.now();
    if (newStatus === "done") updates.completedAt = Date.now();
    await updateTask(taskId, updates);
  }

  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
      {columns.map((col) => (
        <div key={col.key} style={{
          flex: "0 0 auto", width: "calc(33.33% - 6px)", minWidth: 140,
          background: "var(--surface)", borderRadius: 12, padding: "8px 6px",
          border: "1px solid var(--border)",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "var(--ink-soft)",
            marginBottom: 8, textAlign: "center",
          }}>
            {col.label} <span style={{ opacity: 0.6 }}>({col.tasks.length})</span>
          </div>

          {col.tasks.map((task) => (
            <KanbanCard key={task.id} task={task} list={list} columns={columns.map((c) => c.key)}
              currentCol={col.key} onMove={moveToColumn} />
          ))}

          {col.tasks.length === 0 && (
            <div style={{ fontSize: 11, color: "var(--ink-soft)", textAlign: "center", padding: "16px 0", opacity: 0.5 }}>
              Empty
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function KanbanCard({ task, list, columns, currentCol, onMove }: {
  task: TaskDto; list: TaskListDto;
  columns: TaskDto["status"][]; currentCol: TaskDto["status"];
  onMove: (id: number, status: TaskDto["status"]) => void;
}) {
  const elapsed = task.startedAt ? Math.round((Date.now() - task.startedAt) / 60_000) : 0;
  const nextCol = columns[columns.indexOf(currentCol) + 1];
  const prevCol = columns.indexOf(currentCol) > 0 ? columns[columns.indexOf(currentCol) - 1] : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        padding: "8px 8px", marginBottom: 4, borderRadius: 8,
        background: "var(--bg)", border: "1px solid var(--border)",
        borderLeft: `3px solid ${list.color}`,
        opacity: task.status === "done" ? 0.55 : 1,
      }}
    >
      <div style={{
        fontSize: 12, fontWeight: 600,
        textDecoration: task.status === "done" ? "line-through" : "none",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {task.priority === 1 && <span style={{ color: "#ff2740" }}>● </span>}
        {task.title}
      </div>

      {task.status === "in_progress" && elapsed > 0 && (
        <div style={{ fontSize: 9, color: list.color, marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}>
          <TbClock size={10} /> {elapsed}m
        </div>
      )}

      {/* Quick move buttons */}
      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
        {prevCol && (
          <button onClick={() => task.id && onMove(task.id, prevCol)}
            style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, border: "1px solid var(--border)", background: "transparent", color: "var(--ink-soft)", cursor: "pointer" }}>
            ← Back
          </button>
        )}
        {nextCol && (
          <button onClick={() => task.id && onMove(task.id, nextCol)}
            style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, padding: "1px 6px", borderRadius: 4, border: `1px solid ${list.color}40`, background: `${list.color}15`, color: list.color, cursor: "pointer", fontWeight: 700 }}>
            {nextCol === "done" ? <><TbCheck size={10} /> Done</> : "Start →"}
          </button>
        )}
      </div>
    </motion.div>
  );
}
