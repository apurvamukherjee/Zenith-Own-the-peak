import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Progress, Button, App } from "antd";
import { TbFlame, TbChevronRight, TbDroplet, TbMoon, TbBarbell, TbBook2, TbPlus, TbSettings, TbShare2, TbMeat, TbGasStation, TbCalendar, TbSun, TbSunrise, TbSunset, TbMoonStars, TbCoffee, TbTrophy, TbSnowflake, TbStarFilled, TbX, TbCheck } from "react-icons/tb";
import { useLiveQuery } from "dexie-react-hooks";
import { motion, useScroll, useTransform } from "framer-motion";
import { AnimatedNumber } from "../../components/AnimatedNumber";
import { SisyphusOverlay } from "../../components/SisyphusOverlay";
import { HomeQuoteCard } from "../../components/HomeQuoteCard";
import { ColdIcon } from "../../components/ColdIcon";
import { db } from "../../db/db";
import { useTokens } from "../../hooks/useTokens";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useSetting, setSetting } from "../../hooks/useSettings";
import { useTodayWater, useWorkoutToday, addWater } from "../water/useWater";
import { useTodaySession, useTodayDayId, useDayExercises, useSessionSets } from "../gym/useGym";
import { useRecentSleep } from "../sleep/useSleep";
import { computeUnifiedStreak, isFreezeAvailable, useStreakFreeze as useFreezeAction } from "../../lib/streak.utils";
import { computeTodayScore } from "../../lib/todayScore";
import { useMonthScores } from "../calendar/useCalendar";
import { fmtDuration, todayKey } from "../../lib/date.utils";
import { hapticLight, hapticSuccess } from "../../lib/haptics";
import { useXP } from "../../hooks/useXP";
import { isDevilsHour, isZenithHour, isPalindromeDate, isHardcoreActive, isSabbathActive } from "../../lib/easterEggs";
import { playBellDing } from "../../lib/audio";

// Time-aware greeting: text, icon, tagline, and a gradient accent that
// evolves through the day — dawn amber, day peak crimson, dusk ember, night black.
// Every stop stays inside the red-black-ember family. No purple.
// `overrides` lets easter eggs replace the base greeting without touching
// the base map: 3:33 AM → devil's hour, palindrome dates → symmetry note.
function greeting(overrides?: { devilsHour?: boolean; zenithHour?: boolean; palindrome?: boolean; hardcore?: boolean; sabbath?: boolean }) {
  const h = new Date().getHours();

  // Egg #5 — Devil's hour override. Only fires between 3:33 and 3:34.
  if (overrides?.devilsHour) return {
    text: "Devil's hour", icon: TbMoonStars, tagline: "What are you doing awake?",
    grad: "linear-gradient(135deg, #6e0f1c, #ff2740)",
  };

  // Egg #10 — Zenith hour. Exactly 12:00 noon — the sun's peak.
  if (overrides?.zenithHour) return {
    text: "Zenith hour", icon: TbSun, tagline: "The sun is at its peak. So are you.",
    grad: "linear-gradient(135deg, #ff2740, #d81f34)",
  };

  const base = (() => {
    if (h >= 5 && h < 8) return {
      text: "Rise & shine", icon: TbSunrise, tagline: "Fresh day, fresh peak",
      grad: "linear-gradient(135deg, #f6b93b, #ff6b3d)",
    };
    if (h >= 8 && h < 12) return {
      text: "Good morning", icon: TbCoffee, tagline: "Fuel up, own the day",
      grad: "linear-gradient(135deg, #ff6b3d, #ff2740)",
    };
    if (h >= 12 && h < 15) return {
      text: "Good afternoon", icon: TbSun, tagline: "Push through the middle",
      grad: "linear-gradient(135deg, #ff2740, #d81f34)",
    };
    if (h >= 15 && h < 18) return {
      text: "Steady on", icon: TbSun, tagline: "Second wind time",
      grad: "linear-gradient(135deg, #d81f34, #a8172b)",
    };
    if (h >= 18 && h < 21) return {
      text: "Good evening", icon: TbSunset, tagline: "Finish strong",
      grad: "linear-gradient(135deg, #a8172b, #6e0f1c)",
    };
    if (h >= 21 && h < 24) return {
      text: "Wind down", icon: TbMoon, tagline: "Recovery is where growth happens",
      grad: "linear-gradient(135deg, #6e0f1c, #1a0509)",
    };
    return {
      text: "Late night", icon: TbMoonStars, tagline: "Sleep is your edge",
      grad: "linear-gradient(135deg, #1a0509, #08060a)",
    };
  })();

  // Egg #12 — Hardcore Mode SHOUTS training-flavoured base text (24 h window).
  if (overrides?.hardcore) return { ...base, text: base.text.toUpperCase() + " — TRAIN", tagline: "GRIND ENGAGED" };
  // Egg #12 — Sabbath Mode softens things (Sundays only).
  if (overrides?.sabbath) return { ...base, tagline: "Rest is a discipline too" };
  // Egg #13 — palindrome date. Appends symmetry line, keeps the base greeting.
  if (overrides?.palindrome) return { ...base, tagline: `${base.tagline} · Palindrome day, fittingly symmetric` };
  return base;
}

export function DashboardPage() {
  const { message } = App.useApp();
  const t = useTokens();
  const reducedMotion = useReducedMotion();
  const name = useSetting("name");
  const waterGoal = useSetting("waterGoalMl");
  const proteinTarget = useSetting("proteinTargetG");
  const { total: waterMl } = useTodayWater();
  const trained = useWorkoutToday();
  const sleep = useRecentSleep(2);
  const lastSleep = [...sleep].reverse().find(Boolean);
  const todayDayId = useTodayDayId();
  const todaySession = useTodaySession(todayDayId);
  const todayExercises = useDayExercises(todayDayId ?? undefined);
  const todaySets = useSessionSets(todaySession?.id);
  const trainTotalSets = todayExercises.reduce((s, e) => s + e.sets, 0);
  const trainDoneSets = todaySets.length;
  const trainPct = trainTotalSets > 0 ? Math.round((trainDoneSets / trainTotalSets) * 100) : 0;
  const trainAllDone = trainTotalSets > 0 && trainDoneSets >= trainTotalSets;

  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState({ score: 0, waterPct: 0, sessionDone: false, sleepLogged: false, proteinPct: 0 });
  const [freezeAvailable, setFreezeAvailable] = useState(false);

  // Egg overlay + interaction state.
  const [sisyphusOpen, setSisyphusOpen] = useState(false);
  const [flameHot, setFlameHot] = useState(false);
  const [bellFlash, setBellFlash] = useState(0);
  const ringTapsRef = useRef<{ count: number; last: number }>({ count: 0, last: 0 });
  const ringPressRef = useRef<number | null>(null);
  const ringPressTickRef = useRef<number | null>(null);
  const [ringPressPct, setRingPressPct] = useState(0);

  const hardcoreUntil = Number(useSetting("hardcoreUntil"));
  const sabbathUntil = Number(useSetting("sabbathUntil"));
  const eggReflectiveYear = String(useSetting("eggReflective") ?? "");

  // Auto-claim Reflective (Egg #13) on a palindrome date, once per calendar year.
  useEffect(() => {
    const now = new Date();
    if (!isPalindromeDate(now)) return;
    const yr = String(now.getFullYear());
    if (eggReflectiveYear === yr) return;
    void setSetting("eggReflective", yr);
  }, [eggReflectiveYear]);

  useEffect(() => { computeUnifiedStreak().then(setStreak); }, [waterMl, trained]);
  useEffect(() => { computeTodayScore(waterGoal, proteinTarget).then(setScore); }, [waterMl, waterGoal, proteinTarget]);
  useEffect(() => { isFreezeAvailable(todayKey()).then(setFreezeAvailable); }, [waterMl, trained]);

  // Rocky Mode (Egg #14): 40+ sets today → gold star on the training hero card.
  const setsToday = useLiveQuery(
    () => db.workoutSets.where("date").equals(todayKey()).count(),
    [],
  ) ?? 0;
  const rockyToday = setsToday >= 40;

  const firstSeenAt = Number(useSetting("firstSeenAt"));
  const reviewNudgeDone = Number(useSetting("reviewNudgeDone"));
  // Show "Review your targets" nudge on day 7+ after first launch — once only.
  // The 7-day window means the user has lived with the app long enough to
  // know if their water/protein targets are actually right for them.
  const sevenDaysOld = firstSeenAt > 0 && (Date.now() - firstSeenAt) >= 7 * 86_400_000;
  const showReviewNudge = sevenDaysOld && !reviewNudgeDone;

  const hour = new Date().getHours();
  // Fires at 9pm+ only if the user has literally zero writes today AND has a streak
  // to protect. Old condition used `score.score === 0`, but score can be 0 for a
  // legitimate rest day where sleep hasn't been logged yet — reading as "app broken"
  // instead of "genuine warning".
  const hasAnyWriteToday = score.waterPct > 0 || score.sessionDone || score.sleepLogged || score.proteinPct > 0;
  const streakInDanger = hour >= 21 && !hasAnyWriteToday && streak > 0;

  // Discipline-ring "rage meter" — the ring recolors and starts pulsing the
  // later in the day it is with the score still low, so it reads as an
  // alarm instead of a passive stat. `scoreCritical` adds a shake on top,
  // reusing the same "score >= 100 → calm, else → accent" convention the
  // session progress bar already uses elsewhere (SessionLogger).
  const scoreUrgent = hour >= 18 && score.score < 40;
  const scoreCritical = hour >= 21 && score.score < 15;

  // End-of-day brutal recap — water/protein/session (not sleep, which often
  // isn't loggable until the day is basically over) all still untouched
  // this late. Independent of `streakInDanger`: fires even with no streak to
  // protect, since "you did nothing today" deserves a callout either way.
  const didNothingToday = hour >= 21 && score.waterPct === 0 && !score.sessionDone && score.proteinPct === 0;
  const NOTHING_TODAY_QUOTES = [
    "Zero water. Zero protein. Zero sets. What exactly did you do today?",
    "It's night. The scoreboard says nothing happened. That's on you.",
    "Tomorrow you'll say you'll do better. You said that yesterday too.",
    "Nothing logged, nothing done. That's not a rest day, that's a skip.",
  ];
  // Stable per-day, not re-rolled on every re-render — keyed on the date so
  // it stays put through this file's frequent live-query re-renders but
  // still changes tomorrow.
  const nothingTodayQuote = NOTHING_TODAY_QUOTES[
    todayKey().split("-").reduce((s, n) => s + Number(n), 0) % NOTHING_TODAY_QUOTES.length
  ];

  async function protectStreak() {
    await addWater(500);
    hapticLight();
    message.success("Streak protected — 500ml logged");
  }
  async function protectWithFreeze() {
    const ok = await useFreezeAction(todayKey());
    if (ok) { message.success("Streak freeze used for today"); setFreezeAvailable(false); }
    else message.info("Freeze already used this week");
  }

  const todayDay = useLiveQuery(async () => {
    const wd = new Date().getDay();
    const entry = await db.weekSchedule.where({ weekday: wd }).first();
    if (!entry?.dayId) return null;
    return db.workoutDays.get(entry.dayId);
  }, []);

  const upNext = useLiveQuery(async () => {
    const items = await db.studyItems.where("status").notEqual("done").sortBy("order");
    return items[0]?.title ?? null;
  }, []);

  async function quickWater(ml: number) {
    await addWater(ml);
    hapticLight();
    message.success(`+${ml}ml`);
  }

  const now = new Date();
  const g = greeting({
    devilsHour: isDevilsHour(now),
    zenithHour: isZenithHour(now),
    palindrome: isPalindromeDate(now),
    hardcore: isHardcoreActive(hardcoreUntil),
    sabbath: isSabbathActive(sabbathUntil),
  });
  const GIcon = g.icon;

  // Egg #2 — 3-tap the ring at 100%. Debounced 500 ms window between taps.
  function onRingTap() {
    if (score.score < 100) return;
    const t = Date.now();
    if (t - ringTapsRef.current.last > 500) ringTapsRef.current.count = 0;
    ringTapsRef.current.count++;
    ringTapsRef.current.last = t;
    if (ringTapsRef.current.count >= 3) {
      ringTapsRef.current.count = 0;
      playBellDing();
      void hapticSuccess();
      setBellFlash(Date.now());
      window.setTimeout(() => setBellFlash(0), 500);
    }
  }
  // Egg #11 — 8-second continuous press. Mid-press feedback via ringPressPct
  // (0→1 over 8s) so users know something is happening; before, nothing
  // moved and people gave up at 3s thinking it was broken. Cleared on lift.
  function onRingPressStart() {
    if (ringPressRef.current !== null) window.clearTimeout(ringPressRef.current);
    if (ringPressTickRef.current !== null) window.clearInterval(ringPressTickRef.current);
    const startedAt = Date.now();
    setRingPressPct(0);
    ringPressTickRef.current = window.setInterval(() => {
      const pct = Math.min(1, (Date.now() - startedAt) / 8000);
      setRingPressPct(pct);
    }, 90);
    ringPressRef.current = window.setTimeout(() => {
      setSisyphusOpen(true);
      ringPressRef.current = null;
      if (ringPressTickRef.current !== null) {
        window.clearInterval(ringPressTickRef.current);
        ringPressTickRef.current = null;
      }
      setRingPressPct(0);
    }, 8000);
  }
  function onRingPressEnd() {
    if (ringPressRef.current !== null) {
      window.clearTimeout(ringPressRef.current);
      ringPressRef.current = null;
    }
    if (ringPressTickRef.current !== null) {
      window.clearInterval(ringPressTickRef.current);
      ringPressTickRef.current = null;
    }
    setRingPressPct(0);
  }
  // Egg #3 — long-press the streak flame (3 s) → flame ignites for a moment.
  const flameHoldRef = useRef<number | null>(null);
  function onFlameDown() {
    if (flameHoldRef.current !== null) window.clearTimeout(flameHoldRef.current);
    flameHoldRef.current = window.setTimeout(() => {
      setFlameHot(true);
      window.setTimeout(() => setFlameHot(false), 3000);
      flameHoldRef.current = null;
    }, 800);
  }
  function onFlameUp() {
    if (flameHoldRef.current !== null) {
      window.clearTimeout(flameHoldRef.current);
      flameHoldRef.current = null;
    }
  }

  // Scroll-linked parallax for the greeting zone. `<main>` (AppShell) is the
  // actual scroll container, not the window, so useScroll needs its ref —
  // `closest`-free, `document.querySelector` is safe since AppShell renders
  // exactly one `<main>`. Set in a layout effect (before useScroll's own
  // subscribe effect, since hooks run in declaration order) so the container
  // is known on first scroll, not just after a re-render.
  const mainElRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => { mainElRef.current = document.querySelector("main"); }, []);
  const { scrollY } = useScroll({ container: mainElRef });
  const greetingY = useTransform(scrollY, [0, 220], [0, reducedMotion ? 0 : 55], { clamp: true });

  // Kinetic typography: a one-shot digit-flicker on the discipline % the
  // moment the real (async) score first resolves urgent, so the alarm reads
  // through the typography itself, not just the ring color/pulse. Gated on
  // the `score` object reference (only changes when computeTodayScore
  // actually resolves) rather than `scoreUrgent`'s value, since the default
  // pre-load state would otherwise spuriously read as "urgent" too.
  const [urgentFlicker, setUrgentFlicker] = useState(false);
  const flickerFiredRef = useRef(false);
  useEffect(() => {
    if (flickerFiredRef.current || reducedMotion) return;
    if (hour >= 18 && score.score < 40) {
      flickerFiredRef.current = true;
      setUrgentFlicker(true);
      const id = window.setTimeout(() => setUrgentFlicker(false), 700);
      return () => window.clearTimeout(id);
    }
  }, [score, hour, reducedMotion]);

  // Staggered entrance cascade — top-to-bottom, opacity/y only (cheap, no
  // layout thrash). `index` maps 1:1 to the section's visual order below.
  function cascade(index: number) {
    if (reducedMotion) return { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } };
    return {
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] as const },
    };
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 10,
      padding: "12px 16px 12px", minHeight: "calc(100dvh - 100px)",
    }}>
      {/* Header row: greeting + streak + settings. `y` carries the scroll
          parallax (drifts slower than the cards below); opacity carries the
          entrance cascade — kept separate since a MotionValue and a static
          animate target can't both drive the same transform key. */}
      <motion.div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", y: greetingY }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <motion.div
            key={g.text}
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
            {/* Bare icon — no badge, no gradient box. Just the glyph in ember red. */}
            <GIcon size={14} style={{ color: "var(--accent)", opacity: 0.85, flexShrink: 0 }} />
            {/* Gothic italic — Cinzel, solid ink, no gradient clip. Restrained > flashy. */}
            <span style={{
              fontFamily: '"Cinzel", "Plus Jakarta Sans", serif',
              fontStyle: "italic",
              fontSize: 12, fontWeight: 600,
              letterSpacing: "0.08em",
              color: "var(--ink-soft)",
            }}>{g.text}</span>
          </motion.div>
          <h2 className="display" style={{ margin: 0, fontSize: 22, fontWeight: 800, lineHeight: 1.05 }}>
            {name}
          </h2>
          <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 2, fontStyle: "italic" }}>
            {g.tagline}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{ textAlign: "center", cursor: "default", touchAction: "manipulation" }}
            onMouseDown={onFlameDown} onMouseUp={onFlameUp} onMouseLeave={onFlameUp}
            onTouchStart={onFlameDown} onTouchEnd={onFlameUp} onTouchCancel={onFlameUp}
          >
            <div className="display text-ember" style={{ fontSize: 20, fontWeight: 800, lineHeight: 1, position: "relative" }}>
              <TbFlame style={{ verticalAlign: "-2px" }} /><AnimatedNumber value={streak} />
              {flameHot && (
                <motion.span
                  aria-hidden
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1.4, 1.6, 1.8] }}
                  transition={{ duration: 3, times: [0, 0.15, 0.85, 1] }}
                  style={{
                    position: "absolute", left: -8, right: -8, top: -14, bottom: -6,
                    background: "radial-gradient(circle at 50% 60%, #d81f34 0%, #ff2740 50%, rgba(255,39,64,0) 75%)",
                    filter: "blur(6px)", pointerEvents: "none", borderRadius: "50%",
                    mixBlendMode: "screen",
                  }}
                />
              )}
            </div>
            <div style={{ fontSize: 9, color: "var(--ink-soft)" }}>
              streak{freezeAvailable && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 1, marginLeft: 4, fontSize: 8, opacity: 0.7 }}>
                  <TbSnowflake size={9} />1
                </span>
              )}
            </div>
          </div>
          <Link to="/glance"><Button type="text" size="small" icon={<TbShare2 size={18} />} aria-label="Share card" /></Link>
          <Link to="/leaderboard"><Button type="text" size="small" icon={<TbTrophy size={18} />} aria-label="Leaderboard" /></Link>
          <Link to="/settings"><Button type="text" size="small" icon={<TbSettings size={18} />} aria-label="Settings" /></Link>
        </div>
      </motion.div>

      {/* Streak-in-danger banner — escalates to the brutal end-of-day recap
          line when water/protein/session are ALL still untouched, instead of
          the milder default copy. Same slot, same buttons either way. */}
      {streakInDanger && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: "linear-gradient(135deg, #ff2740, #6e0f1c)", borderRadius: 12,
            padding: "10px 12px", color: "#fff" }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <TbFlame /> {didNothingToday ? nothingTodayQuote : "Streak at risk — protect it now"}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Button size="small" onClick={protectStreak} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", flex: 1 }}>
              +500ml water
            </Button>
            {freezeAvailable && (
              <Button size="small" onClick={protectWithFreeze} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", flex: 1 }}>
                Use freeze
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* End-of-day brutal recap — fires even with no streak to protect
          (streakInDanger above requires streak > 0), since doing literally
          nothing all day deserves a callout either way. */}
      {!streakInDanger && didNothingToday && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: "linear-gradient(135deg, #ff2740, #6e0f1c)", borderRadius: 12,
            padding: "10px 12px", color: "#fff" }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <TbFlame /> {nothingTodayQuote}
          </div>
          <Link to="/quick">
            <Button size="small" style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff" }}>
              Log something now
            </Button>
          </Link>
        </motion.div>
      )}

      {/* 7-day review nudge — fires once on day 7+ after first launch */}
      {showReviewNudge && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: "var(--surface)", borderRadius: 12,
            padding: "10px 14px", border: "1px solid var(--ember-inner)",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>A week in — targets still right?</div>
            <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>Your water, protein, and sleep goals are easy to adjust.</div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <Link to="/settings">
              <Button size="small" type="primary">Review</Button>
            </Link>
            <Button size="small" type="text" icon={<TbX size={14} />} aria-label="Dismiss" onClick={() => setSetting("reviewNudgeDone", 1)} />
          </div>
        </motion.div>
      )}

      {/* Center: discipline ring — primary tier. Elevated glass "dish" (heavier
          shadow + faint frosted panel via color-mix, theme-safe unlike a
          hardcoded rgba white) so it and the training hero read as the two
          things on this screen that matter, vs the flatter secondary cards
          below. */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: reducedMotion ? 0 : 0.06, ease: [0.22, 1, 0.36, 1] }}
        style={{
          textAlign: "center", flex: "0 0 auto", padding: "16px 10px 14px", userSelect: "none",
          borderRadius: 22,
          background: "linear-gradient(180deg, color-mix(in srgb, var(--ink) 8%, transparent), color-mix(in srgb, var(--ink) 2%, transparent))",
          border: "1px solid color-mix(in srgb, var(--ink) 14%, transparent)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          boxShadow: "inset 0 1px 0 color-mix(in srgb, var(--ink) 10%, transparent), 0 18px 40px -20px rgba(0,0,0,0.55), 0 3px 12px -4px var(--ember-glow)",
        }}>
        <div
          className="ember-ring"
          style={{ display: "inline-block", position: "relative", cursor: "pointer", userSelect: "none", touchAction: "manipulation" }}
          onClick={onRingTap}
          onMouseDown={onRingPressStart} onMouseUp={onRingPressEnd} onMouseLeave={onRingPressEnd}
          onTouchStart={onRingPressStart} onTouchEnd={onRingPressEnd} onTouchCancel={onRingPressEnd}
        >
          {/* #4 — Sisyphus press progress ring. Grows from 0→1 during the 8s hold. */}
          {ringPressPct > 0 && (
            <svg viewBox="0 0 120 120"
              style={{
                position: "absolute", inset: -8, width: 136, height: 136,
                pointerEvents: "none", zIndex: 1,
              }}>
              <circle cx="60" cy="60" r="58"
                fill="none" stroke="var(--accent)" strokeWidth="2"
                strokeDasharray={2 * Math.PI * 58}
                strokeDashoffset={2 * Math.PI * 58 * (1 - ringPressPct)}
                transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dashoffset 90ms linear", opacity: 0.7 }}
              />
            </svg>
          )}
          <motion.div
            animate={
              reducedMotion ? {}
              : scoreCritical ? { x: [0, -3, 3, -2, 2, 0] }
              : scoreUrgent ? { scale: [1, 1.035, 1] }
              : {}
            }
            transition={
              scoreCritical ? { duration: 0.6, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }
              : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <Progress type="dashboard" percent={score.score} size={120}
              strokeColor={score.score >= 100 ? t.teal : scoreUrgent ? "#ff2740" : t.accent} strokeWidth={8}
              format={() => (
                <div>
                  {/* Kinetic typography — bolder/wider weight while urgent so
                      the number itself carries the alarm, not just the ring
                      color/pulse; a one-shot digit-flicker (urgentFlicker,
                      fired once on load by the effect above) layers a brief
                      neon-flicker on top instead of a continuous distraction. */}
                  <motion.div
                    className="display"
                    animate={urgentFlicker ? { opacity: [1, 0.15, 1, 0.25, 1, 0.5, 1] } : { opacity: 1 }}
                    transition={urgentFlicker ? { duration: 0.6, times: [0, 0.15, 0.3, 0.45, 0.6, 0.8, 1] } : { duration: 0 }}
                    style={{
                      fontSize: 28, lineHeight: 1,
                      fontWeight: scoreUrgent ? 900 : 800,
                      letterSpacing: scoreUrgent ? "0.02em" : "normal",
                    }}
                  ><AnimatedNumber value={score.score} />%</motion.div>
                  <div style={{ fontSize: 9, color: "var(--ink-soft)", marginTop: 1 }}>discipline</div>
                </div>
              )} />
          </motion.div>
          {bellFlash > 0 && (
            <motion.div
              key={bellFlash} aria-hidden
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: [0, 0.9, 0], scale: [0.9, 1.15, 1.3] }}
              transition={{ duration: 0.5 }}
              style={{
                position: "absolute", inset: -14, borderRadius: "50%",
                background: "radial-gradient(circle,#ffd76b 0%,rgba(255,215,107,0) 70%)",
                pointerEvents: "none", filter: "blur(2px)",
              }}
            />
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 6 }}>
          <Pill done={score.waterPct >= 100} label="Water" icon={<TbDroplet size={12} />} />
          <Pill done={score.sessionDone} label="Train" icon={<TbBarbell size={12} />} />
          <Pill done={score.sleepLogged} label="Sleep" icon={<TbMoon size={12} />} />
          <Pill done={score.proteinPct >= 100} label="Protein" icon={<TbMeat size={12} />} />
        </div>
        {score.score === 0 && !hasAnyWriteToday && (
          <div style={{
            fontSize: 10, color: "var(--ink-soft)", fontStyle: "italic",
            marginTop: 8, opacity: 0.7, letterSpacing: 0.3,
          }}>
            Ready when you are
          </div>
        )}
        {/* Level badge — Phase 5 XP system */}
        <LevelBadge />
      </motion.div>

      {/* Mini calendar streak strip — last 7 days */}
      <motion.div {...cascade(2)}>
        <MiniWeekStrip />
      </motion.div>

      {/* Training hero card — primary tier, second of the two "matters most"
          surfaces. Glassmorphism recipe lifted from GymFocusMode's CTA
          buttons (translucent tint + blurred backdrop + hairline border +
          inset highlight) but with a lighter blur (10px vs Focus Mode's
          18px) — full-screen Focus Mode can afford heavier blur since it's
          the only thing rendering, a scrolling card feed can't without
          risking jank on low-end phones. `hero-grad`'s `!important` opaque
          fill can't be overridden by an inline style, so the translucent
          gradient below replaces it outright instead of layering on top. */}
      <motion.div {...cascade(3)}>
      <Link to="/workout" style={{ color: "inherit", display: "block", flex: "0 0 auto" }}>
        <div className="ember-corner" style={{
          borderRadius: 16, padding: "12px 16px", position: "relative", overflow: "hidden",
          background: "linear-gradient(135deg, rgba(26,5,9,0.64) 0%, rgba(110,15,28,0.58) 55%, rgba(200,17,42,0.52) 100%)",
          border: "1px solid rgba(255,255,255,0.20)",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 20px 46px -18px rgba(0,0,0,0.6), 0 4px 16px -6px var(--ember-glow)",
        }}>
          <svg viewBox="0 0 120 120" width="80" height="80" style={{ position: "absolute", right: -4, bottom: -10, opacity: 0.1 }}>
            <rect x="10" y="42" width="20" height="36" rx="4" fill="#fff"/>
            <rect x="90" y="42" width="20" height="36" rx="4" fill="#fff"/>
            <rect x="22" y="48" width="12" height="24" rx="3" fill="#fff"/>
            <rect x="86" y="48" width="12" height="24" rx="3" fill="#fff"/>
            <rect x="34" y="54" width="52" height="12" rx="3" fill="#fff"/>
          </svg>
          <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 600 }}>
                {todayDay ? "Today's training" : "Rest day"}
                {todaySession?.durationMin ? ` · ${todaySession.durationMin}min` : ""}
              </div>
              <div className="display" style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>
                {todayDay?.name ?? "Recovery"}
                {rockyToday && (
                  <span title="Rocky Mode — 40+ sets today" style={{ display: "inline-flex", marginLeft: 6, verticalAlign: "-3px" }} aria-label="Rocky Mode">
                    <TbStarFilled size={16} color="#f6b93b" />
                  </span>
                )}
              </div>
            </div>
            <TbChevronRight size={20} style={{ color: "rgba(255,255,255,0.7)" }} />
          </div>
          {todayDay && trainTotalSets > 0 && (
            trainAllDone ? (
              <div style={{ position: "relative", zIndex: 1, marginTop: 8, display: "flex", alignItems: "center", gap: 6, color: "#fff" }}>
                <ColdIcon glyph="peak" size={14} />
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3 }}>All done — peak conquered</span>
              </div>
            ) : (
              <div style={{ position: "relative", zIndex: 1, marginTop: 8 }}>
                <Progress percent={trainPct} showInfo={false} size={[-1, 5]}
                  strokeColor="#fff" trailColor="rgba(255,255,255,0.25)" />
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 3 }}>
                  {trainDoneSets}/{trainTotalSets} sets
                </div>
              </div>
            )
          )}
        </div>
      </Link>
      </motion.div>

      {/* 2x2 compact grid: water, sleep, study, protein */}
      <motion.div {...cascade(4)} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flex: "0 0 auto", marginTop: 8 }}>
        {/* Water */}
        <div style={{ background: "var(--surface)", borderRadius: 14, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <Progress type="circle" percent={score.waterPct} size={38} strokeColor={score.waterPct >= 100 ? t.teal : t.accent} strokeWidth={10}
            format={() => <span style={{ fontSize: 8, fontWeight: 700 }}>{score.waterPct}%</span>} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link to="/water" style={{ color: "inherit" }}>
              <div style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 3 }}>
                <TbDroplet size={13} /> Water
              </div>
            </Link>
            <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>{(waterMl / 1000).toFixed(1)}L</div>
          </div>
          <Button size="small" type="text" icon={<TbPlus size={14} />} onClick={() => quickWater(500)} style={{ padding: "0 6px" }} />
        </div>

        {/* Sleep */}
        <Link to="/sleep" style={{ color: "inherit" }}>
          <div style={{ background: "var(--surface)", borderRadius: 14, padding: "10px 12px", height: "100%" }}>
            <div style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 3 }}>
              <TbMoon size={13} /> Sleep
            </div>
            <div className="display" style={{ fontSize: 18, fontWeight: 800, color: "var(--accent)", marginTop: 2 }}>
              {lastSleep ? fmtDuration(lastSleep.durationMin) : "–"}
            </div>
          </div>
        </Link>

        {/* Study */}
        <Link to="/study" style={{ color: "inherit" }}>
          <div style={{ background: "var(--surface)", borderRadius: 14, padding: "10px 12px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 3 }}>
              <TbBook2 size={13} /> Study
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {upNext ?? "Add a path"}
            </div>
          </div>
        </Link>

        {/* Nutrition */}
        <Link to="/nutrition" style={{ color: "inherit" }}>
          <div style={{ background: "var(--surface)", borderRadius: 14, padding: "10px 12px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 3 }}>
              <TbMeat size={13} /> Nutrition
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
              {score.proteinPct >= 100 ? "On target" : `${score.proteinPct}% protein`}
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Fuel + Calendar quick links — secondary tier: flatter and more
          translucent than the primary ring/hero above, via color-mix on
          --surface rather than a hardcoded rgba (stays correct in both
          themes). No shadow, by design — that flatness is what signals
          "behind" the elevated primary cards. */}
      <motion.div {...cascade(5)} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Link to="/fuel" style={{ color: "inherit" }}>
          <div style={{
            background: "color-mix(in srgb, var(--surface) 55%, transparent)",
            border: "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
            borderRadius: 14, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8,
          }}>
            <TbGasStation size={16} style={{ color: "var(--accent)" }} />
            <span style={{ fontWeight: 700, fontSize: 13 }}>Fuel</span>
          </div>
        </Link>
        <Link to="/calendar" style={{ color: "inherit" }}>
          <div style={{
            background: "color-mix(in srgb, var(--surface) 55%, transparent)",
            border: "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
            borderRadius: 14, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8,
          }}>
            <TbCalendar size={16} style={{ color: "var(--accent)" }} />
            <span style={{ fontWeight: 700, fontSize: 13 }}>Calendar</span>
          </div>
        </Link>
      </motion.div>

      {/* Motivation quote — tap card or shuffle button to draw a new one. */}
      <motion.div {...cascade(6)}>
        <HomeQuoteCard />
      </motion.div>

      <SisyphusOverlay open={sisyphusOpen} onClose={() => setSisyphusOpen(false)} />
    </div>
  );
}

// Last 7 days as small dots, colored by discipline score — a glanceable
// streak strip that links to the full calendar for detail/edit.
function MiniWeekStrip() {
  const t = useTokens();
  const waterGoal = useSetting("waterGoalMl");
  const proteinTarget = useSetting("proteinTargetG");
  const now = new Date();
  const cells = useMonthScores(now.getFullYear(), now.getMonth(), waterGoal, proteinTarget);
  const todayNum = now.getDate();
  const last7 = cells.filter((c) => {
    const n = Number(c.date.slice(-2));
    return n <= todayNum && n > todayNum - 7;
  });

  return (
    <Link to="/calendar" style={{ color: "inherit" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface)", borderRadius: 12, padding: "8px 12px" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)" }}>Last 7 days</span>
        <div style={{ display: "flex", gap: 5 }}>
          {last7.map((c) => (
            <div key={c.date} title={c.date} style={{
              width: 16, height: 16, borderRadius: 5,
              background: c.hasAny ? (c.score >= 75 ? t.teal : c.score >= 40 ? t.gold : "#ff5c7a") : "var(--border)",
              border: c.isToday ? `2px solid ${t.accent}` : "none",
            }} />
          ))}
        </div>
        <TbChevronRight size={14} style={{ color: "var(--ink-soft)" }} />
      </div>
    </Link>
  );
}

function Pill({ done, label, icon }: { done: boolean; label: string; icon: React.ReactNode }) {
  // Not-done pills used to render as grey ghost text at 0.6 opacity, which read
  // as "app broken" at 6am on a fresh day. Now they carry a subtle red outline
  // (1px accent border, transparent bg) so the ring at 0% looks like anticipation,
  // not an error state.
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600,
      padding: "3px 8px", borderRadius: 999,
      color: done ? "var(--teal)" : "var(--accent)",
      border: done ? "1px solid transparent" : "1px solid var(--ember-inner)",
      background: done ? "rgba(18,179,161,0.10)" : "transparent",
      opacity: done ? 1 : 0.75,
    }}>
      {icon} {label} {done && <TbCheck size={11} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEVEL BADGE — compact XP chip below the discipline ring
// ─────────────────────────────────────────────────────────────────────────────
function LevelBadge() {
  const { totalXP, level, next, progress } = useXP();
  if (totalXP === 0) return null; // hide on fresh install until first XP earned
  const xpToNext = next ? next.xpRequired - level.xpRequired : 0;
  const xpInLevel = next ? totalXP - level.xpRequired : 0;
  // Secondary tier, same flatter/translucent treatment as the fuel/calendar
  // row below the ring — color-mix over --surface/--ember-inner instead of
  // solid fills, so it reads as sitting behind the elevated primary cards.
  return (
    <div style={{ marginTop: 10, display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: "color-mix(in srgb, var(--surface) 50%, transparent)", borderRadius: 24,
        border: "1px solid color-mix(in srgb, var(--ember-inner) 70%, transparent)",
        padding: "3px 10px 3px 7px",
      }}>
        <span style={{
          fontFamily: '"Cinzel", serif', fontWeight: 800, fontSize: 10,
          color: "var(--accent)", letterSpacing: "0.05em",
        }}>Lv.{level.level}</span>
        <span style={{ fontSize: 10, color: "var(--ink-soft)", letterSpacing: "0.03em" }}>
          {level.name}
        </span>
      </div>
      {next && (
        <div style={{ width: 90, height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", background: "var(--accent)", borderRadius: 2,
            width: `${Math.round(progress * 100)}%`,
            transition: "width 600ms ease-out",
          }} />
        </div>
      )}
      {next && (
        <div style={{ fontSize: 9, color: "var(--ink-soft)", opacity: 0.6 }}>
          {xpInLevel} / {xpToNext} XP → {next.name}
        </div>
      )}
    </div>
  );
}
