import type { ReactNode } from "react";
import { Button } from "antd";
import { TbArrowRight } from "react-icons/tb";

// Every empty state should tell the user what to do next. No more silent
// "No data yet" walls — always show the exact button that fixes it.
interface Props {
  icon?: ReactNode;
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
}
export function EmptyState({ icon, title, hint, actionLabel, onAction }: Props) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      textAlign: "center", padding: "36px 16px", color: "var(--ink-soft)",
      gap: 8,
    }}>
      {icon && <div style={{ fontSize: 32, opacity: 0.7, color: "var(--accent)" }}>{icon}</div>}
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{title}</div>
      {hint && <div style={{ fontSize: 12, maxWidth: 280 }}>{hint}</div>}
      {actionLabel && onAction && (
        <Button
          type="primary" size="middle" onClick={onAction}
          style={{ marginTop: 8 }}
          icon={<TbArrowRight />}
          iconPosition="end"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
