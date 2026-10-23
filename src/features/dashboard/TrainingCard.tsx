import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TbPlayerPlayFilled, TbStarFilled, TbClock, TbStack2, TbCalendarEvent, TbZzz } from "react-icons/tb";
import { ColdIcon } from "../../components/ColdIcon";
import { TrainingHeroBg, SetsBar } from "./TrainingHeroArt";
import type { TrainingToday } from "./useHomeData";
import { MUSCLE_LABELS } from "../../config/exerciseLibrary";

const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function TrainingCard({ t, rocky }: { t: TrainingToday | undefined; rocky: boolean }) {
  if (!t) return <div className="hb-train hb-train--loading" />;

  if (!t.day) {
    const tomorrow = t.next && t.next.weekday === (new Date().getDay() + 1) % 7;
    return (
      <Link to="/planner" className="hb-train hb-train--rest">
        <TrainingHeroBg />
        <div className="hb-train__content">
          <div className="hb-train__eyebrow"><TbZzz size={14} /> Rest day</div>
          <div className="hb-train__title display">Recovery</div>
          <p className="hb-train__copy">Muscle is built between sessions. Eat, hydrate, sleep.</p>
          {t.next && (
            <div className="hb-train__chips">
              <span className="hb-chip"><TbCalendarEvent size={13} /> Next: {t.next.name} · {tomorrow ? "Tomorrow" : WEEKDAY[t.next.weekday]}</span>
            </div>
          )}
        </div>
      </Link>
    );
  }

  const done = t.totalSets > 0 && t.doneSets >= t.totalSets;
  const started = t.doneSets > 0;
  const minLeft = t.totalSets > 0 ? Math.round(t.estMin * (1 - t.doneSets / t.totalSets)) : t.estMin;

  return (
    <Link to="/workout" className={`hb-train${done ? " is-done" : ""}`}>
      <TrainingHeroBg />
      <div className="hb-train__content">
        <div className="hb-train__eyebrow">Today's training</div>
        <div className="hb-train__title display">
          {t.day.name}
          {rocky && <span title="Rocky Mode — 40+ sets today" aria-label="Rocky Mode" className="hb-train__rocky"><TbStarFilled size={16} /></span>}
        </div>
        {t.muscles.length > 0 && (
          <div className="hb-train__chips">
            {t.muscles.slice(0, 4).map((m) => <span key={m} className="hb-chip">{MUSCLE_LABELS[m]}</span>)}
            {t.muscles.length > 4 && <span className="hb-chip">+{t.muscles.length - 4}</span>}
          </div>
        )}
        <div className="hb-train__stats">
          <span><TbStack2 size={14} /> {t.exercises} exercises · {t.totalSets} sets</span>
          {!done && t.estMin > 0 && <span><TbClock size={14} /> ~{minLeft} min</span>}
        </div>
        {t.totalSets > 0 && (done ? (
          <div className="hb-train__done"><ColdIcon glyph="peak" size={16} /> All done — peak conquered</div>
        ) : (
          <div className="hb-train__progress">
            <div style={{ flex: 1 }}>
              <SetsBar done={t.doneSets} total={t.totalSets} />
              <div className="hb-train__count">{t.doneSets}/{t.totalSets} sets</div>
            </div>
            <motion.span className="hb-train__cta" whileTap={{ scale: 0.92 }}>
              <TbPlayerPlayFilled size={14} /> {started ? "Resume" : "Start"}
            </motion.span>
          </div>
        ))}
      </div>
    </Link>
  );
}
