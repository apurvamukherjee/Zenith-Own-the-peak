import type { CSSProperties, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { App } from "antd";
import { motion } from "framer-motion";
import { TbDroplet, TbMeat, TbMoon, TbMoonStars, TbBook2, TbFlame, TbPlus, TbArrowUpRight } from "react-icons/tb";
import { AnimatedNumber } from "../../components/AnimatedNumber";
import { Liquid } from "../../components/ui/Liquid";
import { pressable } from "../../lib/a11y";
import { fmtDuration, prettyDate, todayKey } from "../../lib/date.utils";
import { hapticLight, hapticSuccess } from "../../lib/haptics";
import { addWater, type WaterStatus } from "../water/useWater";
import { toggleHabitToday } from "../habits/useHabits";
import { habitIconFor } from "../habits/habitIcons";
import type { HabitDto, SleepDto } from "../../db/types";

function TileHead({ icon, label, to, color }: { icon: ReactNode; label: string; to: string; color: string }) {
  return (
    <div className="hb-tile__head" style={{ "--c": color } as CSSProperties}>
      <span className="hb-tile__icon">{icon}</span>
      <span className="hb-tile__label">{label}</span>
      <Link to={to} className="hb-tile__open" aria-label={`Open ${label}`} onClick={(e) => e.stopPropagation()}>
        <TbArrowUpRight size={14} />
      </Link>
    </div>
  );
}

const PACE_COPY: Record<WaterStatus, string> = {
  done: "Goal reached", "on-track": "On pace", behind: "Slightly behind", "way-behind": "Way behind",
};

export function WaterTile({ ml, goal, status, reduced }: { ml: number; goal: number; status: WaterStatus; reduced: boolean }) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const pct = goal > 0 ? Math.min(100, (ml / goal) * 100) : 0;
  const done = pct >= 100;

  async function add(amount: number) {
    await addWater(amount);
    if (ml < goal && ml + amount >= goal) { void hapticSuccess(); message.success("Hydration goal reached"); }
    else { void hapticLight(); message.success(`+${amount}ml`); }
  }

  return (
    <div className={`hb-tile hb-water${done ? " is-done" : ""}`} {...pressable(() => navigate("/water"))} aria-label="Water">
      <Liquid pct={pct} color={done ? "var(--success)" : "var(--info)"} reduced={reduced} />
      <div className="hb-water__marks" aria-hidden>
        {[0.75, 0.5, 0.25].map((f) => (
          <span key={f} style={{ bottom: `${f * 100}%` }}>{((goal * f) / 1000).toFixed(1)}L</span>
        ))}
      </div>
      <TileHead icon={<TbDroplet size={14} />} label="Water" to="/water" color="var(--info)" />
      <div className="hb-water__value">
        <span className="display"><AnimatedNumber value={ml / 1000} decimals={1} /></span>
        <small>/ {(goal / 1000).toFixed(1)} L</small>
      </div>
      <div className={`hb-water__pace is-${status}`}>{PACE_COPY[status]}</div>
      <div className="hb-water__actions">
        {[250, 500].map((a) => (
          <motion.button key={a} whileTap={{ scale: 0.9 }} className="hb-glassbtn"
            aria-label={`Add ${a}ml water`}
            onClick={(e) => { e.stopPropagation(); void add(a); }}>
            <TbPlus size={13} />{a}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export function MacrosTile({ protein, carbs, fat, kcal, targets }: {
  protein: number; carbs: number; fat: number; kcal: number;
  targets: { protein: number; carbs: number; fat: number; kcal: number };
}) {
  const navigate = useNavigate();
  const bars = [
    { k: "P", v: finite(protein), t: targets.protein, c: "var(--teal)" },
    { k: "C", v: finite(carbs), t: targets.carbs, c: "var(--gold)" },
    { k: "F", v: finite(fat), t: targets.fat, c: "var(--info)" },
  ];
  return (
    <div className="hb-tile" {...pressable(() => navigate("/nutrition"))} aria-label="Nutrition">
      <TileHead icon={<TbMeat size={14} />} label="Protein" to="/nutrition" color="var(--teal)" />
      <div className="hb-tile__big">
        <span className="display"><AnimatedNumber value={Math.round(protein)} /></span>
        <small>/ {targets.protein}g</small>
      </div>
      <div className="hb-macros">
        {bars.map((b, i) => (
          <div key={b.k} className="hb-macros__row">
            <span>{b.k}</span>
            <div className="hb-macros__track">
              <motion.i style={{ background: b.c }}
                initial={{ width: 0 }} animate={{ width: `${b.t > 0 ? Math.min(100, (b.v / b.t) * 100) : 0}%` }}
                transition={{ type: "spring", stiffness: 70, damping: 16, delay: 0.2 + i * 0.08 }} />
            </div>
          </div>
        ))}
      </div>
      <div className="hb-tile__foot">{Math.round(kcal)} / {targets.kcal} kcal</div>
    </div>
  );
}

const finite = (n: number) => (Number.isFinite(n) ? n : 0);

function minutesUntil(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date();
  let diff = h * 60 + m - (now.getHours() * 60 + now.getMinutes());
  if (diff < -120) diff += 24 * 60;
  return diff;
}

export function SleepTile({ last, targetMin, bedtime, hour }: { last: SleepDto | undefined; targetMin: number; bedtime: string; hour: number }) {
  const navigate = useNavigate();
  const fresh = last?.date === todayKey();
  const pct = last && fresh ? Math.min(100, (last.durationMin / targetMin) * 100) : 0;
  const untilBed = hour >= 17 ? minutesUntil(bedtime) : null;
  return (
    <div className={`hb-tile${last && !fresh ? " is-stale" : ""}`} {...pressable(() => navigate("/sleep"))} aria-label="Sleep">
      <TileHead icon={<TbMoon size={14} />} label="Sleep" to="/sleep" color="var(--gold)" />
      <div className="hb-tile__big">
        <span className="display">{last ? fmtDuration(last.durationMin) : "—"}</span>
      </div>
      <div className="hb-sleepbar"><motion.i initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 70, damping: 16, delay: 0.3 }} /></div>
      <div className="hb-tile__foot">
        {untilBed !== null && untilBed > 0
          ? <><TbMoonStars size={12} /> Bed in {fmtDuration(untilBed)}</>
          : fresh ? `Last night · target ${fmtDuration(targetMin)}` : last ? `Last logged ${prettyDate(last.date)}` : "Not logged yet"}
      </div>
    </div>
  );
}

export function StudyTile({ next, minutes }: { next: string | null; minutes: number }) {
  const navigate = useNavigate();
  return (
    <div className="hb-tile" {...pressable(() => navigate("/study"))} aria-label="Study">
      <TileHead icon={<TbBook2 size={14} />} label="Learn" to="/study" color="var(--success)" />
      <div className="hb-study__next">{next ?? "Add a learning path"}</div>
      <div className="hb-tile__foot">{minutes > 0 ? `${minutes} min today` : next ? "Up next" : "Nothing queued"}</div>
    </div>
  );
}

export function HabitsTile({ habits }: { habits: (HabitDto & { done: boolean })[] }) {
  const navigate = useNavigate();
  const done = habits.filter((h) => h.done).length;
  return (
    <div className="hb-tile" {...pressable(() => navigate("/habits"))} aria-label="Habits">
      <TileHead icon={<TbFlame size={14} />} label="Habits" to="/habits" color="var(--accent)" />
      {habits.length === 0 ? (
        <>
          <div className="hb-study__next">Stack a habit</div>
          <div className="hb-tile__foot">Trigger → action chains</div>
        </>
      ) : (
        <>
          <div className="hb-tile__big"><span className="display">{done}</span><small>/ {habits.length} today</small></div>
          <div className="hb-habits">
            {habits.slice(0, 6).map((h) => {
              const Icon = habitIconFor(h.icon);
              return (
                <motion.button key={h.id} whileTap={{ scale: 0.82 }}
                  className={`hb-habit${h.done ? " is-done" : ""}`} style={{ "--c": h.color } as CSSProperties}
                  aria-label={`${h.name}${h.done ? " (done)" : ""}`} aria-pressed={h.done}
                  onClick={async (e) => {
                    e.stopPropagation();
                    const on = await toggleHabitToday(h.id!);
                    void (on ? hapticSuccess() : hapticLight());
                  }}>
                  <Icon size={15} />
                </motion.button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
