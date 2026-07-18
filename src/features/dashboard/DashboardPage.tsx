import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Progress, Button, App } from "antd";
import { TbFlame, TbChevronRight, TbDroplet, TbMoon, TbBarbell, TbBook2, TbPlus, TbSettings, TbShare2, TbMeat, TbGasStation, TbCalendar, TbSun, TbSunrise, TbSunset, TbMoonStars, TbCoffee } from "react-icons/tb";
import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
import { AnimatedNumber } from "../../components/AnimatedNumber";
import { SisyphusOverlay } from "../../components/SisyphusOverlay";
import { HomeQuoteCard } from "../../components/HomeQuoteCard";
import { db } from "../../db/db";
import { useTokens } from "../../hooks/useTokens";
import { useSetting, setSetting } from "../../hooks/useSettings";
import { useTodayWater, useWorkoutToday, addWater } from "../water/useWater";
import { useTodaySession, useTodayDayId } from "../gym/useGym";
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
  const name = useSetting("name");
  const waterGoal = useSetting("waterGoalMl");
  const proteinTarget = useSetting("proteinTargetG");
  const { total: waterMl } = useTodayWater();
  const trained = useWorkoutToday();
  const sleep = useRecentSleep(2);
  const lastSleep = [...sleep].reverse().find(Boolean);
  const todayDayId = useTodayDayId();
  const todaySession = useTodaySession(todayDayId);

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

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 10,
      padding: "12px 16px 12px", minHeight: "calc(100dvh - 100px)",
    }}>
      {/* Header row: greeting + streak + settings */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
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
              streak{freezeAvailable && <span style={{ marginLeft: 4, fontSize: 8, opacity: 0.7 }}>❄️1</span>}
            </div>
          </div>
          <Link to="/glance"><Button type="text" size="small" icon={<TbShare2 size={18} />} aria-label="Share card" /></Link>
          <Link to="/settings"><Button type="text" size="small" icon={<TbSettings size={18} />} aria-label="Settings" /></Link>
        </div>
      </div>

      {/* Streak-in-danger banner */}
      {streakInDanger && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: "linear-gradient(135deg, #ff2740, #6e0f1c)", borderRadius: 12,
            padding: "10px 12px", color: "#fff" }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <TbFlame /> Streak at risk — protect it now
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
            <Button size="small" type="text" onClick={() => setSetting("reviewNudgeDone", 1)}>✕</Button>
          </div>
        </motion.div>
      )}

      {/* Center: discipline ring */}
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ textAlign: "center", flex: "0 0 auto", padding: "8px 0", userSelect: "none" }}>
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
          <Progress type="dashboard" percent={score.score} size={120} strokeColor={t.accent} strokeWidth={8}
            format={() => (
              <div>
                <div className="display" style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}><AnimatedNumber value={score.score} />%</div>
                <div style={{ fontSize: 9, color: "var(--ink-soft)", marginTop: 1 }}>discipline</div>
              </div>
            )} />
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
      <MiniWeekStrip />

      {/* Training hero card */}
      <Link to="/workout" style={{ color: "inherit", display: "block", flex: "0 0 auto" }}>
        <div className="hero-grad metal-shadow ember-corner" style={{
          borderRadius: 16, padding: "12px 16px", position: "relative", overflow: "hidden",
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
                  <span title="Rocky Mode — 40+ sets today" style={{ marginLeft: 6, fontSize: 16, verticalAlign: "-1px" }} aria-label="Rocky Mode">
                    ⭐
                  </span>
                )}
              </div>
            </div>
            <TbChevronRight size={20} style={{ color: "rgba(255,255,255,0.7)" }} />
          </div>
        </div>
      </Link>

      {/* 2x2 compact grid: water, sleep, study, protein */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flex: "0 0 auto", marginTop: 8 }}>
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
      </div>

      {/* Fuel + Calendar quick links */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Link to="/fuel" style={{ color: "inherit" }}>
          <div style={{ background: "var(--surface)", borderRadius: 14, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <TbGasStation size={16} style={{ color: "var(--accent)" }} />
            <span style={{ fontWeight: 700, fontSize: 13 }}>Fuel</span>
          </div>
        </Link>
        <Link to="/calendar" style={{ color: "inherit" }}>
          <div style={{ background: "var(--surface)", borderRadius: 14, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <TbCalendar size={16} style={{ color: "var(--accent)" }} />
            <span style={{ fontWeight: 700, fontSize: 13 }}>Calendar</span>
          </div>
        </Link>
      </div>

      {/* Motivation quote — tap card or shuffle button to draw a new one. */}
      <HomeQuoteCard />

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
      {icon} {label} {done && "✓"}
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
  return (
    <div style={{ marginTop: 10, display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: "var(--surface)", borderRadius: 24,
        border: "1px solid var(--ember-inner)",
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
