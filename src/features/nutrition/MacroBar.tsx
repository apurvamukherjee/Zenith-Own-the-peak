import { Progress } from "antd";
import type { MealDto } from "../../db/types";
import { useTokens } from "../../hooks/useTokens";

interface Props { meals: MealDto[]; proteinTarget: number; fatTarget: number; carbTarget: number; kcalTarget: number; }

// Add-on #3: horizontal stacked bar of P / F / C consumed vs target, colour-coded.
// One row per macro so the "over" / "under" state is obvious at a glance.
export function MacroBar({ meals, proteinTarget, fatTarget, carbTarget, kcalTarget }: Props) {
  const t = useTokens();
  const protein = meals.reduce((s, m) => s + (m.protein || 0), 0);
  const fat = meals.reduce((s, m) => s + (m.fatG || 0), 0);
  const carbs = meals.reduce((s, m) => s + (m.carbsG || 0), 0);
  const kcal = meals.reduce((s, m) => s + (m.calories || 0), 0);

  const rows: { label: string; value: number; target: number; color: string; unit: string }[] = [
    { label: "Protein", value: protein, target: proteinTarget, color: t.accent, unit: "g" },
    { label: "Carbs", value: carbs, target: carbTarget, color: t.gold, unit: "g" },
    { label: "Fat", value: fat, target: fatTarget, color: t.teal, unit: "g" },
    { label: "Calories", value: kcal, target: kcalTarget, color: "#ff5c7a", unit: "kcal" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {rows.map((r) => {
        const pct = r.target > 0 ? Math.min(100, Math.round((r.value / r.target) * 100)) : 0;
        return (
          <div key={r.label}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
              <span style={{ fontWeight: 700, color: "var(--ink)" }}>{r.label}</span>
              <span style={{ color: "var(--ink-soft)" }}>
                {Math.round(r.value)}<span style={{ opacity: 0.7 }}> / {r.target} {r.unit}</span>
              </span>
            </div>
            <Progress percent={pct} strokeColor={r.color} showInfo={false} size={[-1, 6]} />
          </div>
        );
      })}
    </div>
  );
}

// Add-on #5: mini bar showing breakfast/lunch/dinner/snack calorie split.
export function TimeOfDayBar({ meals }: { meals: MealDto[] }) {
  const t = useTokens();
  const buckets: Record<MealDto["mealType"], number> = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
  for (const m of meals) buckets[m.mealType] += m.calories || 0;
  const total = Math.max(1, buckets.breakfast + buckets.lunch + buckets.dinner + buckets.snack);
  const items: { key: MealDto["mealType"]; label: string; color: string }[] = [
    { key: "breakfast", label: "B", color: t.gold },
    { key: "lunch", label: "L", color: t.accent },
    { key: "dinner", label: "D", color: t.teal },
    { key: "snack", label: "S", color: "#ff5c7a" },
  ];
  if (total <= 1) return null;
  return (
    <div>
      <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 4 }}>
        {items.map((i) => {
          const pct = (buckets[i.key] / total) * 100;
          if (pct === 0) return null;
          return <div key={i.key} title={`${i.label}: ${Math.round(buckets[i.key])}kcal`}
            style={{ width: `${pct}%`, background: i.color }} />;
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--ink-soft)" }}>
        {items.map((i) => (
          <span key={i.key}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 2, background: i.color, marginRight: 3, verticalAlign: "middle" }} />
            {i.label} {Math.round(buckets[i.key])}
          </span>
        ))}
      </div>
    </div>
  );
}
