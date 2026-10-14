import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { TbBolt, TbMeat, TbBread, TbDroplet, TbCheck } from "react-icons/tb";
import type { MealDto } from "../../db/types";
import { Hero } from "../../components/ui/Hero";
import { Rings } from "../../components/ui/Rings";
import { AnimatedNumber } from "../../components/AnimatedNumber";
import { useReducedMotion } from "../../hooks/useReducedMotion";

interface Props { meals: MealDto[]; proteinTarget: number; fatTarget: number; carbTarget: number; kcalTarget: number }

// Same concentric-ring language as Home's summit: each macro is its own
// ring so "calories fine, protein short" is visible at a glance.
export function FuelHero({ meals, proteinTarget, fatTarget, carbTarget, kcalTarget }: Props) {
  const reduced = useReducedMotion();
  const sum = (f: (m: MealDto) => number) => meals.reduce((s, m) => s + (f(m) || 0), 0);
  const kcal = sum((m) => m.calories);
  const rows = [
    { key: "kcal", label: "Calories", v: kcal, t: kcalTarget, unit: "kcal", c: "var(--accent)", icon: <TbBolt size={14} /> },
    { key: "p", label: "Protein", v: sum((m) => m.protein), t: proteinTarget, unit: "g", c: "var(--teal)", icon: <TbMeat size={14} /> },
    { key: "c", label: "Carbs", v: sum((m) => m.carbsG ?? 0), t: carbTarget, unit: "g", c: "var(--gold)", icon: <TbBread size={14} /> },
    { key: "f", label: "Fat", v: sum((m) => m.fatG ?? 0), t: fatTarget, unit: "g", c: "var(--info)", icon: <TbDroplet size={14} /> },
  ];
  const left = Math.max(0, Math.round(kcalTarget - kcal));

  return (
    <Hero eyebrow="Today's fuel" color="var(--teal)" className="nu-hero"
      right={<span className="z-pill" style={{ "--c": left ? "var(--ink-soft)" : "var(--success)" } as CSSProperties}>{left ? `${left} kcal to go` : "Surplus hit"}</span>}>
      <div className="nu-hero__body">
        <Rings size={142} stroke={9.5} gap={3} reduced={reduced}
          rings={rows.map((r) => ({ key: r.key, pct: r.t > 0 ? (r.v / r.t) * 100 : 0, color: r.c }))}>
          <div className="nu-hero__kcal display"><AnimatedNumber value={Math.round(kcal)} /></div>
          <div className="nu-hero__unit">kcal</div>
        </Rings>
        <ul className="nu-legend-rows">
          {rows.map((r, i) => {
            const done = r.t > 0 && r.v >= r.t;
            return (
              <motion.li key={r.key} style={{ "--c": r.c } as CSSProperties}
                initial={reduced ? false : { opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.06, type: "spring", stiffness: 260, damping: 24 }}>
                <span className="z-ico z-ico--sm">{done ? <TbCheck size={14} /> : r.icon}</span>
                <span className="nu-legend-rows__text">
                  <small>{r.label}</small>
                  <b>{Math.round(r.v).toLocaleString()}<em> / {r.t.toLocaleString()}{r.unit === "g" ? "g" : ""}</em></b>
                </span>
              </motion.li>
            );
          })}
        </ul>
      </div>
      <TimeOfDayBar meals={meals} />
    </Hero>
  );
}

// Breakfast / lunch / dinner / snack calorie split.
function TimeOfDayBar({ meals }: { meals: MealDto[] }) {
  const buckets: Record<MealDto["mealType"], number> = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
  for (const m of meals) buckets[m.mealType] += m.calories || 0;
  const total = buckets.breakfast + buckets.lunch + buckets.dinner + buckets.snack;
  if (total <= 0) return null;
  const items: { key: MealDto["mealType"]; label: string; c: string }[] = [
    { key: "breakfast", label: "Breakfast", c: "var(--gold)" },
    { key: "lunch", label: "Lunch", c: "var(--accent)" },
    { key: "dinner", label: "Dinner", c: "var(--teal)" },
    { key: "snack", label: "Snack", c: "var(--info)" },
  ];
  return (
    <div className="nu-tod">
      <div className="nu-tod__bar">
        {items.map((i) => buckets[i.key] > 0 && (
          <motion.i key={i.key} style={{ background: i.c }} initial={false}
            animate={{ width: `${(buckets[i.key] / total) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        ))}
      </div>
      <div className="nu-tod__legend">
        {items.map((i) => <span key={i.key}><i style={{ background: i.c }} />{i.label} {Math.round(buckets[i.key])}</span>)}
      </div>
    </div>
  );
}
