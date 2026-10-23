import type { ReactNode } from "react";
import type { MuscleGroup } from "../db/types";
import { MUSCLE_LABELS } from "../config/exerciseLibrary";
import { BodyMap, MuscleGlyph, type Flash, type Heat } from "./BodyMap";

export interface MuscleCardRow { muscle: MuscleGroup; value: ReactNode; pct: number; tag?: { label: string; tone: "good" | "low" | "high" | "none" }; dim?: boolean }

export function Legend({ items }: { items: ["hot" | "warm" | "cold", string][] }) {
  return (
    <span className="mc-legend">
      {items.map(([tone, label]) => <span key={label}><i className={`bm-dot bm-dot--${tone}`} /> {label}</span>)}
    </span>
  );
}

// Body map + per-muscle rows. One layout for the Train tab, Planner and Progress.
export function MuscleCard({ eyebrow, aside, heat, flash, rows, foot, children }: {
  eyebrow: string; aside?: ReactNode; heat: Heat; flash?: Flash; rows: MuscleCardRow[]; foot?: ReactNode; children?: ReactNode;
}) {
  return (
    <section className="mc" aria-label={eyebrow}>
      <header className="mc-head">
        <span className="mc-eyebrow">{eyebrow}</span>
        {aside}
      </header>
      {children}
      <BodyMap heat={heat} flash={flash} />
      {rows.length > 0 && (
        <ul className="mc-list">
          {rows.map((r) => (
            <li key={r.muscle} className={r.dim ? "is-dim" : undefined}>
              <MuscleGlyph muscle={r.muscle} size={26} />
              <span className="mc-name">{MUSCLE_LABELS[r.muscle]}</span>
              <span className="mc-val">{r.value}</span>
              <span className="mc-bar"><span style={{ transform: `scaleX(${Math.min(1, Math.max(0, r.pct))})` }} /></span>
              {r.tag && <em className={`mc-tag mc-tag--${r.tag.tone}`}>{r.tag.label}</em>}
            </li>
          ))}
        </ul>
      )}
      {foot && <p className="mc-foot">{foot}</p>}
    </section>
  );
}
