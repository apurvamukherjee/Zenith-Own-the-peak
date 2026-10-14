import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { db } from "../../db/db";
import { useTokens } from "../../hooks/useTokens";
import { useSetting } from "../../hooks/useSettings";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { lastNDates } from "../../lib/date.utils";

// 7-day area chart of protein / carbs / fat vs targets. Same macro colours
// as the Home tile and the Nutrition hero rings.
export function WeeklyMacroChart() {
  const t = useTokens();
  const reduced = useReducedMotion();
  const proteinTarget = Number(useSetting("proteinTargetG"));
  const fatTarget = Number(useSetting("fatTargetG"));
  const carbTarget = Number(useSetting("carbTargetG"));
  const dates = useMemo(() => lastNDates(7), []);
  const meals = useLiveQuery(() => db.meals.where("date").anyOf(dates).toArray(), [dates.join(",")]);

  const data = useMemo(() => dates.map((d) => {
    const day = (meals ?? []).filter((m) => m.date === d);
    return {
      label: d.slice(5),
      protein: Math.round(day.reduce((s, m) => s + m.protein, 0)),
      carbs: Math.round(day.reduce((s, m) => s + (m.carbsG ?? 0), 0)),
      fat: Math.round(day.reduce((s, m) => s + (m.fatG ?? 0), 0)),
    };
  }), [meals, dates]);

  if (!meals || data.every((d) => !d.protein && !d.fat && !d.carbs)) {
    return <div className="nu-chart-empty">Log a few days of meals to see your macro trend.</div>;
  }

  const series = [
    { k: "protein", label: "Protein", c: t.teal, target: proteinTarget },
    { k: "carbs", label: "Carbs", c: t.gold, target: carbTarget },
    { k: "fat", label: "Fat", c: t.info, target: fatTarget },
  ] as const;

  return (
    <div className="nu-chart">
      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.k} id={`nu-${s.k}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.c} stopOpacity={0.35} />
                <stop offset="100%" stopColor={s.c} stopOpacity={0.03} />
              </linearGradient>
            ))}
          </defs>
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: t.ink }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: t.ink }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} labelStyle={{ fontWeight: 700 }} />
          {series.map((s) => s.target > 0 && <ReferenceLine key={`r-${s.k}`} y={s.target} stroke={s.c} strokeDasharray="4 4" strokeOpacity={0.35} />)}
          {series.map((s) => (
            <Area key={s.k} type="monotone" dataKey={s.k} name={s.label} stroke={s.c} fill={`url(#nu-${s.k})`}
              strokeWidth={s.k === "protein" ? 2.4 : 1.6} dot={false} isAnimationActive={!reduced} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      <div className="nu-legend">
        {series.map((s) => <span key={s.k}><i style={{ background: s.c }} />{s.label}</span>)}
      </div>
    </div>
  );
}
