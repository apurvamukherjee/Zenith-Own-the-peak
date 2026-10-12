import type { ReactNode } from "react";
import { TbArrowDownRight, TbArrowUpRight, TbMinus } from "react-icons/tb";

interface Props {
  label: string;
  value: ReactNode;
  suffix?: string;
  prefix?: string;
  tone?: "accent" | "success" | "warn";
  /** Percent change vs a baseline; omit to hide the trend chip. */
  delta?: number;
  /** True when a lower number is the good direction (e.g. cost per km). */
  lowerIsBetter?: boolean;
}

const TONE = { accent: "var(--accent)", success: "var(--success)", warn: "var(--warn)" } as const;

export function StatTile({ label, value, suffix, prefix, tone, delta, lowerIsBetter }: Props) {
  const empty = value === 0 || value === "–" || value === "0";
  const flat = delta === undefined || Math.abs(delta) < 1;
  const good = delta !== undefined && (lowerIsBetter ? delta < 0 : delta > 0);
  const Arrow = flat ? TbMinus : delta! > 0 ? TbArrowUpRight : TbArrowDownRight;
  return (
    <div className="z-card" style={{ padding: 12 }}>
      <div className="z-stat-label">{label}</div>
      <div className="z-stat-value" style={{ color: tone && !empty ? TONE[tone] : "var(--ink)", marginTop: 2 }}>
        {prefix}{value}{suffix && <span style={{ fontSize: "var(--fs-xs)", fontWeight: 600, marginLeft: 3, color: "var(--ink-soft)" }}>{suffix}</span>}
      </div>
      {delta !== undefined && (
        <div className={flat ? "z-stat-label" : good ? "z-ok" : "z-bad"}
          style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: "var(--fs-xs)", fontWeight: 700, marginTop: 2 }}>
          <Arrow size={14} aria-hidden />{flat ? "steady" : `${Math.abs(Math.round(delta!))}%`}
        </div>
      )}
    </div>
  );
}
