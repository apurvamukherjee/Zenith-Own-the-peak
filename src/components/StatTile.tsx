import type { CSSProperties, ReactNode } from "react";
import { TbArrowDownRight, TbArrowUpRight, TbMinus } from "react-icons/tb";

interface Props {
  label: string;
  value: ReactNode;
  suffix?: string;
  prefix?: string;
  tone?: "accent" | "success" | "warn";
  icon?: ReactNode;
  /** Percent change vs a baseline; omit to hide the trend chip. */
  delta?: number;
  /** True when a lower number is the good direction (e.g. cost per km). */
  lowerIsBetter?: boolean;
}

const TONE = { accent: "var(--accent)", success: "var(--success)", warn: "var(--warn)" } as const;

export function StatTile({ label, value, suffix, prefix, tone, icon, delta, lowerIsBetter }: Props) {
  const empty = value === 0 || value === "–" || value === "0";
  const flat = delta === undefined || Math.abs(delta) < 1;
  const good = delta !== undefined && (lowerIsBetter ? delta < 0 : delta > 0);
  const Arrow = flat ? TbMinus : delta! > 0 ? TbArrowUpRight : TbArrowDownRight;
  const c = tone ? TONE[tone] : "var(--ink-soft)";
  return (
    <div className="z-tile z-stat" style={{ "--c": c } as CSSProperties}>
      <div className="z-tile__head">
        {icon && <span className="z-ico z-ico--sm">{icon}</span>}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      </div>
      <div className="z-tile__big" style={{ paddingTop: 8 }}>
        <b style={{ color: tone && !empty ? c : "var(--ink)" }}>{prefix}{value}</b>
        {suffix && <small>{suffix}</small>}
      </div>
      {delta !== undefined && (
        <div className={`z-pill ${flat ? "" : good ? "is-good" : "is-bad"}`} style={{ alignSelf: "flex-start", marginTop: 6 }}>
          <Arrow size={13} aria-hidden />{flat ? "steady" : `${Math.abs(Math.round(delta!))}%`}
        </div>
      )}
    </div>
  );
}
