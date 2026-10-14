import { useEffect, useState, type CSSProperties } from "react";
import { App } from "antd";
import { motion } from "framer-motion";
import { SmartInputNumber } from "../../components/SmartInputNumber";
import { TbPlus, TbArrowBackUp, TbDroplet, TbBarbell } from "react-icons/tb";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { EmptyState } from "../../components/EmptyState";
import { ColdIcon } from "../../components/ColdIcon";
import { AnimatedNumber } from "../../components/AnimatedNumber";
import { Hero } from "../../components/ui/Hero";
import { Liquid } from "../../components/ui/Liquid";
import { ListGroup, ListRow } from "../../components/ui/List";
import { useTodayWater, useWeeklyWater, useWorkoutToday, addWater, undoLastWater, computeStatus, type WaterStatus } from "./useWater";
import { useSetting } from "../../hooks/useSettings";
import { useTokens } from "../../hooks/useTokens";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useOptimisticNumber } from "../../hooks/useOptimistic";
import { hapticLight, hapticSuccess } from "../../lib/haptics";
import { playBellDing } from "../../lib/audio";
import "./water.css";

const QUICK = [250, 500, 1000];

const STATUS: Record<WaterStatus, { label: string; c: string }> = {
  done: { label: "Goal reached", c: "var(--success)" },
  "on-track": { label: "On pace", c: "var(--info)" },
  behind: { label: "Behind pace", c: "var(--warn)" },
  "way-behind": { label: "Way behind", c: "var(--danger)" },
};

export function WaterPage() {
  const t = useTokens();
  const reduced = useReducedMotion();
  const { message } = App.useApp();
  const { total, entries } = useTodayWater();
  const weekly = useWeeklyWater();
  const trained = useWorkoutToday();
  const base = useSetting("waterGoalMl");
  const bump = useSetting("workoutBumpMl");
  const wakeHour = useSetting("wakeHour");
  const windowH = useSetting("wakingWindowH");
  const [custom, setCustom] = useState<number>();

  const goal = base + (trained ? bump : 0);
  const { optimistic, commit } = useOptimisticNumber(total, "water");
  const { status, deltaMl } = computeStatus(optimistic, goal, wakeHour, windowH);
  const pct = Math.min(100, Math.round((optimistic / goal) * 100));

  // Once-a-day payoff: same bell as the rest-timer finish, unlike the quick
  // adds which stay haptic-only since they fire many times an hour.
  const [showedGoalToast, setShowedGoalToast] = useState(false);
  useEffect(() => {
    if (optimistic >= goal && !showedGoalToast) {
      setShowedGoalToast(true);
      void hapticSuccess();
      playBellDing();
      message.success("Daily goal reached!");
    }
  }, [optimistic, goal, showedGoalToast, message]);

  const pace = {
    done: "Goal smashed — nice work staying hydrated.",
    "on-track": "On track. Keep sipping through the day.",
    behind: `About ${Math.abs(deltaMl)} ml under where you should be by now.`,
    "way-behind": `${Math.abs(deltaMl)} ml short of pace. Drink up.`,
  }[status];

  async function log(ml: number) {
    void hapticLight();
    await commit(ml, () => addWater(ml), "water entry");
  }

  const hit = weekly.filter((d) => d.ml >= goal).length;
  const avg = weekly.length ? weekly.reduce((s, d) => s + d.ml, 0) / weekly.length : 0;
  const recent = [...entries].sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);

  return (
    <PageTransition>
      <div style={{ position: "relative" }}>
        <SectionTitle eyebrow="Hydration" title="Water" />

        <Hero color="var(--info)" color2="var(--info)" embers={false} className="wp-hero"
          eyebrow="Today"
          right={<span className="z-pill" style={{ "--c": STATUS[status].c } as CSSProperties}>{STATUS[status].label}</span>}>
          <Liquid pct={pct} color={status === "done" ? "var(--success)" : "var(--info)"} reduced={reduced} min={4} />
          <div className="wp-marks" aria-hidden>
            {[0.75, 0.5, 0.25].map((f) => <span key={f} style={{ bottom: `${f * 100}%` }}>{((goal * f) / 1000).toFixed(1)}L</span>)}
          </div>
          <div className="wp-hero__body">
            <div className="z-hero__big"><AnimatedNumber value={optimistic / 1000} decimals={2} /><small>L</small></div>
            <div className="wp-hero__of">
              of {(goal / 1000).toFixed(1)} L
              {trained && bump > 0 && <span className="wp-bump"><TbBarbell size={12} /> +{(bump / 1000).toFixed(2).replace(/0$/, "")}L training day</span>}
            </div>
            <div className="wp-hero__pace">{pace}</div>
          </div>
          <div className="wp-quick">
            {QUICK.map((ml) => (
              <motion.button key={ml} type="button" whileTap={{ scale: 0.9 }} className="wp-quick__btn" onClick={() => log(ml)} aria-label={`Add ${ml} ml`}>
                <TbPlus size={14} />{ml >= 1000 ? `${ml / 1000}L` : ml}
              </motion.button>
            ))}
            <motion.button type="button" whileTap={{ scale: 0.9 }} className="wp-quick__btn wp-quick__undo" aria-label="Undo last water entry"
              disabled={entries.length === 0}
              onClick={async () => { await undoLastWater(); void hapticLight(); message.success("Last entry removed"); }}>
              <TbArrowBackUp size={17} />
            </motion.button>
          </div>
        </Hero>

        <div className="wp-custom">
          <SmartInputNumber placeholder="Custom amount" value={custom} onChange={(v) => setCustom(v == null ? undefined : Number(v))}
            min={1} max={5000} controls={false} suffix="ml" aria-label="Custom water amount" style={{ flex: 1 }} />
          <button type="button" className="z-btn z-btn--solid" style={{ "--c": "var(--info)" } as CSSProperties} disabled={!custom}
            onClick={() => { if (custom) { void log(custom); setCustom(undefined); } }}>
            Add
          </button>
        </div>

        {entries.length === 0 ? (
          <EmptyState icon={<ColdIcon glyph="droplet" size={44} />} title="Nothing logged yet today"
            hint="Tap a quick add above to log your first sip." actionLabel="Add 500 ml" onAction={() => void log(500)} />
        ) : (
          <>
            <div className="z-bento wp-stats">
              <div className="z-tile" style={{ "--c": "var(--info)" } as CSSProperties}>
                <div className="z-tile__head"><span className="z-ico z-ico--sm"><TbDroplet size={14} /></span>7-day average</div>
                <div className="z-tile__big"><b>{(avg / 1000).toFixed(1)}</b><small>L / day</small></div>
              </div>
              <div className="z-tile" style={{ "--c": "var(--success)" } as CSSProperties}>
                <div className="z-tile__head"><span className="z-ico z-ico--sm"><TbDroplet size={14} /></span>Goal hit</div>
                <div className="z-tile__big"><b>{hit}</b><small>of 7 days</small></div>
              </div>
            </div>

            <ListGroup title="Last 7 days">
              <div className="wp-chart">
                <ResponsiveContainer>
                  <BarChart data={weekly} margin={{ top: 10, right: 6, left: 6, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8f8590" }} axisLine={false} tickLine={false} />
                    <ReferenceLine y={goal} stroke={t.accent} strokeDasharray="4 4" strokeOpacity={0.5} />
                    <Bar dataKey="ml" radius={[7, 7, 3, 3]} isAnimationActive={!reduced}>
                      {weekly.map((d, i) => <Cell key={i} fill={d.ml >= goal ? t.teal : "rgba(110,162,255,0.45)"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ListGroup>

            <ListGroup title="Today's log" right={<span>{entries.length} entries</span>}>
              {recent.map((e) => (
                <ListRow key={e.id} icon={<TbDroplet size={15} />} color="var(--info)" label={`${e.amountMl} ml`}
                  value={new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
              ))}
            </ListGroup>
          </>
        )}
      </div>
    </PageTransition>
  );
}
