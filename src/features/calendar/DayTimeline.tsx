import { useMemo, useRef, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { useTaskLists } from "../../features/tasks/useTasks";
import type { TaskDto } from "../../db/types";
import { HOUR_H, START_HOUR, TOTAL_H, HourGridLines, NowIndicator, TimeBlock, TimeGridColumn } from "./timeGrid";
import { useGymOverlay } from "./useGymOverlay";
import { useAllDayEvents } from "./useAllDayEvents";
import { TbBarbell } from "react-icons/tb";
import { useTokens } from "../../hooks/useTokens";

interface Props {
  date: string;
  onFocus?: (task: TaskDto) => void;
  onGymTap?: (date: string, dayId: number, done: boolean) => void;
  onTapTask?: (task: TaskDto) => void;
  onToggleDone?: (task: TaskDto) => void;
  onCreateAt?: (date: string, time: string, endTime: string) => void;
  visibleListIds?: Set<string>;
  showGym?: boolean;
}

export function DayTimeline({ date, onFocus, onGymTap, onTapTask, onToggleDone, onCreateAt, visibleListIds, showGym = true }: Props) {
  const t = useTokens();
  const lists = useTaskLists();
  const listMap = useMemo(() => new Map(lists.map((l) => [l.id, l])), [lists]);
  const gymDates = useMemo(() => [date], [date]);
  const gymOverlay = useGymOverlay(gymDates);
  const gym = showGym ? gymOverlay.get(date) : undefined;
  const allDayDates = useMemo(() => [date], [date]);
  const allDayEvents = useAllDayEvents(allDayDates);

  const tasks = useLiveQuery(
    () => db.tasks.where("date").equals(date).toArray(),
    [date],
  ) ?? [];
  const visibleTasks = useMemo(
    () => tasks.filter((tk) => !visibleListIds || visibleListIds.has(tk.listId)),
    [tasks, visibleListIds],
  );

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current hour on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const h = new Date().getHours();
    const offset = Math.max(0, (h - START_HOUR - 1) * HOUR_H);
    scrollRef.current.scrollTop = offset;
  }, [date]);

  // Split: timed tasks (have time field) vs unscheduled vs all-day
  const timed = visibleTasks.filter((tk) => tk.time && tk.status !== "cancelled" && !tk.allDay);
  const unscheduled = visibleTasks.filter((tk) => !tk.time && tk.status !== "cancelled" && tk.status !== "done" && !tk.allDay);
  const allDayHere = (allDayEvents.get(date) ?? []).filter((tk) => !visibleListIds || visibleListIds.has(tk.listId));

  return (
    <div style={{ marginTop: 16 }}>
      <div className="gothic-eyebrow" style={{ marginBottom: 8 }}>
        {new Date(date + "T00:00").toLocaleDateString("en", { weekday: "long", day: "numeric", month: "short" })}
      </div>

      {/* Gym-day overlay chip — synthetic, not a real task row */}
      {gym && (
        <button onClick={() => onGymTap?.(date, gym.dayId, gym.done)} style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          background: `${gym.done ? t.teal : t.accent}22`,
          border: `1px solid ${gym.done ? t.teal : t.accent}40`,
          borderRadius: 10, padding: "8px 12px", marginBottom: 10,
          cursor: "pointer", textAlign: "left",
        }}>
          <TbBarbell size={16} style={{ color: gym.done ? t.teal : t.accent }} />
          <span style={{ flex: 1, fontSize: 12, fontWeight: 700 }}>{gym.dayName}</span>
          <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>{gym.done ? "Done ✓" : "Planned"}</span>
        </button>
      )}

      {/* All-day / multi-day events */}
      {allDayHere.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
          {allDayHere.map((task) => {
            const color = listMap.get(task.listId)?.color ?? "var(--accent)";
            return (
              <button key={task.id} onClick={() => onTapTask?.(task)} style={{
                display: "flex", alignItems: "center", gap: 6, width: "100%", textAlign: "left",
                background: `${color}20`, border: `1px solid ${color}40`,
                borderRadius: 8, padding: "6px 10px", cursor: "pointer",
              }}>
                <span style={{ fontSize: 9, fontWeight: 800, color, textTransform: "uppercase" }}>All day</span>
                <span style={{ fontSize: 12, fontWeight: 700, flex: 1 }}>{task.title}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Scrollable timeline */}
      <div ref={scrollRef} style={{
        position: "relative", height: 360, overflowY: "auto",
        background: "var(--surface)", borderRadius: 14,
        border: "1px solid var(--border)",
      }}>
        <TimeGridColumn date={date} onCreateAt={onCreateAt} style={{ height: TOTAL_H }}>
          <HourGridLines />
          <NowIndicator date={date} />
          {timed.map((task) => (
            <TimeBlock key={task.id} task={task} list={listMap.get(task.listId)}
              onFocus={onFocus} onTap={onTapTask} onToggleDone={onToggleDone} />
          ))}
        </TimeGridColumn>
      </div>

      {/* Unscheduled tasks */}
      {unscheduled.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 6, fontWeight: 600 }}>
            UNSCHEDULED ({unscheduled.length})
          </div>
          {unscheduled.map((task) => {
            const list = listMap.get(task.listId);
            return (
              <div key={task.id} onClick={() => onTapTask?.(task)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                marginBottom: 3, borderRadius: 8, background: "var(--surface)", cursor: "pointer",
                border: "1px solid var(--border)", borderLeft: `3px solid ${list?.color ?? "var(--border)"}`,
              }}>
                <button onClick={(e) => { e.stopPropagation(); onToggleDone?.(task); }}
                  style={{
                    width: 18, height: 18, borderRadius: 4,
                    border: `2px solid ${list?.color ?? "var(--ink-soft)"}`,
                    background: "transparent", cursor: "pointer", flexShrink: 0,
                  }} />
                <span style={{ fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {task.priority === 1 && <span style={{ color: "#ff2740" }}>● </span>}
                  {task.title}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
