import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { Card } from "antd";
import { TbTrendingUp } from "react-icons/tb";

// Derived "efficiency" numbers: ₹/session, ₹/km, minutes-per-topic-completed.
// All from existing data, no schema change.
export function EfficiencyCard() {
  const data = useLiveQuery(async () => {
    const [sessions, fuel, studyItems, studySessions] = await Promise.all([
      db.workoutSessions.count(),
      db.fuel.toArray(),
      db.studyItems.where("status").equals("done").count(),
      db.studySessions.toArray(),
    ]);
    const totalSpend = fuel.reduce((s, f) => s + f.cost, 0);
    const totalKm = fuel.length >= 2 ? fuel[fuel.length - 1].odometer - fuel[0].odometer : 0;
    const totalStudyMin = studySessions.reduce((s, x) => s + x.minutes, 0);
    return {
      perSession: sessions > 0 ? Math.round(totalSpend / sessions) : 0,
      perKm: totalKm > 0 ? (totalSpend / totalKm).toFixed(2) : "0",
      minsPerTopic: studyItems > 0 ? Math.round(totalStudyMin / studyItems) : 0,
      hasAny: sessions > 0 || studyItems > 0 || fuel.length > 0,
    };
  }, []);

  if (!data?.hasAny) return null;
  return (
    <Card size="small" title={<span><TbTrendingUp /> Efficiency</span>} style={{ marginBottom: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <Tile label="Per session" value={`₹${data.perSession}`} />
        <Tile label="Per km" value={`₹${data.perKm}`} />
        <Tile label="Min / topic" value={String(data.minsPerTopic)} />
      </div>
    </Card>
  );
}
function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--bg)", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
      <div style={{ fontSize: 10, color: "var(--ink-soft)" }}>{label}</div>
      <div className="display" style={{ fontSize: 15, fontWeight: 800 }}>{value}</div>
    </div>
  );
}
