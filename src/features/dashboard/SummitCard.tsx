import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TbFlame, TbSnowflake, TbDroplet, TbMeat, TbBarbell, TbMoon, TbCheck, TbChevronRight } from "react-icons/tb";
import { AnimatedNumber } from "../../components/AnimatedNumber";
import { SisyphusOverlay } from "../../components/SisyphusOverlay";
import { useXP } from "../../hooks/useXP";
import { hapticSuccess } from "../../lib/haptics";
import { playBellDing } from "../../lib/audio";
import { Rings } from "../../components/ui/Rings";
import { Hero } from "../../components/ui/Hero";
import type { WeekDot } from "./useHomeData";

export interface Pillar {
  key: "water" | "protein" | "train" | "sleep";
  label: string;
  value: string;
  pct: number;
  to: string;
}

const PILLAR_META: Record<Pillar["key"], { color: string; icon: ReactNode }> = {
  water: { color: "var(--info)", icon: <TbDroplet size={14} /> },
  protein: { color: "var(--teal)", icon: <TbMeat size={14} /> },
  train: { color: "var(--accent)", icon: <TbBarbell size={14} /> },
  sleep: { color: "var(--gold)", icon: <TbMoon size={14} /> },
};

const MILESTONES = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365, 500, 1000];
const WEEKDAY = ["S", "M", "T", "W", "T", "F", "S"];

interface Props {
  score: number;
  pillars: Pillar[];
  streak: number;
  freezeAvailable: boolean;
  week: WeekDot[];
  urgent: boolean;
  critical: boolean;
  reduced: boolean;
}

export function SummitCard({ score, pillars, streak, freezeAvailable, week, urgent, critical, reduced }: Props) {
  const closed = pillars.filter((p) => p.pct >= 100).length;
  const status = score >= 100 ? "Peak reached" : urgent ? "Behind" : `${closed} of 4 closed`;
  const nextMilestone = MILESTONES.find((m) => m > streak);

  // Egg #2 (3 taps at 100% → bell) and Egg #11 (8 s hold → Sisyphus).
  const [sisyphusOpen, setSisyphusOpen] = useState(false);
  const [bellFlash, setBellFlash] = useState(0);
  const [pressPct, setPressPct] = useState(0);
  const taps = useRef({ count: 0, last: 0 });
  const pressTimer = useRef<number | null>(null);
  const pressTick = useRef<number | null>(null);

  function onRingTap() {
    if (score < 100) return;
    const now = Date.now();
    if (now - taps.current.last > 500) taps.current.count = 0;
    taps.current.count++;
    taps.current.last = now;
    if (taps.current.count >= 3) {
      taps.current.count = 0;
      playBellDing();
      void hapticSuccess();
      setBellFlash(now);
      window.setTimeout(() => setBellFlash(0), 500);
    }
  }
  function clearPress() {
    if (pressTimer.current !== null) window.clearTimeout(pressTimer.current);
    if (pressTick.current !== null) window.clearInterval(pressTick.current);
    pressTimer.current = pressTick.current = null;
    setPressPct(0);
  }
  function onPressStart() {
    clearPress();
    const started = Date.now();
    pressTick.current = window.setInterval(() => setPressPct(Math.min(1, (Date.now() - started) / 8000)), 90);
    pressTimer.current = window.setTimeout(() => { clearPress(); setSisyphusOpen(true); }, 8000);
  }

  // One-shot digit flicker the first time the resolved score reads urgent.
  const [flicker, setFlicker] = useState(false);
  const flickered = useRef(false);
  useEffect(() => {
    if (flickered.current || reduced || !urgent) return;
    flickered.current = true;
    setFlicker(true);
    const id = window.setTimeout(() => setFlicker(false), 700);
    return () => window.clearTimeout(id);
  }, [urgent, reduced]);

  return (
    <Hero eyebrow="Today's summit" className="hb-summit"
      right={<span className={`hb-status${score >= 100 ? " is-peak" : urgent ? " is-urgent" : ""}`}>{status}</span>}>
      <div className="hb-summit__body">
        <div
          className="hb-summit__ring"
          role="img"
          aria-label={`Discipline ${score} percent`}
          onClick={onRingTap}
          onPointerDown={onPressStart} onPointerUp={clearPress} onPointerLeave={clearPress} onPointerCancel={clearPress}
          onContextMenu={(e) => e.preventDefault()}
        >
          {pressPct > 0 && (
            <svg viewBox="0 0 120 120" className="hb-press-ring" aria-hidden>
              <circle cx="60" cy="60" r="58" fill="none" strokeWidth="2"
                style={{ stroke: "var(--accent)" }}
                strokeDasharray={2 * Math.PI * 58} strokeDashoffset={2 * Math.PI * 58 * (1 - pressPct)}
                transform="rotate(-90 60 60)" />
            </svg>
          )}
          <motion.div
            animate={reduced ? {} : critical ? { x: [0, -3, 3, -2, 2, 0] } : urgent ? { scale: [1, 1.03, 1] } : {}}
            transition={critical ? { duration: 0.6, repeat: Infinity, repeatDelay: 1.2 } : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <Rings reduced={reduced} rings={pillars.map((p) => ({ key: p.key, pct: p.pct, color: PILLAR_META[p.key].color }))}>
              <motion.div
                className={`hb-score${urgent ? " is-urgent" : ""}${score >= 100 ? " is-peak" : ""}`}
                animate={flicker ? { opacity: [1, 0.15, 1, 0.25, 1, 0.5, 1] } : { opacity: 1 }}
                transition={flicker ? { duration: 0.6 } : { duration: 0 }}
              >
                <AnimatedNumber value={score} /><small>%</small>
              </motion.div>
              <div className="hb-score__label">discipline</div>
            </Rings>
          </motion.div>
          {bellFlash > 0 && (
            <motion.div key={bellFlash} aria-hidden className="hb-bell"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: [0, 0.9, 0], scale: [0.9, 1.15, 1.3] }} transition={{ duration: 0.5 }} />
          )}
        </div>

        <ul className="hb-legend">
          {pillars.map((p, i) => (
            <motion.li key={p.key}
              initial={reduced ? false : { opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.07, type: "spring", stiffness: 260, damping: 24 }}>
              <Link to={p.to} className="hb-legend__row" style={{ "--c": PILLAR_META[p.key].color } as CSSProperties}>
                <span className="hb-legend__icon">{p.pct >= 100 ? <TbCheck size={14} /> : PILLAR_META[p.key].icon}</span>
                <span className="hb-legend__text">
                  <span className="hb-legend__label">{p.label}</span>
                  <span className="hb-legend__value">{p.value}</span>
                </span>
                <TbChevronRight size={14} className="hb-legend__chev" />
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="hb-divider" />

      <Link to="/calendar" className="hb-streak">
        <StreakFlame streak={streak} />
        <div className="hb-streak__meta">
          <div className="hb-streak__title">
            day streak
            {freezeAvailable && <span className="hb-freeze" title="Streak freeze available this week"><TbSnowflake size={11} /> 1</span>}
          </div>
          {nextMilestone && <div className="hb-streak__sub">{nextMilestone - streak} to {nextMilestone}</div>}
        </div>
        <div className="hb-week">
          {week.map((d, i) => {
            const tone = !d.hasAny ? "" : d.score >= 75 ? " is-high" : d.score >= 40 ? " is-mid" : " is-low";
            return (
              <div key={d.date} className={`hb-week__day${d.isToday ? " is-today" : ""}`}>
                <span>{WEEKDAY[new Date(d.date + "T00:00").getDay()]}</span>
                <motion.i className={`hb-week__dot${tone}`}
                  initial={reduced ? false : { scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: 0.35 + i * 0.05, type: "spring", stiffness: 400, damping: 18 }}>
                  {d.hasAny && <TbFlame size={11} />}
                </motion.i>
              </div>
            );
          })}
        </div>
      </Link>

      <LevelRow />
      <SisyphusOverlay open={sisyphusOpen} onClose={() => setSisyphusOpen(false)} />
    </Hero>
  );
}

// Egg #3 — hold the flame ~1 s and it ignites.
function StreakFlame({ streak }: { streak: number }) {
  const [hot, setHot] = useState(false);
  const hold = useRef<number | null>(null);
  // The flame sits inside the streak row's calendar link — a completed hold
  // must swallow the click that follows pointerup or it would also navigate.
  const fired = useRef(false);
  const down = () => {
    if (hold.current !== null) window.clearTimeout(hold.current);
    fired.current = false;
    hold.current = window.setTimeout(() => {
      fired.current = true;
      setHot(true);
      window.setTimeout(() => setHot(false), 3000);
      hold.current = null;
    }, 800);
  };
  const up = () => { if (hold.current !== null) window.clearTimeout(hold.current); hold.current = null; };
  return (
    <div className={`hb-flame${streak > 0 ? " is-lit" : ""}`} onPointerDown={down} onPointerUp={up} onPointerLeave={up}
      onClick={(e) => { if (fired.current) { e.preventDefault(); fired.current = false; } }}>
      <TbFlame size={22} />
      <span className="display"><AnimatedNumber value={streak} /></span>
      {hot && (
        <motion.span aria-hidden className="hb-flame__burst"
          initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1.4, 1.6, 1.8] }}
          transition={{ duration: 3, times: [0, 0.15, 0.85, 1] }} />
      )}
    </div>
  );
}

function LevelRow() {
  const { totalXP, level, next, progress } = useXP();
  if (totalXP === 0) return null;
  return (
    <Link to="/hall" className="hb-level">
      <span className="hb-level__lv">Lv.{level.level}</span>
      <span className="hb-level__name">{level.name}</span>
      <span className="hb-level__bar">
        <motion.i initial={{ width: 0 }} animate={{ width: `${Math.round(progress * 100)}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 16, delay: 0.5 }} />
      </span>
      {next && <span className="hb-level__xp">{totalXP - level.xpRequired}/{next.xpRequired - level.xpRequired} XP</span>}
    </Link>
  );
}
