import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { TbArrowsShuffle, TbQuote } from "react-icons/tb";
import { useQuotes, pickRandomIndex } from "../features/quotes/useQuotes";
import { hapticLight } from "../lib/haptics";

// Compact quote card for the bottom of the dashboard. Picks a random quote
// on mount, and the whole card (or the dedicated shuffle button) advances to
// a new one. Never shows the same quote twice in a row while there's another
// available. Falls back to a helpful empty state that links to /quotes if the
// user cleared out the seed set.
export function HomeQuoteCard() {
  const quotes = useQuotes("all");
  const [index, setIndex] = useState<number>(() => Math.floor(Math.random() * Math.max(1, quotes.length)));

  // Re-anchor once quotes finish loading (empty on first render).
  useEffect(() => {
    if (quotes.length && index >= quotes.length) setIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotes.length]);

  const current = quotes[index];

  const shuffle = useMemo(() => () => {
    if (quotes.length < 2) return;
    setIndex((i) => pickRandomIndex(quotes.length, i));
    void hapticLight();
  }, [quotes.length]);

  if (quotes.length === 0) {
    return (
      <Link to="/quotes" style={{ color: "inherit", textDecoration: "none" }}>
        <div style={cardBase}>
          <TbQuote size={18} style={{ color: "var(--accent)", flex: "0 0 auto" }} />
          <div style={{ fontSize: 12, color: "var(--ink-soft)", fontStyle: "italic", flex: 1 }}>
            Add your first motivation quote →
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div
      role="button"
      aria-label="Shuffle quote"
      onClick={shuffle}
      style={{ ...cardBase, cursor: quotes.length > 1 ? "pointer" : "default" }}
    >
      <TbQuote size={16} style={{ color: "var(--accent)", flex: "0 0 auto", marginTop: 2 }} aria-hidden />
      <div style={{ flex: 1, minWidth: 0, position: "relative", overflow: "hidden" }}>
        {/* AnimatePresence swaps out the current quote with a soft fade+slide.
            key on quote.id so identical text (e.g. two of the same seed) still
            re-animates. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current?.id ?? index}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div style={{
              fontSize: 12, lineHeight: 1.4, color: "var(--ink)",
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              overflow: "hidden", fontStyle: "italic",
            }}>
              "{current?.text}"
            </div>
            {current?.author && (
              <div style={{ fontSize: 10, color: "var(--ink-soft)", marginTop: 2, fontWeight: 600 }}>
                — {current.author}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); shuffle(); }}
        disabled={quotes.length < 2}
        aria-label="Shuffle"
        style={{
          flex: "0 0 auto",
          background: "rgba(255,39,64,0.10)",
          border: "1px solid rgba(255,39,64,0.35)",
          borderRadius: 10,
          padding: 6,
          color: "var(--accent)",
          cursor: quotes.length < 2 ? "not-allowed" : "pointer",
          opacity: quotes.length < 2 ? 0.4 : 1,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <TbArrowsShuffle size={16} />
      </button>
    </div>
  );
}

const cardBase: React.CSSProperties = {
  display: "flex", alignItems: "flex-start", gap: 10,
  padding: "10px 12px",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  minHeight: 56,
};
