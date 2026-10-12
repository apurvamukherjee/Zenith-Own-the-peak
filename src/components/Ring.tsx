import type { ReactNode } from "react";
import { Progress } from "antd";
import { useTokens } from "../hooks/useTokens";

interface Props {
  percent: number;
  size?: number;
  strokeWidth?: number;
  /** Danger color instead of the brand gradient, e.g. when behind pace. */
  urgent?: boolean;
  children?: ReactNode;
}

export function Ring({ percent, size = 80, strokeWidth = 9, urgent, children }: Props) {
  const t = useTokens();
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  const done = pct >= 100;
  const stroke = done
    ? { "0%": t.teal, "100%": t.gold }
    : urgent ? t.danger : { "0%": t.accent, "100%": t.gold };
  return (
    <Progress
      type="circle" percent={pct} size={size} strokeWidth={strokeWidth} strokeColor={stroke}
      className={`ring-glow${done ? " ring-done" : ""}`}
      format={() => children ?? <span style={{ fontWeight: 800, fontSize: size > 70 ? "var(--fs-md)" : "var(--fs-xs)" }}>{pct}%</span>}
    />
  );
}
