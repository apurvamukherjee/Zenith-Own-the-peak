import { App } from "antd";
import { motion } from "framer-motion";
import { TbFlame, TbShare, TbDroplet, TbMeat, TbBarbell, TbMoon } from "react-icons/tb";
import { Rings } from "../../components/ui/Rings";
import { Embers } from "../../components/ui/Hero";
import { AnimatedNumber } from "../../components/AnimatedNumber";
import { useSetting } from "../../hooks/useSettings";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { shareText } from "../../lib/saveFile";
import { useTodayScore, useStreak, useLast7, useTrainingToday } from "../dashboard/useHomeData";
import "./glance.css";

const PILLARS = [
  { key: "water", label: "Water", icon: TbDroplet, color: "#6ea2ff" },
  { key: "protein", label: "Protein", icon: TbMeat, color: "#ff6b3d" },
  { key: "train", label: "Train", icon: TbBarbell, color: "#ff2740" },
  { key: "sleep", label: "Sleep", icon: TbMoon, color: "#f6b93b" },
] as const;

// Screenshot-friendly "today at a glance" card — fixed brand colours (not
// theme tokens) so a shared image looks the same whatever theme it came from.
export function GlancePage() {
  const { message } = App.useApp();
  const reduced = useReducedMotion();
  const name = String(useSetting("name"));
  const waterGoal = Number(useSetting("waterGoalMl"));
  const proteinTarget = Number(useSetting("proteinTargetG"));
  const score = useTodayScore(waterGoal, proteinTarget) ?? { score: 0, waterPct: 0, sessionDone: false, sleepLogged: false, proteinPct: 0 };
  const streak = useStreak();
  const week = useLast7(waterGoal, proteinTarget);
  const training = useTrainingToday();
  const rest = training !== undefined && !training.day;
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
  const pct = { water: score.waterPct, protein: score.proteinPct, train: score.sessionDone || rest ? 100 : 0, sleep: score.sleepLogged ? 100 : 0 };

  async function share() {
    const text = `Zenith — ${today}\nDiscipline ${score.score}% · ${streak}-day streak · ${name}`;
    try {
      if (await shareText("Zenith", text) === "copied") message.success("Copied to clipboard");
    } catch (err) {
      message.error(`Couldn't share: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return (
    <div className="gl-page">
      <motion.article className="gl-card" initial={reduced ? false : { opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 24 }}>
        <div className="gl-glow" aria-hidden />
        <Embers />
        <div className="gl-date">{today}</div>
        <div className="gl-name display">{name}</div>

        <div className="gl-rings">
          <Rings size={210} stroke={13} gap={4} reduced={reduced}
            rings={PILLARS.map((p) => ({ key: p.key, pct: pct[p.key], color: p.color }))}>
            <div className="gl-score display"><AnimatedNumber value={score.score} /><small>%</small></div>
            <div className="gl-score__label">discipline</div>
          </Rings>
        </div>

        <div className="gl-pillars">
          {PILLARS.map((p) => (
            <span key={p.key} className={pct[p.key] >= 100 ? "is-done" : ""} style={{ color: p.color }}>
              <p.icon size={14} /><em>{p.label}</em>
            </span>
          ))}
        </div>

        <div className="gl-streak"><TbFlame size={22} /> <AnimatedNumber value={streak} />-day streak</div>
        <div className="gl-week" aria-label="Last 7 days">
          {week.map((d) => <i key={d.date} className={!d.hasAny ? "" : d.score >= 75 ? "is-high" : d.score >= 40 ? "is-mid" : "is-low"} />)}
        </div>

        <div className="gl-brand">
          <img src="/logo-mark.png" alt="" width={14} height={14} />
          ZENITH · OWN THE PEAK
        </div>
      </motion.article>

      <button type="button" className="z-btn z-btn--solid gl-share" onClick={share}><TbShare size={17} /> Share</button>
    </div>
  );
}
