import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { Card } from "antd";
import dayjs from "dayjs";
import { TbCamera } from "react-icons/tb";

export function PhotoTimeline() {
  const photos = useLiveQuery(() => db.dayPhotos.orderBy("date").reverse().toArray(), []) ?? [];
  if (photos.length === 0) return null;
  return (
    <Card size="small" title={<span><TbCamera /> Photo timeline</span>} style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {photos.map((p) => (
          <div key={p.id} style={{ flex: "0 0 90px", textAlign: "center" }}>
            <img src={p.dataUrl} alt={p.date} style={{ width: 90, height: 120, borderRadius: 8, objectFit: "cover" }} />
            <div style={{ fontSize: 10, color: "var(--ink-soft)", marginTop: 4 }}>{dayjs(p.date).format("D MMM")}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
