import { useState, useEffect } from "react";
import { Modal, Input, Segmented, Button, App, Popconfirm } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import {
  TbQuote, TbPlus, TbStarFilled, TbStar, TbTrash, TbChevronLeft, TbChevronRight, TbPencil,
  TbArrowsShuffle, TbBarbell, TbBook2, TbSparkles,
} from "react-icons/tb";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { EmptyState } from "../../components/EmptyState";
import type { QuoteCategory, QuoteDto } from "../../db/types";
import { useQuotes, addQuote, updateQuote, deleteQuote, toggleFavorite, pickRandomIndex } from "./useQuotes";
import { hapticLight } from "../../lib/haptics";

const CATEGORY_META: Record<QuoteCategory, { label: string; icon: typeof TbBarbell; color: string }> = {
  gym: { label: "Gym", icon: TbBarbell, color: "var(--accent)" },
  study: { label: "Study", icon: TbBook2, color: "var(--teal)" },
  life: { label: "Life", icon: TbSparkles, color: "var(--gold)" },
};

export function QuotesPage() {
  const { message } = App.useApp();
  const [filter, setFilter] = useState<QuoteCategory | "all">("all");
  const quotes = useQuotes(filter);
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<QuoteDto | null>(null);

  const safeIndex = quotes.length ? index % quotes.length : 0;
  const current = quotes[safeIndex];

  function go(newDir: number) {
    if (quotes.length < 2) return;
    setDir(newDir);
    setIndex((i) => (i + newDir + quotes.length) % quotes.length);
    hapticLight();
  }
  function shuffle() {
    if (quotes.length < 2) return;
    setDir(1);
    setIndex(pickRandomIndex(quotes.length, safeIndex));
    hapticLight();
  }

  return (
    <PageTransition>
      <SectionTitle eyebrow="Fuel for the mind" title="Motivation"
        right={<button type="button" className="z-btn z-btn--solid" onClick={() => setAddOpen(true)}><TbPlus size={16} /> Add</button>} />

      <Segmented
        block
        value={filter}
        onChange={(v) => { setFilter(v as QuoteCategory | "all"); setIndex(0); }}
        options={[
          { label: "All", value: "all" },
          { label: "Gym", value: "gym", icon: <TbBarbell /> },
          { label: "Study", value: "study", icon: <TbBook2 /> },
          { label: "Life", value: "life", icon: <TbSparkles /> },
        ]}
        style={{ marginBottom: 18 }}
      />

      {quotes.length === 0 ? (
        <EmptyState icon={<TbQuote size={40} />} title="No quotes yet"
          hint="Write down what pushes you — a line from a coach, a book, or your own words. Read it back mid-set or mid-doubt."
          actionLabel="Write your first quote" onAction={() => setAddOpen(true)} />
      ) : (
        <>
          {/* Card deck */}
          <div style={{ position: "relative", minHeight: 320, marginBottom: 16 }}>
            <AnimatePresence mode="wait" custom={dir}>
              {current && (
                <motion.div
                  key={current.id}
                  custom={dir}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.7}
                  onDragEnd={(_e, info) => {
                    if (info.offset.x < -70) go(1);
                    else if (info.offset.x > 70) go(-1);
                  }}
                  initial={{ opacity: 0, x: dir > 0 ? 60 : -60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: dir > 0 ? -60 : 60 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position: "absolute", inset: 0, borderRadius: 28,
                    background: `radial-gradient(120% 90% at 0% 0%, color-mix(in srgb, ${CATEGORY_META[current.category].color} 16%, transparent), transparent 60%), linear-gradient(180deg, var(--surface-2), var(--surface))`,
                    border: `1px solid color-mix(in srgb, ${CATEGORY_META[current.category].color} 22%, var(--border))`,
                    boxShadow: "0 28px 54px -32px rgba(0,0,0,0.8)",
                    padding: "36px 28px", display: "flex", flexDirection: "column",
                    justifyContent: "center", overflow: "hidden", cursor: "grab",
                  }}
                >
                  {/* Giant faded quote mark */}
                  <TbQuote size={140} style={{
                    position: "absolute", top: -20, left: -10,
                    color: CATEGORY_META[current.category].color, opacity: 0.08,
                  }} />

                  {/* Category tag */}
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    alignSelf: "flex-start", padding: "4px 10px", borderRadius: 8,
                    background: `color-mix(in srgb, ${CATEGORY_META[current.category].color} 14%, transparent)`,
                    color: CATEGORY_META[current.category].color,
                    fontSize: 12, fontWeight: 700, marginBottom: 18, zIndex: 1,
                  }}>
                    {(() => { const Icon = CATEGORY_META[current.category].icon; return <Icon size={13} />; })()}
                    {CATEGORY_META[current.category].label.toUpperCase()}
                  </div>

                  {/* Quote text */}
                  <div className="display" style={{
                    fontSize: current.text.length > 90 ? 22 : 28,
                    fontWeight: 800, lineHeight: 1.32, zIndex: 1,
                    color: "var(--ink)",
                  }}>
                    {current.text}
                  </div>

                  {current.author && (
                    <div style={{ marginTop: 18, fontSize: 14, fontWeight: 600, color: "var(--ink-soft)", zIndex: 1 }}>
                      — {current.author}
                    </div>
                  )}

                  {/* Favorite + edit + delete */}
                  <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 6, zIndex: 1 }}>
                    <Button type="text" shape="circle"
                      icon={current.isFavorite ? <TbStarFilled style={{ color: "var(--gold)" }} /> : <TbStar />}
                      onClick={() => toggleFavorite(current)} aria-label="Favorite" />
                    <Button type="text" shape="circle" icon={<TbPencil />}
                      onClick={() => setEditing(current)} aria-label="Edit" />
                    <Popconfirm title="Delete this quote?" okButtonProps={{ danger: true }}
                      onConfirm={() => { deleteQuote(current.id!); message.success("Deleted"); setIndex(0); }}>
                      <Button type="text" shape="circle" icon={<TbTrash />} aria-label="Delete" />
                    </Popconfirm>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
            <Button shape="circle" size="large" icon={<TbChevronLeft />} onClick={() => go(-1)} disabled={quotes.length < 2} aria-label="Previous" />
            <Button shape="circle" size="large" icon={<TbArrowsShuffle />} aria-label="Shuffle quote" onClick={shuffle} disabled={quotes.length < 2}
              style={{ color: "var(--accent)" }} />
            <Button shape="circle" size="large" icon={<TbChevronRight />} onClick={() => go(1)} disabled={quotes.length < 2} aria-label="Next" />
          </div>
          <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}>
            {safeIndex + 1} / {quotes.length}
          </div>
        </>
      )}

      <AddQuoteModal open={addOpen} onClose={() => setAddOpen(false)} />
      <EditQuoteModal quote={editing} onClose={() => setEditing(null)} />
    </PageTransition>
  );
}

function AddQuoteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { message } = App.useApp();
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState<QuoteCategory>("gym");

  async function submit() {
    if (!text.trim()) return;
    await addQuote(text, author, category);
    message.success("Quote saved");
    setText(""); setAuthor(""); setCategory("gym");
    onClose();
  }

  return (
    <Modal open={open} onCancel={onClose} title="Write a quote" onOk={submit} okText="Save">
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
        <Input.TextArea rows={4} placeholder="What keeps you going?" value={text}
          onChange={(e) => setText(e.target.value)} maxLength={280} showCount autoFocus />
        <Input placeholder="Author (optional)" value={author} onChange={(e) => setAuthor(e.target.value)} />
        <Segmented block value={category} onChange={(v) => setCategory(v as QuoteCategory)}
          options={[
            { label: "Gym", value: "gym", icon: <TbBarbell /> },
            { label: "Study", value: "study", icon: <TbBook2 /> },
            { label: "Life", value: "life", icon: <TbSparkles /> },
          ]} />
      </div>
    </Modal>
  );
}

function EditQuoteModal({ quote, onClose }: { quote: QuoteDto | null; onClose: () => void }) {
  const { message } = App.useApp();
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState<QuoteCategory>("gym");

  // Sync form when a new quote is opened for editing
  useEffect(() => {
    if (quote) {
      setText(quote.text);
      setAuthor(quote.author ?? "");
      setCategory(quote.category);
    }
  }, [quote]);

  async function save() {
    if (!quote?.id || !text.trim()) return;
    await updateQuote(quote.id, { text, author, category });
    message.success("Updated");
    onClose();
  }

  return (
    <Modal open={!!quote} onCancel={onClose} title="Edit quote" onOk={save} okText="Save changes">
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
        <Input.TextArea rows={4} value={text} onChange={(e) => setText(e.target.value)} maxLength={280} showCount autoFocus />
        <Input placeholder="Author (optional)" value={author} onChange={(e) => setAuthor(e.target.value)} />
        <Segmented block value={category} onChange={(v) => setCategory(v as QuoteCategory)}
          options={[
            { label: "Gym", value: "gym", icon: <TbBarbell /> },
            { label: "Study", value: "study", icon: <TbBook2 /> },
            { label: "Life", value: "life", icon: <TbSparkles /> },
          ]} />
      </div>
    </Modal>
  );
}
