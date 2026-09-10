import { Card } from "antd";
import { TbCompass } from "react-icons/tb";
import { useCompassInsights } from "../review/useCompass";

// The Compass — long-range (60-day), deterministic correlation insights.
// Kept as its own card rather than folded into Weekly Review: that card
// looks at a 14-day window, this one a 60-day window, and mixing the two
// time horizons in one place would read as inconsistent.
export function CompassCard() {
  const insights = useCompassInsights();

  if (insights === undefined) return null; // still loading, avoid a flash of the empty state

  return (
    <Card size="small" style={{ marginBottom: 16 }} title={<span><TbCompass /> The Compass</span>}>
      {insights.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          Keep logging — Compass insights unlock once you've got more history to compare against.
        </div>
      ) : (
        insights.map((ins, i) => (
          <div key={i} style={{
            fontSize: 13, color: "var(--ink)", marginBottom: i === insights.length - 1 ? 0 : 6,
            paddingLeft: 8, borderLeft: `2px solid ${ins.good ? "var(--teal)" : "#ff5c7a"}`,
          }}>
            {ins.text}
          </div>
        ))
      )}
    </Card>
  );
}
