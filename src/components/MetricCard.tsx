import { Card } from "antd";
import type { ReactNode } from "react";

export function MetricCard({ label, value, unit, accent = "var(--ink)", icon }: {
  label: string; value: ReactNode; unit?: string; accent?: string; icon?: ReactNode;
}) {
  return (
    <Card size="small" styles={{ body: { padding: 16 } }} style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)" }}>{label}</span>
        {icon && <span style={{ color: accent }}>{icon}</span>}
      </div>
      <div className="display" style={{ fontSize: 28, fontWeight: 800, color: accent, marginTop: 6, lineHeight: 1 }}>
        {value}
        {unit && <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-soft)", marginLeft: 4 }}>{unit}</span>}
      </div>
    </Card>
  );
}
