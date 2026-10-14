import { useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { TbTrophy, TbChartLine, TbTrendingUp, TbTrendingDown, TbStack2, TbBarbell } from "react-icons/tb";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { EmptyState } from "../../components/EmptyState";
import { AnimatedNumber } from "../../components/AnimatedNumber";
import { Hero } from "../../components/ui/Hero";
import { ListGroup, ListRow } from "../../components/ui/List";
import { useExerciseHistory, useLoggedExercises, useRecentPRs } from "./useWorkoutProgress";
import { progressionByDate, volumeLoad } from "../../lib/workout.utils";
import { prettyDate } from "../../lib/date.utils";
import { useTokens } from "../../hooks/useTokens";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./progress.css";

export function WorkoutProgressPage() {
  const t = useTokens();
  const reduced = useReducedMotion();
  const exercises = useLoggedExercises() ?? [];
  const [selected, setSelected] = useState<string>();
  const active = selected ?? exercises[0];
  const history = useExerciseHistory(active) ?? [];
  const prs = useRecentPRs() ?? [];

  const points = progressionByDate(history).map((p) => ({ ...p, label: prettyDate(p.date) }));
  const first = points[0]?.topE1rm ?? 0;
  const latest = points[points.length - 1]?.topE1rm ?? 0;
  const best = Math.max(0, ...points.map((p) => p.topE1rm));
  const gain = first ? Math.round(((latest - first) / first) * 100) : 0;
  const last = points[points.length - 1];

  return (
    <PageTransition>
      <SectionTitle eyebrow="Progress" title="Getting stronger" />

      {exercises.length === 0 ? (
        <EmptyState icon={<TbChartLine size={40} />} title="No sessions logged yet"
          hint="Hit Train, log a few sets, and your strength curves appear here automatically." />
      ) : (
        <>
          <div className="pg-chips" role="tablist" aria-label="Exercise">
            {exercises.map((e) => (
              <button key={e} type="button" role="tab" aria-selected={e === active}
                className={`pg-chip${e === active ? " is-on" : ""}`} onClick={() => setSelected(e)}>
                {e === active && <motion.span layoutId="pg-chip-bg" className="pg-chip__bg" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
                <span className="pg-chip__label">{e}</span>
              </button>
            ))}
          </div>

          <Hero eyebrow={active} tone="ember" className="pg-hero"
            right={points.length > 1 && (
              <span className="pg-gain">{gain >= 0 ? <TbTrendingUp size={13} /> : <TbTrendingDown size={13} />} {gain >= 0 ? "+" : ""}{gain}%</span>
            )}>
            <div className="z-hero__big"><AnimatedNumber value={latest} /><small>kg e1RM</small></div>
            <div className="z-hero__sub">Best ever {best} kg · {points.length} session{points.length === 1 ? "" : "s"}</div>
            <div className="pg-chart">
              <ResponsiveContainer>
                <LineChart data={points} margin={{ top: 10, right: 6, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pg-line" x1="0" x2="1">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#ffffff" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.7)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.7)" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number, _n, p) => [`${v} kg (top set ${p.payload.topWeight}×${p.payload.topReps})`, "e1RM"]} />
                  <Line type="monotone" dataKey="topE1rm" stroke="url(#pg-line)" strokeWidth={3} dot={{ r: 3, fill: "#fff", strokeWidth: 0 }} activeDot={{ r: 5 }} isAnimationActive={!reduced} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Hero>

          <div className="z-bento" style={{ marginTop: 12 }}>
            <div className="z-tile" style={{ "--c": "var(--accent)" } as CSSProperties}>
              <div className="z-tile__head"><span className="z-ico z-ico--sm"><TbStack2 size={14} /></span>Volume</div>
              <div className="z-tile__big"><b>{volumeLoad(history).toLocaleString()}</b><small>kg</small></div>
            </div>
            <div className="z-tile" style={{ "--c": "var(--gold)" } as CSSProperties}>
              <div className="z-tile__head"><span className="z-ico z-ico--sm"><TbBarbell size={14} /></span>Top set</div>
              <div className="z-tile__big"><b>{last?.topWeight ?? "–"}</b><small>kg × {last?.topReps ?? "–"}</small></div>
            </div>
          </div>
          <div className="z-list-foot">e1RM rises when you add weight <em>or</em> reps — beat last week either way.</div>
        </>
      )}

      <ListGroup title="Recent PRs">
        {prs.length === 0 ? (
          <div className="pg-empty">No PRs yet — your first logged set of each lift counts.</div>
        ) : prs.map((p) => (
          <ListRow key={p.id} icon={<TbTrophy size={15} />} color={t.gold} label={p.exerciseName}
            hint={prettyDate(p.date)} value={<b style={{ color: "var(--ink)" }}>{p.weightKg} × {p.reps}</b>} />
        ))}
      </ListGroup>
    </PageTransition>
  );
}
