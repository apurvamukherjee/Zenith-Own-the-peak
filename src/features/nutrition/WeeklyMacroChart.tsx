import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { db } from "../../db/db";
import { useTokens } from "../../hooks/useTokens";
import { useSetting } from "../../hooks/useSettings";
import { lastNDates } from "../../lib/date.utils";

// 7-day stacked area chart: protein / fat / carbs consumed vs targets.
// Sits below the daily MacroBar on the Nutrition page.
export function WeeklyMacroChart() {
  const t = useTokens();
  const proteinTarget = Number(useSetting("proteinTargetG"));
  const fatTarget = Number(useSetting("fatTargetG"));
  const carbTarget = Number(useSetting("carbTargetG"));

  const dates = useMemo(() => lastNDates(7), []);

  const meals = useLiveQuery(
    () => db.meals.where("date").anyOf(dates).toArray(),
    [dates.join(",")],
  );

  const data = useMemo(() => {
    if (!meals) return [];
    return dates.map((d) => {
      const dayMeals = meals.filter((m) => m.date === d);
      return {
        label: d.slice(5), // MM-DD
        protein: Math.round(dayMeals.reduce((s, m) => s + m.protein, 0)),
        fat: Math.round(dayMeals.reduce((s, m) => s + (m.fatG ?? 0), 0)),
        carbs: Math.round(dayMeals.reduce((s, m) => s + (m.carbsG ?? 0), 0)),
      };
    });
  }, [meals, dates]);

  if (!meals || data.every((d) => d.protein === 0 && d.fat === 0 && d.carbs === 0)) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div className="gothic-eyebrow" style={{ marginBottom: 8 }}>7-DAY MACROS</div>
      <div style={{ background: "var(--surface)", borderRadius: 14, padding: "10px 6px 4px", border: "1px solid var(--border)" }}>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={t.accent} stopOpacity={0.35} />
                <stop offset="100%" stopColor={t.accent} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={t.gold} stopOpacity={0.3} />
                <stop offset="100%" stopColor={t.gold} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={t.teal} stopOpacity={0.3} />
                <stop offset="100%" stopColor={t.teal} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ fontWeight: 700 }}
            />
            {proteinTarget > 0 && <ReferenceLine y={proteinTarget} stroke={t.accent} strokeDasharray="4 4" strokeOpacity={0.4} />}
            {fatTarget > 0 && <ReferenceLine y={fatTarget} stroke={t.gold} strokeDasharray="4 4" strokeOpacity={0.3} />}
            {carbTarget > 0 && <ReferenceLine y={carbTarget} stroke={t.teal} strokeDasharray="4 4" strokeOpacity={0.3} />}
            <Area type="monotone" dataKey="protein" name="Protein" stroke={t.accent} fill="url(#gP)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="fat" name="Fat" stroke={t.gold} fill="url(#gF)" strokeWidth={1.5} dot={false} />
            <Area type="monotone" dataKey="carbs" name="Carbs" stroke={t.teal} fill="url(#gC)" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, paddingBottom: 4 }}>
          <Legend color={t.accent} label="Protein" />
          <Legend color={t.gold} label="Fat" />
          <Legend color={t.teal} label="Carbs" />
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--ink-soft)" }}>
      <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
      {label}
    </div>
  );
}
