import { useState, type CSSProperties } from "react";
import { DatePicker } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { TbMoonStars, TbStarFilled, TbClockHour4, TbTrendingDown, TbCheck } from "react-icons/tb";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { Hero } from "../../components/ui/Hero";
import { ListGroup, ListRow } from "../../components/ui/List";
import { useRecentSleep } from "./useSleep";
import { SleepForm } from "./SleepForm";
import { SleepClock } from "./SleepClock";
import { useSetting } from "../../hooks/useSettings";
import { useTokens } from "../../hooks/useTokens";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { fmtDuration, todayKey, prettyDate } from "../../lib/date.utils";
import "./sleep.css";

export function SleepPage() {
  const t = useTokens();
  const reduced = useReducedMotion();
  const recent = useRecentSleep(14);
  const target = useSetting("sleepTargetMin");
  const [date, setDate] = useState<Dayjs>(dayjs());
  const dateKey = todayKey(date.toDate());

  const logged = recent.filter(Boolean) as NonNullable<(typeof recent)[number]>[];
  const last = logged[logged.length - 1];
  const week = logged.slice(-7);
  const avgMin = week.length ? Math.round(week.reduce((s, e) => s + e.durationMin, 0) / week.length) : 0;
  const avgQual = week.length ? week.reduce((s, e) => s + e.quality, 0) / week.length : 0;
  const debt = recent.slice(-7).reduce((sum, s) => sum + Math.max(0, target - (s?.durationMin ?? target)), 0);
  const nights = Math.ceil(debt / 30);
  const perNight = nights ? Math.round(((target + debt / nights) / 60) * 10) / 10 : 0;
  const vsTarget = last ? last.durationMin - target : 0;

  const chart = recent.map((e, i) => ({ label: e ? e.date.slice(5) : lastLabel(i), hours: e ? +(e.durationMin / 60).toFixed(1) : null }));

  return (
    <PageTransition>
      <SectionTitle eyebrow="Recovery" title="Sleep" />

      <Hero color="var(--info)" color2="var(--gold)" className="sl-hero" eyebrow={last ? `Night of ${prettyDate(last.date)}` : "Last night"}
        right={last && <span className="z-pill" style={{ "--c": vsTarget >= 0 ? "var(--success)" : "var(--warn)" } as CSSProperties}>
          {vsTarget >= 0 ? "Target met" : `${fmtDuration(-vsTarget)} short`}
        </span>}>
        <div className="sl-hero__body">
          <SleepClock sleepAt={last?.sleepAt} wakeAt={last?.wakeAt} reduced={reduced}>
            <div className="sl-hero__dur display">{last ? fmtDuration(last.durationMin) : "—"}</div>
            {last && <div className="sl-hero__range">{last.sleepAt} → {last.wakeAt}</div>}
          </SleepClock>
          <ul className="sl-facts">
            <li><span className="z-ico z-ico--sm" style={{ "--c": "var(--info)" } as CSSProperties}><TbClockHour4 size={14} /></span>
              <div><small>7-day avg</small><b>{avgMin ? fmtDuration(avgMin) : "—"}</b></div></li>
            <li><span className="z-ico z-ico--sm" style={{ "--c": "var(--gold)" } as CSSProperties}><TbStarFilled size={13} /></span>
              <div><small>Quality</small><b>{avgQual ? `${avgQual.toFixed(1)} / 5` : "—"}</b></div></li>
            <li><span className="z-ico z-ico--sm" style={{ "--c": debt > 60 ? "var(--danger)" : "var(--success)" } as CSSProperties}>{debt > 60 ? <TbTrendingDown size={14} /> : <TbCheck size={14} />}</span>
              <div><small>Sleep debt</small><b>{debt ? fmtDuration(debt) : "None"}</b></div></li>
          </ul>
        </div>
        {debt > 60 && (
          <div className="sl-hero__plan">
            <TbMoonStars size={15} /> Sleep {perNight}h for {nights} night{nights === 1 ? "" : "s"} to clear it. Muscle is built asleep.
          </div>
        )}
      </Hero>

      <ListGroup title="Log or edit a night">
        <div className="sl-form">
          <label className="sl-form__label">Night of (wake-up date)</label>
          <DatePicker inputReadOnly value={date} onChange={(v) => v && setDate(v)} disabledDate={(d) => d.isAfter(dayjs(), "day")}
            style={{ width: "100%", marginBottom: 12 }} format="ddd, DD MMM YYYY" allowClear={false} />
          <SleepForm date={dateKey} />
        </div>
      </ListGroup>

      <ListGroup title="Last 14 nights">
        <div className="sl-chart">
          <ResponsiveContainer>
            <LineChart data={chart} margin={{ top: 12, right: 10, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="sl-line" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#6ea2ff" />
                  <stop offset="100%" stopColor={t.gold} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#8f8590" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#8f8590" }} domain={[0, 10]} axisLine={false} tickLine={false} />
              <ReferenceLine y={target / 60} stroke={t.gold} strokeDasharray="4 4" strokeOpacity={0.55} />
              <Tooltip formatter={(v: number) => [`${v} h`, "Sleep"]} />
              <Line type="monotone" dataKey="hours" stroke="url(#sl-line)" strokeWidth={3} connectNulls dot={{ r: 2.5, fill: t.gold, strokeWidth: 0 }} isAnimationActive={!reduced} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ListGroup>

      {logged.length > 0 && (
        <ListGroup title="Recent nights" footer="Tap a night to edit it above.">
          {[...logged].reverse().map((e) => (
            <ListRow key={e.date} icon={<TbMoonStars size={15} />} color={e.durationMin >= target ? "var(--success)" : "var(--gold)"}
              label={prettyDate(e.date)} hint={`${e.sleepAt} → ${e.wakeAt} · ${"★".repeat(e.quality)}`}
              value={fmtDuration(e.durationMin)}
              onClick={() => { setDate(dayjs(e.date)); document.querySelector("main")?.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }); }} />
          ))}
        </ListGroup>
      )}
    </PageTransition>
  );
}

function lastLabel(i: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (13 - i));
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
