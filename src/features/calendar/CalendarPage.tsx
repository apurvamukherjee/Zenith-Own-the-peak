import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Modal, Button, App, Segmented, Input } from "antd";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  TbChevronLeft, TbChevronRight, TbFlag, TbCamera, TbShare, TbX,
  TbCalendarMonth, TbCalendarWeek, TbCalendarEvent, TbPlus, TbSearch,
  TbStack2, TbFileExport,
} from "react-icons/tb";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { useMonthScores as useRawMonthScores } from "./useCalendar";
import { useSetting } from "../../hooks/useSettings";
import { useBackClose } from "../../hooks/useBackClose";
import { useTokens } from "../../hooks/useTokens";
import { DayTaskSheet } from "./DayTaskSheet";
import { DayTimeline } from "./DayTimeline";
import { WeekView } from "./WeekView";
import { useGymOverlay } from "./useGymOverlay";
import { useAllDayEvents } from "./useAllDayEvents";
import { EventEditorSheet } from "./EventEditorSheet";
import { useMealCompletion } from "./useMealCompletion";
import { CalendarLayersSheet } from "./CalendarLayersSheet";
import { CalendarSearchSheet } from "./CalendarSearchSheet";
import { FoodPickerModal } from "../nutrition/FoodPickerModal";
import { FocusMode } from "../../components/FocusMode";
import { spawnRecurring } from "../tasks/useRecurringSpawner";
import { useTaskLists } from "../tasks/useTasks";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { todayKey } from "../../lib/date.utils";
import { filteredValue, type ScoreFilter } from "../../lib/dayScore";
import { useMonthSummary } from "./useMonthSummary";
import { useGoalsForMonth, useUpcomingGoals, addGoalDay, daysUntil, useMilestoneCounts } from "./useGoalDays";
import { GoalDetailSheet } from "./GoalDetailSheet";
import { usePhotoDatesInMonth } from "./useDayPhoto";
import { backfillSession } from "../gym/useGym";
import { buildICS, exportICS } from "../../lib/icsExport";
import type { TaskDto, GoalDayDto } from "../../db/types";
import dayjs from "dayjs";

function inferMealType() {
  const h = new Date().getHours();
  if (h < 11) return "breakfast" as const;
  if (h < 15) return "lunch" as const;
  if (h < 21) return "dinner" as const;
  return "snack" as const;
}

const WEEKDAY_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];
const FILTERS: { label: string; value: ScoreFilter }[] = [
  { label: "All", value: "blended" }, { label: "Water", value: "water" },
  { label: "Sleep", value: "sleep" }, { label: "Train", value: "session" }, { label: "Protein", value: "protein" },
];
type ViewMode = "month" | "week" | "day";
const VIEW_OPTIONS: { label: React.ReactNode; value: ViewMode }[] = [
  { label: <TbCalendarMonth size={15} />, value: "month" },
  { label: <TbCalendarWeek size={15} />, value: "week" },
  { label: <TbCalendarEvent size={15} />, value: "day" },
];
const SWIPE_THRESHOLD = 70;
const VELOCITY_THRESHOLD = 300;

function colorFor(pct: number, hasAny: boolean, t: { teal: string; gold: string }): string {
  if (!hasAny) return "var(--border)";
  if (pct >= 75) return t.teal;
  if (pct >= 40) return t.gold;
  return "#ff5c7a";
}

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 28 : -28 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -28 : 28 }),
};

export function CalendarPage() {
  const { message, modal } = App.useApp();
  const t = useTokens();
  const nav = useNavigate();
  const waterGoal = useSetting("waterGoalMl");
  const proteinTarget = useSetting("proteinTargetG");
  const now = new Date();
  const location = useLocation();
  const navState = location.state as { year?: number; month?: number } | null;
  const [year, setYear] = useState(navState?.year ?? now.getFullYear());
  const [month, setMonth] = useState(navState?.month ?? now.getMonth());
  const [view, setView] = useState<ViewMode>("month");
  const [viewDate, setViewDate] = useState(todayKey());
  const [direction, setDirection] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<ScoreFilter>("blended");
  const [showSummary, setShowSummary] = useState(false);
  const [showGoalAdd, setShowGoalAdd] = useState(false);
  const [goalDetail, setGoalDetail] = useState<GoalDayDto | null>(null);

  // Range select (long-press start, tap end) — Month view only
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const pressTimer = useRef<number | null>(null);

  const rawCells = useRawMonthScores(year, month, waterGoal, proteinTarget);
  const dates = useMemo(() => rawCells.map((c) => c.date), [rawCells]);
  const scoreMap = useMemo(() => new Map(rawCells.map((c) => [c.date, { score: c.score, hasAny: c.hasAny }])), [rawCells]);
  const goals = useGoalsForMonth(dates);
  const photoDates = usePhotoDatesInMonth(dates);
  const summary = useMonthSummary(dates, scoreMap);
  const upcomingGoals = useUpcomingGoals(3);
  const milestoneCounts = useMilestoneCounts(upcomingGoals.map((g) => g.id!).filter(Boolean));
  const gymOverlay = useGymOverlay(dates);
  const allDayEvents = useAllDayEvents(dates);

  // Phase 6B — focus mode + task dots + recurring spawner
  const [focusTask, setFocusTask] = useState<TaskDto | null>(null);
  // Phase 8 — unified event editor + meal-plan-to-log completion
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTask, setEditorTask] = useState<TaskDto | undefined>(undefined);
  const [editorDefaults, setEditorDefaults] = useState<{ date?: string; time?: string; endTime?: string }>({});
  const mealFlow = useMealCompletion();

  // Phase 9 — layers (show/hide by list + gym + discipline score) + search
  const taskLists = useTaskLists();
  const [hiddenLists, setHiddenLists] = useState<Set<string>>(new Set());
  const [showGymLayer, setShowGymLayer] = useState(true);
  const [showScoreLayer, setShowScoreLayer] = useState(true);
  const [layersOpen, setLayersOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const visibleListIds = useMemo(
    () => new Set(taskLists.map((l) => l.id).filter((id) => !hiddenLists.has(id))),
    [taskLists, hiddenLists],
  );
  const listColorMap = useMemo(() => new Map(taskLists.map((l) => [l.id, l.color])), [taskLists]);
  function toggleListLayer(id: string) {
    setHiddenLists((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function jumpToSearchResult(task: TaskDto) {
    setSearchOpen(false);
    if (!task.date) return;
    setViewDate(task.date);
    setView("day");
  }
  async function handleExportICS() {
    const start = todayKey();
    const end = dayjs().add(180, "day").format("YYYY-MM-DD");
    const tasks = await db.tasks.where("date").between(start, end, true, true).toArray();
    const ics = buildICS(tasks.filter((tsk) => tsk.status !== "cancelled"));
    await exportICS("zenith-calendar.ics", ics);
    message.success("Calendar exported");
  }

  function openEditor(task?: TaskDto, defaults?: { date?: string; time?: string; endTime?: string }) {
    setEditorTask(task);
    setEditorDefaults(defaults ?? {});
    setEditorOpen(true);
  }
  function handleCreateAt(date: string, time: string, endTime: string) {
    openEditor(undefined, { date, time, endTime });
  }

  // Spawn recurring task instances for the visible month
  useEffect(() => {
    const firstDay = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = `${year}-${String(month + 1).padStart(2, "0")}-${new Date(year, month + 1, 0).getDate()}`;
    spawnRecurring(firstDay, lastDay).catch(() => {});
  }, [year, month]);

  // Task dots per day — grouped by list color (max 4 dots)
  const taskDots = useLiveQuery(async () => {
    const monthTasks = await db.tasks.where("date").between(
      `${year}-${String(month + 1).padStart(2, "0")}-01`,
      `${year}-${String(month + 1).padStart(2, "0")}-31`,
      true, true,
    ).toArray();
    const lists = await db.taskLists.toArray();
    const colorMap = new Map(lists.map((l) => [l.id, l.color]));
    const dots = new Map<string, string[]>(); // date → unique colors
    for (const t of monthTasks) {
      if (!t.date || t.status === "cancelled" || t.allDay) continue;
      if (!visibleListIds.has(t.listId)) continue;
      const arr = dots.get(t.date) ?? [];
      const c = colorMap.get(t.listId) ?? "var(--accent)";
      if (!arr.includes(c)) arr.push(c);
      dots.set(t.date, arr.slice(0, 4)); // max 4 dots
    }
    return dots;
  }, [year, month, visibleListIds]) ?? new Map();

  const firstDow = new Date(year, month, 1).getDay();
  const monthLabel = dayjs(new Date(year, month, 1)).format("MMMM YYYY");
  const weekStart = useMemo(() => {
    const d = dayjs(viewDate);
    return d.subtract(d.day(), "day").format("YYYY-MM-DD");
  }, [viewDate]);
  const weekLabel = `${dayjs(weekStart).format("D MMM")} – ${dayjs(weekStart).add(6, "day").format("D MMM YYYY")}`;
  const dayLabel = dayjs(viewDate).format("dddd, D MMMM");

  function prevMonth() { setDirection(-1); if (month === 0) { setYear(year - 1); setMonth(11); } else setMonth(month - 1); }
  function nextMonth() { setDirection(1); if (month === 11) { setYear(year + 1); setMonth(0); } else setMonth(month + 1); }
  function stepPeriod(dir: 1 | -1) {
    setDirection(dir);
    if (view === "month") { dir === 1 ? nextMonth() : prevMonth(); }
    else if (view === "week") setViewDate((d) => dayjs(d).add(dir * 7, "day").format("YYYY-MM-DD"));
    else setViewDate((d) => dayjs(d).add(dir, "day").format("YYYY-MM-DD"));
  }
  function changeView(v: ViewMode) {
    if (v !== "month" && selected) setViewDate(selected);
    setView(v);
  }

  function handlePressStart(date: string) {
    pressTimer.current = window.setTimeout(() => {
      setRangeStart(date); setRangeEnd(date);
      message.info("Range select started — tap an end date");
    }, 500);
  }
  function handlePressEnd() {
    if (pressTimer.current) { window.clearTimeout(pressTimer.current); pressTimer.current = null; }
  }
  function handleTap(date: string, isFuture: boolean) {
    if (isFuture) return;
    if (rangeStart && !rangeEnd) { setRangeEnd(date); return; }
    if (rangeStart && rangeEnd) { setRangeStart(null); setRangeEnd(null); }
    setSelected(date);
  }

  // Drag-to-swipe for Week/Day views (Month view keeps its own long-press
  // range-select gesture, so it isn't wrapped in a competing drag handler).
  function handlePeriodDrag(_: unknown, info: PanInfo) {
    if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -VELOCITY_THRESHOLD) stepPeriod(1);
    else if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > VELOCITY_THRESHOLD) stepPeriod(-1);
  }

  async function handleGymTap(date: string, dayId: number, done: boolean) {
    if (done) { message.success("Session already logged for this day ✓"); return; }
    const today = todayKey();
    if (date > today) { message.info("Planned — nothing to log yet."); return; }
    if (date === today) { nav("/workout"); return; }
    modal.confirm({
      title: "Backfill this session?",
      content: "Logs all planned sets at your program's target weight/reps for this date.",
      okText: "Backfill",
      onOk: async () => { await backfillSession(date, dayId); message.success("Session backfilled"); },
    });
  }

  const rangeStats = useMemo(() => {
    if (!rangeStart || !rangeEnd) return null;
    const [a, b] = [rangeStart, rangeEnd].sort();
    const inRange = dates.filter((d) => d >= a && d <= b);
    const active = inRange.filter((d) => scoreMap.get(d)?.hasAny);
    const avg = active.length ? Math.round(active.reduce((s, d) => s + (scoreMap.get(d)?.score ?? 0), 0) / active.length) : 0;
    return { from: a, to: b, days: inRange.length, activeDays: active.length, avg };
  }, [rangeStart, rangeEnd, dates, scoreMap]);

  function exportMonth() {
    const text = `Zenith — ${monthLabel}\nAvg discipline: ${summary.avgScore}%\nBest week: ${summary.bestWeek?.weekLabel ?? "–"} (${summary.bestWeek?.avg ?? 0}%)\nTraining volume: ${summary.totalVolume}kg across ${summary.totalSets} sets\nStudy time: ${summary.totalStudyMin} min\nActive days: ${summary.daysActive}/${dates.length}`;
    if (navigator.share) {
      navigator.share({ title: `Zenith — ${monthLabel}`, text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
      message.success("Summary copied to clipboard");
    }
  }

  const periodKey = view === "month" ? `month-${year}-${month}` : view === "week" ? `week-${weekStart}` : `day-${viewDate}`;
  const headerLabel = view === "month" ? monthLabel : view === "week" ? weekLabel : dayLabel;

  return (
    <PageTransition>
      <SectionTitle eyebrow="Calendar" title="Your discipline, day by day" />

      {/* Upcoming goal countdown */}
      {upcomingGoals.length > 0 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 12, paddingBottom: 2 }}>
          {upcomingGoals.map((g) => {
            const counts = g.id ? milestoneCounts.get(g.id) : undefined;
            return (
              <div key={g.id} onClick={() => setGoalDetail(g)} role="button" tabIndex={0}
                style={{ background: "var(--surface)", borderRadius: 12, padding: "8px 12px", whiteSpace: "nowrap", border: "1px solid var(--border)", cursor: "pointer" }}>
                <div style={{ fontSize: 11, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 4 }}><TbFlag size={12} />{g.title}</div>
                <div style={{ fontWeight: 800, color: "var(--accent)", fontSize: 14 }}>
                  {daysUntil(g.date) === 0 ? "Today!" : `${daysUntil(g.date)}d away`}
                </div>
                {counts && counts.total > 0 && (
                  <div style={{ fontSize: 10, color: "var(--ink-soft)", marginTop: 1 }}>{counts.done}/{counts.total} milestones</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* View switcher + layers/search/export/new-event */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <div />
        <Segmented size="small" value={view} onChange={(v) => changeView(v as ViewMode)} options={VIEW_OPTIONS} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
          <Button size="small" type="text" icon={<TbSearch size={15} />} aria-label="Search" onClick={() => setSearchOpen(true)} />
          <Button size="small" type="text" icon={<TbStack2 size={15} />} aria-label="Layers" onClick={() => setLayersOpen(true)} />
          <Button size="small" type="text" icon={<TbFileExport size={15} />} aria-label="Export calendar" onClick={handleExportICS} />
          <Button size="small" type="primary" icon={<TbPlus size={15} />} aria-label="New event"
            onClick={() => openEditor(undefined, { date: view === "day" ? viewDate : view === "week" ? weekStart : (selected ?? todayKey()) })} />
        </div>
      </div>

      {/* Period nav + label */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <Button type="text" icon={<TbChevronLeft />} onClick={() => stepPeriod(-1)} aria-label="Previous" />
        <button onClick={() => view === "month" && setShowSummary(true)} style={{
          background: "none", border: "none",
          fontFamily: '"Cinzel", "Plus Jakarta Sans", serif',
          fontWeight: 700, fontSize: view === "month" ? 15 : 13, letterSpacing: "0.1em",
          textTransform: "uppercase", cursor: view === "month" ? "pointer" : "default", color: "var(--ink)",
        }}>
          {headerLabel}
        </button>
        <Button type="text" icon={<TbChevronRight />} onClick={() => stepPeriod(1)} aria-label="Next" />
      </div>

      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={periodKey}
          custom={direction}
          variants={slideVariants}
          initial="enter" animate="center" exit="exit"
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          drag={view !== "month" ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.3}
          onDragEnd={view !== "month" ? handlePeriodDrag : undefined}
        >
          {view === "month" && (
            <>
              {/* Weekly strip — this week zoomed */}
              <div style={{ background: "var(--surface)", borderRadius: 10, padding: "8px 12px", marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>This week</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                  {(() => {
                    const today = new Date();
                    const dow = today.getDay();
                    const wStart = new Date(today); wStart.setDate(today.getDate() - dow);
                    const week = Array.from({ length: 7 }, (_, i) => {
                      const d = new Date(wStart); d.setDate(wStart.getDate() + i);
                      return d.toISOString().slice(0, 10);
                    });
                    return week.map((iso) => {
                      const cell = rawCells.find((c) => c.date === iso);
                      const pct = cell ? filteredValue(cell, filter) : 0;
                      const bg = cell?.hasAny ? colorFor(pct, cell.hasAny, t) : "var(--surface)";
                      const bgImage = cell?.hasAny ? "none" : "radial-gradient(circle at 50% 50%, var(--ember-inner) 1px, transparent 1px)";
                      return (
                        <div key={iso} style={{
                          aspectRatio: "1", borderRadius: 6, background: bg,
                          backgroundImage: bgImage, backgroundSize: "6px 6px",
                          opacity: cell?.isFuture ? 0.25 : 1,
                          border: cell?.isToday ? `2px solid ${t.accent}` : "none",
                        }} />
                      );
                    });
                  })()}
                </div>
              </div>

              <Segmented block size="small" value={filter} onChange={(v) => setFilter(v as ScoreFilter)}
                options={FILTERS} style={{ marginBottom: 10 }} />

              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <Button size="small" icon={<TbFlag />} onClick={() => setShowGoalAdd(true)}>Add goal</Button>
                <Button size="small" icon={<TbShare />} onClick={exportMonth}>Share month</Button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
                {WEEKDAY_HEADERS.map((d, i) => (
                  <div key={i} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)" }}>{d}</div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                {Array.from({ length: firstDow }, (_, i) => <div key={`pad-${i}`} />)}
                {rawCells.map((c, idx) => {
                  const dayNum = Number(c.date.slice(-2));
                  const pct = filteredValue(c, filter);
                  const inRange = rangeStart && rangeEnd && c.date >= [rangeStart, rangeEnd].sort()[0] && c.date <= [rangeStart, rangeEnd].sort()[1];
                  const hasGoal = goals.some((g) => g.date === c.date);
                  const hasPhoto = photoDates.has(c.date);
                  const gym = showGymLayer ? gymOverlay.get(c.date) : undefined;
                  const barColor = showScoreLayer && c.hasAny ? colorFor(pct, true, t) : undefined;
                  const allDayHere = (allDayEvents.get(c.date) ?? []).filter((tk) => visibleListIds.has(tk.listId));
                  return (
                    <motion.button
                      key={c.date}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: Math.min(idx * 0.006, 0.22), type: "spring", stiffness: 420, damping: 28 }}
                      whileTap={{ scale: 0.9 }}
                      onPointerDown={() => !c.isFuture && handlePressStart(c.date)}
                      onPointerUp={handlePressEnd}
                      onPointerLeave={handlePressEnd}
                      onClick={() => handleTap(c.date, c.isFuture)}
                      disabled={c.isFuture}
                      style={{
                        position: "relative", aspectRatio: "1", borderRadius: 10, overflow: "hidden",
                        border: c.isToday ? `2px solid ${t.accent}` : inRange ? `2px solid ${t.gold}` : "1px solid var(--border)",
                        background: "var(--surface)",
                        backgroundImage: !c.hasAny ? "radial-gradient(circle at 50% 50%, var(--ember-inner) 1px, transparent 1px)" : "none",
                        backgroundSize: "6px 6px",
                        opacity: c.isFuture ? 0.35 : 1,
                        color: "var(--ink)",
                        fontWeight: 700, fontSize: 12, cursor: c.isFuture ? "default" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {gym && (
                        <div style={{
                          position: "absolute", left: 0, top: 3, bottom: 3, width: 3, borderRadius: 2,
                          background: gym.done ? t.teal : t.accent, opacity: gym.done ? 1 : 0.5,
                        }} />
                      )}
                      {allDayHere.length > 0 && (
                        <div style={{
                          position: "absolute", top: 2, left: 10, right: 10, height: 3, borderRadius: 2,
                          background: listColorMap.get(allDayHere[0].listId) ?? t.accent,
                        }} />
                      )}
                      {dayNum}
                      {hasGoal && <TbFlag size={9} style={{ position: "absolute", top: 2, right: 2 }} />}
                      {hasPhoto && <TbCamera size={9} style={{ position: "absolute", bottom: 2, right: 2 }} />}
                      {/* Task dots — colored by list, max 4 */}
                      {(taskDots.get(c.date) ?? []).length > 0 && (
                        <div style={{ position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)",
                          display: "flex", gap: 2 }}>
                          {(taskDots.get(c.date) ?? []).map((color: string, i: number) => (
                            <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: color }} />
                          ))}
                        </div>
                      )}
                      {barColor && (
                        <div style={{ position: "absolute", left: 2, right: 2, bottom: 0, height: 3, borderRadius: "0 0 3px 3px", background: barColor }} />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 16, fontSize: 11, color: "var(--ink-soft)", flexWrap: "wrap" }}>
                <Legend color={t.teal} label="Strong (75%+)" />
                <Legend color={t.gold} label="Okay (40–74%)" />
                <Legend color="#ff5c7a" label="Rough (<40%)" />
                <Legend color="var(--surface)" label="No data" bordered />
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 6 }}>
                Hold a day, then tap another to see stats for that range.
              </div>
            </>
          )}

          {view === "week" && (
            <WeekView weekStart={weekStart} onDayTap={(d) => { setViewDate(d); setView("day"); }} onFocus={setFocusTask}
              onTapTask={(task) => openEditor(task)} onToggleDone={mealFlow.tryComplete} onCreateAt={handleCreateAt}
              visibleListIds={visibleListIds} showGym={showGymLayer} />
          )}

          {view === "day" && (
            <DayTimeline date={viewDate} onFocus={setFocusTask} onGymTap={handleGymTap}
              onTapTask={(task) => openEditor(task)} onToggleDone={mealFlow.tryComplete} onCreateAt={handleCreateAt}
              visibleListIds={visibleListIds} showGym={showGymLayer} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Day task sheet — bottom sheet with tasks, quick-add, swipe between days (Month view peek) */}
      {view === "month" && (
        <DayTaskSheet
          date={selected}
          onClose={() => setSelected(null)}
          onDateChange={(d) => setSelected(d)}
          onFocus={setFocusTask}
          onGymTap={handleGymTap}
        />
      )}

      {/* Focus mode overlay */}
      <FocusMode task={focusTask} onClose={() => setFocusTask(null)} />

      {/* Unified event editor + meal-plan-to-log completion */}
      <EventEditorSheet
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        task={editorTask}
        defaultDate={editorDefaults.date}
        defaultTime={editorDefaults.time}
        defaultEndTime={editorDefaults.endTime}
        onComplete={mealFlow.tryComplete}
      />
      <FoodPickerModal
        open={!!mealFlow.foodPickerTask}
        onClose={mealFlow.closeFoodPicker}
        date={mealFlow.foodPickerTask?.date}
        defaultMealType={inferMealType()}
        title="Log this meal"
      />

      <CalendarLayersSheet
        open={layersOpen}
        onClose={() => setLayersOpen(false)}
        lists={taskLists}
        visibleLists={visibleListIds}
        onToggleList={toggleListLayer}
        showGym={showGymLayer}
        onToggleGym={() => setShowGymLayer((v) => !v)}
        showScore={showScoreLayer}
        onToggleScore={() => setShowScoreLayer((v) => !v)}
      />
      <CalendarSearchSheet open={searchOpen} onClose={() => setSearchOpen(false)} onJumpTo={jumpToSearchResult} />

      {view === "month" && rangeStats && (
        <div style={{ position: "fixed", bottom: 76, left: 16, right: 16, background: "var(--surface)", borderRadius: 14,
          padding: "12px 16px", boxShadow: "0 8px 30px rgba(0,0,0,0.25)", border: "1px solid var(--border)", zIndex: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>{dayjs(rangeStats.from).format("D MMM")} – {dayjs(rangeStats.to).format("D MMM")}</div>
              <div style={{ fontWeight: 700 }}>Avg {rangeStats.avg}% · {rangeStats.activeDays}/{rangeStats.days} active days</div>
            </div>
            <Button type="text" icon={<TbX />} onClick={() => { setRangeStart(null); setRangeEnd(null); }} />
          </div>
        </div>
      )}

      {/* DayDetailModal replaced by DayTaskSheet above */}

      <Modal open={showSummary} onCancel={() => setShowSummary(false)} footer={null} title={`${monthLabel} summary`}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
          <SummaryTile label="Avg discipline" value={`${summary.avgScore}%`} />
          <SummaryTile label="Best week" value={summary.bestWeek ? `${summary.bestWeek.weekLabel} (${summary.bestWeek.avg}%)` : "–"} />
          <SummaryTile label="Training volume" value={`${summary.totalVolume}kg`} />
          <SummaryTile label="Total sets" value={String(summary.totalSets)} />
          <SummaryTile label="Study time" value={`${summary.totalStudyMin}m`} />
          <SummaryTile label="Active days" value={`${summary.daysActive}/${dates.length}`} />
        </div>
      </Modal>

      <AddGoalModal open={showGoalAdd} onClose={() => setShowGoalAdd(false)} />
      <GoalDetailSheet open={!!goalDetail} goal={goalDetail} onClose={() => setGoalDetail(null)} />
    </PageTransition>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--bg)", borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>{label}</div>
      <div className="display" style={{ fontSize: 17, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function Legend({ color, label, bordered }: { color: string; label: string; bordered?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ width: 10, height: 10, borderRadius: 3, background: color, border: bordered ? "1px solid var(--border)" : "none" }} />
      {label}
    </div>
  );
}

function AddGoalModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(dayjs().add(7, "day").format("YYYY-MM-DD"));
  useBackClose(open, onClose);
  async function submit() {
    if (!title.trim()) return;
    await addGoalDay(date, title.trim());
    setTitle(""); onClose();
  }
  return (
    <Modal open={open} onCancel={onClose} onOk={submit} okText="Add goal" title="New goal day">
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
        <Input placeholder="e.g. Half marathon, Final exam" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }} />
      </div>
    </Modal>
  );
}

