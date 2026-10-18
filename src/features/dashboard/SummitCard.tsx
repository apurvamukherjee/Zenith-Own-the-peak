import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TbFlame, TbSnowflake, TbCheck } from "react-icons/tb";
import { AnimatedNumber } from "../../components/AnimatedNumber";
import { SisyphusOverlay } from "../../components/SisyphusOverlay";
import { useXP } from "../../hooks/useXP";
import { hapticSuccess } from "../../lib/haptics";
import { playBellDing } from "../../lib/audio";
import { Hero } from "../../components/ui/Hero";
import type { WeekDot } from "./useHomeData";

export interface Pillar {
  key: "water" | "protein" | "train" | "sleep";
  label: string;
  value: string;
  pct: number;
  to: string;
}

const COLOR: Record<Pillar["key"], string> = {
  water: "var(--info)", protein: "var(--teal)", train: "var(--accent)", sleep: "var(--gold)",
};

const MILESTONES = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365, 500, 1000];
const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// One ring, four quarter segments — the composite stays legible without
// four concentric rings fighting for attention.
const SIZE = 148;
const STROKE = 11;
const C = SIZE / 2;
const R = C - 12 - STROKE / 2; // inner room for the tick orbit outside the ring
const SPAN = 78; // degrees per segment; the rest of each quarter is the gap
const pt = (deg: number) => {
  const t = (deg * Math.PI) / 180;
  return `${(C + R * Math.sin(t)).toFixed(2)} ${(C - R * Math.cos(t)).toFixed(2)}`;
};
const arc = (a0: number) => `M ${pt(a0)} A ${R} ${R} 0 0 1 ${pt(a0 + SPAN)}`;
const draw = (delay: number) => ({ type: "spring" as const, stiffness: 38, damping: 13, delay });

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
  const peak = score >= 100;
  const tone = peak ? "is-peak" : urgent ? "is-urgent" : "";
  const status = peak ? "Peak reached" : urgent ? "Behind pace" : `${closed} of 4 closed`;
  const nextMilestone = MILESTONES.find((m) => m > streak);

  // Egg #2 (3 taps at 100% → bell) and Egg #11 (8 s hold → Sisyphus).
  const [sisyphusOpen, setSisyphusOpen] = useState(false);
  const [bellFlash, setBellFlash] = useState(0);
  const [pressPct, setPressPct] = useState(0);
  const taps = useRef({ count: 0, last: 0 });
  const pressTimer = useRef<number | null>(null);
  const pressTick = useRef<number | null>(null);

  function onRingTap() {
    if (!peak) return;
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
    <Hero eyebrow="Today's summit" className={`hb-summit ${tone}`} right={<LevelChip />}>
      <div className="hb-summit__body">
        <div
          className="hb-dial"
          role="img"
          aria-label={`Discipline ${score} percent, ${status}`}
          onClick={onRingTap}
          onPointerDown={onPressStart} onPointerUp={clearPress} onPointerLeave={clearPress} onPointerCancel={clearPress}
          onContextMenu={(e) => e.preventDefault()}
        >
          <motion.div
            className="hb-dial__spin"
            animate={reduced ? {} : critical ? { x: [0, -3, 3, -2, 2, 0] } : urgent ? { scale: [1, 1.03, 1] } : {}}
            transition={critical ? { duration: 0.6, repeat: Infinity, repeatDelay: 1.2 } : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="hb-dial__glow" aria-hidden />
            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden className="hb-dial__svg">
              <circle className="hb-dial__ticks" cx={C} cy={C} r={C - 3} fill="none" strokeWidth="2" strokeDasharray="1.2 6.1" />
              {pressPct > 0 && (
                <circle cx={C} cy={C} r={C - 3} fill="none" strokeWidth="2.5" className="hb-dial__press"
                  strokeDasharray={2 * Math.PI * (C - 3)} strokeDashoffset={2 * Math.PI * (C - 3) * (1 - pressPct)}
                  transform={`rotate(-90 ${C} ${C})`} />
              )}
              {pillars.map((p, i) => {
                const pct = Math.max(0, Math.min(100, p.pct)) / 100;
                const d = arc(i * 90 + (90 - SPAN) / 2);
                const motionProps = {
                  initial: reduced ? false : { pathLength: 0, opacity: 0 },
                  animate: { pathLength: pct, opacity: pct > 0 ? 1 : 0 },
                  transition: reduced ? { duration: 0 } : { pathLength: draw(0.2 + i * 0.14), opacity: { duration: 0.15, delay: 0.2 + i * 0.14 } },
                };
                return (
                  <g key={p.key} style={{ "--c": COLOR[p.key] } as CSSProperties} className={pct >= 1 ? "is-done" : undefined}>
                    <path d={d} className="hb-dial__track" fill="none" strokeWidth={STROKE} strokeLinecap="round" />
                    {/* Blurred twin = the glow. A drop-shadow filter mis-tints var() colors and costs more on Android. */}
                    <motion.path d={d} fill="none" strokeWidth={STROKE + 4} strokeLinecap="round" className="hb-dial__bloom" {...motionProps} />
                    <motion.path d={d} fill="none" strokeWidth={STROKE} strokeLinecap="round" className="hb-dial__seg" {...motionProps} />
                  </g>
                );
              })}
            </svg>
            {/* Comet heads ride each segment's leading edge, rotating with the same spring as the stroke. */}
            {!reduced && pillars.map((p, i) => {
              const pct = Math.max(0, Math.min(100, p.pct)) / 100;
              if (pct <= 0 || pct >= 1) return null;
              const a0 = i * 90 + (90 - SPAN) / 2;
              return (
                <motion.div key={p.key} className="hb-dial__comet" aria-hidden style={{ "--c": COLOR[p.key], "--r": `${(R / SIZE) * 100}%` } as CSSProperties}
                  initial={{ rotate: a0 }} animate={{ rotate: a0 + SPAN * pct }} transition={draw(0.2 + i * 0.14)}>
                  <i />
                </motion.div>
              );
            })}
            <div className="hb-dial__center">
              <motion.div
                className="hb-score"
                animate={flicker ? { opacity: [1, 0.15, 1, 0.25, 1, 0.5, 1] } : { opacity: 1 }}
                transition={flicker ? { duration: 0.6 } : { duration: 0 }}
              >
                <AnimatedNumber value={score} /><small>%</small>
              </motion.div>
              <div className="hb-score__label">discipline</div>
              <div className="hb-score__status">{status}</div>
            </div>
          </motion.div>
          {peak && !reduced && <PeakBurst />}
          {bellFlash > 0 && (
            <motion.div key={bellFlash} aria-hidden className="hb-bell"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: [0, 0.9, 0], scale: [0.9, 1.15, 1.3] }} transition={{ duration: 0.5 }} />
          )}
        </div>

        <ul className="hb-pillars">
          {pillars.map((p, i) => {
            const done = p.pct >= 100;
            return (
              <motion.li key={p.key}
                initial={reduced ? false : { opacity: 0, x: 14, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.25 + i * 0.08, type: "spring", stiffness: 240, damping: 24 }}>
                <Link to={p.to} className={`hb-pillar${done ? " is-done" : ""}`} style={{ "--c": COLOR[p.key] } as CSSProperties}>
                  <span className="hb-pillar__row">
                    <span className="hb-pillar__dot">{done && <TbCheck size={9} strokeWidth={4} />}</span>
                    <span className="hb-pillar__label">{p.label}</span>
                    <span className="hb-pillar__value">{p.value}</span>
                  </span>
                  <span className={`hb-pillar__track${p.pct > 0 && !done ? " is-live" : ""}`}>
                    <motion.i initial={reduced ? false : { scaleX: 0 }} animate={{ scaleX: Math.max(0, Math.min(100, p.pct)) / 100 }}
                      transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 70, damping: 18, delay: 0.35 + i * 0.08 }} />
                  </span>
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </div>

      <Link to="/calendar" className="hb-foot">
        <StreakFlame streak={streak} />
        <span className="hb-foot__meta">
          <span className="hb-foot__title">
            day streak
            {freezeAvailable && <span className="hb-freeze" title="Streak freeze available this week"><TbSnowflake size={10} /> 1</span>}
          </span>
          {nextMilestone && <span className="hb-foot__sub">{nextMilestone - streak} to {nextMilestone}</span>}
        </span>
        <span className="hb-bars" aria-label="Last 7 days">
          {week.map((d, i) => {
            const band = !d.hasAny ? "" : d.score >= 75 ? " is-high" : d.score >= 40 ? " is-mid" : " is-low";
            const h = d.hasAny ? 6 + (Math.min(100, d.score) / 100) * 20 : 4;
            return (
              <motion.i key={d.date} className={`hb-bars__bar${band}${d.isToday ? " is-today" : ""}`}
                title={`${WEEKDAY[new Date(d.date + "T00:00").getDay()]} · ${d.hasAny ? `${d.score}%` : "no data"}`}
                style={{ height: h }}
                initial={reduced ? false : { scaleY: 0 }} animate={{ scaleY: 1 }}
                transition={{ delay: 0.5 + i * 0.05, type: "spring", stiffness: 380, damping: 20 }} />
            );
          })}
        </span>
      </Link>

      <SisyphusOverlay open={sisyphusOpen} onClose={() => setSisyphusOpen(false)} />
    </Hero>
  );
}

// Sparks thrown off the dial when the day peaks. Fixed angles, not random, so
// re-renders never reshuffle them.
const SPARKS = Array.from({ length: 14 }, (_, i) => ({ a: (i / 14) * 360 + (i % 2) * 9, d: R + 16 + (i % 3) * 9 }));
function PeakBurst() {
  return (
    <div className="hb-burst" aria-hidden>
      {/* Wrapper holds the angle; the spark only travels outward along it
          (Framer would otherwise translate first, then rotate in place). */}
      {SPARKS.map((s, i) => (
        <span key={i} style={{ transform: `rotate(${s.a}deg)` }}>
          <motion.i
            initial={{ opacity: 0, y: -R + 4, scaleY: 0.4 }}
            animate={{ opacity: [0, 1, 0], y: -s.d, scaleY: [0.4, 1, 0.3] }}
            transition={{ duration: 1.1, delay: 1 + (i % 4) * 0.04, ease: [0.22, 1, 0.36, 1] }} />
        </span>
      ))}
    </div>
  );
}

// Egg #3 — hold the flame ~1 s and it ignites.
function StreakFlame({ streak }: { streak: number }) {
  const [hot, setHot] = useState(false);
  const hold = useRef<number | null>(null);
  // The flame sits inside the footer's calendar link — a completed hold must
  // swallow the click that follows pointerup or it would also navigate.
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
    <span className={`hb-flame${streak > 0 ? " is-lit" : ""}`} onPointerDown={down} onPointerUp={up} onPointerLeave={up}
      onClick={(e) => { if (fired.current) { e.preventDefault(); fired.current = false; } }}>
      <TbFlame size={20} />
      <span className="display"><AnimatedNumber value={streak} /></span>
      {hot && (
        <motion.span aria-hidden className="hb-flame__burst"
          initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1.4, 1.6, 1.8] }}
          transition={{ duration: 3, times: [0, 0.15, 0.85, 1] }} />
      )}
    </span>
  );
}

function LevelChip() {
  const { totalXP, level, next, progress } = useXP();
  if (totalXP === 0) return null;
  return (
    <Link to="/hall" className="hb-lv" aria-label={`Level ${level.level} ${level.name}${next ? `, ${Math.round(progress * 100)}% to next` : ""}`}>
      <b>Lv.{level.level}</b> {level.name}
      <span className="hb-lv__bar"><motion.i initial={{ scaleX: 0 }} animate={{ scaleX: progress }}
        transition={{ type: "spring", stiffness: 60, damping: 16, delay: 0.6 }} /></span>
    </Link>
  );
}
