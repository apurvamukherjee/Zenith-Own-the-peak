import { useState } from "react";
import { Card, Button, Modal, Input, Select, Tag, App, Segmented, Alert } from "antd";
import { SmartInputNumber } from "../../components/SmartInputNumber";
import { TbPlus, TbTrash, TbCopy, TbEdit, TbBarbell, TbLink, TbLinkOff, TbTrendingUp } from "react-icons/tb";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { CoachMark } from "../../components/CoachMark";
import { useSetting, setSetting } from "../../hooks/useSettings";
import { MUSCLE_LABELS } from "../../config/exerciseLibrary";
import { MuscleIcon } from "../../components/MuscleIcon";
import type { MuscleGroup, ExerciseDto, DayExerciseDto } from "../../db/types";
import {
  useWorkoutDays, useExerciseLibrary, useDayExercises, useWeekSchedule,
  addWorkoutDay, deleteWorkoutDay, cloneDay,
  addDayExercise, updateDayExercise, removeDayExercise, setWeekday,
  toggleSupersetLink,
} from "./useGym";
import { useOverloadSuggestions } from "./useOverloadSuggestions";

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ALL_MUSCLES: MuscleGroup[] = ["chest", "back", "shoulders", "biceps", "triceps", "quads", "hamstrings", "glutes", "calves", "abs", "forearms", "traps"];

function DayCard({ dayId }: { dayId: number }) {
  const { message, modal } = App.useApp();
  const days = useWorkoutDays();
  const day = days.find((d) => d.id === dayId);
  const exercises = useDayExercises(dayId);
  const library = useExerciseLibrary();
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState<MuscleGroup | "all">("all");
  const [editEx, setEditEx] = useState<DayExerciseDto | null>(null);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<number[]>([]);

  const suggestions = useOverloadSuggestions(exercises);
  const activeSuggestions = suggestions.filter((s) => !dismissedSuggestions.includes(s.exerciseId));

  if (!day) return null;
  const filtered = filter === "all" ? library : library.filter((e) => e.primaryMuscle === filter);

  async function handleAddEx(ex: ExerciseDto) {
    await addDayExercise(dayId, ex.id!, { sets: 3, repLow: 8, repHigh: 12, weightKg: 0, restSec: 90 });
    setAddOpen(false);
    message.success(`Added ${ex.name}`);
  }

  return (
    <Card size="small" style={{ marginBottom: 14 }}
      title={<span style={{ fontWeight: 700 }}><>{day.muscles.map((m,i) => <MuscleIcon key={i} muscle={m} size={14} color="var(--accent)" />)}</> {day.name}</span>}
      extra={<div style={{ display: "flex", gap: 6 }}>
        <Button size="small" icon={<TbCopy />} onClick={() => {
          const name = prompt("Clone name", `${day.name} copy`);
          if (name) cloneDay(dayId, name);
        }} />
        <Button size="small" danger icon={<TbTrash />} onClick={() => {
          modal.confirm({ title: `Delete ${day.name}?`, onOk: () => deleteWorkoutDay(dayId), okButtonProps: { danger: true } });
        }} />
      </div>}>
      {/* Progressive overload suggestions — fires after 3 sessions all hitting repHigh */}
      {activeSuggestions.map((s) => (
        <Alert key={s.exerciseId} type="info" style={{ marginBottom: 8, borderRadius: 10 }}
          icon={<TbTrendingUp size={16} />} showIcon
          message={
            <span>
              <strong>{s.exerciseName}</strong> — try <strong>{s.suggestKg}kg</strong>
              <span style={{ fontSize: 11, color: "var(--ink-soft)", marginLeft: 4 }}>
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
                <MuscleIcon muscle={ex?.primaryMuscle as MuscleGroup} size={16} color="var(--accent)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{ex?.name ?? "?"}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
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
                <Button size="small" type="text" icon={<TbEdit />} onClick={() => setEditEx(de)} />
                <Button size="small" type="text" danger icon={<TbTrash />} onClick={() => de.id && removeDayExercise(de.id)} />
              </div>
              {linkedToNext && (
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: 0.6,
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

      {/* Add exercise modal */}
      <Modal open={addOpen} onCancel={() => setAddOpen(false)} footer={null} title="Exercise library">
        <div style={{ marginBottom: 10 }}>
          <Segmented size="small"
            value={filter}
            onChange={(v) => setFilter(v as MuscleGroup | "all")}
            options={[{ label: "All", value: "all" }, ...ALL_MUSCLES.map((m) => ({ label: MUSCLE_LABELS[m], value: m }))]}
            style={{ overflowX: "auto", display: "flex" }} />
        </div>
        <div style={{ maxHeight: 350, overflow: "auto" }}>
          {filtered.map((ex) => (
            <div key={ex.id} onClick={() => handleAddEx(ex)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px", cursor: "pointer", borderBottom: "1px solid var(--border)" }}>
              <MuscleIcon muscle={ex.primaryMuscle} size={16} color="var(--accent)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{ex.name}</div>
                <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                  {ex.equipment} · {ex.secondaryMuscles.map((m) => MUSCLE_LABELS[m]).join(", ") || "isolated"}
                </div>
              </div>
              <TbPlus style={{ color: "var(--accent)" }} />
            </div>
          ))}
        </div>
      </Modal>

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
  const [newName, setNewName] = useState("");
  const [newMuscles, setNewMuscles] = useState<MuscleGroup[]>([]);
  const coachDone = Number(useSetting("coachPlanner"));
  const [coachStep, setCoachStep] = useState(coachDone ? -1 : 0);
  const PLANNER_COACH = [
    { title: "Plan your week", body: "Assign a workout day to each weekday below. You can have multiple days with different muscle groups." },
    { title: "Link supersets", body: "In any day card, tap the ⛓ chain icon between two exercises to link them as a superset A1→A2." },
  ];

  function handleCreate() {
    if (!newName.trim()) return;
    addWorkoutDay(newName.trim(), newMuscles);
    setNewName(""); setNewMuscles([]); setAddOpen(false);
  }

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

      {/* Weekly schedule */}
      <Card size="small" title="Weekly schedule" style={{ marginBottom: 16 }}>
        {WEEKDAY_NAMES.map((name, wd) => {
          const entry = schedule.find((s) => s.weekday === wd);
          
          return (
            <div key={wd} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ width: 36, fontWeight: 700 }}>{name}</span>
              <Select size="small" style={{ flex: 1 }}
                value={entry?.dayId ?? 0}
                onChange={(v) => setWeekday(wd, v)}
                options={[{ label: "Rest", value: 0 }, ...days.map((d) => ({ label: d.name, value: d.id! }))]} />
            </div>
          );
        })}
      </Card>

      {days.length === 0 ? (
        <div style={{ textAlign: "center", padding: 32 }}>
          <div style={{ marginBottom: 8 }}><TbBarbell size={48} style={{ color: "var(--accent)" }} /></div>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>No workout days yet</div>
          <Button type="primary" icon={<TbPlus />} onClick={() => setAddOpen(true)}>Create your first day</Button>
        </div>
      ) : (
        days.map((d) => <DayCard key={d.id} dayId={d.id!} />)
      )}

      <Modal open={addOpen} onCancel={() => setAddOpen(false)} title="New workout day" onOk={handleCreate} okText="Create">
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
          <Input placeholder="Day name (e.g. Back Day)" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Target muscles (tap to toggle)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ALL_MUSCLES.map((m) => (
              <Tag key={m} icon={<MuscleIcon muscle={m} size={12} />} style={{ cursor: "pointer", borderRadius: 8 }}
                color={newMuscles.includes(m) ? "var(--accent)" : "default"}
                onClick={() => setNewMuscles((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m])}>
                {MUSCLE_LABELS[m]}
              </Tag>
            ))}
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}
