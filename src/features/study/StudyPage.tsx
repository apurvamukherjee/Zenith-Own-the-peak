import { useState } from "react";
import {
  Card, Button, Collapse, Progress, Input, Modal, Tag, App, Empty, Segmented,
} from "antd";
import {
  PlusOutlined, DeleteOutlined, FileTextOutlined, YoutubeFilled, ClockCircleOutlined,
} from "@ant-design/icons";
import { BarChart, Bar, XAxis, ResponsiveContainer } from "recharts";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import type { StudyItemDto, StudyPathDto, StudyStatus, StudySource } from "../../db/types";
import {
  usePaths, useItems, useWeeklyStudy, addPath, deletePath, addItem, cycleStatus,
  updateNotes, deleteItem, logStudyMinutes, pathProgress, sourceLabel, useAllItems,
} from "./useStudy";
import { VIOLET, GOLD } from "../../theme";
import { useTokens } from "../../hooks/useTokens";

const STATUS_META: Record<StudyStatus, { color: string; label: string }> = {
  todo: { color: "default", label: "To learn" },
  doing: { color: "gold", label: "Learning" },
  done: { color: "green", label: "Done" },
};

export function StudyPage() {
  const t = useTokens();
  const paths = usePaths();
  const weekly = useWeeklyStudy();
  const allItems = useAllItems();
  const [addOpen, setAddOpen] = useState(false);
  const totalMin = weekly.reduce((s, d) => s + d.min, 0);
  const doneAll = allItems.filter((i) => i.status === "done").length;

  return (
    <PageTransition>
      <SectionTitle eyebrow="Productivity" title="Study"
        right={<Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>Path</Button>} />

      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontWeight: 700 }}><ClockCircleOutlined /> {totalMin} min this week</span>
          <span style={{ color: "var(--ink-soft)" }}>{doneAll} topics done</span>
        </div>
        <div style={{ width: "100%", height: 70 }}>
          <ResponsiveContainer>
            <BarChart data={weekly} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 9 }} />
              <Bar dataKey="min" fill={t.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {paths.length === 0 ? (
        <Empty description="Add a learning path — e.g. Learn React from YouTube." />
      ) : (
        paths.map((p) => <PathCard key={p.id} path={p} />)
      )}

      <AddPathModal open={addOpen} onClose={() => setAddOpen(false)} />
    </PageTransition>
  );
}

function PathCard({ path }: { path: StudyPathDto }) {
  const t = useTokens();
  const { message } = App.useApp();
  const items = useItems(path.id);
  const { pct, done, total, upNext } = pathProgress(items);
  const [newTopic, setNewTopic] = useState("");
  const [noteItem, setNoteItem] = useState<StudyItemDto | null>(null);

  return (
    <Card style={{ marginBottom: 14 }} styles={{ body: { padding: 16 } }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div className="display" style={{ fontWeight: 800, fontSize: 18 }}>{path.title}</div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
            {path.sourceType === "youtube" && <YoutubeFilled style={{ color: "#ff0000", marginRight: 4 }} />}
            {path.sourceUrl ? (
              <a href={path.sourceUrl} target="_blank" rel="noreferrer">{sourceLabel(path)}</a>
            ) : sourceLabel(path)}
          </div>
        </div>
        <Button type="text" danger size="small" icon={<DeleteOutlined />}
          onClick={() => path.id && deletePath(path.id)} aria-label="Delete path" />
      </div>

      <div style={{ margin: "12px 0 6px", display: "flex", alignItems: "center", gap: 10 }}>
        <Progress percent={pct} strokeColor={t.accent} style={{ flex: 1, margin: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>{done}/{total}</span>
      </div>

      {upNext && (
        <div style={{ background: "rgba(124,92,252,0.08)", borderRadius: 10, padding: "8px 12px", marginBottom: 8, fontSize: 13 }}>
          <span style={{ fontWeight: 700, color: VIOLET }}>Up next:</span> {upNext.title}
        </div>
      )}

      <Collapse ghost items={[{
        key: "topics",
        label: <span style={{ fontWeight: 600 }}>Topics</span>,
        children: (
          <>
            {items.map((it) => (
              <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
                <Tag color={STATUS_META[it.status].color} style={{ cursor: "pointer", borderRadius: 8, minWidth: 74, textAlign: "center" }}
                  onClick={() => cycleStatus(it)}>{STATUS_META[it.status].label}</Tag>
                <span style={{ flex: 1, textDecoration: it.status === "done" ? "line-through" : "none", color: it.status === "done" ? "var(--ink-soft)" : "var(--ink)" }}>{it.title}</span>
                <Button type="text" size="small" icon={<FileTextOutlined style={{ color: it.notes ? GOLD : undefined }} />} onClick={() => setNoteItem(it)} aria-label="Notes" />
                <Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => it.id && deleteItem(it.id)} aria-label="Delete topic" />
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Input placeholder="Add topic" value={newTopic} onChange={(e) => setNewTopic(e.target.value)}
                onPressEnter={() => { if (newTopic.trim() && path.id) { addItem(path.id, newTopic.trim()); setNewTopic(""); } }} />
              <Button icon={<PlusOutlined />} onClick={() => { if (newTopic.trim() && path.id) { addItem(path.id, newTopic.trim()); setNewTopic(""); } }} />
            </div>
          </>
        ),
      }]} />

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        {[25, 45].map((m) => (
          <Button key={m} size="small" icon={<ClockCircleOutlined />}
            onClick={() => { if (path.id) { logStudyMinutes(path.id, m); message.success(`+${m} min studied`); } }}>
            +{m}m
          </Button>
        ))}
      </div>

      <NotesModal item={noteItem} onClose={() => setNoteItem(null)} />
    </Card>
  );
}

function NotesModal({ item, onClose }: { item: StudyItemDto | null; onClose: () => void }) {
  const [text, setText] = useState("");
  return (
    <Modal
      open={!!item} title={item?.title} onCancel={onClose}
      afterOpenChange={(o) => o && setText(item?.notes ?? "")}
      onOk={() => { if (item?.id) updateNotes(item.id, text); onClose(); }}
      okText="Save notes"
    >
      <Input.TextArea value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder="Notes, code snippets, links…" />
    </Modal>
  );
}

function AddPathModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<StudySource>("youtube");
  const [url, setUrl] = useState("");
  function submit() {
    if (!title.trim()) return;
    addPath({ title: title.trim(), sourceType: type, sourceUrl: url.trim() || undefined });
    setTitle(""); setUrl(""); setType("youtube"); onClose();
  }
  return (
    <Modal open={open} title="New learning path" onCancel={onClose} onOk={submit} okText="Create">
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
        <Input placeholder="e.g. Learn React from YouTube" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Segmented block value={type} onChange={(v) => setType(v as StudySource)}
          options={[{ label: "YouTube", value: "youtube" }, { label: "Course", value: "course" }, { label: "Book", value: "book" }, { label: "Other", value: "other" }]} />
        <Input placeholder="Source link (optional)" value={url} onChange={(e) => setUrl(e.target.value)} />
      </div>
    </Modal>
  );
}
