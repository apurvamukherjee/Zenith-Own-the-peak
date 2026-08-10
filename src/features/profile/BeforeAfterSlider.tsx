import { useMemo, useRef, useState } from "react";
import { Card, Button, Select, Empty } from "antd";
import { TbArrowsLeftRight } from "react-icons/tb";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import dayjs from "dayjs";

// Before/after photo slider (Batch 4).
// Uses existing dayPhotos table — no new storage.
// Draggable divider over two overlaid photos; select which "before" and "after"
// date to compare from the dropdown.
export function BeforeAfterSlider() {
  const photos = useLiveQuery(() => db.dayPhotos.orderBy("date").toArray(), []) ?? [];
  const [beforeId, setBeforeId] = useState<number | null>(null);
  const [afterId, setAfterId] = useState<number | null>(null);
  const [split, setSplit] = useState(50);
  const boxRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // Default: oldest = before, newest = after — once photos load.
  useMemo(() => {
    if (photos.length >= 2 && beforeId == null && afterId == null) {
      setBeforeId(photos[0].id!);
      setAfterId(photos[photos.length - 1].id!);
    }
  }, [photos, beforeId, afterId]);

  if (photos.length < 2) {
    return (
      <Card size="small" title={<span><TbArrowsLeftRight /> Before / after</span>} style={{ marginBottom: 12 }}>
        <Empty description="Add photos to two different days on the calendar to compare." styles={{ image: { height: 40 } }} />
      </Card>
    );
  }

  const before = photos.find((p) => p.id === beforeId);
  const after = photos.find((p) => p.id === afterId);

  const options = photos.map((p) => ({ value: p.id, label: dayjs(p.date).format("D MMM YYYY") }));

  function onMove(clientX: number) {
    const box = boxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSplit(Math.max(0, Math.min(100, pct)));
  }

  return (
    <Card size="small" title={<span><TbArrowsLeftRight /> Before / after</span>} style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 130 }}>
          <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 2 }}>Before</div>
          <Select value={beforeId ?? undefined} onChange={setBeforeId} options={options} style={{ width: "100%" }} />
        </div>
        <div style={{ flex: 1, minWidth: 130 }}>
          <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 2 }}>After</div>
          <Select value={afterId ?? undefined} onChange={setAfterId} options={options} style={{ width: "100%" }} />
        </div>
      </div>

      {before && after ? (
        <div
          ref={boxRef}
          onMouseDown={(e) => { dragging.current = true; onMove(e.clientX); }}
          onMouseMove={(e) => { if (dragging.current) onMove(e.clientX); }}
          onMouseUp={() => { dragging.current = false; }}
          onMouseLeave={() => { dragging.current = false; }}
          onTouchStart={(e) => { dragging.current = true; onMove(e.touches[0].clientX); }}
          onTouchMove={(e) => { onMove(e.touches[0].clientX); }}
          onTouchEnd={() => { dragging.current = false; }}
          style={{ position: "relative", width: "100%", aspectRatio: "3/4", borderRadius: 12,
            overflow: "hidden", cursor: "ew-resize", userSelect: "none", background: "var(--bg)" }}>
          {/* After (full width, underneath) */}
          <img src={after.dataUrl} alt="after" draggable={false}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          {/* Before (clipped to left portion, on top) */}
          <div style={{ position: "absolute", inset: 0, width: `${split}%`, overflow: "hidden" }}>
            <img src={before.dataUrl} alt="before" draggable={false}
              style={{ width: `${100 / (split / 100)}%`, height: "100%", objectFit: "cover",
                maxWidth: "none" }} />
          </div>
          {/* Divider handle */}
          <div style={{ position: "absolute", top: 0, bottom: 0, left: `${split}%`, width: 2,
            background: "#fff", boxShadow: "0 0 8px rgba(0,0,0,0.5)", pointerEvents: "none" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
              width: 30, height: 30, borderRadius: "50%", background: "#fff", display: "flex",
              alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}>
              <TbArrowsLeftRight size={16} style={{ color: "var(--accent)" }} />
            </div>
          </div>
          {/* Labels */}
          <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.55)", color: "#fff",
            fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
            {dayjs(before.date).format("D MMM YY")}
          </div>
          <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.55)", color: "#fff",
            fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
            {dayjs(after.date).format("D MMM YY")}
          </div>
        </div>
      ) : (
        <Empty description="Pick two dates to compare" styles={{ image: { height: 40 } }} />
      )}

      <div style={{ marginTop: 8, textAlign: "center" }}>
        <Button size="small" onClick={() => setSplit(50)}>Reset divider</Button>
      </div>
    </Card>
  );
}
