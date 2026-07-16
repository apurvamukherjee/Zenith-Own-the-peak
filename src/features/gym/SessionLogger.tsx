import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Progress, Tag, Segmented } from "antd";
import { motion } from "framer-motion";
import { TbCheck, TbMinus, TbPlus, TbTrophy, TbFlame, TbMoon, TbQuote, TbArrowsRightLeft } from "react-icons/tb";
import { RestTimer } from "../../components/RestTimer";
import { PageTransition } from "../../components/PageTransition";
import { useTokens } from "../../hooks/useTokens";
import { MUSCLE_LABELS } from "../../config/exerciseLibrary";
import { MuscleIcon } from "../../components/MuscleIcon";
import type { DayExerciseDto, MuscleGroup, WorkoutSetDto } from "../../db/types";
import {
  useWorkoutDays, useDayExercises, useTodayDayId, useTodaySession,
  useSessionSets, useGhostSets, useExercise, ensureSession, logSet,
} from "./useGym";
import { prettyDate, todayKey } from "../../lib/date.utils";
import { startRest } from "../../lib/restTimerStore";
import { celebrate } from "../../lib/celebrate";

// -----------------------------------------------------------------------------
// SessionLogger — the "execute today's workout" surface.
//
// Phase-3 changes:
//   • Rest timer now lives in the global store (lib/restTimerStore.ts). This
//     component just calls `startRest()` when a set completes; the shared
//     RestTimer view renders wherever the user goes.
//   • PR moments fire the `celebrate` emitter, painting a gold overlay via
//     the mounted <PRCelebration/> in AppShell.
//   • Supersets: exercises sharing `supersetGroupId` render as ONE card with
//     both headers. Rest fires only after the LAST partner completes its set
//     (real-world "A → B → rest" pattern).
// -----------------------------------------------------------------------------

// ---- Row for a single set (unchanged UI, PR firing lifted into `complete`) ----
function SetRow({
  plan, exerciseName, exerciseId, setIndex, logged, ghost, getSessionId, onSetCompleted,
}: {
  plan: DayExerciseDto; exerciseName: string; exerciseId: number; setIndex: number;
  logged?: WorkoutSetDto; ghost?: WorkoutSetDto;
  getSessionId: () => Promise<number>;
  onSetCompleted: (exerciseId: number) => void;
}) {
  const t = useTokens();
  const baseW = logged?.weightKg ?? ghost?.weightKg ?? plan.weightKg;
  const baseR = logged?.reps ?? ghost?.reps ?? plan.repLow;
  const [w, setW] = useState(baseW);
  const [r, setR] = useState(baseR);
  useEffect(() => { if (!logged) { setW(baseW); setR(baseR); } }, [baseW, baseR, logged]);

  if (logged) {
    return (
      <motion.div initial={{ scale: 0.96, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
          background: logged.isPR ? "rgba(255,176,32,0.12)" : "rgba(18,179,161,0.10)",
          borderRadius: 10, marginBottom: 4 }}>
        <span style={{ width: 22, fontWeight: 700, color: "var(--ink-soft)", fontSize: 12 }}>{setIndex}</span>
        <span style={{ flex: 1, fontWeight: 700 }}>{logged.weightKg}kg × {logged.reps}</span>
        {logged.isPR && <TbTrophy style={{ color: t.gold }} />}
      </motion.div>
    );
  }

  async function complete() {
    if (w <= 0 || r <= 0) return;
    const sid = await getSessionId();
    const { isPR, e1rm } = await logSet({
      sessionId: sid, exerciseId, exerciseName, setIndex, weightKg: w, reps: r,
    });
    if (isPR) {
      celebrate({
        kind: "pr",
        title: "New PR",
        subtitle: `${exerciseName} · ${w}kg × ${r} · e1RM ${Math.round(e1rm)}`,
      });
    }
    onSetCompleted(exerciseId);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
      <span style={{ width: 22, fontWeight: 700, color: "var(--ink-soft)", fontSize: 12 }}>{setIndex}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
        <Button size="small" type="text" aria-label="Decrease weight" icon={<TbMinus />} onClick={() => setW(Math.max(0, w - 2.5))} />
        <span style={{ fontWeight: 700, minWidth: 42, textAlign: "center" }}>{w}<span style={{ fontSize: 10 }}>kg</span></span>
        <Button size="small" type="text" aria-label="Increase weight" icon={<TbPlus />} onClick={() => setW(w + 2.5)} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Button size="small" type="text" aria-label="Decrease reps" icon={<TbMinus />} onClick={() => setR(Math.max(1, r - 1))} />
        <span style={{ fontWeight: 700, minWidth: 24, textAlign: "center" }}>{r}</span>
        <Button size="small" type="text" aria-label="Increase reps" icon={<TbPlus />} onClick={() => setR(r + 1)} />
      </div>
      <Button type="primary" size="small" icon={<TbCheck />} aria-label="Complete set" onClick={complete} style={{ borderRadius: 10 }} />
    </div>
  );
}

// ---- Single-exercise block (default rendering) ----
function ExerciseBlock({ plan, dayId, sets, getSessionId }: {
  plan: DayExerciseDto; dayId: number; sets: WorkoutSetDto[]; getSessionId: () => Promise<number>;
}) {
  const ex = useExercise(plan.exerciseId);
  const ghosts = useGhostSets(dayId, plan.exerciseId);
  const t = useTokens();
  const doneCountRef = useRef(0);

  const done = sets.filter((s) => s.exerciseId === plan.exerciseId);
  const totalSets = plan.sets;
  const doneCount = done.length;
  const allDone = doneCount >= totalSets;
  const rows = Array.from({ length: totalSets }, (_, i) => i + 1);

  // Whenever a NEW set is completed here (doneCount increased), start rest —
  // unless the exercise is now fully done. Store is idempotent-safe.
  useEffect(() => {
    if (doneCount > doneCountRef.current && !allDone && ex) {
      startRest(plan.restSec, t.accent, ex.name);
    }
    doneCountRef.current = doneCount;
  }, [doneCount, allDone, plan.restSec, t.accent, ex]);

  if (!ex) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: "var(--surface)", borderRadius: 16, padding: "14px 14px 10px", marginBottom: 10,
        border: allDone ? `1px solid var(--teal)` : "1px solid var(--border)",
        opacity: allDone ? 0.75 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <MuscleIcon muscle={ex.primaryMuscle as MuscleGroup} size={20} color="var(--accent)" />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{ex.name}</div>
          {ex.cues && <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>{ex.cues}</div>}
        </div>
        <Tag color={allDone ? "green" : "default"} style={{ borderRadius: 8, margin: 0 }}>
          {doneCount}/{totalSets}
        </Tag>
      </div>
      <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 6 }}>
        {plan.sets}×{plan.repLow}–{plan.repHigh} · rest {plan.restSec}s · {plan.weightKg}kg planned
      </div>
      <RestTimer />
      {rows.map((si) => (
        <SetRow
          key={si} plan={plan} exerciseName={ex.name} exerciseId={plan.exerciseId}
          setIndex={si}
          logged={done.find((s) => s.setIndex === si)}
          ghost={ghosts?.find((g: WorkoutSetDto) => g.setIndex === si)}
          getSessionId={getSessionId}
          onSetCompleted={() => { /* rest firing is driven by doneCount effect above */ }}
        />
      ))}
    </motion.div>
  );
}

// ---- Superset block — two or more exercises alternating in one card ----
function SupersetBlock({ group, dayId, sets, getSessionId }: {
  group: DayExerciseDto[]; dayId: number; sets: WorkoutSetDto[]; getSessionId: () => Promise<number>;
}) {
  const t = useTokens();
  const doneCountsRef = useRef<number[]>(group.map(() => 0));

  // Compute done-per-partner. The group's "rounds done" is the min across
  // partners (a full round = one set of each). Rest fires only when the last
  // partner in the group completes a set for the current round.
  const perExerciseDone = group.map((g) => sets.filter((s) => s.exerciseId === g.exerciseId).length);
  const targetSets = Math.max(...group.map((g) => g.sets));
  const roundsCompleted = Math.min(...perExerciseDone);
  const allDone = roundsCompleted >= targetSets;

  // Rest color from the LAST partner in the group (its planned restSec).
  const restSec = group[group.length - 1].restSec;

  useEffect(() => {
    // Detect: a new set was added to the LAST partner AND now all partners
    // are level (i.e. a round just closed). Only then start rest.
    const prev = doneCountsRef.current;
    let lastPartnerAdvanced = false;
    for (let i = 0; i < group.length; i++) {
      if (perExerciseDone[i] > prev[i]) {
        if (i === group.length - 1) lastPartnerAdvanced = true;
      }
    }
    if (lastPartnerAdvanced && !allDone) {
      const label = group.map((g) => g.exerciseId).length
        ? "Superset"
        : "Rest";
      startRest(restSec, t.accent, label);
    }
    doneCountsRef.current = perExerciseDone.slice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perExerciseDone.join(",")]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: "var(--surface)", borderRadius: 16, padding: "12px 14px 10px", marginBottom: 10,
        border: allDone ? `1px solid var(--teal)` : "1px solid var(--accent)",
        opacity: allDone ? 0.75 : 1,
      }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "rgba(255,39,64,0.12)", color: "var(--accent)",
        borderRadius: 999, padding: "2px 10px", fontSize: 10, fontWeight: 800,
        letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8,
      }}>
        <TbArrowsRightLeft size={12} /> Superset · round {Math.min(roundsCompleted + 1, targetSets)}/{targetSets}
      </div>
      <RestTimer />
      {group.map((plan, gIdx) => (
        <SupersetPartner
          key={plan.id}
          plan={plan}
          dayId={dayId}
          sets={sets}
          isLastInGroup={gIdx === group.length - 1}
          getSessionId={getSessionId}
        />
      ))}
    </motion.div>
  );
}

// Partner inside a superset. Same as ExerciseBlock but WITHOUT its own
// auto-rest effect — the wrapping SupersetBlock owns rest triggering.
function SupersetPartner({
  plan, dayId, sets, getSessionId, isLastInGroup,
}: {
  plan: DayExerciseDto; dayId: number; sets: WorkoutSetDto[];
  getSessionId: () => Promise<number>; isLastInGroup: boolean;
}) {
  const ex = useExercise(plan.exerciseId);
  const ghosts = useGhostSets(dayId, plan.exerciseId);
  const done = sets.filter((s) => s.exerciseId === plan.exerciseId);
  const totalSets = plan.sets;
  const rows = Array.from({ length: totalSets }, (_, i) => i + 1);

  if (!ex) return null;

  return (
    <div style={{
      padding: "8px 0",
      borderTop: "1px dashed var(--border)",
      marginTop: 4,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <MuscleIcon muscle={ex.primaryMuscle as MuscleGroup} size={18} color="var(--accent)" />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{ex.name}</div>
          <div style={{ fontSize: 10, color: "var(--ink-soft)" }}>
            {plan.sets}×{plan.repLow}–{plan.repHigh} · {plan.weightKg}kg
            {isLastInGroup ? ` · rest ${plan.restSec}s after round` : " · then →"}
          </div>
        </div>
        <Tag style={{ borderRadius: 8, margin: 0 }}>{done.length}/{totalSets}</Tag>
      </div>
      {rows.map((si) => (
        <SetRow
          key={si} plan={plan} exerciseName={ex.name} exerciseId={plan.exerciseId}
          setIndex={si}
          logged={done.find((s) => s.setIndex === si)}
          ghost={ghosts?.find((g: WorkoutSetDto) => g.setIndex === si)}
          getSessionId={getSessionId}
          onSetCompleted={() => { /* rest firing owned by parent SupersetBlock */ }}
        />
      ))}
    </div>
  );
}

// ---- Group builder: fold consecutive same-supersetGroupId exercises ----
type Item = { type: "single"; ex: DayExerciseDto } | { type: "group"; exs: DayExerciseDto[] };
function buildItems(exercises: DayExerciseDto[]): Item[] {
  const items: Item[] = [];
  let i = 0;
  while (i < exercises.length) {
    const cur = exercises[i];
    const gid = cur.supersetGroupId;
    if (gid == null) {
      items.push({ type: "single", ex: cur });
      i++;
      continue;
    }
    const grp: DayExerciseDto[] = [cur];
    let j = i + 1;
    while (j < exercises.length && exercises[j].supersetGroupId === gid) {
      grp.push(exercises[j]);
      j++;
    }
    // A group of one is really just a single (user unlinked one side).
    if (grp.length >= 2) items.push({ type: "group", exs: grp });
    else items.push({ type: "single", ex: cur });
    i = j;
  }
  return items;
}

export function SessionLogger() {
  const t = useTokens();
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

  const items = useMemo(() => buildItems(exercises), [exercises]);

  const totalSets = exercises.reduce((s, e) => s + e.sets, 0);
  const doneSets = sets.length;
  const pct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;
  const volume = sets.reduce((s, x) => s + x.weightKg * x.reps, 0);

  async function getSessionId(): Promise<number> {
    if (sessionIdRef.current) return sessionIdRef.current;
    if (!dayId) throw new Error("No day");
    const id = await ensureSession(dayId);
    sessionIdRef.current = id;
    return id;
  }

  const isRest = !dayId || dayId === 0;

  return (
    <>
      <PageTransition>
        <div style={{ textAlign: "center", marginBottom: 12, position: "relative" }}>
          <Link to="/quotes" style={{ position: "absolute", top: -2, right: 0 }}>
            <Button type="text" shape="circle" icon={<TbQuote size={20} />} aria-label="Motivation quotes" />
          </Link>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>{prettyDate(todayKey())}</div>
          <div className="display" style={{ fontSize: 26, fontWeight: 800, margin: "4px 0" }}>
            {isRest ? "Rest Day" : dayPlan?.name ?? "Session"}
          </div>
          {dayPlan && (
            <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {dayPlan.muscles.map((m) => (
                <Tag key={m} style={{ borderRadius: 8, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 600 }}>
                  {MUSCLE_LABELS[m]}
                </Tag>
              ))}
            </div>
          )}
          {!isRest && (
            <Progress percent={pct} strokeColor={pct >= 100 ? t.teal : t.accent} showInfo={false}
              style={{ maxWidth: 320, margin: "0 auto" }} size={[-1, 8]} />
          )}
        </div>

        {days.length > 0 && (
          <div style={{ overflowX: "auto", whiteSpace: "nowrap", marginBottom: 14, paddingBottom: 4 }}>
            <Segmented
              value={dayId ?? 0}
              onChange={(v) => setActiveDayId(v as number)}
              options={[...days.map((d) => ({ label: d.name, value: d.id! })), { label: "Rest", value: 0 }]}
            />
          </div>
        )}

        {isRest ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--ink-soft)" }}>
            <div style={{ marginBottom: 8 }}><TbMoon size={48} style={{ color: "var(--accent)" }} /></div>
            <div style={{ fontWeight: 600 }}>Recovery day — muscle grows now, not in the gym.</div>
          </div>
        ) : (
          <>
            {items.map((item, idx) => (
              item.type === "single" ? (
                <ExerciseBlock key={`s-${item.ex.id ?? idx}`} plan={item.ex} dayId={dayId!} sets={sets} getSessionId={getSessionId} />
              ) : (
                <SupersetBlock key={`g-${item.exs[0].supersetGroupId}-${idx}`} group={item.exs} dayId={dayId!} sets={sets} getSessionId={getSessionId} />
              )
            ))}

            <div style={{ position: "sticky", bottom: 56, background: "var(--surface)", borderRadius: 14,
              padding: "10px 16px", display: "flex", justifyContent: "space-around",
              boxShadow: "0 -4px 20px rgba(0,0,0,0.12)", border: "1px solid var(--border)", marginTop: 8 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--accent)" }}>{doneSets}/{totalSets}</div>
                <div style={{ fontSize: 10, color: "var(--ink-soft)" }}>sets</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{Math.round(volume).toLocaleString()}</div>
                <div style={{ fontSize: 10, color: "var(--ink-soft)" }}>kg vol</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: t.gold }}><TbFlame style={{ verticalAlign: "-2px" }} /> {pct}%</div>
                <div style={{ fontSize: 10, color: "var(--ink-soft)" }}>done</div>
              </div>
            </div>
          </>
        )}
      </PageTransition>
    </>
  );
}
