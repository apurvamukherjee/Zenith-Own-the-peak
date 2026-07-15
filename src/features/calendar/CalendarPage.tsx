import { useState } from "react";
import { Modal, Button, InputNumber, Rate, App } from "antd";
import { motion } from "framer-motion";
import { TbChevronLeft, TbChevronRight, TbDroplet, TbMoon, TbBarbell, TbMeat, TbBook2, TbGasStation } from "react-icons/tb";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { TimeSelect } from "../../components/TimeSelect";
import { useMonthScores, useDayDetail } from "./useCalendar";
import { useSetting } from "../../hooks/useSettings";
import { useTokens } from "../../hooks/useTokens";
import { addWater } from "../water/useWater";
import { upsertSleep } from "../sleep/useSleep";
import { fmtDuration, sleepDurationMin } from "../../lib/date.utils";
import dayjs from "dayjs";

const WEEKDAY_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];

function scoreColor(score: number, hasAny: boolean, t: { teal: string; gold: string; accent: string }): string {
  if (!hasAny) return "var(--border)";
  if (score >= 75) return t.teal;
  if (score >= 40) return t.gold;
  return "#ff5c7a";
}

export function CalendarPage() {
  const t = useTokens();
  const waterGoal = useSetting("waterGoalMl");
  const proteinTarget = useSetting("proteinTargetG");
  // Always starts on the current month — never persisted, resets on every load.
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const cells = useMonthScores(year, month, waterGoal, proteinTarget);
  const firstDow = new Date(year, month, 1).getDay();
  const monthLabel = dayjs(new Date(year, month, 1)).format("MMMM YYYY");

  function prevMonth() {
    if (month === 0) { setYear(year - 1); setMonth(11); } else setMonth(month - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(year + 1); setMonth(0); } else setMonth(month + 1);
  }

  return (
    <PageTransition>
      <SectionTitle eyebrow="Calendar" title="Your discipline, day by day" />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Button type="text" icon={<TbChevronLeft />} onClick={prevMonth} aria-label="Previous month" />
        <div style={{ fontWeight: 700, fontSize: 15 }}>{monthLabel}</div>
        <Button type="text" icon={<TbChevronRight />} onClick={nextMonth} aria-label="Next month" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
        {WEEKDAY_HEADERS.map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)" }}>{d}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {Array.from({ length: firstDow }, (_, i) => <div key={`pad-${i}`} />)}
        {cells.map((c) => {
          const dayNum = Number(c.date.slice(-2));
          return (
            <motion.button
              key={c.date}
              whileTap={{ scale: 0.9 }}
              onClick={() => !c.isFuture && setSelected(c.date)}
              disabled={c.isFuture}
              style={{
                aspectRatio: "1", borderRadius: 10, border: c.isToday ? `2px solid ${t.accent}` : "1px solid var(--border)",
                background: c.hasAny ? scoreColor(c.score, c.hasAny, t) : "var(--surface)",
                opacity: c.isFuture ? 0.25 : c.hasAny ? 0.9 : 1,
                color: c.hasAny ? "#fff" : "var(--ink-soft)",
                fontWeight: 700, fontSize: 12, cursor: c.isFuture ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {dayNum}
            </motion.button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 16, fontSize: 11, color: "var(--ink-soft)", flexWrap: "wrap" }}>
        <Legend color={t.teal} label="Strong day (75%+)" />
        <Legend color={t.gold} label="Okay (40–74%)" />
        <Legend color="#ff5c7a" label="Rough (<40%)" />
        <Legend color="var(--surface)" label="No data" bordered />
      </div>

      {selected && <DayDetailModal date={selected} onClose={() => setSelected(null)} />}
    </PageTransition>
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

function DayDetailModal({ date, onClose }: { date: string; onClose: () => void }) {
  const { message } = App.useApp();
  const detail = useDayDetail(date);
  const isToday = date === new Date().toISOString().slice(0, 10);
  const [waterAdd, setWaterAdd] = useState<number>();
  const [editSleep, setEditSleep] = useState(false);
  const [sleepAt, setSleepAt] = useState("23:30");
  const [wakeAt, setWakeAt] = useState("07:00");
  const [quality, setQuality] = useState(3);

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

          <div style={{ borderTop: "1px solid var(--border)", marginTop: 6, paddingTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 8 }}>
              {isToday ? "Quick add" : "Missed something? Backfill it"}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <InputNumber placeholder="ml to add" value={waterAdd} onChange={(v) => setWaterAdd(v ?? undefined)}
                style={{ flex: 1 }} min={0} step={50} />
              <Button type="primary" onClick={saveWater}>Add water</Button>
            </div>

            {!editSleep ? (
              <Button block onClick={() => setEditSleep(true)}>
                {detail.sleepMin ? "Edit sleep for this day" : "Log sleep for this day"}
              </Button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "var(--bg)", borderRadius: 10, padding: 10 }}>
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
