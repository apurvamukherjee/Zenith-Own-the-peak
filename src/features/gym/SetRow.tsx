import { useEffect, useState } from "react";
import { App } from "antd";
import { motion, useAnimationControls, type PanInfo } from "framer-motion";
import { TbCheck, TbTrophy, TbTrendingDown } from "react-icons/tb";
import type { DayExerciseDto, WorkoutSetDto } from "../../db/types";
import { logSet, updateSet, deleteSet, restoreSet } from "./useGym";
import { celebrate } from "../../lib/celebrate";
import { unlockAudio } from "../../lib/audio";
import { hapticLight, hapticMedium } from "../../lib/haptics";
import { useUsageValue, recordUsage } from "../../hooks/useUsageHistory";
import { SetSheet, type SetDraft } from "./SetSheet";

const SWIPE_DELETE_PX = 90;

export function SetHeader() {
  return (
    <div className="st-row st-row--head" aria-hidden>
      <span>Set</span><span>Kg</span><span>Reps</span><span>Prev</span><span />
    </div>
  );
}

export function SetRow({
  plan, exerciseName, exerciseId, setIndex, logged, ghost, lastCompleted, active, step, getSessionId,
}: {
  plan: DayExerciseDto; exerciseName: string; exerciseId: number; setIndex: number;
  logged?: WorkoutSetDto; ghost?: WorkoutSetDto;
  lastCompleted?: WorkoutSetDto;  // most recent completed set in THIS session (predictive)
  active: boolean;                 // first pending set of the exercise — the one you're about to do
  step: number;
  getSessionId: () => Promise<number>;
}) {
  const { message } = App.useApp();
  // Autofill priority: (1) last completed set in this session (the user just
  // dialed it in), (2) usageHistory (last-ever value), (3) ghost from previous
  // session, (4) planned baseline.
  const usageW = useUsageValue(`weight:${exerciseId}`);
  const usageR = useUsageValue(`reps:${exerciseId}`);
  const baseW = lastCompleted?.weightKg ?? usageW ?? ghost?.weightKg ?? plan.weightKg;
  const baseR = lastCompleted?.reps ?? usageR ?? ghost?.reps ?? plan.repLow;

  const [draft, setDraft] = useState<SetDraft>({ weightKg: baseW, reps: baseR, drops: [] });
  // Re-seed while untouched so a just-logged previous set flows into this row.
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (!logged && !touched) setDraft((d) => ({ ...d, weightKg: baseW, reps: baseR }));
  }, [baseW, baseR, logged, touched]);

  const [sheet, setSheet] = useState(false);
  const controls = useAnimationControls();

  function editDraft(d: SetDraft) { setTouched(true); setDraft(d); }

  function openEditor() {
    if (logged) setDraft({ weightKg: logged.weightKg, reps: logged.reps, drops: logged.dropStages ?? [] });
    setSheet(true);
  }

  const validDrops = (d: SetDraft) => {
    const v = d.drops.filter((s) => s.weightKg > 0 && s.reps > 0);
    return v.length ? v : undefined;
  };

  async function complete() {
    if (draft.weightKg <= 0 || draft.reps <= 0) return;
    // Warm WebAudio on a user gesture, or the first rest-timer beep is silent.
    unlockAudio();
    const sid = await getSessionId();
    const { isPR, e1rm } = await logSet({
      sessionId: sid, exerciseId, exerciseName, setIndex,
      weightKg: draft.weightKg, reps: draft.reps, dropStages: validDrops(draft),
    });
    void recordUsage(`weight:${exerciseId}`, draft.weightKg);
    void recordUsage(`reps:${exerciseId}`, draft.reps);
    if (isPR) {
      celebrate({ kind: "pr", title: "New PR", subtitle: `${exerciseName} · ${draft.weightKg}kg × ${draft.reps} · e1RM ${Math.round(e1rm)}` });
    }
    setSheet(false);
  }

  async function saveEdit() {
    if (!logged?.id || draft.weightKg <= 0 || draft.reps <= 0) return;
    await updateSet(logged.id, { weightKg: draft.weightKg, reps: draft.reps, dropStages: validDrops(draft) });
    void hapticLight();
    setSheet(false);
  }

  async function remove() {
    if (!logged?.id) return;
    const snapshot = logged;
    await deleteSet(logged.id);
    void hapticMedium();
    setSheet(false);
    message.open({
      type: "info", duration: 6, key: `undo-${snapshot.id}`,
      content: (
        <span>Set {setIndex} deleted{" "}
          <button type="button" className="st-undo" onClick={() => { void restoreSet(snapshot); message.destroy(`undo-${snapshot.id}`); }}>Undo</button>
        </span>
      ),
    });
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -SWIPE_DELETE_PX) void remove();
    else void controls.start({ x: 0 });
  }

  const sheetEl = (
    <SetSheet
      open={sheet} onClose={() => setSheet(false)} title={exerciseName} setIndex={setIndex}
      draft={draft} onDraft={editDraft} step={step} repRange={[plan.repLow, plan.repHigh]} ghost={ghost}
      primaryLabel={logged ? "Save set" : "Log set"} onPrimary={logged ? saveEdit : complete}
      onDelete={logged ? remove : undefined}
    />
  );

  const prev = ghost ? `${ghost.weightKg}×${ghost.reps}` : "—";

  if (logged) {
    // A set under last session's e1RM at the same index is called out — every
    // set is a challenge against your own history. PR wins over "weaker".
    const weaker = !logged.isPR && !!ghost && logged.e1rm < ghost.e1rm;
    const drops = logged.dropStages ?? [];
    const fresh = Date.now() - logged.createdAt < 1500;
    return (
      <div className="st-swipe">
        <div className="st-swipe__bg" aria-hidden>Delete</div>
        <motion.div
          className={`st-row st-row--done${logged.isPR ? " is-pr" : ""}`}
          drag="x" dragConstraints={{ left: -140, right: 0 }} dragElastic={0.1}
          animate={controls} onDragEnd={onDragEnd}
        >
          {fresh && <motion.span className="st-flash" aria-hidden initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.7 }} />}
          <span className="st-idx">{logged.isPR ? <TbTrophy className="st-pr" /> : setIndex}</span>
          <button type="button" className="st-cell st-cell--done" onClick={openEditor} aria-label={`Edit set ${setIndex} weight`}>
            {logged.weightKg}{drops.length > 0 && <sup className="st-drop">↓{drops.length}</sup>}
          </button>
          <button type="button" className="st-cell st-cell--done" onClick={openEditor} aria-label={`Edit set ${setIndex} reps`}>
            {logged.reps}{weaker && <TbTrendingDown className="st-weak" aria-label="Weaker than last time" />}
          </button>
          <span className="st-prev">{prev}</span>
          <button type="button" className="st-check is-done" onClick={openEditor} aria-label={`Edit set ${setIndex}`}><TbCheck size={20} /></button>
        </motion.div>
        {sheetEl}
      </div>
    );
  }

  return (
    <div className={`st-row${active ? " is-active" : ""}`}>
      <span className="st-idx">{setIndex}</span>
      <button type="button" className="st-cell" onClick={openEditor} aria-label={`Set ${setIndex} weight, ${draft.weightKg} kg`}>
        {draft.weightKg}{draft.drops.length > 0 && <sup className="st-drop">↓{draft.drops.length}</sup>}
      </button>
      <button type="button" className="st-cell" onClick={openEditor} aria-label={`Set ${setIndex} reps, ${draft.reps}`}>
        {draft.reps}
      </button>
      <button type="button" className="st-prev st-prev--btn" disabled={!ghost} aria-label="Copy last session's set"
        onClick={() => ghost && editDraft({ ...draft, weightKg: ghost.weightKg, reps: ghost.reps })}>{prev}</button>
      <button type="button" className="st-check" onClick={() => complete().catch((e: unknown) => message.error(`Couldn't log set: ${e instanceof Error ? e.message : String(e)}`))} aria-label={`Complete set ${setIndex}`}>
        <TbCheck size={20} />
      </button>
      {sheetEl}
    </div>
  );
}
