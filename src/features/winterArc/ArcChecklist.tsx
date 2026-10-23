import { TbCircleCheckFilled, TbCircle, TbBolt } from "react-icons/tb";
import { hapticLight } from "../../lib/haptics";
import { useArcChecklist, toggleArcRule } from "./useArcChecklist";
import "./arc.css";

// The drill alone keeps the chain; this is the fuller picture, auto-filled
// from what you actually logged. Only manual Cold Rules are tappable.
export function ArcChecklist({ date }: { date: string }) {
  const c = useArcChecklist(date);
  if (!c) return null;
  return (
    <section className="arc-list" aria-label="Winter Arc checklist">
      <header className="arc-list__head">
        <b>Today's arc</b>
        <span className="arc-list__xp"><TbBolt size={12} /> 1.5× XP — not double, don't get excited</span>
        <span className="arc-list__score">{c.score}%</span>
      </header>
      <div className="arc-list__bar" role="progressbar" aria-valuenow={c.score} aria-valuemin={0} aria-valuemax={100}>
        <i style={{ width: `${c.score}%` }} />
      </div>
      <ul>
        {c.items.map((it) => (
          <li key={it.id} className={it.done ? "is-done" : ""}>
            {it.auto ? (
              <span className="arc-list__item">
                {it.done ? <TbCircleCheckFilled size={18} /> : <TbCircle size={18} />} {it.label}
                <em>auto</em>
              </span>
            ) : (
              <button type="button" className="arc-list__item" aria-pressed={it.done}
                onClick={() => { hapticLight(); void toggleArcRule(date, it.id); }}>
                {it.done ? <TbCircleCheckFilled size={18} /> : <TbCircle size={18} />} {it.label}
              </button>
            )}
            {it.note && !it.done && <p className="arc-list__note">{it.note}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
