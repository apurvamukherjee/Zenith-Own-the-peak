import { useState } from "react";
import { Card, Button, Modal, Input, Select, App, Alert, Popconfirm } from "antd";
import { SmartInputNumber } from "../../components/SmartInputNumber";
import { TbPlus, TbTrash, TbCopy, TbEdit, TbBarbell, TbLink, TbLinkOff, TbTrendingUp, TbSwitch3, TbRefresh, TbMoon } from "react-icons/tb";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { Hero } from "../../components/ui/Hero";
import "./train.css";
import { CoachMark } from "../../components/CoachMark";
import { useSetting, setSetting } from "../../hooks/useSettings";
import { MUSCLE_LABELS } from "../../config/exerciseLibrary";
import { BodyMap, MusclePicker, MuscleGlyph, heatOf } from "../../components/BodyMap";
import { muscleLoad } from "./muscleLoad";
import { AddExerciseSheet } from "./AddExerciseSheet";
import { WeeklyVolumeCard } from "./WeeklyVolumeCard";
import type { MuscleGroup, DayExerciseDto } from "../../db/types";
import {
  useWorkoutDays, useExerciseLibrary, useDayExercises, useWeekSchedule,
  addWorkoutDay, updateWorkoutDay, deleteWorkoutDay, cloneDay,
  updateDayExercise, removeDayExercise, setWeekday, toggleSupersetLink,
} from "./useGym";
import { useActivePlan, planExerciseCount, resetBuiltInPlan } from "./usePlans";
import { PlanSwitcherSheet } from "./PlanSwitcherSheet";
import { useOverloadSuggestions } from "./useOverloadSuggestions";

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ---- Plan hero card: active plan identity + entry point to the switcher ----
function PlanHeroCard({ onOpenSwitcher }: { onOpenSwitcher: () => void }) {
  const { message } = App.useApp();
  const plan = useActivePlan();
  const days = useWorkoutDays();

  return (
    <Hero eyebrow="Active plan" className="pl-hero" style={{ marginBottom: 16 }}
      right={plan?.isBuiltIn === 1 ? <span className="z-pill">Built-in</span> : undefined}>
      <div className="pl-hero__row">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="z-hero__title">{plan?.name ?? "—"}</div>
          <div className="z-hero__sub">{days.length} day{days.length === 1 ? "" : "s"} · {plan ? planExerciseCount(plan) : 0} exercises</div>
        </div>
        <span className="z-ico z-ico--lg"><TbBarbell size={24} /></span>
      </div>
      <div className="pl-hero__actions">
        <button type="button" className="z-btn z-btn--solid" onClick={onOpenSwitcher}><TbSwitch3 size={16} /> Switch plan</button>
        {plan?.isBuiltIn === 1 && (
          <Popconfirm title="Reset to the default plan?" description="Your edits to this built-in plan are replaced." okText="Reset" okButtonProps={{ danger: true }}
            onConfirm={async () => { await resetBuiltInPlan(plan.id!); message.success(`"${plan.name}" reset to default`); }}>
            <button type="button" className="z-btn"><TbRefresh size={16} /> Reset to default</button>
          </Popconfirm>
        )}
      </div>
    </Hero>
  );
}
// Mounted only while open, so each open starts from `initial`.
function DayEditor({ title, okText, initial, onClose, onSave }: {
  title: string; okText: string; initial: { name: string; muscles: MuscleGroup[] };
  onClose: () => void; onSave: (name: string, muscles: MuscleGroup[]) => Promise<unknown>;
}) {
  const [name, setName] = useState(initial.name);
  const [muscles, setMuscles] = useState(initial.muscles);
  return (
    <Modal open onCancel={onClose} title={title} okText={okText} okButtonProps={{ disabled: !name.trim() }}
      onOk={async () => { await onSave(name.trim(), muscles); onClose(); }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
        <Input placeholder="Day name (e.g. Back Day)" value={name} onChange={(e) => setName(e.target.value)} />
        <MusclePicker value={muscles} onChange={setMuscles} hint={muscles.length ? undefined : "Optional — leave empty and it lights up from the exercises"} />
      </div>
    </Modal>
  );
}

function DayCard({ dayId }: { dayId: number }) {
  const { message, modal } = App.useApp();
  const days = useWorkoutDays();
  const day = days.find((d) => d.id === dayId);
  const exercises = useDayExercises(dayId);
  const library = useExerciseLibrary();
  const [addOpen, setAddOpen] = useState(false);
  const [editEx, setEditEx] = useState<DayExerciseDto | null>(null);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<number[]>([]);
  const [editOpen, setEditOpen] = useState(false);

  const suggestions = useOverloadSuggestions(exercises);
  const activeSuggestions = suggestions.filter((s) => !dismissedSuggestions.includes(s.exerciseId));

  if (!day) return null;
  const { hot, warm } = muscleLoad(day.muscles, exercises, library);
  const totalSets = exercises.reduce((s, e) => s + e.sets, 0);

  return (
    <Card size="small" style={{ marginBottom: 14, borderRadius: 16, borderLeft: "3px solid var(--accent)" }}
      styles={{ header: { border: "none", paddingBottom: 0 } }}
      title={
        <div className="display" style={{ padding: "4px 0", fontWeight: 800, fontSize: 16 }}>{day.name}</div>
      }
      extra={<div style={{ display: "flex", gap: 6 }}>
        <Button size="small" icon={<TbEdit />} onClick={() => setEditOpen(true)} aria-label="Edit day" />
        <Button size="small" icon={<TbCopy />} onClick={() => {
          const name = prompt("Clone name", `${day.name} copy`);
          if (name) cloneDay(dayId, name);
        }} aria-label="Duplicate" />
        <Button size="small" danger icon={<TbTrash />} onClick={() => {
          modal.confirm({ title: `Delete ${day.name}?`, onOk: () => deleteWorkoutDay(dayId), okButtonProps: { danger: true } });
        }} aria-label="Delete" />
      </div>}>
      <div className="pl-day__top">
        <button type="button" className="pl-day__map" onClick={() => setEditOpen(true)} aria-label={`Edit ${day.name} target muscles`}>
          <BodyMap heat={heatOf(hot, warm)} />
        </button>
        <div className="pl-day__info">
          <div className="pl-day__stat"><b>{exercises.length}</b> exercises · <b>{totalSets}</b> sets</div>
          {hot.length > 0 && (
            <div className="bm-chips">{hot.map((m) => <span key={m} className={`bm-chip${day.muscles.includes(m) ? " is-on" : " is-assist"}`}>{MUSCLE_LABELS[m]}</span>)}</div>
          )}
          {day.muscles.length === 0 && (
            <button type="button" className="pl-day__empty" onClick={() => setEditOpen(true)}>
              {hot.length ? "Auto from exercises · pin targets" : "+ Pick target muscles"}
            </button>
          )}
        </div>
      </div>
      {editOpen && (
        <DayEditor title="Edit day" okText="Save" initial={{ name: day.name, muscles: day.muscles }}
          onClose={() => setEditOpen(false)} onSave={(name, muscles) => updateWorkoutDay(dayId, { name, muscles })} />
      )}
      {/* Progressive overload suggestions — fires after 3 sessions all hitting repHigh */}
      {activeSuggestions.map((s) => (
        <Alert key={s.exerciseId} type="info" style={{ marginBottom: 8, borderRadius: 10 }}
          icon={<TbTrendingUp size={16} />} showIcon
          message={
            <span>
              <strong>{s.exerciseName}</strong> — try <strong>{s.suggestKg}kg</strong>
              <span style={{ fontSize: 12, color: "var(--ink-soft)", marginLeft: 4 }}>
                (+{s.increment}kg · 3 sessions at top of rep range)
              </span>
            </span>
          }
          action={
            <div style={{ display: "flex", gap: 6 }}>
              <Button size="small" type="primary" onClick={async () => {
                const ex = exercises.find((e) => e.exerciseId === s.exerciseId);
                if (ex?.id) {
                  await updateDayExercise(ex.id, { ...ex, weightKg: s.suggestKg });
                  message.success(`${s.exerciseName} updated to ${s.suggestKg}kg`);
                  setDismissedSuggestions((p) => [...p, s.exerciseId]);
                }
              }}>Apply</Button>
              <Button size="small" onClick={() => setDismissedSuggestions((p) => [...p, s.exerciseId])}>Later</Button>
            </div>
          } />
      ))}
      {exercises.length === 0 ? (
        <div style={{ color: "var(--ink-soft)", fontSize: 13, padding: 8 }}>No exercises yet</div>
      ) : (
        exercises.map((de, idx) => {
          const ex = library.find((e) => e.id === de.exerciseId);
          const next = exercises[idx + 1];
          // "Linked-to-next" state: this row and the next share a non-null group id.
          const linkedToNext = Boolean(
            next && de.supersetGroupId != null && de.supersetGroupId === next.supersetGroupId,
          );
          // Bracket color when this row is part of any group (marker on the left).
          const inGroup = de.supersetGroupId != null;
          return (
            <div key={de.id}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
                borderBottom: linkedToNext ? "none" : "1px solid var(--border)",
                borderLeft: inGroup ? "3px solid var(--accent)" : "3px solid transparent",
                paddingLeft: inGroup ? 8 : 0,
              }}>
                {ex && <MuscleGlyph muscle={ex.primaryMuscle} size={28} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{ex?.name ?? "?"}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    {de.sets}×{de.repLow}–{de.repHigh} · {de.weightKg}kg · rest {de.restSec}s
                  </div>
                </div>
                {next && (
                  <Button
                    size="small" type="text"
                    aria-label={linkedToNext ? "Unlink superset" : "Link as superset with next"}
                    title={linkedToNext ? "Unlink superset" : "Link as superset with next"}
                    icon={linkedToNext ? <TbLinkOff /> : <TbLink />}
                    style={linkedToNext ? { color: "var(--accent)" } : undefined}
                    onClick={() => {
                      if (de.id && next.id) toggleSupersetLink(de.id, next.id);
                    }}
                  />
                )}
                <Button size="small" type="text" icon={<TbEdit />} onClick={() => setEditEx(de)} aria-label="Edit" />
                <Button size="small" type="text" danger icon={<TbTrash />} onClick={() => de.id && removeDayExercise(de.id)} aria-label="Delete" />
              </div>
              {linkedToNext && (
                <div style={{
                  fontSize: 12, fontWeight: 700, letterSpacing: 0.6,
                  color: "var(--accent)", padding: "2px 0 2px 11px",
                  borderLeft: "3px solid var(--accent)",
                  textTransform: "uppercase",
                }}>
                  ↳ Superset
                </div>
              )}
            </div>
          );
        })
      )}
      <Button type="dashed" block icon={<TbPlus />} onClick={() => setAddOpen(true)} style={{ marginTop: 8 }}>Add exercise</Button>

      <AddExerciseSheet open={addOpen} onClose={() => setAddOpen(false)} dayId={dayId} dayMuscles={hot} day={exercises}
        hint={`Adds to ${day.name}, at the end.`} />

      {/* Edit exercise modal */}
      <Modal open={!!editEx} onCancel={() => setEditEx(null)} title="Edit exercise"
        onOk={() => { if (editEx?.id) { updateDayExercise(editEx.id, editEx); setEditEx(null); } }} okText="Save">
        {editEx && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}><div style={{ fontSize: 12, marginBottom: 4 }}>Sets</div><SmartInputNumber value={editEx.sets} min={1} onChange={(v) => setEditEx({ ...editEx, sets: Number(v ?? 3) })} style={{ width: "100%" }} /></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 12, marginBottom: 4 }}>Rep low</div><SmartInputNumber value={editEx.repLow} min={1} onChange={(v) => setEditEx({ ...editEx, repLow: Number(v ?? 6) })} style={{ width: "100%" }} /></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 12, marginBottom: 4 }}>Rep high</div><SmartInputNumber value={editEx.repHigh} min={1} onChange={(v) => setEditEx({ ...editEx, repHigh: Number(v ?? 12) })} style={{ width: "100%" }} /></div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}><div style={{ fontSize: 12, marginBottom: 4 }}>Weight (kg)</div><SmartInputNumber value={editEx.weightKg} min={0} step={2.5} onChange={(v) => setEditEx({ ...editEx, weightKg: Number(v ?? 0) })} style={{ width: "100%" }} /></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 12, marginBottom: 4 }}>Rest (sec)</div><SmartInputNumber value={editEx.restSec} min={0} step={15} onChange={(v) => setEditEx({ ...editEx, restSec: Number(v ?? 90) })} style={{ width: "100%" }} /></div>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}

export function WorkoutPlanner() {
  const days = useWorkoutDays();
  const schedule = useWeekSchedule();
  const [addOpen, setAddOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const coachDone = Number(useSetting("coachPlanner"));
  const [coachStep, setCoachStep] = useState(coachDone ? -1 : 0);
  const PLANNER_COACH = [
    { title: "Plan your week", body: "Assign a workout day to each weekday below. You can have multiple days with different muscle groups." },
    { title: "Link supersets", body: "In any day card, tap the chain icon between two exercises to link them as a superset A1→A2." },
  ];

  return (
    <PageTransition>
      {coachStep >= 0 && (
        <CoachMark
          steps={PLANNER_COACH}
          current={coachStep}
          onNext={() => setCoachStep((s) => s + 1)}
          onDone={() => { setCoachStep(-1); void setSetting("coachPlanner", 1); }}
        />
      )}
      <SectionTitle eyebrow="Planner" title="Build your program" right={
        <Button type="primary" icon={<TbPlus />} onClick={() => setAddOpen(true)}>New day</Button>
      } />

      <PlanHeroCard onOpenSwitcher={() => setSwitcherOpen(true)} />
      <PlanSwitcherSheet open={switcherOpen} onClose={() => setSwitcherOpen(false)} />

      {/* Weekly schedule — 7-tile strip, Sun..Sat to match weekSchedule.weekday */}
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 8 }}>
        Weekly schedule
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
        gap: 8, marginBottom: 20,
      }}>
        {WEEKDAY_NAMES.map((name, wd) => {
          const entry = schedule.find((s) => s.weekday === wd);
          const isRest = !entry?.dayId;
          const dayName = days.find((d) => d.id === entry?.dayId)?.name;
          return (
            <div key={wd} style={{
              borderRadius: 12, padding: "8px 10px",
              background: isRest ? "var(--surface)" : "rgba(255,39,64,0.10)",
              border: isRest ? "1px solid var(--border)" : "1px solid var(--accent)",
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, color: "var(--ink-soft)", marginBottom: 4 }}>
                {name.toUpperCase()}
              </div>
              <Select size="small" variant="borderless" style={{ width: "100%", fontWeight: 700 }}
                value={entry?.dayId ?? 0}
                onChange={(v) => setWeekday(wd, v)}
                options={[{ label: "Rest", value: 0 }, ...days.map((d) => ({ label: d.name, value: d.id! }))]}
                popupMatchSelectWidth={false}
                suffixIcon={isRest ? <TbMoon size={12} style={{ color: "var(--ink-soft)" }} /> : null}
              />
              {dayName === undefined && !isRest && (
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Unassigned</div>
              )}
            </div>
          );
        })}
      </div>

      <WeeklyVolumeCard />

      {days.length === 0 ? (
        <div style={{ textAlign: "center", padding: 32 }}>
          <div style={{ marginBottom: 8 }}><TbBarbell size={48} style={{ color: "var(--accent)" }} /></div>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>No workout days yet</div>
          <Button type="primary" icon={<TbPlus />} onClick={() => setAddOpen(true)}>Create your first day</Button>
        </div>
      ) : (
        days.map((d) => <DayCard key={d.id} dayId={d.id!} />)
      )}

      {addOpen && (
        <DayEditor title="New workout day" okText="Create" initial={{ name: "", muscles: [] }}
          onClose={() => setAddOpen(false)} onSave={addWorkoutDay} />
      )}
    </PageTransition>
  );
}
