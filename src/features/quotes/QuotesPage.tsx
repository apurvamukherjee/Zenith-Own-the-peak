import { useState } from "react";
import { Modal, Input, Segmented, Button, App, Popconfirm } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import {
  TbQuote, TbPlus, TbStarFilled, TbStar, TbTrash, TbChevronLeft, TbChevronRight,
  TbArrowsShuffle, TbBarbell, TbBook2, TbSparkles,
} from "react-icons/tb";
import { PageTransition } from "../../components/PageTransition";
import type { QuoteCategory } from "../../db/types";
import { useQuotes, addQuote, deleteQuote, toggleFavorite, pickRandomIndex } from "./useQuotes";
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 className="display" style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Motivation</h2>
        <Button type="primary" icon={<TbPlus />} onClick={() => setAddOpen(true)}>Add</Button>
      </div>

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
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <TbQuote size={56} style={{ color: "var(--accent)", opacity: 0.5, marginBottom: 12 }} />
          <div style={{ fontWeight: 700, marginBottom: 6 }}>No quotes yet</div>
          <div style={{ color: "var(--ink-soft)", fontSize: 13, marginBottom: 18 }}>
            Write down what pushes you — a line from a coach, a book, or your own words.
            Read it back anytime you need it, mid-set or mid-doubt.
          </div>
          <Button type="primary" icon={<TbPlus />} onClick={() => setAddOpen(true)}>Write your first quote</Button>
        </div>
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
                    position: "absolute", inset: 0,
                    background: "var(--surface)", borderRadius: 24,
                    border: `1px solid var(--border)`,
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
                    background: `${CATEGORY_META[current.category].color}18`,
                    color: CATEGORY_META[current.category].color,
                    fontSize: 11, fontWeight: 700, marginBottom: 18, zIndex: 1,
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

                  {/* Favorite + delete */}
                  <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 6, zIndex: 1 }}>
                    <Button type="text" shape="circle"
                      icon={current.isFavorite ? <TbStarFilled style={{ color: "var(--gold)" }} /> : <TbStar />}
                      onClick={() => toggleFavorite(current)} aria-label="Favorite" />
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
            <Button shape="circle" size="large" icon={<TbChevronLeft />} onClick={() => go(-1)} disabled={quotes.length < 2} />
            <Button shape="circle" size="large" icon={<TbArrowsShuffle />} onClick={shuffle} disabled={quotes.length < 2}
              style={{ color: "var(--accent)" }} />
            <Button shape="circle" size="large" icon={<TbChevronRight />} onClick={() => go(1)} disabled={quotes.length < 2} />
          </div>
          <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}>
            {safeIndex + 1} / {quotes.length}
          </div>
        </>
      )}

      <AddQuoteModal open={addOpen} onClose={() => setAddOpen(false)} />
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
