import { useState } from "react";
import { App } from "antd";
import { TbSnowflake, TbCheck } from "react-icons/tb";
import { setSetting, useSetting } from "../../hooks/useSettings";
import { addHabit } from "../habits/useHabits";
import { useArcWrapped, ArcWrappedSheet } from "./ArcWrapped";
import "./arc.css";

// Jan 1: most programs' effects vanish the day they end (~8% of megastudy
// arms lasted), so the arc hands off to a lighter cadence instead of a void.
// The cadence is a plain Forged Habit — it keeps its own streak on Home.
export function ArcAfter() {
  const { message } = App.useApp();
  const after = String(useSetting("arcAfter"));
  const s = useArcWrapped();
  const [open, setOpen] = useState(false);
  if (!s) return <div className="arc-card arc-card--loading" />;

  const keep = async () => {
    await addHabit({ name: "Winter drill", triggerLabel: "After waking up", actionLabel: "5-minute bodyweight drill", icon: "TbBarbell" });
    await setSetting("arcAfter", "keep");
    void message.success("Added to Habits. The arc is over; the habit isn't.");
  };

  return (
    <div className="arc-card is-done">
      <div className="arc-card__eyebrow"><TbSnowflake size={14} /> Winter Arc 2026 · closed</div>
      <div className="arc-card__title display">{s.persona.title}</div>
      <p className="arc-card__copy">{s.kept}/61 days kept · best run {s.bestRun}. {s.persona.line}</p>
      <div className="arc-card__actions">
        <button type="button" className="arc-card__cta" onClick={() => setOpen(true)}>Open your Wrapped</button>
      </div>
      {after === "" ? (
        <div className="arc-card__theme">
          <b>2027 cadence</b> Sixty-one days builds a habit; it doesn't prove one. Keep a lighter version going?
          <div className="arc-card__actions">
            <button type="button" className="arc-card__ghost" onClick={() => void keep()}>Keep a 5-min daily drill</button>
            <button type="button" className="arc-card__link" onClick={() => void setSetting("arcAfter", "off")}>I'm done — rest</button>
          </div>
        </div>
      ) : (
        <div className="arc-card__done"><TbCheck size={16} /> {after === "keep" ? "5-min drill is in Habits." : "Rested. Respect."} Next up: Kolkata Book Fair, Jan 22 – Feb 3 — a reading quest?</div>
      )}
      {open && <ArcWrappedSheet onClose={() => setOpen(false)} />}
    </div>
  );
}
