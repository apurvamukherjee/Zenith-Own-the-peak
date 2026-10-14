import type { ReactNode } from "react";
import { Rings } from "./ui/Rings";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface Props {
  percent: number;
  size?: number;
  strokeWidth?: number;
  /** Danger color instead of the brand gradient, e.g. when behind pace. */
  urgent?: boolean;
  /** Override the ring tint (any CSS color / var). */
  color?: string;
  children?: ReactNode;
}

export function Ring({ percent, size = 80, strokeWidth = 9, urgent, color, children }: Props) {
  const reduced = useReducedMotion();
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  const tint: [string, string] | string = pct >= 100
    ? ["var(--success)", "var(--gold)"]
    : urgent ? "var(--danger)" : color ?? ["var(--accent)", "var(--gold)"];
  return (
    <Rings size={size} stroke={strokeWidth} reduced={reduced} delay={0.1} rings={[{ key: "p", pct, color: tint }]}>
      {children ?? <span className="display" style={{ fontWeight: 800, fontSize: size > 70 ? "var(--fs-md)" : "var(--fs-xs)" }}>{pct}%</span>}
    </Rings>
  );
}
