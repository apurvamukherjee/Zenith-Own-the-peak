import { useMemo, useRef, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import dayjs from "dayjs";
import { db } from "../../db/db";
import { useTaskLists } from "../tasks/useTasks";
import type { TaskDto } from "../../db/types";
import { HOUR_H, START_HOUR, TOTAL_H, HourGridLines, NowIndicator, TimeBlock, TimeGridColumn, isToday, layoutDayTasks } from "./timeGrid";
import { useGymOverlay } from "./useGymOverlay";
import { useAllDayEvents } from "./useAllDayEvents";
import { todayKey } from "../../lib/date.utils";

const GUTTER = 40;   // sticky hour-label column
const COL_W = 68;    // fixed width per day column (grid scrolls horizontally on phones)

interface Props {
  weekStart: string; // Sunday of the visible week, YYYY-MM-DD
  onDayTap: (date: string) => void;
  onFocus?: (task: TaskDto) => void;
  onTapTask?: (task: TaskDto) => void;
  onToggleDone?: (task: TaskDto) => void;
  onCreateAt?: (date: string, time: string, endTime: string) => void;
  visibleListIds?: Set<string>;
  showGym?: boolean;
}

// 7-day hour grid — Google-Calendar-style week view. Sticky hour gutter +
// sticky day header (freeze-pane) so both stay pinned while the grid scrolls
// both directions. Time blocks reuse the exact same drag-to-reschedule
// primitive as DayTimeline, just narrower.
export function WeekView({ weekStart, onDayTap, onFocus, onTapTask, onToggleDone, onCreateAt, visibleListIds, showGym = true }: Props) {
  const lists = useTaskLists();
  const listMap = useMemo(() => new Map(lists.map((l) => [l.id, l])), [lists]);
  const dates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => dayjs(weekStart).add(i, "day").format("YYYY-MM-DD")),
    [weekStart],
  );
  const gymOverlay = useGymOverlay(dates);
  const allDayEvents = useAllDayEvents(dates);

  const tasks = useLiveQuery(
    () => db.tasks.where("date").anyOf(dates).toArray(),
    [dates.join(",")],
  ) ?? [];

  const byDate = useMemo(() => {
    const m = new Map<string, TaskDto[]>();
    for (const d of dates) m.set(d, []);
    for (const t of tasks) {
      if (t.status === "cancelled" || !t.date || !t.time || t.allDay) continue;
      if (visibleListIds && !visibleListIds.has(t.listId)) continue;
      m.get(t.date)?.push(t);
    }
    return m;
  }, [tasks, dates, visibleListIds]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!scrollRef.current) return;
    const h = new Date().getHours();
    scrollRef.current.scrollTop = Math.max(0, (h - START_HOUR - 1) * HOUR_H);
    const todayIdx = dates.indexOf(todayKey());
    scrollRef.current.scrollLeft = todayIdx >= 0 ? Math.max(0, todayIdx * COL_W - COL_W) : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  return (
    <div style={{ marginTop: 12 }}>
      <div ref={scrollRef} style={{
        position: "relative", height: 460, overflow: "auto",
        background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)",
        WebkitOverflowScrolling: "touch",
      }}>
        <div style={{ position: "relative", width: GUTTER + 7 * COL_W }}>
          {/* Sticky day header */}
          <div style={{ position: "sticky", top: 0, zIndex: 8, display: "flex", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
            <div style={{ position: "sticky", left: 0, zIndex: 9, width: GUTTER, flexShrink: 0, background: "var(--surface)" }} />
            {dates.map((d) => {
              const gym = showGym ? gymOverlay.get(d) : undefined;
              const today = isToday(d);
              return (
                <button key={d} onClick={() => onDayTap(d)} style={{
                  width: COL_W, flexShrink: 0, background: "transparent", border: "none",
                  cursor: "pointer", padding: "6px 0 8px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 10, color: "var(--ink-soft)", fontWeight: 700 }}>{dayjs(d).format("ddd")}</div>
                  <div style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 22, height: 22, borderRadius: "50%", margin: "2px auto 0",
                    fontSize: 12, fontWeight: 800,
                    background: today ? "var(--accent)" : "transparent",
                    color: today ? "#fff" : "var(--ink)",
                    transition: "background 200ms ease",
                  }}>
                    {dayjs(d).format("D")}
                  </div>
                  {gym && (
                    <div style={{
                      width: 5, height: 5, borderRadius: "50%", margin: "4px auto 0",
                      background: gym.done ? "var(--teal)" : "var(--accent)",
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* All-day / multi-day events row */}
          {dates.some((d) => (allDayEvents.get(d) ?? []).some((t) => !visibleListIds || visibleListIds.has(t.listId))) && (
            <div style={{ position: "sticky", top: 46, zIndex: 7, display: "flex", background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "3px 0" }}>
              <div style={{ position: "sticky", left: 0, width: GUTTER, flexShrink: 0 }} />
              {dates.map((d) => {
                const events = (allDayEvents.get(d) ?? []).filter((t) => !visibleListIds || visibleListIds.has(t.listId));
                return (
                  <div key={d} style={{ width: COL_W, flexShrink: 0, padding: "0 2px", display: "flex", flexDirection: "column", gap: 2 }}>
                    {events.slice(0, 2).map((t) => {
                      const color = listMap.get(t.listId)?.color ?? "var(--accent)";
                      return (
                        <button key={t.id} onClick={() => onTapTask?.(t)} style={{
                          fontSize: 9, fontWeight: 700, padding: "1px 3px", borderRadius: 4,
                          background: `${color}30`, color, border: "none", cursor: "pointer",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left",
                        }}>
                          {t.title}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* Hour grid body */}
          <div style={{ position: "relative", height: TOTAL_H, display: "flex" }}>
            <div style={{ position: "sticky", left: 0, zIndex: 6, width: GUTTER, flexShrink: 0, background: "var(--surface)" }}>
              <HourGridLines />
            </div>
            {dates.map((d) => {
              const dayTasks = byDate.get(d) ?? [];
              const layout = layoutDayTasks(dayTasks);
              return (
                <TimeGridColumn key={d} date={d} onCreateAt={onCreateAt} onEmptyTap={() => onDayTap(d)}
                  style={{ width: COL_W, flexShrink: 0, borderLeft: "1px solid var(--border)" }}>
                  <NowIndicator date={d} left={2} right={2} />
                  {dayTasks.map((t) => {
                    const pos = t.id != null ? layout.get(t.id) : undefined;
                    return (
                      <TimeBlock key={t.id} task={t} list={listMap.get(t.listId)} onFocus={onFocus}
                        onTap={onTapTask} onToggleDone={onToggleDone}
                        insetLeft={2} insetRight={2} compact
                        col={pos?.col ?? 0} cols={pos?.cols ?? 1} />
                    );
                  })}
                </TimeGridColumn>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
