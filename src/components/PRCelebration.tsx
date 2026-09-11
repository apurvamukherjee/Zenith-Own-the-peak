import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TbTrophy } from "react-icons/tb";
import { subscribeCelebrate, type CelebrationPayload } from "../lib/celebrate";
import { useReducedMotion } from "../hooks/useReducedMotion";

// Full-screen PR celebration overlay. Mounts once (in AppShell). Listens to the
// celebrate emitter and shows a ~1.4s burst: gold ring pulse, headline, and
// ~24 confetti flakes drifting down. Non-blocking — pointer-events: none so it
// never eats a tap.
const DURATION_MS = 1400;

// Overrides the caller-supplied title for "pr" celebrations — one place for
// the quote bank instead of duplicating it at every `celebrate()` call site
// (SessionLogger's SetRow, GymFocusMode's logCurrent). Random pick per hit.
const PR_QUOTES = [
  "You just broke something. Good.",
  "New number. Old you doesn't live here anymore.",
  "That's what happens when you stop negotiating with yourself.",
  "PR. Now go find the next one.",
  "The bar didn't know what hit it.",
  "Numbers don't lie. You just got stronger.",
  "That weight used to be impossible. Not anymore.",
  "Somewhere, your excuses just got quieter.",
];
function headlineFor(p: CelebrationPayload): string {
  return p.kind === "pr" ? PR_QUOTES[Math.floor(Math.random() * PR_QUOTES.length)] : p.title;
}

interface Flake { id: number; x: number; hue: number; delay: number; drift: number; rot: number; }

function makeFlakes(count = 24): Flake[] {
  const flakes: Flake[] = [];
  for (let i = 0; i < count; i++) {
    flakes.push({
      id: i,
      x: Math.random() * 100,           // % of viewport width
      hue: Math.random() < 0.5 ? 44 : 6, // gold-ish or red-ish
      delay: Math.random() * 0.15,
      drift: (Math.random() - 0.5) * 40, // horizontal drift px
      rot: (Math.random() - 0.5) * 720,  // spin
    });
  }
  return flakes;
}

export function PRCelebration() {
  const [payload, setPayload] = useState<CelebrationPayload | null>(null);
  // Keyed on the payload object itself, not a derived string — every
  // celebrate() call constructs a fresh object, so this is guaranteed to
  // change per celebration even when two PRs in a row share the same title.
  const flakes = useMemo(() => makeFlakes(), [payload]);
  const headline = useMemo(() => (payload ? headlineFor(payload) : ""), [payload]);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    return subscribeCelebrate((p) => {
      setPayload(p);
      const t = window.setTimeout(() => setPayload(null), DURATION_MS);
      return () => window.clearTimeout(t);
    });
  }, []);

  // Reduced-motion mode: skip confetti, just show a subtle bottom banner
  if (reducedMotion) {
    return payload ? (
      <div style={{ position: "fixed", bottom: 80, left: 0, right: 0, zIndex: 10000, textAlign: "center", pointerEvents: "none" }}>
        <span className="display" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--surface)", padding: "8px 16px", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "var(--gold)", border: "1px solid var(--border)" }}>
          <TbTrophy size={16} /> {headline}
        </span>
      </div>
    ) : null;
  }

  return (
    <AnimatePresence>
      {payload && (
        <div
          key="pr-overlay"
          aria-live="polite"
          style={{
            position: "fixed", inset: 0, zIndex: 10000,
            pointerEvents: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {/* Radial gold flash */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.35, 0], scale: [0.6, 1.4, 1.6] }}
            transition={{ duration: DURATION_MS / 1000, ease: "easeOut" }}
            style={{
              position: "absolute", width: 420, height: 420, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(246,185,59,0.5) 0%, rgba(246,185,59,0) 65%)",
            }}
          />
          {/* Headline card */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, -8], scale: [0.9, 1, 1, 0.98] }}
            transition={{ duration: DURATION_MS / 1000, times: [0, 0.18, 0.75, 1] }}
            style={{
              position: "relative", zIndex: 2,
              padding: "16px 22px", borderRadius: 18,
              background: "linear-gradient(135deg,#0d0709,#241014)",
              border: "1px solid #f6b93b",
              boxShadow: "0 12px 40px rgba(246,185,59,0.35)",
              textAlign: "center", minWidth: 220, maxWidth: "80vw",
            }}
          >
            {/* Impact shake — isolated in its own nested motion.div with an
                independent, short-lived `animate` so it can't fight the
                parent's longer entrance animation (same lesson as the drag/
                animate conflict fixed in GymFocusMode: never mix a one-shot
                imperative animate with a gesture/entrance transform on the
                SAME element). Runs once, ~0.4s, right on mount. */}
            <motion.div
              animate={{ x: [0, -8, 8, -5, 5, -2, 2, 0] }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <TbTrophy size={22} style={{ color: "#f6b93b" }} />
                <span className="display" style={{
                  fontSize: 22, fontWeight: 800, letterSpacing: 0.5, color: "#f6b93b",
                }}>
                  {headline}
                </span>
              </div>
            </motion.div>
            {payload.subtitle && (
              <div style={{ fontSize: 12, color: "rgba(243,238,242,0.85)", fontWeight: 600 }}>
                {payload.subtitle}
              </div>
            )}
          </motion.div>
          {/* Confetti */}
          {flakes.map((f) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: -20, x: 0, rotate: 0 }}
              animate={{ opacity: [0, 1, 1, 0], y: [-20, 260, 320], x: [0, f.drift, f.drift], rotate: f.rot }}
              transition={{ duration: DURATION_MS / 1000, delay: f.delay, ease: "easeOut" }}
              style={{
                position: "absolute",
                left: `${f.x}%`, top: "18%",
                width: 8, height: 12, borderRadius: 2,
                background: `hsl(${f.hue}, 88%, 58%)`,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
