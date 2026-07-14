import { Card, Empty } from "antd";
import { motion } from "framer-motion";
import { TbTrendingUp, TbTrendingDown, TbBulb, TbFlame } from "react-icons/tb";
import { PageTransition } from "../../components/PageTransition";
import { AnimatedNumber } from "../../components/AnimatedNumber";
import { useWeeklyReview, type ReviewStat } from "./useWeeklyReview";
import { useTokens } from "../../hooks/useTokens";

function Delta({ pct }: { pct: number | null }) {
  if (pct == null) return null;
  const up = pct >= 0;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: up ? "var(--teal)" : "#ff5c7a", display: "inline-flex", alignItems: "center", gap: 2 }}>
      {up ? <TbTrendingUp /> : <TbTrendingDown />}{Math.abs(pct)}%
    </span>
  );
}

function StatTile({ s, i }: { s: ReviewStat; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card size="small" styles={{ body: { padding: 14 } }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}>{s.label}</span>
          <Delta pct={s.deltaPct} />
        </div>
        <div className="display" style={{ fontSize: 24, fontWeight: 800, marginTop: 6, lineHeight: 1 }}>
          {s.prefix}<AnimatedNumber value={s.value} decimals={s.decimals} />{s.suffix}
        </div>
      </Card>
    </motion.div>
  );
}

export function WeeklyReviewPage() {
  const t = useTokens();
  const review = useWeeklyReview();

  return (
    <PageTransition>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
        className="hero-grad"
        style={{ borderRadius: 20, padding: "22px 20px", marginBottom: 18, color: "#fff" }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.85, letterSpacing: 1, textTransform: "uppercase" }}>This week</div>
        <div className="display" style={{ fontSize: 30, fontWeight: 800, margin: "2px 0 4px" }}>Your review <TbFlame style={{ verticalAlign: "-3px" }} /></div>
        <div style={{ fontSize: 13, opacity: 0.9 }}>Did the last 7 days move you toward the peak?</div>
      </motion.div>

      {!review ? (
        <Empty description="Crunching your week…" />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {review.stats.map((s, i) => <StatTile key={s.key} s={s} i={i} />)}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 2px 12px" }}>
            <TbBulb style={{ color: t.gold, fontSize: 20 }} />
            <h2 className="display" style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Insights</h2>
          </div>

          {review.insights.map((ins, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.4 }}
            >
              <Card size="small" style={{ marginBottom: 10, borderLeft: `3px solid ${ins.good ? t.teal : "#ff5c7a"}` }}
                styles={{ body: { padding: 14 } }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{ins.emoji}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.4 }}>{ins.text}</span>
                </div>
              </Card>
            </motion.div>
          ))}

          <div style={{ textAlign: "center", color: "var(--ink-soft)", fontSize: 13, margin: "18px 0 4px" }}>
            New week, new peak. Keep stacking days. ⛰️
          </div>
        </>
      )}
    </PageTransition>
  );
}
