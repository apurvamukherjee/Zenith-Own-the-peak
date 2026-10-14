import { useState, type CSSProperties } from "react";
import { Input, Modal, App, Segmented, Popconfirm } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import { TbBrandYoutube, TbClock, TbFileText, TbPlus, TbTrash, TbChevronDown, TbPlayerPlay } from "react-icons/tb";
import { Hero } from "../../components/ui/Hero";
import { Rings } from "../../components/ui/Rings";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { hapticSuccess } from "../../lib/haptics";
import "./study.css";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { EmptyState } from "../../components/EmptyState";
import { ColdIcon } from "../../components/ColdIcon";
import type { StudyItemDto, StudyPathDto, StudyStatus, StudySource } from "../../db/types";
import {
  usePaths, useItems, useWeeklyStudy, addPath, deletePath, addItem, cycleStatus,
  updateNotes, deleteItem, logStudyMinutes, pathProgress, sourceLabel, useAllItems,
} from "./useStudy";

const STATUS_META: Record<StudyStatus, { c: string; label: string }> = {
  todo: { c: "var(--ink-soft)", label: "To learn" },
  doing: { c: "var(--gold)", label: "Learning" },
  done: { c: "var(--success)", label: "Done" },
};

function weekdayAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toLocaleDateString(undefined, { weekday: "narrow" });
}

export function StudyPage() {
  const reduced = useReducedMotion();
  const paths = usePaths();
  const weekly = useWeeklyStudy();
  const allItems = useAllItems();
  const [addOpen, setAddOpen] = useState(false);
  const totalMin = weekly.reduce((s, d) => s + d.min, 0);
  const doneAll = allItems.filter((i) => i.status === "done").length;
  const max = Math.max(30, ...weekly.map((d) => d.min));
  const todayMin = weekly[weekly.length - 1]?.min ?? 0;

  return (
    <PageTransition>
      <SectionTitle eyebrow="Sharpen the mind" title="Learn"
        right={<button type="button" className="z-btn z-btn--solid" onClick={() => setAddOpen(true)}><TbPlus size={16} /> Path</button>} />

      <Hero color="var(--success)" eyebrow="This week" className="st-hero"
        right={<span className="z-pill" style={{ "--c": todayMin ? "var(--success)" : "var(--ink-soft)" } as CSSProperties}>{todayMin ? `${todayMin} min today` : "Nothing today"}</span>}>
        <div className="st-hero__row">
          <div>
            <div className="z-hero__big">{Math.floor(totalMin / 60)}<small>h</small> {totalMin % 60}<small>m</small></div>
            <div className="z-hero__sub">{doneAll} topic{doneAll === 1 ? "" : "s"} mastered · {paths.length} path{paths.length === 1 ? "" : "s"}</div>
          </div>
          <div className="st-bars" aria-label="Minutes studied per day this week">
            {weekly.map((d, i) => (
              <div key={d.date} className={`st-bars__col${i === weekly.length - 1 ? " is-today" : ""}`}>
                <motion.i initial={reduced ? false : { height: 0 }} animate={{ height: `${Math.max(4, (d.min / max) * 100)}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.1 + i * 0.05 }}
                  className={d.min ? "" : "is-zero"} />
                <span>{weekdayAgo(weekly.length - 1 - i)}</span>
              </div>
            ))}
          </div>
        </div>
      </Hero>

      {paths.length === 0 ? (
        <EmptyState icon={<ColdIcon glyph="tome" size={44} />} title="No learning paths yet"
          hint="Add a YouTube playlist, course, or book — then break it into topics and track your way through."
          actionLabel="Create your first path" onAction={() => setAddOpen(true)} />
      ) : (
        <>
          <div className="z-list-title">Paths</div>
          <div className="st-paths">{paths.map((p) => <PathCard key={p.id} path={p} />)}</div>
        </>
      )}

      <AddPathModal open={addOpen} onClose={() => setAddOpen(false)} />
    </PageTransition>
  );
}

function PathCard({ path }: { path: StudyPathDto }) {
  const { message } = App.useApp();
  const reduced = useReducedMotion();
  const items = useItems(path.id);
  const { pct, done, total, upNext } = pathProgress(items);
  const [newTopic, setNewTopic] = useState("");
  const [noteItem, setNoteItem] = useState<StudyItemDto | null>(null);
  const [open, setOpen] = useState(false);
  const add = () => { if (newTopic.trim() && path.id) { void addItem(path.id, newTopic.trim()); setNewTopic(""); } };

  return (
    <div className="st-path">
      <div className="st-path__head">
        <Rings size={58} stroke={6} reduced={reduced} rings={[{ key: "p", pct, color: ["var(--success)", "var(--gold)"] }]}>
          <span className="st-path__pct">{pct}%</span>
        </Rings>
        <div className="st-path__text">
          <div className="st-path__title display">{path.title}</div>
          <div className="st-path__src">
            {path.sourceType === "youtube" && <TbBrandYoutube size={13} style={{ color: "#ff0000" }} />}
            {path.sourceUrl ? <a href={path.sourceUrl} target="_blank" rel="noreferrer">{sourceLabel(path)}</a> : sourceLabel(path)}
            <span>· {done}/{total} topics</span>
          </div>
        </div>
        <Popconfirm title="Delete this learning path?" description="All its topics and notes will be removed." okText="Delete" okButtonProps={{ danger: true }}
          onConfirm={() => path.id && deletePath(path.id)}>
          <button type="button" className="st-icon" aria-label={`Delete ${path.title}`}><TbTrash size={16} /></button>
        </Popconfirm>
      </div>

      {upNext && (
        <div className="st-next"><TbPlayerPlay size={13} /> <b>Up next</b> {upNext.title}</div>
      )}

      <div className="st-path__actions">
        {[25, 45].map((m) => (
          <motion.button key={m} type="button" whileTap={{ scale: 0.93 }} className="z-btn" style={{ flex: 1 }}
            onClick={() => { if (path.id) { void logStudyMinutes(path.id, m); void hapticSuccess(); message.success(`+${m} min studied`); } }}>
            <TbClock size={15} /> +{m}m
          </motion.button>
        ))}
        <button type="button" className={`z-btn st-toggle${open ? " is-open" : ""}`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          Topics <TbChevronDown size={15} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="topics" className="st-topics" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 340, damping: 34 }}>
            <div className="st-topics__inner">
              {items.map((it) => (
                <div key={it.id} className={`st-topic${it.status === "done" ? " is-done" : ""}`}>
                  <button type="button" className="z-pill st-topic__status" style={{ "--c": STATUS_META[it.status].c } as CSSProperties}
                    onClick={() => cycleStatus(it)} aria-label={`Status: ${STATUS_META[it.status].label}. Tap to change.`}>
                    {STATUS_META[it.status].label}
                  </button>
                  <span className="st-topic__title">{it.title}</span>
                  <button type="button" className={`st-icon${it.notes ? " has-notes" : ""}`} onClick={() => setNoteItem(it)} aria-label="Notes"><TbFileText size={16} /></button>
                  <Popconfirm title="Delete this topic?" okText="Delete" okButtonProps={{ danger: true }} onConfirm={() => it.id && deleteItem(it.id)}>
                    <button type="button" className="st-icon" aria-label={`Delete ${it.title}`}><TbTrash size={15} /></button>
                  </Popconfirm>
                </div>
              ))}
              <div className="st-add">
                <Input placeholder="Add a topic" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} onPressEnter={add} />
                <button type="button" className="z-btn z-btn--solid" style={{ "--c": "var(--success)" } as CSSProperties} onClick={add} aria-label="Add topic" disabled={!newTopic.trim()}><TbPlus size={16} /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <NotesModal item={noteItem} onClose={() => setNoteItem(null)} />
    </div>
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
