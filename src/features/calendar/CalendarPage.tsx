import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Modal, Button, Rate, App, Segmented, Input, Select } from "antd";
import { SmartInputNumber } from "../../components/SmartInputNumber";
import { motion } from "framer-motion";
import {
  TbChevronLeft, TbChevronRight, TbDroplet, TbMoon, TbBarbell, TbMeat, TbBook2,
  TbGasStation, TbSnowflake, TbFlag, TbCamera, TbShare, TbX, TbTrash,
} from "react-icons/tb";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { TimeSelect } from "../../components/TimeSelect";
import { useMonthScores as useRawMonthScores } from "./useCalendar";
import { useDayDetail } from "./useCalendar";
import { useSetting } from "../../hooks/useSettings";
import { useBackClose } from "../../hooks/useBackClose";
import { useTokens } from "../../hooks/useTokens";
import { DayTaskSheet } from "./DayTaskSheet";
import { FocusMode } from "../../components/FocusMode";
import { spawnRecurring } from "../tasks/useRecurringSpawner";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { addWater } from "../water/useWater";
import { upsertSleep } from "../sleep/useSleep";
import { fmtDuration, sleepDurationMin, todayKey } from "../../lib/date.utils";
import { filteredValue, type ScoreFilter, onThisDayComparisons } from "../../lib/dayScore";
import { useStreakFreeze, isFreezeAvailable } from "../../lib/streak.utils";
import { useMonthSummary } from "./useMonthSummary";
import { useGoalsForMonth, useUpcomingGoals, addGoalDay, daysUntil } from "./useGoalDays";
import { useDayPhoto, usePhotoDatesInMonth, setDayPhoto, removeDayPhoto } from "./useDayPhoto";
import { fileToDataURL } from "../../lib/image.utils";
import { useWorkoutDays, backfillSession } from "../gym/useGym";
import dayjs from "dayjs";

const WEEKDAY_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];
const FILTERS: { label: string; value: ScoreFilter }[] = [
  { label: "All", value: "blended" }, { label: "Water", value: "water" },
  { label: "Sleep", value: "sleep" }, { label: "Train", value: "session" }, { label: "Protein", value: "protein" },
];

function colorFor(pct: number, hasAny: boolean, t: { teal: string; gold: string }): string {
  if (!hasAny) return "var(--border)";
  if (pct >= 75) return t.teal;
  if (pct >= 40) return t.gold;
  return "#ff5c7a";
}

export function CalendarPage() {
  const { message } = App.useApp();
  const t = useTokens();
  const waterGoal = useSetting("waterGoalMl");
  const proteinTarget = useSetting("proteinTargetG");
  const now = new Date();
  const location = useLocation();
  const navState = location.state as { year?: number; month?: number } | null;
  const [year, setYear] = useState(navState?.year ?? now.getFullYear());
  const [month, setMonth] = useState(navState?.month ?? now.getMonth());
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<ScoreFilter>("blended");
  const [showSummary, setShowSummary] = useState(false);
  const [showGoalAdd, setShowGoalAdd] = useState(false);

  // Range select (long-press start, tap end)
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

  // Phase 6B — focus mode + task dots + recurring spawner
  const [focusTask, setFocusTask] = useState<import("../../db/types").TaskDto | null>(null);

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
      if (!t.date || t.status === "cancelled") continue;
      const arr = dots.get(t.date) ?? [];
      const c = colorMap.get(t.listId) ?? "var(--accent)";
      if (!arr.includes(c)) arr.push(c);
      dots.set(t.date, arr.slice(0, 4)); // max 4 dots
    }
    return dots;
  }, [year, month]) ?? new Map();

  const firstDow = new Date(year, month, 1).getDay();
  const monthLabel = dayjs(new Date(year, month, 1)).format("MMMM YYYY");

  function prevMonth() { if (month === 0) { setYear(year - 1); setMonth(11); } else setMonth(month - 1); }
  function nextMonth() { if (month === 11) { setYear(year + 1); setMonth(0); } else setMonth(month + 1); }

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

  return (
    <PageTransition>
      <SectionTitle eyebrow="Calendar" title="Your discipline, day by day" />

      {/* Upcoming goal countdown */}
      {upcomingGoals.length > 0 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 12, paddingBottom: 2 }}>
          {upcomingGoals.map((g) => (
            <div key={g.id} style={{ background: "var(--surface)", borderRadius: 12, padding: "8px 12px", whiteSpace: "nowrap", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 4 }}><TbFlag size={12} />{g.title}</div>
              <div style={{ fontWeight: 800, color: "var(--accent)", fontSize: 14 }}>
                {daysUntil(g.date) === 0 ? "Today!" : `${daysUntil(g.date)}d away`}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Month nav + filter + actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <Button type="text" icon={<TbChevronLeft />} onClick={prevMonth} aria-label="Previous month" />
        <button onClick={() => setShowSummary(true)} style={{
          background: "none", border: "none",
          fontFamily: '"Cinzel", "Plus Jakarta Sans", serif',
          fontWeight: 700, fontSize: 15, letterSpacing: "0.14em",
          textTransform: "uppercase", cursor: "pointer", color: "var(--ink)",
        }}>
          {monthLabel}
        </button>
        <Button type="text" icon={<TbChevronRight />} onClick={nextMonth} aria-label="Next month" />
      </div>

      {/* Weekly strip — this week zoomed */}
      <div style={{ background: "var(--surface)", borderRadius: 10, padding: "8px 12px", marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>This week</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {(() => {
            const today = new Date();
            const dow = today.getDay();
            const weekStart = new Date(today); weekStart.setDate(today.getDate() - dow);
            const week = Array.from({ length: 7 }, (_, i) => {
              const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
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
        {rawCells.map((c) => {
          const dayNum = Number(c.date.slice(-2));
          const pct = filteredValue(c, filter);
          const inRange = rangeStart && rangeEnd && c.date >= [rangeStart, rangeEnd].sort()[0] && c.date <= [rangeStart, rangeEnd].sort()[1];
          const hasGoal = goals.some((g) => g.date === c.date);
          const hasPhoto = photoDates.has(c.date);
          return (
            <motion.button
              key={c.date}
              whileTap={{ scale: 0.9 }}
              onPointerDown={() => !c.isFuture && handlePressStart(c.date)}
              onPointerUp={handlePressEnd}
              onPointerLeave={handlePressEnd}
              onClick={() => handleTap(c.date, c.isFuture)}
              disabled={c.isFuture}
              style={{
                position: "relative", aspectRatio: "1", borderRadius: 10,
                border: c.isToday ? `2px solid ${t.accent}` : inRange ? `2px solid ${t.gold}` : "1px solid var(--border)",
                background: c.hasAny ? colorFor(pct, c.hasAny, t) : "var(--surface)",
                backgroundImage: c.hasAny ? "none" : "radial-gradient(circle at 50% 50%, var(--ember-inner) 1px, transparent 1px)",
                backgroundSize: "6px 6px",
                opacity: c.isFuture ? 0.25 : c.hasAny ? 0.9 : 1,
                color: c.hasAny ? "#fff" : "var(--ink-soft)",
                fontWeight: 700, fontSize: 12, cursor: c.isFuture ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {dayNum}
              {hasGoal && <TbFlag size={9} style={{ position: "absolute", top: 2, right: 2 }} />}
              {hasPhoto && <TbCamera size={9} style={{ position: "absolute", bottom: 2, right: 2 }} />}
              {/* Task dots — colored by list, max 4 */}
              {(taskDots.get(c.date) ?? []).length > 0 && (
                <div style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)",
                  display: "flex", gap: 2 }}>
                  {(taskDots.get(c.date) ?? []).map((color: string, i: number) => (
                    <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: color }} />
                  ))}
                </div>
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

      {/* Day task sheet — bottom sheet with tasks, quick-add, swipe between days */}
      <DayTaskSheet
        date={selected}
        onClose={() => setSelected(null)}
        onDateChange={(d) => setSelected(d)}
        onFocus={setFocusTask}
      />

      {/* Focus mode overlay */}
      <FocusMode task={focusTask} onClose={() => setFocusTask(null)} />

      {rangeStats && (
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

// Retained but no longer rendered in CalendarPage — replaced by DayTaskSheet.
// Kept exported so it can be used elsewhere if needed (e.g. a detailed view for past days).
export function DayDetailModal({ date, onClose }: { date: string; onClose: () => void }) {
  const { message, modal } = App.useApp();
  useBackClose(true, onClose);
  const detail = useDayDetail(date);
  const waterGoal = useSetting("waterGoalMl");
  const proteinTarget = useSetting("proteinTargetG");
  const isToday = date === todayKey();
  const isPast = date < todayKey();
  const [waterAdd, setWaterAdd] = useState<number>();
  const [editSleep, setEditSleep] = useState(false);
  const [sleepAt, setSleepAt] = useState("23:30");
  const [wakeAt, setWakeAt] = useState("07:00");
  const [quality, setQuality] = useState(3);
  const [comparisons, setComparisons] = useState<Awaited<ReturnType<typeof onThisDayComparisons>>>([]);
  const [freezeAvailable, setFreezeAvailable] = useState(false);
  const photo = useDayPhoto(date);
  const workoutDays = useWorkoutDays();
  const [backfillDay, setBackfillDay] = useState<number>();
  const photoInputRef = useRef<HTMLInputElement>(null);

  useMemo(() => {
    onThisDayComparisons(date, waterGoal, proteinTarget).then(setComparisons);
    if (isPast && !detail?.sets) isFreezeAvailable(date).then(setFreezeAvailable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function saveWater() {
    if (!waterAdd) return;
    await addWater(waterAdd, date);
    message.success(`+${waterAdd}ml added to ${dayjs(date).format("D MMM")}`);
    setWaterAdd(undefined);
  }
  async function saveSleep() {
    await upsertSleep({ date, sleepAt, wakeAt, quality });
    message.success(`Sleep logged for ${dayjs(date).format("D MMM")}`);
    setEditSleep(false);
  }
  async function doFreeze() {
    const ok = await useStreakFreeze(date);
    if (ok) { message.success("Streak freeze used — this day now counts."); setFreezeAvailable(false); }
    else message.info("No freeze available this week (one per week).");
  }
  async function doBackfill() {
    if (!backfillDay) return;
    modal.confirm({
      title: "Backfill this session?",
      content: "Logs all planned sets at your program's target weight/reps for this date.",
      onOk: async () => { await backfillSession(date, backfillDay); message.success("Session backfilled"); },
    });
  }
  async function handlePhotoPick(file: File) {
    const dataUrl = await fileToDataURL(file, 900, 0.8);
    await setDayPhoto(date, dataUrl);
    message.success("Photo saved");
  }

  return (
    <Modal open onCancel={onClose} footer={null} title={dayjs(date).format("dddd, D MMMM")}>
      {!detail ? <div style={{ color: "var(--ink-soft)" }}>Loading…</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          <Row icon={<TbDroplet />} label="Water" value={`${(detail.waterMl / 1000).toFixed(2)}L`} />
          <Row icon={<TbMoon />} label="Sleep" value={detail.sleepMin ? `${fmtDuration(detail.sleepMin)} · ${detail.sleepQuality}/5` : "Not logged"} />
          <Row icon={<TbBarbell />} label="Training" value={detail.sets > 0 ? `${detail.sets} sets · ${detail.volume}kg` : "Rest / not logged"} />
          <Row icon={<TbMeat />} label="Protein" value={`${detail.protein}g`} />
          <Row icon={<TbBook2 />} label="Study" value={`${detail.studyMin} min`} />
          {detail.fuelCost > 0 && <Row icon={<TbGasStation />} label="Fuel spend" value={`₹${detail.fuelCost}`} />}

          {/* On this day comparison */}
          {comparisons.some((c) => c.metrics) && (
            <div style={{ background: "var(--bg)", borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>On this day</div>
              {comparisons.map((c) => c.metrics && (
                <div key={c.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: "var(--ink-soft)" }}>{c.label}</span>
                  <span style={{ fontWeight: 700 }}>{c.metrics.score}% discipline</span>
                </div>
              ))}
            </div>
          )}

          {/* Progress photo */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <TbCamera size={14} /> Progress photo
            </div>
            {photo ? (
              <div style={{ position: "relative" }}>
                <img src={photo.dataUrl} alt="Progress" style={{ width: "100%", borderRadius: 10, maxHeight: 200, objectFit: "cover" }} />
                <Button size="small" danger icon={<TbTrash />} onClick={() => removeDayPhoto(date)}
                  style={{ position: "absolute", top: 6, right: 6 }} />
              </div>
            ) : (
              <Button block icon={<TbCamera />} onClick={() => photoInputRef.current?.click()}>Add photo</Button>
            )}
            <input ref={photoInputRef} type="file" accept="image/*" hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoPick(f); e.target.value = ""; }} />
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 8 }}>
              {isToday ? "Quick add" : "Missed something? Backfill it"}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <SmartInputNumber placeholder="ml to add" value={waterAdd} onChange={(v) => setWaterAdd(v == null ? undefined : Number(v))}
                style={{ flex: 1 }} min={0} step={50} />
              <Button type="primary" onClick={saveWater}>Add water</Button>
            </div>

            {!editSleep ? (
              <Button block onClick={() => setEditSleep(true)} style={{ marginBottom: 10 }}>
                {detail.sleepMin ? "Edit sleep for this day" : "Log sleep for this day"}
              </Button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "var(--bg)", borderRadius: 10, padding: 10, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>Slept</span>
                  <TimeSelect value={sleepAt} onChange={setSleepAt} size="small" />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>Woke</span>
                  <TimeSelect value={wakeAt} onChange={setWakeAt} size="small" />
                </div>
                <div style={{ textAlign: "center", fontWeight: 700, color: "var(--accent)", fontSize: 13 }}>
                  {fmtDuration(sleepDurationMin(sleepAt, wakeAt))}
                </div>
                <Rate value={quality} onChange={setQuality} style={{ fontSize: 16 }} />
                <Button type="primary" block onClick={saveSleep}>Save</Button>
              </div>
            )}

            {/* Backfill workout */}
            {detail.sets === 0 && !isToday && (
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <Select placeholder="Pick workout day" style={{ flex: 1 }} value={backfillDay}
                  onChange={setBackfillDay}
                  options={workoutDays.map((d) => ({ label: d.name, value: d.id! }))} />
                <Button onClick={doBackfill} disabled={!backfillDay}>Backfill</Button>
              </div>
            )}

            {/* Streak freeze */}
            {isPast && detail.sets === 0 && detail.waterMl === 0 && !detail.sleepMin && freezeAvailable && (
              <Button block icon={<TbSnowflake />} onClick={doFreeze}>Use streak freeze for this day</Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ color: "var(--accent)" }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 13, color: "var(--ink-soft)" }}>{label}</span>
      <span style={{ fontWeight: 700, fontSize: 13 }}>{value}</span>
    </div>
  );
}
