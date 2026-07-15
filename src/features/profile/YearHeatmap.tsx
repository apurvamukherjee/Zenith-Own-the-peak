import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Card } from "antd";
import { computeScoresForMonth } from "../../lib/dayScore";
import { useSetting } from "../../hooks/useSettings";
import { useTokens } from "../../hooks/useTokens";

// GitHub-contributions-style year grid. Each column = a month, each cell = a
// day, colored by discipline score. Clicking a month jumps into the full
// Calendar for that month (via router state — not persisted, so Calendar
// still always opens on the *current* month on a fresh load/refresh).
export function YearHeatmap() {
  const navigate = useNavigate();
  const t = useTokens();
  const waterGoal = useSetting("waterGoalMl");
  const proteinTarget = useSetting("proteinTargetG");
  const year = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const monthGrids = useLiveQuery(async () => {
    const results: { month: number; days: { date: string; score: number; hasAny: boolean }[] }[] = [];
    for (let m = 0; m <= currentMonth; m++) {
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      const dates = Array.from({ length: daysInMonth }, (_, i) =>
        `${year}-${String(m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`);
      const map = await computeScoresForMonth(dates, waterGoal, proteinTarget);
      results.push({ month: m, days: dates.map((d) => ({ date: d, score: map.get(d)?.score ?? 0, hasAny: map.get(d)?.hasAny ?? false })) });
    }
    return results;
  }, [year, currentMonth, waterGoal, proteinTarget]);

  function colorFor(score: number, hasAny: boolean): string {
    if (!hasAny) return "var(--border)";
    if (score >= 75) return t.teal;
    if (score >= 40) return t.gold;
    return "#ff5c7a";
  }

  const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <Card size="small" title={`${year} at a glance`} style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
        {monthGrids?.map((mg) => (
          <button key={mg.month}
            onClick={() => navigate("/calendar", { state: { year, month: mg.month } })}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "center" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 6px)", gridAutoRows: "6px", gap: 2 }}>
              {mg.days.map((d) => (
                <div key={d.date} style={{ width: 6, height: 6, borderRadius: 1.5, background: colorFor(d.score, d.hasAny) }} />
              ))}
            </div>
            <div style={{ fontSize: 9, color: "var(--ink-soft)", marginTop: 4 }}>{MONTH_LABELS[mg.month]}</div>
          </button>
        ))}
      </div>
    </Card>
  );
}
