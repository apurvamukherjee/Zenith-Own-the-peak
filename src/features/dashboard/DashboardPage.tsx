import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "antd";
import { motion, useScroll, useTransform, type MotionProps } from "framer-motion";
import {
  TbFlame, TbSettings, TbShare2, TbTrophy, TbSun, TbSunrise, TbSunset, TbMoon, TbMoonStars, TbCoffee,
  TbCalendar, TbChartLine, TbGasStation, TbWallet, TbAward, TbSparkles, TbQuote, TbSnowflake,
} from "react-icons/tb";
import type { IconType } from "react-icons";
import { HomeQuoteCard } from "../../components/HomeQuoteCard";
import { AvatarFrame } from "../../components/AvatarFrame";
import { Skeleton } from "../../components/Skeleton";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useSetting, setSetting } from "../../hooks/useSettings";
import { useTodayWater, computeStatus } from "../water/useWater";
import { useHabitsToday } from "../habits/useHabits";
import { fmtDuration, todayKey } from "../../lib/date.utils";
import { isDevilsHour, isZenithHour, isPalindromeDate, isHardcoreActive, isSabbathActive } from "../../lib/easterEggs";
import { SummitCard, type Pillar } from "./SummitCard";
import { NextMoveDeck } from "./NextMoveDeck";
import { TrainingCard } from "./TrainingCard";
import { ArcDrillCard } from "../winterArc/ArcDrillCard";
import { WaterTile, MacrosTile, SleepTile, StudyTile, HabitsTile } from "./BentoTiles";
import { TodayAgenda } from "./TodayAgenda";
import { Rings } from "../../components/ui/Rings";
import { buildMoves } from "./nextMoves";
import {
  useClock, useTodayScore, useStreak, useFreezeAvailable, useLast7, useTrainingToday, useTodayMacros,
  useLastSleep, useStudyToday, useTodayAgenda, useSetsTodayCount,
} from "./useHomeData";
import "./home.css";

interface Greeting { text: string; icon: IconType; tagline: string }

// `overrides` lets easter eggs replace the base greeting: 3:33 AM → devil's
// hour, noon → zenith hour, palindrome dates → symmetry note, plus the
// Hardcore/Sabbath modes.
function greeting(h: number, o: { devilsHour: boolean; zenithHour: boolean; palindrome: boolean; hardcore: boolean; sabbath: boolean }): Greeting {
  if (o.devilsHour) return { text: "Devil's hour", icon: TbMoonStars, tagline: "What are you doing awake?" };
  if (o.zenithHour) return { text: "Zenith hour", icon: TbSun, tagline: "The sun is at its peak. So are you." };
  const base: Greeting =
    h >= 5 && h < 8 ? { text: "Rise & shine", icon: TbSunrise, tagline: "Fresh day, fresh peak" }
    : h >= 8 && h < 12 ? { text: "Good morning", icon: TbCoffee, tagline: "Fuel up, own the day" }
    : h >= 12 && h < 15 ? { text: "Good afternoon", icon: TbSun, tagline: "Push through the middle" }
    : h >= 15 && h < 18 ? { text: "Steady on", icon: TbSun, tagline: "Second wind time" }
    : h >= 18 && h < 21 ? { text: "Good evening", icon: TbSunset, tagline: "Finish strong" }
    : h >= 21 ? { text: "Wind down", icon: TbMoon, tagline: "Recovery is where growth happens" }
    : { text: "Late night", icon: TbMoonStars, tagline: "Sleep is your edge" };
  if (o.hardcore) return { ...base, text: base.text.toUpperCase() + " — TRAIN", tagline: "GRIND ENGAGED" };
  if (o.sabbath) return { ...base, tagline: "Rest is a discipline too" };
  if (o.palindrome) return { ...base, tagline: `${base.tagline} · Palindrome day, fittingly symmetric` };
  return base;
}

const SHORTCUTS: { to: string; label: string; icon: IconType; c: string }[] = [
  // ponytail: dated to the 2026 arc, like ARC_START — drops off after January.
  ...(todayKey() < "2027-02-01" ? [{ to: "/arc", label: "Arc", icon: TbSnowflake, c: "var(--info)" }] : []),
  { to: "/calendar", label: "Calendar", icon: TbCalendar, c: "var(--accent)" },
  { to: "/progress", label: "Progress", icon: TbChartLine, c: "var(--teal)" },
  { to: "/fuel", label: "Fuel", icon: TbGasStation, c: "var(--gold)" },
  { to: "/expenses", label: "Spend", icon: TbWallet, c: "var(--success)" },
  { to: "/hall", label: "Hall", icon: TbAward, c: "var(--gold)" },
  { to: "/vault", label: "Vault", icon: TbSparkles, c: "var(--info)" },
  { to: "/quotes", label: "Quotes", icon: TbQuote, c: "var(--accent)" },
];

export function DashboardPage() {
  const reduced = useReducedMotion();
  const now = useClock();
  const hour = now.getHours();

  const name = String(useSetting("name"));
  const profilePic = String(useSetting("profilePic"));
  const equippedFrame = String(useSetting("equippedFrame"));
  const waterGoal = Number(useSetting("waterGoalMl"));
  const proteinTarget = Number(useSetting("proteinTargetG"));
  const carbTarget = Number(useSetting("carbTargetG"));
  const fatTarget = Number(useSetting("fatTargetG"));
  const kcalTarget = Number(useSetting("calorieTargetKcal"));
  const sleepTarget = Number(useSetting("sleepTargetMin"));
  const wakeHour = Number(useSetting("wakeHour"));
  const windowH = Number(useSetting("wakingWindowH"));
  const bedtime = String(useSetting("remBedtimeAt"));
  const hardcoreUntil = Number(useSetting("hardcoreUntil"));
  const sabbathUntil = Number(useSetting("sabbathUntil"));
  const eggReflectiveYear = String(useSetting("eggReflective") ?? "");
  const firstSeenAt = Number(useSetting("firstSeenAt"));
  const reviewNudgeDone = Number(useSetting("reviewNudgeDone"));

  const scoreQuery = useTodayScore(waterGoal, proteinTarget);
  const score = scoreQuery ?? { score: 0, waterPct: 0, sessionDone: false, sleepLogged: false, proteinPct: 0 };
  const streak = useStreak();
  const freezeAvailable = useFreezeAvailable();
  const week = useLast7(waterGoal, proteinTarget);
  const { total: waterMl } = useTodayWater();
  const training = useTrainingToday();
  const macros = useTodayMacros();
  const lastSleep = useLastSleep();
  const study = useStudyToday();
  const habits = useHabitsToday();
  const agenda = useTodayAgenda();
  const setsToday = useSetsTodayCount();

  // Egg #13 — auto-claim Reflective on a palindrome date, once per calendar year.
  useEffect(() => {
    if (!isPalindromeDate(now)) return;
    const yr = String(now.getFullYear());
    if (eggReflectiveYear !== yr) void setSetting("eggReflective", yr);
  }, [now, eggReflectiveYear]);

  const g = greeting(hour, {
    devilsHour: isDevilsHour(now), zenithHour: isZenithHour(now), palindrome: isPalindromeDate(now),
    hardcore: isHardcoreActive(hardcoreUntil), sabbath: isSabbathActive(sabbathUntil),
  });
  const GIcon = g.icon;

  const hasAnyWriteToday = score.waterPct > 0 || score.sessionDone || score.sleepLogged || score.proteinPct > 0;
  // "Rage meter": late in the day with a low score, the ring turns alarm.
  const urgent = hour >= 18 && score.score < 40;
  const critical = hour >= 21 && score.score < 15;
  const pace = computeStatus(waterMl, waterGoal, wakeHour, windowH);
  const sleptToday = lastSleep?.date === todayKey(now);

  const isRest = training !== undefined && !training.day;
  const pillars: Pillar[] = [
    { key: "water", label: "Water", pct: score.waterPct, to: "/water", value: `${(waterMl / 1000).toFixed(1)} / ${(waterGoal / 1000).toFixed(1)}L` },
    { key: "protein", label: "Protein", pct: score.proteinPct, to: "/nutrition", value: `${Math.round(macros.protein)} / ${proteinTarget}g` },
    {
      key: "train", label: "Training", pct: score.sessionDone || isRest ? 100 : 0, to: "/workout",
      value: isRest ? "Rest day" : !training || training.totalSets === 0 ? (score.sessionDone ? "Logged" : "—")
        : training.doneSets >= training.totalSets ? "Complete" : `${training.doneSets} / ${training.totalSets} sets`,
    },
    { key: "sleep", label: "Sleep", pct: score.sleepLogged ? 100 : 0, to: "/sleep", value: sleptToday && lastSleep ? fmtDuration(lastSleep.durationMin) : "Not logged" },
  ];

  const sevenDaysOld = firstSeenAt > 0 && Date.now() - firstSeenAt >= 7 * 86_400_000;
  const moves = buildMoves({
    hour, daySeed: todayKey(now).split("-").reduce((s, n) => s + Number(n), 0),
    score: score.score, streak, hasAnyWriteToday,
    trainedToday: score.sessionDone,
    waterMl, waterGoal, waterExpected: pace.expected,
    sleepLogged: score.sleepLogged, proteinG: macros.protein, proteinTarget,
    studyNext: study.next, studyMinToday: study.minutes,
    reviewNudge: sevenDaysOld && !reviewNudgeDone,
  });

  // `<main>` (AppShell) is the scroll container, not the window. Resolved in
  // a layout effect so useScroll's own subscribe effect (declared after)
  // already sees it on first scroll.
  const mainRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => { mainRef.current = document.querySelector("main"); }, []);
  const { scrollY } = useScroll({ container: mainRef });
  const headerY = useTransform(scrollY, [0, 200], [0, reduced ? 0 : 40], { clamp: true });
  const headerFade = useTransform(scrollY, [0, 140], [1, 0.2], { clamp: true });
  const compactOpacity = useTransform(scrollY, [190, 250], [0, 1], { clamp: true });
  const compactY = useTransform(scrollY, [190, 250], [-14, 0], { clamp: true });
  const compactEvents = useTransform(scrollY, (y) => (y > 220 ? "auto" : "none"));

  const rise = (i: number): MotionProps => reduced ? {} : {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring", stiffness: 210, damping: 26, delay: 0.04 + i * 0.06 },
  };

  return (
    <div className="home-grid hb-page">
      <div className="hb-compact-anchor home-full">
        <motion.div className="hb-compact" style={{ opacity: compactOpacity, y: compactY, pointerEvents: compactEvents }}
          onClick={() => mainRef.current?.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })}>
          <Rings size={30} stroke={3.5} reduced rings={[{ key: "s", pct: score.score, color: "var(--accent)" }]} />
          <div className="hb-compact__text">
            <b>{score.score}%</b> <span>discipline</span>
          </div>
          <span className="hb-compact__streak"><TbFlame size={15} /> {streak}</span>
        </motion.div>
      </div>

      <motion.header className="hb-header home-full" style={{ y: headerY, opacity: headerFade }}>
        <Link to="/settings" className="hb-avatar" aria-label="Profile and settings">
          <AvatarFrame frameId={equippedFrame}>
            <Avatar size={46} src={profilePic || undefined} className="avatar-grad">{name.charAt(0)}</Avatar>
          </AvatarFrame>
        </Link>
        <div className="hb-header__text">
          <motion.div key={g.text} className="hb-greet"
            initial={reduced ? false : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
            <GIcon size={13} /> <span>{g.text}</span>
          </motion.div>
          <h1 className="display">{name}</h1>
          <div className="hb-tagline">
            <b>{now.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</b> · {g.tagline}
          </div>
        </div>
        <nav className="hb-header__actions" aria-label="Shortcuts">
          <Link to="/leaderboard" className="hb-iconbtn" aria-label="Leaderboard"><TbTrophy size={19} /></Link>
          <Link to="/glance" className="hb-iconbtn" aria-label="Share card"><TbShare2 size={19} /></Link>
          <Link to="/settings" className="hb-iconbtn hb-iconbtn--spin" aria-label="Settings"><TbSettings size={19} /></Link>
        </nav>
      </motion.header>

      <div className="home-col">
        <motion.div {...rise(1)}>
          <SummitCard score={score.score} pillars={pillars} streak={streak} freezeAvailable={freezeAvailable}
            week={week} urgent={urgent} critical={critical} reduced={reduced} />
        </motion.div>
        <motion.div {...rise(2)}>
          <ArcDrillCard trainedToday={training?.muscles} />
        </motion.div>
        <motion.div {...rise(2)}>
          {scoreQuery && training
            ? <NextMoveDeck moves={moves} freezeAvailable={freezeAvailable} reduced={reduced} />
            : <Skeleton height={150} radius={22} />}
        </motion.div>
        <motion.div {...rise(3)}>
          <TrainingCard t={training} rocky={setsToday >= 40} />
        </motion.div>
      </div>

      <div className="home-col">
        <motion.div {...rise(4)} className="hb-bento">
          <WaterTile ml={waterMl} goal={waterGoal} status={pace.status} reduced={reduced} />
          <MacrosTile protein={macros.protein} carbs={macros.carbs} fat={macros.fat} kcal={macros.kcal}
            targets={{ protein: proteinTarget, carbs: carbTarget, fat: fatTarget, kcal: kcalTarget }} />
          <SleepTile last={lastSleep} targetMin={sleepTarget} bedtime={bedtime} hour={hour} />
          <StudyTile next={study.next} minutes={study.minutes} />
          <HabitsTile habits={habits ?? []} />
        </motion.div>
        <motion.div {...rise(5)}>
          <TodayAgenda items={agenda} />
        </motion.div>
        <motion.nav {...rise(6)} className="hb-shortcuts" aria-label="More">
          {SHORTCUTS.map((s) => (
            <Link key={s.to} to={s.to} className="hb-shortcut" style={{ "--c": s.c } as CSSProperties}>
              <span className="hb-shortcut__icon"><s.icon size={22} /></span>
              {s.label}
            </Link>
          ))}
        </motion.nav>
        <motion.div {...rise(7)}>
          <HomeQuoteCard />
        </motion.div>
      </div>
    </div>
  );
}
