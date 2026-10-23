import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { App, Button, Dropdown, Popconfirm } from "antd";
import { motion } from "framer-motion";
import { TbCheck, TbChecks, TbChevronUp, TbMoon, TbQuote, TbArrowsRightLeft, TbFocus2, TbList, TbLink, TbUnlink, TbPlus, TbDots, TbPlayerTrackNext, TbPlayerSkipForward, TbArrowBackUp } from "react-icons/tb";
import { RestDock } from "./RestDock";
import { GymFocusMode } from "../../components/GymFocusMode";
import { PageTransition } from "../../components/PageTransition";
import { Hero } from "../../components/ui/Hero";
import { Rings } from "../../components/ui/Rings";
import { TrainingHeroBg } from "../dashboard/TrainingHeroArt";
import "./train.css";
import { useTokens } from "../../hooks/useTokens";
import { MuscleGlyph } from "../../components/BodyMap";
import type { DayExerciseDto, ExerciseDto, WorkoutSetDto } from "../../db/types";
import {
  useWorkoutDays, useDayExercises, useTodayDayId, useTodaySession,
  useSessionSets, useGhostSets, useExercise, useExerciseLibrary, ensureSession,
  completeRemainingSets, completeAllRemainingForDay, toggleSupersetLink,
  updateSessionArrangement, useLastSessionVolume,
} from "./useGym";
import { AddExerciseSheet } from "./AddExerciseSheet";
import { SessionSummary } from "./SessionSummary";
import { MuscleTargets } from "./MuscleTargets";
import { muscleLoad } from "./muscleLoad";
import { SupersetPicker } from "./SupersetPicker";
import { SetRow, SetHeader } from "./SetRow";
import { LEG_MUSCLES } from "./useOverloadSuggestions";
import { useActivePlan } from "./usePlans";
import { buildItems, findNextSet, findNextInGroup, arrangeForToday, doNextOrder, flattenItems, itemKey } from "./groupExercises";
import { prettyDate, todayKey } from "../../lib/date.utils";
import { db } from "../../db/db";
import { skipRest, startRest } from "../../lib/restTimerStore";
import { CoachMark } from "../../components/CoachMark";
import { useSetting, setSetting } from "../../hooks/useSettings";
import { useReducedMotion } from "../../hooks/useReducedMotion";

// -----------------------------------------------------------------------------
// SessionLogger — the "execute today's workout" surface.
//
// Phase-3 changes:
//   • Rest timer lives in the global store (lib/restTimerStore.ts). Blocks
//     call `startRest()` when a set completes; RestDock (pinned above the nav)
//     renders it here, GlobalRestChip everywhere else.
//   • PR moments fire the `celebrate` emitter, painting a gold overlay via
//     the mounted <PRCelebration/> in AppShell.
//   • Supersets: exercises sharing `supersetGroupId` render as ONE card with
//     both headers. Only the partner that's up next has a live row, so the
//     highlight hops A → B → rest. Rest fires only after the LAST partner
//     completes its set. Supersets can be linked mid-workout (SupersetPicker).
// -----------------------------------------------------------------------------

// Shared set table — header + one row per planned set.
function SetTable({ plan, ex, dayId, done, getSessionId, activeSet }: {
  plan: DayExerciseDto; ex: ExerciseDto; dayId: number; done: WorkoutSetDto[]; getSessionId: () => Promise<number>;
  activeSet?: number | null;  // override for supersets; default = first pending set
}) {
  const ghosts = useGhostSets(dayId, plan.exerciseId);
  const step = LEG_MUSCLES.has(ex.primaryMuscle) ? 5 : 2.5;
  const indices = Array.from({ length: plan.sets }, (_, i) => i + 1);
  const firstPending = activeSet !== undefined ? activeSet : indices.find((si) => !done.some((s) => s.setIndex === si));
  return (
    <div className="st">
      <SetHeader />
      {indices.map((si) => (
        <SetRow
          key={si} plan={plan} exerciseName={ex.name} exerciseId={plan.exerciseId} setIndex={si}
          logged={done.find((s) => s.setIndex === si)}
          ghost={ghosts.find((g) => g.setIndex === si)}
          lastCompleted={done.filter((s) => s.setIndex < si).sort((a, b) => b.setIndex - a.setIndex)[0]}
          active={si === firstPending} step={step} getSessionId={getSessionId}
        />
      ))}
    </div>
  );
}

// Segmented progress — one tick per planned set.
function Ticks({ done, total }: { done: number; total: number }) {
  return (
    <div className="xb-ticks" role="img" aria-label={`${done} of ${total} sets done`}>
      {Array.from({ length: total }, (_, i) => <span key={i} className={i < done ? "is-on" : ""} />)}
    </div>
  );
}

function FinishAll({ plan, done, getSessionId }: { plan: DayExerciseDto; done: WorkoutSetDto[]; getSessionId: () => Promise<number> }) {
  if (done.length >= plan.sets) return null;
  return (
    <Button size="small" type="text" icon={<TbChecks size={16} />} className="xb-all"
      aria-label="Complete all sets for this exercise" title="Complete all sets"
      onClick={async () => {
        const sid = await getSessionId();
        await completeRemainingSets(sid, plan, done.map((s) => s.setIndex));
      }} />
  );
}

// Per-block actions. `onDoNext` is omitted when the block is already up next.
interface BlockActions { onLink: () => void; onDoNext?: () => void; onSkip: () => void; }

type MenuEntry = { key: string; label: string; icon: ReactNode; run: () => void; danger?: boolean };
function BlockMenu({ entries, label }: { entries: MenuEntry[]; label: string }) {
  return (
    <Dropdown trigger={["click"]} placement="bottomRight"
      menu={{
        items: entries.map(({ key, label: l, icon, danger }) => ({ key, label: l, icon, danger })),
        onClick: ({ key }) => entries.find((e) => e.key === key)?.run(),
      }}>
      <button type="button" className="xb-icon" aria-label={label}><TbDots size={18} /></button>
    </Dropdown>
  );
}

// Finished blocks fold to one line so the full plan stays scannable, and
// finishing one glides the list on to the next block.
function useDoneFold(allDone: boolean, fresh: boolean) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const wasDone = useRef(allDone);
  useEffect(() => {
    if (allDone && !wasDone.current && fresh) {
      // Blocks sit in a keyed .tr-slot wrapper; the next slot is the target.
      ref.current?.parentElement?.nextElementSibling?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }
    wasDone.current = allDone;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone, reduced]);
  return { ref, folded: allDone && !expanded, setExpanded };
}

function FoldedBlock({ order, name, detail, onOpen }: { order: number; name: string; detail: string; onOpen: () => void }) {
  return (
    <button type="button" className="xb-fold" onClick={onOpen} aria-expanded={false} aria-label={`${name}, done. Show sets`}>
      <span className="xb-no">{String(order).padStart(2, "0")}</span>
      <span className="xb-fold__name">{name}</span>
      <span className="xb-fold__detail">{detail}</span>
      <span className="xb-fold__ok"><TbCheck size={14} /></span>
    </button>
  );
}

function Refold({ onFold }: { onFold: () => void }) {
  return (
    <button type="button" className="xb-refold" onClick={onFold} aria-label="Collapse" aria-expanded>
      <TbChevronUp size={16} />
    </button>
  );
}

// A count bump only means "just logged" if the newest set is fresh — the live
// query lands after first render, so a reload mid-session also bumps 0 → N.
const JUST_LOGGED_MS = 5_000;
const justLogged = (done: WorkoutSetDto[]) => done.some((s) => Date.now() - s.createdAt < JUST_LOGGED_MS);

const topSet = (done: WorkoutSetDto[]) => done.reduce<WorkoutSetDto | undefined>((b, s) => (!b || s.e1rm > b.e1rm ? s : b), undefined);

// ---- Single-exercise block (default rendering) ----
function ExerciseBlock({ plan, order, dayId, sets, getSessionId, actions, dayDone }: {
  plan: DayExerciseDto; order: number; dayId: number; sets: WorkoutSetDto[]; getSessionId: () => Promise<number>;
  actions: BlockActions; dayDone: boolean;
}) {
  const ex = useExercise(plan.exerciseId);
  const t = useTokens();
  const doneCountRef = useRef(0);

  const done = sets.filter((s) => s.exerciseId === plan.exerciseId);
  const doneCount = done.length;
  const allDone = doneCount >= plan.sets;

  // A freshly logged set starts rest — including the last set of an exercise
  // (you rest before the next one too), but not the last set of the day.
  useEffect(() => {
    if (doneCount > doneCountRef.current && !dayDone && ex && justLogged(done)) {
      startRest(plan.restSec, t.accent, ex.name);
    }
    doneCountRef.current = doneCount;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneCount, dayDone, plan.restSec, t.accent, ex]);
  const { ref, folded, setExpanded } = useDoneFold(allDone, justLogged(done));

  if (!ex) return null;

  if (folded) {
    const best = topSet(done);
    return (
      <motion.section ref={ref} className="xb xb--folded" aria-label={ex.name}>
        <FoldedBlock order={order} name={ex.name} onOpen={() => setExpanded(true)}
          detail={best ? `${doneCount} sets · top ${best.weightKg}×${best.reps}` : `${doneCount} sets`} />
      </motion.section>
    );
  }

  return (
    <motion.section ref={ref} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`xb${allDone ? " is-done" : ""}`} aria-label={ex.name}>
      <header className="xb-head">
        <span className="xb-no">{String(order).padStart(2, "0")}</span>
        <div className="xb-title">
          <h3 title={ex.name}>{ex.name}</h3>
          <div className="xb-meta">
            <MuscleGlyph muscle={ex.primaryMuscle} size={18} />
            {plan.sets} × {plan.repLow}–{plan.repHigh} · {plan.restSec}s rest
          </div>
        </div>
        {allDone ? <Refold onFold={() => setExpanded(false)} /> : (
          <BlockMenu label={`${ex.name} options`} entries={[
            ...(actions.onDoNext ? [{ key: "next", label: "Do this next", icon: <TbPlayerTrackNext />, run: actions.onDoNext }] : []),
            { key: "link", label: "Superset with…", icon: <TbLink />, run: actions.onLink },
            { key: "all", label: "Complete all sets", icon: <TbChecks />, run: () => void getSessionId().then((sid) => completeRemainingSets(sid, plan, done.map((s) => s.setIndex))) },
            { key: "skip", label: "Skip today", icon: <TbPlayerSkipForward />, run: actions.onSkip, danger: true },
          ]} />
        )}
      </header>
      <Ticks done={doneCount} total={plan.sets} />
      {ex.cues && !allDone && <div className="xb-cue">{ex.cues}</div>}
      <SetTable plan={plan} ex={ex} dayId={dayId} done={done} getSessionId={getSessionId} />
    </motion.section>
  );
}

// ---- Superset block — two or more exercises alternating in one card ----
function SupersetBlock({ group, order, dayId, sets, getSessionId, actions, dayDone }: {
  group: DayExerciseDto[]; order: number; dayId: number; sets: WorkoutSetDto[]; getSessionId: () => Promise<number>;
  actions: BlockActions; dayDone: boolean;
}) {
  const t = useTokens();
  const { message } = App.useApp();
  const doneCountsRef = useRef<number[]>(group.map(() => 0));

  // A full round = one set of each partner. Rest fires only when the last
  // partner completes its set for the current round (A → B → rest).
  const perExerciseDone = group.map((g) => sets.filter((s) => s.exerciseId === g.exerciseId).length);
  const targetSets = Math.max(...group.map((g) => g.sets));
  const roundsCompleted = Math.min(...perExerciseDone);
  const allDone = roundsCompleted >= targetSets;
  const restSec = group[group.length - 1].restSec;

  useEffect(() => {
    const prev = doneCountsRef.current;
    const last = group.length - 1;
    const lastSets = sets.filter((s) => s.exerciseId === group[last].exerciseId);
    if (perExerciseDone[last] > prev[last] && !dayDone && justLogged(lastSets)) {
      startRest(restSec, t.accent, "Superset");
    }
    doneCountsRef.current = perExerciseDone.slice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perExerciseDone.join(",")]);
  const groupSets = sets.filter((s) => group.some((g) => g.exerciseId === s.exerciseId));
  const fresh = justLogged(groupSets);
  const { ref, folded, setExpanded } = useDoneFold(allDone, fresh);
  const library = useExerciseLibrary();
  const names = group.map((g) => library.find((e) => e.id === g.exerciseId)?.name ?? "…");
  const next = findNextInGroup(group, sets);

  async function unlink() {
    if (!group[0].id || !group[1].id) return;
    await toggleSupersetLink(group[0].id, group[1].id);
    message.info("Superset unlinked");
  }

  if (folded) {
    return (
      <motion.section ref={ref} className="xb xb--folded" aria-label="Superset">
        <FoldedBlock order={order} name={names.join(" + ")} detail={`Superset · ${targetSets} rounds`} onOpen={() => setExpanded(true)} />
      </motion.section>
    );
  }

  return (
    <motion.section ref={ref} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`xb xb--ss${allDone ? " is-done" : ""}`} aria-label="Superset">
      <div className="xb-ss-tag">
        <span className="xb-no">{String(order).padStart(2, "0")}</span>
        <TbArrowsRightLeft size={13} /> Superset
        <span className="xb-ss-round">{allDone ? "Done" : `Round ${roundsCompleted + 1}/${targetSets}`}</span>
        {allDone ? <Refold onFold={() => setExpanded(false)} /> : (
          <BlockMenu label="Superset options" entries={[
            ...(actions.onDoNext ? [{ key: "next", label: "Do this next", icon: <TbPlayerTrackNext />, run: actions.onDoNext }] : []),
            { key: "add", label: "Add exercise to superset", icon: <TbPlus />, run: actions.onLink },
            { key: "unlink", label: "Unlink", icon: <TbUnlink />, run: () => void unlink() },
            { key: "skip", label: "Skip today", icon: <TbPlayerSkipForward />, run: actions.onSkip, danger: true },
          ]} />
        )}
      </div>
      {group.map((plan, gIdx) => (
        <SupersetPartner key={plan.id} plan={plan} letter={String.fromCharCode(65 + gIdx)}
          dayId={dayId} sets={sets} isLastInGroup={gIdx === group.length - 1} getSessionId={getSessionId}
          nextSetIndex={next && next.ex.id === plan.id ? next.setIndex : null} fresh={fresh} />
      ))}
    </motion.section>
  );
}

// Partner inside a superset. Same as ExerciseBlock but WITHOUT its own
// auto-rest effect — the wrapping SupersetBlock owns rest triggering.
function SupersetPartner({ plan, letter, dayId, sets, getSessionId, isLastInGroup, nextSetIndex, fresh }: {
  plan: DayExerciseDto; letter: string; dayId: number; sets: WorkoutSetDto[];
  getSessionId: () => Promise<number>; isLastInGroup: boolean;
  nextSetIndex: number | null;  // set to do now if this partner is up, else null
  fresh: boolean;               // a set in this superset was just logged
}) {
  const ex = useExercise(plan.exerciseId);
  const done = sets.filter((s) => s.exerciseId === plan.exerciseId);
  const isNext = nextSetIndex != null;
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const wasNext = useRef(isNext);
  // Logging A hands the turn to B — bring B on screen if the card is tall.
  useEffect(() => {
    if (isNext && !wasNext.current && fresh) ref.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
    wasNext.current = isNext;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNext, reduced]);
  if (!ex) return null;

  return (
    <div ref={ref} className={`xb-partner${isNext ? " is-next" : ""}`}>
      <header className="xb-head">
        <span className="xb-letter">{letter}</span>
        <div className="xb-title">
          <h3 title={ex.name}>{ex.name}</h3>
          <div className="xb-meta">
            {plan.sets} × {plan.repLow}–{plan.repHigh}{isLastInGroup ? ` · ${plan.restSec}s rest after round` : " · straight into next"}
          </div>
        </div>
        <FinishAll plan={plan} done={done} getSessionId={getSessionId} />
      </header>
      {isNext && <div className="xb-now">Now · set {nextSetIndex}</div>}
      <Ticks done={done.length} total={plan.sets} />
      <SetTable plan={plan} ex={ex} dayId={dayId} done={done} getSessionId={getSessionId} activeSet={nextSetIndex} />
    </div>
  );
}


export function SessionLogger() {
  const plan = useActivePlan();
  const days = useWorkoutDays();
  const todayDayId = useTodayDayId();
  const [activeDayId, setActiveDayId] = useState<number | null>(null);
  const dayId = activeDayId ?? todayDayId;

  useEffect(() => { if (todayDayId && !activeDayId) setActiveDayId(todayDayId); }, [todayDayId, activeDayId]);

  const dayPlan = days.find((d) => d.id === dayId);
  const exercises = useDayExercises(dayId ?? undefined);
  const session = useTodaySession(dayId);
  const sets = useSessionSets(session?.id);
  const sessionIdRef = useRef<number | undefined>(session?.id);
  useEffect(() => { sessionIdRef.current = session?.id; }, [session?.id]);

  // Today's arrangement (skips + "do next" order) sits on the session row and
  // never touches the plan. Everything below works off `todayExercises`.
  const { active: items, skipped: skippedItems } = useMemo(
    () => arrangeForToday(buildItems(exercises), session?.todayOrder, session?.skipped),
    [exercises, session?.todayOrder, session?.skipped],
  );
  const todayExercises = useMemo(() => flattenItems(items), [items]);
  const activeIds = new Set(todayExercises.map((e) => e.exerciseId));

  const totalSets = todayExercises.reduce((s, e) => s + e.sets, 0);
  const doneSets = sets.filter((x) => activeIds.has(x.exerciseId)).length;
  const pct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;
  const volume = sets.reduce((s, x) => s + x.weightKg * x.reps, 0);
  const focusOn = Number(useSetting("gymFocusMode")) === 1;
  // Nothing left to rest for. Also catches "Complete full day", whose
  // one-by-one writes pass through not-yet-done renders that start a rest.
  const dayDone = totalSets > 0 && pct >= 100;
  useEffect(() => { if (dayDone) skipRest(); }, [dayDone]);

  // Session clock is derived from the logged sets themselves, so it survives
  // reloads and navigation: first set → now while training, first → last set
  // once the day is done (leaving the tab open afterwards doesn't inflate it).
  const firstAt = sets.length ? Math.min(...sets.map((x) => x.createdAt)) : null;
  const lastAt = sets.length ? Math.max(...sets.map((x) => x.createdAt)) : null;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  const elapsedMin = firstAt ? Math.max(0, Math.round(((pct >= 100 ? lastAt! : now) - firstAt) / 60_000)) : 0;

  const spanRef = useRef<{ first: number; last: number } | null>(null);
  useEffect(() => { spanRef.current = firstAt && lastAt ? { first: firstAt, last: lastAt } : null; }, [firstAt, lastAt]);
  useEffect(() => () => {
    const span = spanRef.current;
    if (!span || !sessionIdRef.current) return;
    const mins = Math.round((span.last - span.first) / 60_000);
    if (mins > 0 && mins < 300) void db.workoutSessions.update(sessionIdRef.current, { durationMin: mins });
  }, []);

  const library = useExerciseLibrary();
  const load = muscleLoad(dayPlan?.muscles ?? [], todayExercises, library, sets);
  const names = useMemo(() => new Map(library.map((e) => [e.id ?? -1, e.name])), [library]);
  const [linkAnchor, setLinkAnchor] = useState<DayExerciseDto | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const prevVolume = useLastSessionVolume(dayId);
  const next = findNextSet(items, sets);
  const upNext = next ? `${names.get(next.ex.exerciseId) ?? "…"} · set ${next.setIndex}` : undefined;
  const nextKey = next ? itemKey(items.find((i) => (i.type === "single" ? [i.ex] : i.exs).includes(next.ex))!) : undefined;
  const reduced = useReducedMotion();
  const { message } = App.useApp();
  const itemName = (i: ReturnType<typeof buildItems>[number]) =>
    (i.type === "single" ? [i.ex] : i.exs).map((e) => names.get(e.exerciseId) ?? "…").join(" + ");

  async function skipToday(key: number) {
    const sid = await getSessionId();
    await updateSessionArrangement(sid, { skipped: [...(session?.skipped ?? []), key] });
  }
  async function restore(key: number) {
    const sid = await getSessionId();
    await updateSessionArrangement(sid, { skipped: (session?.skipped ?? []).filter((k) => k !== key) });
  }
  async function doNext(key: number) {
    const sid = await getSessionId();
    await updateSessionArrangement(sid, { todayOrder: doNextOrder(items.map(itemKey), key, nextKey) });
    message.success("Moved up next");
    // Wait a frame for the live query to re-render the new order, then jump to it.
    window.setTimeout(() => document.querySelector(`[data-key="${key}"]`)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }), 120);
  }
  const actionsFor = (item: ReturnType<typeof buildItems>[number]): BlockActions => {
    const key = itemKey(item);
    return {
      onLink: () => setLinkAnchor(item.type === "single" ? item.ex : item.exs[item.exs.length - 1]),
      onDoNext: key === nextKey ? undefined : () => void doNext(key),
      onSkip: () => void skipToday(key),
    };
  };

  async function getSessionId(): Promise<number> {
    if (sessionIdRef.current) return sessionIdRef.current;
    if (!dayId) throw new Error("No day");
    const id = await ensureSession(dayId);
    sessionIdRef.current = id;
    return id;
  }

  async function completeWholeDay() {
    const sid = await getSessionId();
    await completeAllRemainingForDay(sid, todayExercises, sets);
  }

  const isRest = !dayId || dayId === 0;
  const coachDone = Number(useSetting("coachLogger"));
  const [coachStep, setCoachStep] = useState(coachDone ? -1 : 0);

  const COACH_STEPS = [
    { title: "Log a set", body: "Tap the check to log the set as shown. Tap the weight or reps to adjust them — or tap PREV to copy last session. Rest starts automatically." },
    { title: "Shape today", body: "The ⋯ on any exercise: superset it with another, do it next, or skip it today. Skips and reordering only affect today — your plan stays as it is." },
    { title: "Fix a mistake", body: "Tap a logged set to edit it, or swipe it left to delete." },
  ];

  return (
    <>
      <PageTransition>
        {coachStep >= 0 && !isRest && (
          <CoachMark
            steps={COACH_STEPS}
            current={coachStep}
            onNext={() => setCoachStep((s) => s + 1)}
            onDone={() => { setCoachStep(-1); void setSetting("coachLogger", 1); }}
          />
        )}
        <Hero tone={isRest ? "surface" : "ember"} embers={!isRest} className="tr-hero">
          {!isRest && <TrainingHeroBg />}
          <div className="tr-hero__content">
            <div className="tr-hero__head">
              <span className="gothic-eyebrow">{plan?.name ?? "Session"} · {prettyDate(todayKey())}</span>
              <Link to="/quotes" className="tr-hero__quote" aria-label="Motivation quotes"><TbQuote size={18} /></Link>
            </div>
            <div className="tr-hero__row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="z-hero__title">{isRest ? "Rest day" : dayPlan?.name ?? "Session"}</div>
                {isRest && <div className="z-hero__sub">Muscle is built between sessions. Pick a day below to train anyway.</div>}
              </div>
              {!isRest && totalSets > 0 && (
                <Rings size={76} stroke={7} rings={[{ key: "s", pct, color: ["#ffffff", "#ffd76b"] }]}>
                  <span className="tr-hero__pct">{pct}%</span>
                </Rings>
              )}
            </div>
            {!isRest && totalSets > 0 && (
              <div className="tr-hero__bar">
                <div className="tr-stats">
                  <div><b>{doneSets}<small>/{totalSets}</small></b><span>Sets</span></div>
                  <div><b>{Math.round(volume).toLocaleString()}</b><span>Kg moved</span></div>
                  <div><b>{elapsedMin}<small>m</small></b><span>Time</span></div>
                </div>
                {pct < 100 && (
                  <Popconfirm title="Complete the full day?" description="Logs every remaining set at planned weight/reps."
                    okText="Complete" cancelText="Cancel" onConfirm={completeWholeDay}>
                    <button type="button" className="tr-hero__all" aria-label="Complete full day routine" title="Complete full day">
                      <TbChecks size={16} /> All
                    </button>
                  </Popconfirm>
                )}
              </div>
            )}
          </div>
        </Hero>

        {!isRest && totalSets > 0 && (
          <div className="tr-mode" role="radiogroup" aria-label="Workout view">
            <button type="button" role="radio" aria-checked={!focusOn} className={!focusOn ? "is-on" : ""}
              onClick={() => setSetting("gymFocusMode", 0)}><TbList size={15} /> Full plan</button>
            <button type="button" role="radio" aria-checked={focusOn} className={focusOn ? "is-on" : ""}
              onClick={() => setSetting("gymFocusMode", 1)}><TbFocus2 size={15} /> Focus</button>
          </div>
        )}

        {days.length > 0 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
            {[...days.map((d) => ({ id: d.id!, name: d.name })), { id: 0, name: "Rest" }].map((d) => {
              const selected = (dayId ?? 0) === d.id;
              const isToday = (todayDayId ?? 0) === d.id;
              return (
                <button key={d.id} onClick={() => setActiveDayId(d.id)} style={{
                  flexShrink: 0, cursor: "pointer", borderRadius: 999, padding: "7px 16px",
                  fontSize: 13, fontWeight: 700, position: "relative",
                  background: selected ? "var(--accent)" : "var(--surface)",
                  color: selected ? "#fff" : "var(--ink)",
                  border: selected ? "1px solid var(--accent)" : "1px solid var(--border)",
                }}>
                  {d.name}
                  {isToday && (
                    <span style={{
                      position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%",
                      background: selected ? "#fff" : "var(--accent)", border: "1px solid var(--bg)",
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {isRest ? (
          <div style={{
            textAlign: "center", padding: "48px 24px", color: "var(--ink-soft)",
            background: "var(--surface)", borderRadius: 18, border: "1px solid var(--border)",
          }}>
            <div style={{ marginBottom: 10 }}><TbMoon size={48} style={{ color: "var(--accent)" }} /></div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>Recovery day</div>
            <div style={{ marginTop: 4 }}>Muscle grows now, not in the gym.</div>
          </div>
        ) : (
          <>
            <MuscleTargets load={load} picked={(dayPlan?.muscles.length ?? 0) > 0} />
            {items.map((item, idx) => (
              <div key={itemKey(item)} data-key={itemKey(item)} className="tr-slot">
                {item.type === "single" ? (
                  <ExerciseBlock order={idx + 1} plan={item.ex} dayId={dayId!} sets={sets} getSessionId={getSessionId}
                    actions={actionsFor(item)} dayDone={dayDone} />
                ) : (
                  <SupersetBlock order={idx + 1} group={item.exs} dayId={dayId!} sets={sets} getSessionId={getSessionId}
                    actions={actionsFor(item)} dayDone={dayDone} />
                )}
              </div>
            ))}

            {skippedItems.length > 0 && (
              <div className="tr-skipped" aria-label="Skipped today">
                <div className="tr-skipped__label">Skipped today</div>
                {skippedItems.map((item) => (
                  <div key={itemKey(item)} className="tr-skipped__row">
                    <span>{itemName(item)}</span>
                    <button type="button" onClick={() => void restore(itemKey(item))}><TbArrowBackUp size={14} /> Restore</button>
                  </div>
                ))}
              </div>
            )}

            <button type="button" className="tr-add" onClick={() => setAddOpen(true)}><TbPlus size={16} /> Add exercise</button>

            {dayDone && (
              <SessionSummary dayName={dayPlan?.name ?? "Session"} sets={sets} volume={volume}
                elapsedMin={elapsedMin} prevVolume={prevVolume} />
            )}
            <div className="tr-dock-space" aria-hidden />
          </>
        )}
      </PageTransition>
      {!focusOn && <RestDock upNext={upNext} />}
      <SupersetPicker anchor={linkAnchor} day={exercises} names={names} onClose={() => setLinkAnchor(null)} />
      {dayId ? (
        <AddExerciseSheet open={addOpen} onClose={() => setAddOpen(false)} dayId={dayId}
          dayMuscles={load.hot} day={exercises} />
      ) : null}
      {focusOn && !isRest && dayId && (
        <GymFocusMode
          dayId={dayId}
          dayName={dayPlan?.name ?? "Session"}
          exercises={todayExercises}
          sets={sets}
          getSessionId={getSessionId}
          doneSets={doneSets}
          totalSets={totalSets}
          volume={volume}
          elapsedMin={elapsedMin}
          onClose={() => setSetting("gymFocusMode", 0)}
        />
      )}
    </>
  );
}
