import { useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { App } from "antd";
import { motion } from "framer-motion";
import {
  TbFlame, TbAlertTriangle, TbDroplet, TbMoon, TbMeat, TbBook2,
  TbAdjustments, TbMountain, TbSparkles, TbX, TbSnowflake, TbArrowRight,
} from "react-icons/tb";
import { addWater } from "../water/useWater";
import { setSetting } from "../../hooks/useSettings";
import { spendStreakFreeze } from "../../lib/streak.utils";
import { todayKey } from "../../lib/date.utils";
import { hapticLight, hapticSuccess } from "../../lib/haptics";
import type { Move, MoveKind } from "./nextMoves";

const META: Record<MoveKind, { icon: ReactNode; color: string; eyebrow: string }> = {
  streak: { icon: <TbFlame size={20} />, color: "var(--danger)", eyebrow: "Protect it" },
  idle: { icon: <TbAlertTriangle size={20} />, color: "var(--danger)", eyebrow: "Wake up" },
  water: { icon: <TbDroplet size={20} />, color: "var(--info)", eyebrow: "Hydrate" },
  sleep: { icon: <TbMoon size={20} />, color: "var(--gold)", eyebrow: "Recover" },
  protein: { icon: <TbMeat size={20} />, color: "var(--teal)", eyebrow: "Fuel" },
  study: { icon: <TbBook2 size={20} />, color: "var(--success)", eyebrow: "Learn" },
  review: { icon: <TbAdjustments size={20} />, color: "var(--accent)", eyebrow: "Tune up" },
  summit: { icon: <TbMountain size={20} />, color: "var(--gold)", eyebrow: "Summit" },
  steady: { icon: <TbSparkles size={20} />, color: "var(--success)", eyebrow: "Up next" },
};

interface Props {
  moves: Move[];
  freezeAvailable: boolean;
  reduced: boolean;
}

// Keyed on the move set: scroll-snap re-snaps to the *same element* when
// cards are inserted before it, so a deck whose contents changed would
// otherwise open mid-stack. A remount also replays the entrance, which is
// the right cue that the suggestions changed.
export function NextMoveDeck(props: Props) {
  return <Deck key={props.moves.map((m) => m.kind).join()} {...props} />;
}

function Deck({ moves, freezeAvailable, reduced }: Props) {
  const [index, setIndex] = useState(0);
  return (
    <section aria-label="Up next" className="hb-deck">
      <div className="hb-deck__head">
        <span className="gothic-eyebrow">Up next</span>
        {moves.length > 1 && (
          <div className="hb-deck__dots" aria-hidden>
            {moves.map((m, i) => <i key={m.kind} className={i === index ? "is-on" : ""} />)}
          </div>
        )}
      </div>
      <div
        className="hb-deck__track"
        onScroll={(e) => {
          const el = e.currentTarget;
          const card = el.firstElementChild as HTMLElement | null;
          if (card) setIndex(Math.round(el.scrollLeft / (card.offsetWidth + 10)));
        }}
      >
        {moves.map((m, i) => (
          <motion.div key={m.kind} className={`hb-move${moves.length === 1 ? " is-solo" : ""}`}
            style={{ "--c": META[m.kind].color } as CSSProperties}
            initial={reduced ? false : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.08, type: "spring", stiffness: 240, damping: 26 }}>
            <div className="hb-move__glow" aria-hidden />
            <div className="hb-move__icon">{META[m.kind].icon}</div>
            <div className="hb-move__body">
              <div className="hb-move__eyebrow">{META[m.kind].eyebrow}</div>
              <div className="hb-move__title">{m.title}</div>
              <div className="hb-move__detail">{m.detail}</div>
              <MoveActions kind={m.kind} freezeAvailable={freezeAvailable} />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function MoveActions({ kind, freezeAvailable }: { kind: MoveKind; freezeAvailable: boolean }) {
  const { message } = App.useApp();

  async function water(ml: number) {
    await addWater(ml);
    void hapticLight();
    message.success(`+${ml}ml`);
  }
  async function freeze() {
    const ok = await spendStreakFreeze(todayKey());
    if (ok) { void hapticSuccess(); message.success("Streak freeze used for today"); }
    else message.info("Freeze already used this week");
  }

  switch (kind) {
    case "streak":
      return (
        <div className="hb-move__actions">
          <motion.button whileTap={{ scale: 0.94 }} className="z-btn z-btn--solid" onClick={() => water(500)}>
            <TbDroplet size={15} /> +500ml
          </motion.button>
          {freezeAvailable && (
            <motion.button whileTap={{ scale: 0.94 }} className="z-btn" onClick={freeze}>
              <TbSnowflake size={15} /> Use freeze
            </motion.button>
          )}
        </div>
      );
    case "water":
      return (
        <div className="hb-move__actions">
          {[250, 500].map((ml) => (
            <motion.button key={ml} whileTap={{ scale: 0.94 }} className={`z-btn${ml === 250 ? " z-btn--solid" : ""}`} onClick={() => water(ml)}>
              +{ml}ml
            </motion.button>
          ))}
        </div>
      );
    case "review":
      return (
        <div className="hb-move__actions">
          <Link to="/settings?s=targets" className="z-btn z-btn--solid">Review targets</Link>
          <button className="z-btn z-btn--ghost" aria-label="Dismiss" onClick={() => setSetting("reviewNudgeDone", 1)}><TbX size={15} /></button>
        </div>
      );
    case "summit":
      return null;
    default: {
      const link: Record<string, [string, string]> = {
        idle: ["/quick", "Log something"],
        sleep: ["/sleep", "Log sleep"],
        protein: ["/nutrition", "Log a meal"],
        study: ["/study", "Start studying"],
        steady: ["/calendar", "Plan the day"],
      };
      const [to, label] = link[kind];
      return (
        <div className="hb-move__actions">
          <Link to={to} className="z-btn z-btn--solid">{label} <TbArrowRight size={15} /></Link>
        </div>
      );
    }
  }
}
