import { useState, type CSSProperties } from "react";
import { StatTile } from "../../components/StatTile";
import { DatePicker, App, Popconfirm } from "antd";
import { motion } from "framer-motion";
import { TbPlus, TbTrash, TbTrendingUp, TbTrendingDown, TbCurrencyRupee, TbRoad, TbGasStation } from "react-icons/tb";
import dayjs from "dayjs";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { SmartInputNumber } from "../../components/SmartInputNumber";
import { Hero } from "../../components/ui/Hero";
import { ListGroup, ListRow } from "../../components/ui/List";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./fuel.css";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { EmptyState } from "../../components/EmptyState";
import { ColdIcon } from "../../components/ColdIcon";
import { useFuel, addFuel, deleteFuel, computeRows, fuelStats } from "./useFuel";
import { useTokens } from "../../hooks/useTokens";
import { prettyDate } from "../../lib/date.utils";

export function FuelPage() {
  const t = useTokens();
  const reduced = useReducedMotion();
  const { message } = App.useApp();
  const fills = useFuel();
  const rows = computeRows(fills);
  const stats = fuelStats(rows);
  const [odo, setOdo] = useState<number>();
  const [litres, setLitres] = useState<number>();
  const [cost, setCost] = useState<number>();
  const [date, setDate] = useState(dayjs());

  const chart = rows.filter((r) => r.mileage !== null).map((r) => ({ label: r.date.slice(5), mileage: r.mileage }));

  async function submit() {
    if (!odo || !litres || !cost) { message.warning("Fill odometer, litres and cost"); return; }
    await addFuel({ date: date.format("YYYY-MM-DD"), odometer: odo, litres, cost });
    setOdo(undefined); setLitres(undefined); setCost(undefined); setDate(dayjs());
    message.success("Fill-up logged");
  }

  const best = Math.max(0, ...rows.map((r) => r.mileage ?? 0));
  const trend = trendDelta(rows);

  return (
    <PageTransition>
      <SectionTitle eyebrow="Bike" title="Fuel & mileage" />

      <Hero color="var(--gold)" color2="var(--accent)" eyebrow="Latest fill" className="fu-hero"
        right={trend !== null && (
          <span className={`z-pill ${trend >= 0 ? "is-good" : "is-bad"}`}>
            {trend >= 0 ? <TbTrendingUp size={12} /> : <TbTrendingDown size={12} />} {Math.abs(trend)}% vs earlier
          </span>
        )}>
        <Gauge value={stats.latestMileage} avg={stats.avgMileage} max={Math.max(best * 1.15, 10)} reduced={reduced} />
        <div className="fu-hero__stats">
          <div><small>Average</small><b>{stats.avgMileage || "–"}<em> km/L</em></b></div>
          <div><small>Best</small><b>{best || "–"}<em> km/L</em></b></div>
          <div><small>Fills</small><b>{rows.length}</b></div>
        </div>
      </Hero>

      <div className="z-bento" style={{ marginTop: 12 }}>
        <StatTile label="This month" value={stats.monthSpend} prefix="₹" tone="warn" icon={<TbCurrencyRupee size={14} />} />
        <StatTile label="Cost per km" value={stats.costPerKm} prefix="₹" icon={<TbRoad size={14} />} />
      </div>

      <ListGroup title="Log a fill-up" footer="Fill to full each time — that keeps mileage accurate. The first fill has no mileage (no prior reading).">
        <div className="fu-form">
          <DatePicker inputReadOnly value={date} onChange={(v) => v && setDate(v)} style={{ width: "100%" }} format="ddd, DD MMM YYYY" allowClear={false} />
          <SmartInputNumber value={odo} onChange={(v) => setOdo(v == null ? undefined : Number(v))} placeholder="Odometer" suffix="km" style={{ width: "100%" }} controls={false} min={0} aria-label="Odometer" />
          <div style={{ display: "flex", gap: 10 }}>
            <SmartInputNumber value={litres} onChange={(v) => setLitres(v == null ? undefined : Number(v))} placeholder="Litres" suffix="L" style={{ flex: 1 }} controls={false} min={0} aria-label="Litres" />
            <SmartInputNumber value={cost} onChange={(v) => setCost(v == null ? undefined : Number(v))} placeholder="Cost" prefix="₹" style={{ flex: 1 }} controls={false} min={0} aria-label="Cost" />
          </div>
          <button type="button" className="z-btn z-btn--solid z-btn--block" style={{ minHeight: 48, "--c": "var(--gold)" } as CSSProperties} onClick={submit}>
            <TbPlus size={17} /> Add fill-up
          </button>
        </div>
      </ListGroup>

      {chart.length > 0 && (
        <ListGroup title="Mileage trend">
          <div className="fu-chart">
            <ResponsiveContainer>
              <LineChart data={chart} margin={{ top: 12, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: t.ink }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: t.ink }} axisLine={false} tickLine={false} />
                {stats.avgMileage > 0 && <ReferenceLine y={stats.avgMileage} stroke={t.gold} strokeDasharray="4 4" strokeOpacity={0.5} />}
                <Tooltip formatter={(v: number) => [`${v} km/L`, "Mileage"]} />
                <Line type="monotone" dataKey="mileage" stroke={t.gold} strokeWidth={3} dot={{ r: 3, fill: t.gold, strokeWidth: 0 }} isAnimationActive={!reduced} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ListGroup>
      )}

      <ListGroup title="History">
        {rows.length === 0 ? (
          <EmptyState icon={<ColdIcon glyph="road" size={44} />} title="No fill-ups logged"
            hint="Log your first full-tank fill above. Mileage starts from the second fill." />
        ) : (
          [...rows].reverse().map((r) => (
            <ListRow key={r.id} icon={<TbGasStation size={15} />} color={r.mileage ? "var(--gold)" : "var(--ink-soft)"}
              label={`${r.odometer.toLocaleString()} km`}
              hint={`${prettyDate(r.date)} · ${r.litres} L · ₹${r.cost}${r.distanceKm !== null ? ` · ${r.distanceKm} km` : ""}`}
              value={r.mileage ? <b style={{ color: "var(--gold)" }}>{r.mileage} km/L</b> : "—"}
              right={
                <Popconfirm title="Delete this fill-up?" okText="Delete" okButtonProps={{ danger: true }} onConfirm={() => r.id && deleteFuel(r.id)}>
                  <button type="button" className="fu-del" aria-label="Delete fill-up"><TbTrash size={15} /></button>
                </Popconfirm>
              } />
          ))
        )}
      </ListGroup>
    </PageTransition>
  );
}

// Recent-half vs earlier-half average of the last 6 fills with mileage.
function trendDelta(rows: { mileage: number | null }[]): number | null {
  const m = rows.filter((r) => r.mileage !== null).slice(-6);
  if (m.length < 3) return null;
  const half = Math.floor(m.length / 2);
  const early = m.slice(0, half).reduce((s, r) => s + (r.mileage ?? 0), 0) / half;
  const recent = m.slice(half).reduce((s, r) => s + (r.mileage ?? 0), 0) / (m.length - half);
  return early ? Math.round(((recent - early) / early) * 100) : null;
}

// Speedometer: 240° sweep, needle springs to the latest mileage, a tick marks the average.
function Gauge({ value, avg, max, reduced }: { value: number; avg: number; max: number; reduced: boolean }) {
  const W = 220, H = 168, cx = W / 2, cy = 100, r = 86;
  const START = -210, SWEEP = 240;
  const ang = (v: number) => START + (Math.min(Math.max(v, 0), max) / max) * SWEEP;
  const pt = (deg: number, rad = r) => [cx + rad * Math.cos((deg * Math.PI) / 180), cy + rad * Math.sin((deg * Math.PI) / 180)] as const;
  const arc = (a0: number, a1: number) => {
    const [x0, y0] = pt(a0); const [x1, y1] = pt(a1);
    return `M ${x0} ${y0} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
  };
  const [ax, ay] = pt(ang(avg), r + 9);
  const [ax2, ay2] = pt(ang(avg), r - 9);
  return (
    <div className="fu-gauge">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 280, display: "block", margin: "0 auto", overflow: "visible" }} aria-hidden>
        <defs>
          <linearGradient id="fu-g" x1="0" x2="1">
            <stop offset="0%" style={{ stopColor: "var(--danger)" }} />
            <stop offset="55%" style={{ stopColor: "var(--gold)" }} />
            <stop offset="100%" style={{ stopColor: "var(--success)" }} />
          </linearGradient>
        </defs>
        <path d={arc(START, START + SWEEP)} fill="none" strokeWidth={12} strokeLinecap="round" style={{ stroke: "color-mix(in srgb, var(--ink) 9%, transparent)" }} />
        <motion.path d={arc(START, START + SWEEP)} fill="none" strokeWidth={12} strokeLinecap="round" style={{ stroke: "url(#fu-g)" }}
          initial={reduced ? false : { pathLength: 0, opacity: 0 }} animate={{ pathLength: value ? Math.min(1, value / max) : 0, opacity: value ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 40, damping: 14, delay: 0.15 }} />
        {Array.from({ length: 9 }, (_, i) => {
          const d = START + (SWEEP / 8) * i;
          const [x1, y1] = pt(d, r - 16); const [x2, y2] = pt(d, r - 22);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={1.5} style={{ stroke: "color-mix(in srgb, var(--ink) 30%, transparent)" }} />;
        })}
        {avg > 0 && <line x1={ax} y1={ay} x2={ax2} y2={ay2} strokeWidth={2.5} strokeLinecap="round" style={{ stroke: "var(--ink)" }} />}
        <motion.g initial={reduced ? false : { rotate: START + 90 }} animate={{ rotate: ang(value) + 90 }}
          transition={{ type: "spring", stiffness: 60, damping: 9, delay: 0.25 }} style={{ originX: 0.5, originY: 1 }}>
          <path d={`M ${cx - 3.5} ${cy} L ${cx} ${cy - r + 26} L ${cx + 3.5} ${cy} Z`} style={{ fill: "var(--accent)", filter: "drop-shadow(0 0 4px var(--ember-glow))" }} />
        </motion.g>
        <circle cx={cx} cy={cy} r={8} style={{ fill: "var(--surface)", stroke: "var(--accent)" }} strokeWidth={3} />
        <text x={cx} y={cy + 44} textAnchor="middle" className="fu-gauge__value">{value || "—"}</text>
        <text x={cx} y={cy + 60} textAnchor="middle" className="fu-gauge__unit">km/L</text>
      </svg>
    </div>
  );
}
