import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { TbX, TbMinus, TbPlus, TbTrophy, TbArrowsRightLeft, TbChevronUp, TbArrowBackUp } from "react-icons/tb";
import { useBackClose } from "../hooks/useBackClose";
import { useRestTimer } from "../hooks/useRestTimer";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useUsageValue, recordUsage } from "../hooks/useUsageHistory";
import { pauseRest, resumeRest, skipRest } from "../lib/restTimerStore";
import { celebrate } from "../lib/celebrate";
import { hapticLight } from "../lib/haptics";
import { unlockAudio, playTick } from "../lib/audio";
import type { DayExerciseDto, ExerciseDto, MuscleGroup, WorkoutSetDto } from "../db/types";
import { useExercise, useExerciseLibrary, useGhostSets, logSet, deleteSet } from "../features/gym/useGym";
import { buildItems } from "../features/gym/groupExercises";

// Fullscreen "one set at a time" view for /workout. Sits ON TOP of
// SessionLogger (which stays mounted underneath, unchanged) rather than
// replacing it — ExerciseBlock/SupersetBlock's own doneCount→startRest
// effects keep firing exactly as before since they still receive the same
// live `sets` query. This view just reads the same rest-timer singleton to
// decide whether to show the set-entry screen or the rest screen, and calls
// the same `logSet()` SessionLogger's SetRow calls — one write path, two skins.
interface Props {
  dayId: number;
  dayName: string;
  exercises: DayExerciseDto[];
  sets: WorkoutSetDto[];
  getSessionId: () => Promise<number>;
  doneSets: number;
  totalSets: number;
  volume: number;
  elapsedMin: number;
  onClose: () => void;
}

// Subtle per-muscle-group wash for the vignette center — the base radial
// (black at the edges) never changes, only the small color right at 50%/30%
// shifts, so the gothic red identity stays intact and this reads as a hint,
// not a repaint.
const MUSCLE_TINT: Record<MuscleGroup, string> = {
  chest: "#1a0509", traps: "#1a0509",
  back: "#051a14", forearms: "#051a1a", calves: "#051a1a",
  shoulders: "#1a1005", quads: "#1a1005", glutes: "#1a1005",
  biceps: "#12051a", abs: "#0a051a",
  triceps: "#1a0512",
  hamstrings: "#141a05",
};

interface NextSet {
  ex: DayExerciseDto;
  setIndex: number;
  // Present when this set belongs to a superset group — drives the badge and
  // "round r/n" label, matching SupersetBlock's own display in SessionLogger.
  superset?: { round: number; target: number; partnerNames: string[] };
}

// Within a group, the next set to log is whichever partner has the FEWEST
// sets logged so far (ties broken by group order). Since every completed set
// increments that partner's count by exactly one, this greedy rule reproduces
// the real A1 → B1 → A2 → B2 alternation without needing an explicit "round"
// counter, and degrades gracefully if partners have different set targets.
function findNextInGroup(group: DayExerciseDto[], sets: WorkoutSetDto[]): { ex: DayExerciseDto; setIndex: number } | null {
  let best: { ex: DayExerciseDto; setIndex: number; done: number } | null = null;
  for (const g of group) {
    const done = sets.filter((s) => s.exerciseId === g.exerciseId).length;
    if (done >= g.sets) continue;
    if (!best || done < best.done) best = { ex: g, setIndex: done + 1, done };
  }
  return best ? { ex: best.ex, setIndex: best.setIndex } : null;
}

function findNext(
  items: ReturnType<typeof buildItems>,
  sets: WorkoutSetDto[],
  exerciseNames: Map<number, string>,
): NextSet | null {
  for (const item of items) {
    if (item.type === "single") {
      const done = sets.filter((s) => s.exerciseId === item.ex.exerciseId).length;
      if (done < item.ex.sets) return { ex: item.ex, setIndex: done + 1 };
      continue;
    }
    const next = findNextInGroup(item.exs, sets);
    if (!next) continue;
    const perDone = item.exs.map((g) => sets.filter((s) => s.exerciseId === g.exerciseId).length);
    const target = Math.max(...item.exs.map((g) => g.sets));
    const round = Math.min(Math.min(...perDone) + 1, target);
    return {
      ex: next.ex, setIndex: next.setIndex,
      superset: {
        round, target,
        partnerNames: item.exs
          .filter((g) => g.exerciseId !== next.ex.exerciseId)
          .map((g) => exerciseNames.get(g.exerciseId) ?? "…"),
      },
    };
  }
  return null;
}

export function GymFocusMode({
  dayId, dayName, exercises, sets, getSessionId, doneSets, totalSets, volume, elapsedMin, onClose,
}: Props) {
  useBackClose(true, onClose);
  const reducedMotion = useReducedMotion();

  // Screen wake-lock — feature-detected, silently no-ops where unsupported
  // (older iOS Safari) or denied (backgrounded tab).
  useEffect(() => {
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> };
    };
    if (!nav.wakeLock) return;
    let sentinel: { release: () => Promise<void> } | null = null;
    nav.wakeLock.request("screen").then((s) => { sentinel = s; }).catch(() => { /* unsupported/denied */ });
    return () => { void sentinel?.release(); };
  }, []);

  const items = useMemo(() => buildItems(exercises), [exercises]);
  const library = useExerciseLibrary();
  const exerciseNames = useMemo(
    () => new Map(library.filter((e) => e.id != null).map((e) => [e.id as number, e.name])),
    [library],
  );
  const next = findNext(items, sets, exerciseNames);
  const ex = useExercise(next?.ex.exerciseId);
  const ghosts = useGhostSets(dayId, next?.ex.exerciseId ?? -1);
  const usageW = useUsageValue(next ? `weight:${next.ex.exerciseId}` : null);
  const usageR = useUsageValue(next ? `reps:${next.ex.exerciseId}` : null);
  const rest = useRestTimer();

  const lastCompleted = next
    ? sets
      .filter((s) => s.exerciseId === next.ex.exerciseId && s.setIndex < next.setIndex)
      .sort((a, b) => b.setIndex - a.setIndex)[0]
    : undefined;
  const ghost = next ? ghosts?.find((g: WorkoutSetDto) => g.setIndex === next.setIndex) : undefined;

  const baseW = lastCompleted?.weightKg ?? usageW ?? ghost?.weightKg ?? next?.ex.weightKg ?? 0;
  const baseR = lastCompleted?.reps ?? usageR ?? ghost?.reps ?? next?.ex.repLow ?? 0;
  const [w, setW] = useState(baseW);
  const [r, setR] = useState(baseR);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    setW(baseW); setR(baseR); setEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [next?.ex.exerciseId, next?.setIndex]);

  const [justLogged, setJustLogged] = useState(false);

  async function logCurrent() {
    if (!next || !ex || w <= 0 || r <= 0) return;
    unlockAudio();
    const sid = await getSessionId();
    try {
      const { isPR, e1rm } = await logSet({
        sessionId: sid, exerciseId: next.ex.exerciseId, exerciseName: ex.name,
        setIndex: next.setIndex, weightKg: w, reps: r,
      });
      void recordUsage(`weight:${next.ex.exerciseId}`, w);
      void recordUsage(`reps:${next.ex.exerciseId}`, r);
      if (isPR) {
        celebrate({ kind: "pr", title: "New PR", subtitle: `${ex.name} · ${w}kg × ${r} · e1RM ${Math.round(e1rm)}` });
        setJustLogged(true);
        window.setTimeout(() => setJustLogged(false), 900);
      } else {
        void hapticLight();
      }
    } catch (err) {
      console.warn("[GymFocusMode] logSet failed:", err);
    }
  }

  // Undo the most recently logged set (by createdAt, across the whole day —
  // matches "last thing I did", not just the current exercise). Tap-to-arm,
  // tap-again-to-confirm rather than a Popconfirm popover, which would need
  // its own z-index fight against this fullscreen overlay.
  const lastLogged = sets.length > 0 ? sets.slice().sort((a, b) => b.createdAt - a.createdAt)[0] : undefined;
  const [confirmUndo, setConfirmUndo] = useState(false);
  const undoTimerRef = useRef<number | null>(null);
  useEffect(() => () => { if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current); }, []);
  // A newer set landing (either logged normally, or a second undo) invalidates
  // whatever was armed — re-arming against a set the user never saw the label
  // for would delete the wrong thing.
  useEffect(() => { setConfirmUndo(false); }, [lastLogged?.id]);
  function handleUndoTap() {
    if (!lastLogged?.id) return;
    if (!confirmUndo) {
      setConfirmUndo(true);
      void hapticLight();
      undoTimerRef.current = window.setTimeout(() => setConfirmUndo(false), 2500);
      return;
    }
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    setConfirmUndo(false);
    void deleteSet(lastLogged.id);
    // The set being undone may have just started a rest countdown (the
    // underlying ExerciseBlock/SupersetBlock effect fires on every doneCount
    // increase); undoing the set that triggered it should cancel that rest
    // too, or the timer keeps counting down for a set that no longer exists.
    skipRest();
    void hapticLight();
  }

  const allDone = !next;
  const tint = ex ? (MUSCLE_TINT[ex.primaryMuscle] ?? "#1a0509") : "#1a0509";
  const trans = reducedMotion ? { duration: 0.01 } : { duration: 0.28, ease: "easeOut" as const };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, zIndex: 9998, overflow: "hidden", background: "#08060a", color: "#f3eef2" }}
      >
        {/* Muscle-group tint layer — a real crossfade (two stacked gradients,
            opacity tweened) rather than a `transition: background` CSS
            declaration, since browsers don't reliably tween gradient strings
            (especially on iOS Safari, which this app targets via Capacitor). */}
        <AnimatePresence>
          <motion.div
            key={tint}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.6 }}
            style={{
              position: "absolute", inset: 0, zIndex: 0,
              background: `radial-gradient(circle at 50% 30%, ${tint} 0%, #08060a 70%)`,
            }}
          />
        </AnimatePresence>

        <div style={{
          position: "relative", zIndex: 1, height: "100%",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <button onClick={onClose} aria-label="Exit focus mode" style={{
            position: "absolute", top: 8, right: 8, background: "transparent", border: "none",
            color: "#948b98", cursor: "pointer", padding: 12, minWidth: 44, minHeight: 44,
          }}>
            <TbX size={24} />
          </button>

          <div style={{
            fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 12,
            letterSpacing: "0.2em", textTransform: "uppercase", color: "#948b98", marginBottom: 16,
          }}>
            {dayName}
          </div>

          <AnimatePresence mode="wait">
            {allDone ? (
              <CompleteView key="complete" doneSets={doneSets} totalSets={totalSets} volume={volume}
                elapsedMin={elapsedMin} onClose={onClose} trans={trans} reducedMotion={reducedMotion} />
            ) : rest.active ? (
              <RestView key="rest" preview={ex && next ? {
                name: ex.name, weightKg: w, reps: r, setIndex: next.setIndex, totalSets: next.ex.sets,
              } : undefined} trans={trans} reducedMotion={reducedMotion} />
            ) : ex && next ? (
              <SetView
                key={`set-${next.ex.exerciseId}-${next.setIndex}`}
                ex={ex} setIndex={next.setIndex} totalSets={next.ex.sets} superset={next.superset}
                w={w} r={r} setW={setW} setR={setR}
                editing={editing} setEditing={setEditing}
                ghost={ghost} onLog={logCurrent} justLogged={justLogged}
                trans={trans} reducedMotion={reducedMotion}
              />
            ) : null}
          </AnimatePresence>

          <div style={{ marginTop: 28, fontSize: 11, color: "#6b6470", display: "flex", alignItems: "center", gap: 14 }}>
            <span>{doneSets}/{totalSets} sets</span>
            <span>{Math.round(volume).toLocaleString()}kg vol</span>
            <span>{elapsedMin > 0 ? `${elapsedMin}m` : "–"}</span>
            {lastLogged && (
              <button onClick={handleUndoTap} style={{
                display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none",
                color: confirmUndo ? "#ff2740" : "#6b6470", fontWeight: confirmUndo ? 800 : 400,
                cursor: "pointer", fontSize: 11, padding: "6px 4px",
              }}>
                <TbArrowBackUp size={13} /> {confirmUndo ? "tap to confirm" : "undo last"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

type Trans = { duration: number; ease?: "easeOut" };

function SetView({
  ex, setIndex, totalSets, w, r, setW, setR, editing, setEditing, ghost, onLog, justLogged, superset, trans, reducedMotion,
}: {
  ex: ExerciseDto; setIndex: number; totalSets: number;
  w: number; r: number; setW: (n: number) => void; setR: (n: number) => void;
  editing: boolean; setEditing: (b: boolean) => void;
  ghost?: WorkoutSetDto; onLog: () => void; justLogged: boolean;
  superset?: { round: number; target: number; partnerNames: string[] };
  trans: Trans; reducedMotion: boolean;
}) {
  function onDragEnd(_: unknown, info: PanInfo) {
    if (editing) return;
    if (info.offset.y < -50 || info.velocity.y < -500) onLog();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : -12 }}
      transition={trans}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 340 }}>
      {superset && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(255,39,64,0.14)", color: "#ff2740",
          borderRadius: 999, padding: "3px 12px", fontSize: 10, fontWeight: 800,
          letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 10,
        }}>
          <TbArrowsRightLeft size={12} /> Superset · round {superset.round}/{superset.target}
        </div>
      )}
      <div className="display" style={{ fontSize: 24, fontWeight: 800, textAlign: "center", marginBottom: 4 }}>
        {ex.name}
      </div>
      {superset && superset.partnerNames.length > 0 && (
        <div style={{ fontSize: 12, color: "#6b6470", marginBottom: 4 }}>
          then → {superset.partnerNames.join(", ")}
        </div>
      )}
      <div style={{ fontSize: 13, color: "#948b98", marginBottom: 16 }}>Set {setIndex} of {totalSets}</div>

      {!editing && (
        <motion.div
          animate={reducedMotion ? {} : { y: [0, -6, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ color: "#ff2740", marginBottom: 2 }}
        >
          <TbChevronUp size={16} />
        </motion.div>
      )}

      <motion.div
        drag={!editing ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.4}
        onDragEnd={onDragEnd}
        onTap={() => !editing && setEditing(true)}
        whileTap={editing ? undefined : { scale: 0.97 }}
        animate={justLogged && !reducedMotion ? { scale: [1, 1.08, 1] } : {}}
        style={{
          width: 220, height: 220, borderRadius: "50%",
          border: "3px solid #ff2740", boxShadow: "0 0 40px rgba(255,39,64,0.35)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          marginBottom: 20, cursor: "pointer", touchAction: "none",
        }}
      >
        {editing ? (
          <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <Stepper label="kg" value={w} step={2.5} min={0} onChange={setW} />
            <Stepper label="reps" value={r} step={1} min={1} onChange={setR} />
          </div>
        ) : (
          <>
            <div className="display" style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>
              {w}<span style={{ fontSize: 18 }}>kg</span>
            </div>
            <div className="display" style={{ fontSize: 28, fontWeight: 700, color: "#948b98" }}>× {r}</div>
          </>
        )}
      </motion.div>

      {!editing && (
        <div style={{ fontSize: 11, color: "#6b6470", marginBottom: 20, textAlign: "center" }}>
          {ghost ? `last week: ${ghost.weightKg}kg × ${ghost.reps} · ` : ""}swipe up or tap the button to log
        </div>
      )}

      <button
        onClick={editing ? () => setEditing(false) : onLog}
        style={{
          width: "100%", padding: "16px 0", borderRadius: 16, border: "none",
          background: "#ff2740", color: "#fff", fontWeight: 800, fontSize: 16,
          letterSpacing: 0.5, cursor: "pointer", boxShadow: "0 4px 20px rgba(255,39,64,0.4)",
        }}
      >
        {editing ? "CONFIRM" : "LOG SET ⚡"}
      </button>
    </motion.div>
  );
}

const stepperBtnStyle: CSSProperties = {
  width: 44, height: 44, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.08)", color: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};

function Stepper({ label, value, step, min, onChange }: {
  label: string; value: number; step: number; min: number; onChange: (n: number) => void;
}) {
  function bump(delta: number) {
    onChange(Math.max(min, value + delta));
    void hapticLight();
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button onClick={() => bump(-step)} style={stepperBtnStyle} aria-label={`Decrease ${label}`}>
        <TbMinus size={18} />
      </button>
      <span style={{ minWidth: 56, textAlign: "center", fontWeight: 800, fontSize: 18 }}>
        {value}{label === "kg" ? "kg" : ""}
      </span>
      <button onClick={() => bump(step)} style={stepperBtnStyle} aria-label={`Increase ${label}`}>
        <TbPlus size={18} />
      </button>
    </div>
  );
}

function RestView({ preview, trans, reducedMotion }: {
  preview?: { name: string; weightKg: number; reps: number; setIndex: number; totalSets: number };
  trans: Trans; reducedMotion: boolean;
}) {
  const rest = useRestTimer();
  const pct = rest.totalSec > 0 ? (1 - rest.remaining / rest.totalSec) * 100 : 0;
  const m = Math.floor(rest.remaining / 60);
  const s = String(rest.remaining % 60).padStart(2, "0");

  // Countdown tick in the last 3 seconds — audible cue so you don't have to
  // be looking at the phone to know rest is ending. Fires once per second
  // (the store ticks every 250ms), not gated on reducedMotion since it's
  // sound, not motion.
  const lastTickRef = useRef<number | null>(null);
  useEffect(() => {
    if (!rest.active || rest.paused) return;
    if (rest.remaining <= 3 && rest.remaining >= 1 && rest.remaining !== lastTickRef.current) {
      lastTickRef.current = rest.remaining;
      playTick();
    }
    if (rest.remaining > 3) lastTickRef.current = null;
  }, [rest.remaining, rest.active, rest.paused]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.95 }} animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.95 }} transition={trans}
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontSize: 13, color: "#948b98", marginBottom: 16, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
        {rest.paused ? "Paused" : "Rest"}
      </div>
      <div
        onClick={() => (rest.paused ? resumeRest() : pauseRest())}
        role="button" aria-label={rest.paused ? "Resume rest" : "Pause rest"}
        style={{ position: "relative", width: 220, height: 220, cursor: "pointer", marginBottom: 20 }}
      >
        <svg viewBox="0 0 220 220" width="220" height="220">
          <circle cx="110" cy="110" r="98" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <circle cx="110" cy="110" r="98" fill="none" stroke={rest.color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 98} strokeDashoffset={2 * Math.PI * 98 * (1 - pct / 100)}
            transform="rotate(-90 110 110)" style={{ transition: "stroke-dashoffset 0.3s linear" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div className="display" style={{ fontSize: 42, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{m}:{s}</div>
          <div style={{ fontSize: 11, color: "#948b98" }}>{rest.label}</div>
        </div>
      </div>
      <button onClick={skipRest} style={{
        padding: "10px 24px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(255,255,255,0.08)", color: "#fff", fontWeight: 700, cursor: "pointer", marginBottom: preview ? 20 : 0,
      }}>
        Skip rest
      </button>
      {preview && (
        <div style={{
          textAlign: "center", padding: "10px 16px", borderRadius: 12,
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: "#6b6470", marginBottom: 3 }}>
            Up next · set {preview.setIndex}/{preview.totalSets}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            {preview.name} — {preview.weightKg}kg × {preview.reps}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function CompleteView({ doneSets, totalSets, volume, elapsedMin, onClose, trans, reducedMotion }: {
  doneSets: number; totalSets: number; volume: number; elapsedMin: number; onClose: () => void;
  trans: Trans; reducedMotion: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }} transition={trans}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <motion.div
        initial={reducedMotion ? undefined : { scale: 0.5, rotate: -10 }}
        animate={reducedMotion ? undefined : { scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 12 }}
      >
        <TbTrophy size={56} style={{ color: "#f6b93b", marginBottom: 12 }} />
      </motion.div>
      <div className="display" style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Session complete</div>
      <div style={{ fontSize: 13, color: "#948b98", marginBottom: 24 }}>
        {doneSets}/{totalSets} sets · {Math.round(volume).toLocaleString()}kg · {elapsedMin}m
      </div>
      <button onClick={onClose} style={{
        padding: "14px 32px", borderRadius: 14, border: "none", background: "#ff2740",
        color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
      }}>
        Finish
      </button>
    </motion.div>
  );
}
