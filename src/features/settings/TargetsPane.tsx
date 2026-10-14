import { useRef, type CSSProperties, type ReactNode } from "react";
import { Slider } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import { TbDroplet, TbDropletPlus, TbSunrise, TbMoon, TbMeat, TbBread, TbFlame, TbBolt, TbHourglass, TbMinus, TbPlus } from "react-icons/tb";
import { useSetting, setSetting, type SettingKey } from "../../hooks/useSettings";
import { fmtDuration } from "../../lib/date.utils";
import { hapticLight } from "../../lib/haptics";
import { useDraft } from "./useDraft";

interface DialProps {
  k: SettingKey;
  row: string;
  icon: ReactNode;
  color: string;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  hint?: (v: number) => string;
}

function TargetDial({ k, row, icon, color, label, min, max, step, format, hint }: DialProps) {
  const stored = Number(useSetting(k));
  const [value, setDraft] = useDraft(stored);
  const live = useRef(value);
  live.current = value;
  const dir = useRef(1);
  const hold = useRef<{ t: number | null; i: number | null }>({ t: null, i: null });

  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  const commit = (v: number) => { if (v !== stored) void setSetting(k, v); };
  const nudge = (d: 1 | -1) => {
    const next = clamp(live.current + d * step);
    if (next === live.current) return;
    dir.current = d;
    live.current = next;
    setDraft(next);
    void hapticLight();
  };
  // Tap = one step; hold = accelerate after 400 ms. Persist only on release.
  const start = (d: 1 | -1) => {
    nudge(d);
    hold.current.t = window.setTimeout(() => { hold.current.i = window.setInterval(() => nudge(d), 75); }, 400);
  };
  const stop = () => {
    if (hold.current.t !== null) window.clearTimeout(hold.current.t);
    if (hold.current.i !== null) window.clearInterval(hold.current.i);
    if (hold.current.t !== null) commit(live.current);
    hold.current = { t: null, i: null };
  };

  return (
    <div className="zs-dial" data-row={row} style={{ "--c": color } as CSSProperties}>
      <div className="zs-dial__head">
        <span className="z-ico z-ico--sm">{icon}</span>
        <span className="zs-dial__label">{label}</span>
        {hint && <span className="zs-dial__hint">{hint(value)}</span>}
      </div>
      <div className="zs-dial__main">
        <button type="button" className="zs-step" aria-label={`Decrease ${label}`} disabled={value <= min}
          onPointerDown={() => start(-1)} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); const v = clamp(value - step); setDraft(v); commit(v); } }}>
          <TbMinus size={18} />
        </button>
        <div className="zs-dial__value" aria-live="polite">
          <AnimatePresence mode="popLayout" initial={false} custom={dir.current}>
            <motion.span key={value} custom={dir.current}
              variants={{ in: (d: number) => ({ y: d * 18, opacity: 0 }), out: (d: number) => ({ y: d * -18, opacity: 0 }) }}
              initial="in" animate={{ y: 0, opacity: 1 }} exit="out"
              transition={{ type: "spring", stiffness: 500, damping: 34 }}>
              {format(value)}
            </motion.span>
          </AnimatePresence>
        </div>
        <button type="button" className="zs-step" aria-label={`Increase ${label}`} disabled={value >= max}
          onPointerDown={() => start(1)} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); const v = clamp(value + step); setDraft(v); commit(v); } }}>
          <TbPlus size={18} />
        </button>
      </div>
      <Slider className="zs-slider" min={min} max={max} step={step} value={value} tooltip={{ open: false }}
        aria-label={label}
        onChange={(v) => { dir.current = v > value ? 1 : -1; setDraft(v); }}
        onChangeComplete={commit} />
    </div>
  );
}

function MacroBalance() {
  const p = Number(useSetting("proteinTargetG"));
  const c = Number(useSetting("carbTargetG"));
  const f = Number(useSetting("fatTargetG"));
  const kcal = Number(useSetting("calorieTargetKcal"));
  const parts = [
    { k: "Protein", v: p * 4, color: "var(--teal)" },
    { k: "Carbs", v: c * 4, color: "var(--gold)" },
    { k: "Fat", v: f * 9, color: "var(--info)" },
  ];
  const total = parts.reduce((s, x) => s + x.v, 0);
  const scale = Math.max(total, kcal) || 1;
  const diff = total - kcal;
  return (
    <div className="zs-macro" data-row="calories-balance">
      <div className="zs-macro__bar">
        {parts.map((x) => (
          <motion.i key={x.k} style={{ background: x.color }} initial={false}
            animate={{ width: `${(x.v / scale) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        ))}
        <span className="zs-macro__target" style={{ left: `${(kcal / scale) * 100}%` }} />
      </div>
      <div className="zs-macro__legend">
        {parts.map((x) => (
          <span key={x.k}><i style={{ background: x.color }} />{x.k} {total ? Math.round((x.v / total) * 100) : 0}%</span>
        ))}
      </div>
      <div className={`zs-macro__verdict${Math.abs(diff) <= 100 ? " is-ok" : ""}`}>
        Macros add up to <b>{total.toLocaleString()} kcal</b>
        {Math.abs(diff) <= 100 ? " — matches your target." : diff > 0 ? ` — ${diff.toLocaleString()} over target.` : ` — ${(-diff).toLocaleString()} under target.`}
      </div>
    </div>
  );
}

const L = (ml: number) => `${+(ml / 1000).toFixed(2)} L`;
const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

export function TargetsPane() {
  const wake = Number(useSetting("wakeHour"));
  return (
    <>
      <div className="z-list-title">Hydration</div>
      <div className="zs-dials">
        <TargetDial k="waterGoalMl" row="water" icon={<TbDroplet size={15} />} color="var(--info)" label="Water goal"
          min={1000} max={6000} step={250} format={L} hint={(v) => `≈ ${Math.round(v / 250)} glasses`} />
        <TargetDial k="workoutBumpMl" row="bump" icon={<TbDropletPlus size={15} />} color="var(--info)" label="Training-day bonus"
          min={0} max={1500} step={250} format={(v) => (v ? `+${L(v)}` : "Off")} hint={() => "Added on days you lift"} />
        <TargetDial k="wakingWindowH" row="window" icon={<TbHourglass size={15} />} color="var(--info)" label="Hours awake"
          min={10} max={20} step={1} format={(v) => `${v} h`} hint={(v) => `Pace ends ${hh((wake + v) % 24)}`} />
      </div>

      <div className="z-list-title">Nutrition</div>
      <div className="zs-dials">
        <TargetDial k="proteinTargetG" row="protein" icon={<TbMeat size={15} />} color="var(--teal)" label="Protein"
          min={30} max={300} step={5} format={(v) => `${v} g`} />
        <TargetDial k="carbTargetG" row="carbs" icon={<TbBread size={15} />} color="var(--gold)" label="Carbs"
          min={0} max={700} step={10} format={(v) => `${v} g`} />
        <TargetDial k="fatTargetG" row="fat" icon={<TbFlame size={15} />} color="var(--info)" label="Fat"
          min={10} max={250} step={5} format={(v) => `${v} g`} />
        <TargetDial k="calorieTargetKcal" row="calories" icon={<TbBolt size={15} />} color="var(--accent)" label="Calories"
          min={1000} max={5000} step={50} format={(v) => `${v.toLocaleString()} kcal`} />
        <MacroBalance />
      </div>

      <div className="z-list-title">Sleep & rhythm</div>
      <div className="zs-dials">
        <TargetDial k="sleepTargetMin" row="sleep" icon={<TbMoon size={15} />} color="var(--gold)" label="Sleep target"
          min={240} max={720} step={15} format={fmtDuration}
          hint={(v) => { const bed = (((wake * 60 - v) % 1440) + 1440) % 1440; return `Bed by ${String(Math.floor(bed / 60)).padStart(2, "0")}:${String(bed % 60).padStart(2, "0")}`; }} />
        <TargetDial k="wakeHour" row="wake" icon={<TbSunrise size={15} />} color="var(--gold)" label="Wake-up time"
          min={0} max={23} step={1} format={hh} hint={() => "Water pacing starts here"} />
      </div>
      <div className="z-list-foot">Targets drive the discipline ring on Home, pace nudges and every progress bar.</div>
    </>
  );
}
