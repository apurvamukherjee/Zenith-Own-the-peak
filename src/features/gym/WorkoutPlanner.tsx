import { useState } from "react";
import { Card, Button, Modal, Input, Select, Tag, App, Segmented, Alert } from "antd";
import { SmartInputNumber } from "../../components/SmartInputNumber";
import { TbPlus, TbTrash, TbCopy, TbEdit, TbBarbell, TbLink, TbLinkOff, TbTrendingUp, TbSwitch3, TbRefresh, TbMoon } from "react-icons/tb";
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
  toggleSupersetLink, addCustomExercise,
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
    <div style={{
      borderRadius: 18, padding: "16px 18px", marginBottom: 16,
      background: "linear-gradient(135deg, rgba(255,39,64,0.18), rgba(0,0,0,0.35))",
      border: "1px solid var(--accent)", position: "relative", overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "var(--accent)" }}>
            Active plan
          </div>
          <div className="display" style={{ fontSize: 22, fontWeight: 800, margin: "2px 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
            {plan?.name ?? "—"}
            {plan?.isBuiltIn === 1 && <Tag style={{ borderRadius: 6, fontSize: 9, margin: 0 }}>Built-in</Tag>}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
            {days.length} day{days.length === 1 ? "" : "s"} · {plan ? planExerciseCount(plan) : 0} exercises
          </div>
        </div>
        <TbBarbell size={34} style={{ color: "var(--accent)", opacity: 0.5, flexShrink: 0 }} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <Button type="primary" icon={<TbSwitch3 />} onClick={onOpenSwitcher}>Switch plan</Button>
        {plan?.isBuiltIn === 1 && (
          <Button icon={<TbRefresh />} onClick={async () => {
            await resetBuiltInPlan(plan.id!);
            message.success(`"${plan.name}" reset to default`);
          }}>Reset to default</Button>
        )}
      </div>
    </div>
  );
}
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
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrimary, setCustomPrimary] = useState<MuscleGroup | undefined>(undefined);
  const [customSecondary, setCustomSecondary] = useState<MuscleGroup[]>([]);
  const [customEquipment, setCustomEquipment] = useState("");
  const [customCues, setCustomCues] = useState("");

  const suggestions = useOverloadSuggestions(exercises);
  const activeSuggestions = suggestions.filter((s) => !dismissedSuggestions.includes(s.exerciseId));

  if (!day) return null;
  const filtered = filter === "all" ? library : library.filter((e) => e.primaryMuscle === filter);

  async function handleAddEx(ex: ExerciseDto) {
    await addDayExercise(dayId, ex.id!, { sets: 3, repLow: 8, repHigh: 12, weightKg: 0, restSec: 90 });
    setAddOpen(false);
    message.success(`Added ${ex.name}`);
  }

  function resetCustomForm() {
    setCustomName(""); setCustomPrimary(undefined); setCustomSecondary([]);
    setCustomEquipment(""); setCustomCues("");
  }

  async function handleSaveCustom() {
    const name = customName.trim();
    if (!name || !customPrimary) return;
    const id = await addCustomExercise({
      name, primaryMuscle: customPrimary, secondaryMuscles: customSecondary,
      equipment: customEquipment.trim() || "other",
      cues: customCues.trim() || undefined,
    });
    await addDayExercise(dayId, id, { sets: 3, repLow: 8, repHigh: 12, weightKg: 0, restSec: 90 });
    message.success(`Added ${name} to your exercise library`);
    setCustomOpen(false);
    setAddOpen(false);
    resetCustomForm();
  }

  return (
    <Card size="small" style={{ marginBottom: 14, borderRadius: 16, borderLeft: "3px solid var(--accent)" }}
      styles={{ header: { border: "none", paddingBottom: 0 } }}
      title={
        <div style={{ padding: "4px 0" }}>
          <div className="display" style={{ fontWeight: 800, fontSize: 16 }}>{day.name}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
            {day.muscles.map((m, i) => (
              <span key={i} style={{
                display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700,
                borderRadius: 999, padding: "1px 8px", background: "rgba(255,39,64,0.12)", color: "var(--accent)",
              }}>
                <MuscleIcon muscle={m} size={11} color="var(--accent)" /> {MUSCLE_LABELS[m]}
              </span>
            ))}
          </div>
        </div>
      }
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
        <Button type="dashed" block icon={<TbPlus />} onClick={() => setCustomOpen(true)} style={{ marginBottom: 10 }}>
          Add custom exercise
        </Button>
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

      {/* Add custom exercise modal */}
      <Modal open={customOpen} onCancel={() => { setCustomOpen(false); resetCustomForm(); }}
        title="Add custom exercise" onOk={handleSaveCustom} okText="Add"
        okButtonProps={{ disabled: !customName.trim() || !customPrimary }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
          <Input placeholder="Exercise name" value={customName} onChange={(e) => setCustomName(e.target.value)} />
          <div>
            <div style={{ fontSize: 12, marginBottom: 4 }}>Primary muscle</div>
            <Select
              style={{ width: "100%" }}
              placeholder="Select primary muscle"
              value={customPrimary}
              onChange={(v) => setCustomPrimary(v)}
              options={ALL_MUSCLES.map((m) => ({ label: MUSCLE_LABELS[m], value: m }))}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, marginBottom: 4 }}>Secondary muscles (optional)</div>
            <Select
              mode="multiple"
              style={{ width: "100%" }}
              placeholder="Select secondary muscles"
              value={customSecondary}
              onChange={(v) => setCustomSecondary(v)}
              options={ALL_MUSCLES.filter((m) => m !== customPrimary).map((m) => ({ label: MUSCLE_LABELS[m], value: m }))}
            />
          </div>
          <Input placeholder="Equipment (e.g. barbell, dumbbell, cable, bodyweight)" value={customEquipment} onChange={(e) => setCustomEquipment(e.target.value)} />
          <Input placeholder="Cue / tip (optional)" value={customCues} onChange={(e) => setCustomCues(e.target.value)} />
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
  const [switcherOpen, setSwitcherOpen] = useState(false);
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

      <PlanHeroCard onOpenSwitcher={() => setSwitcherOpen(true)} />
      <PlanSwitcherSheet open={switcherOpen} onClose={() => setSwitcherOpen(false)} />

      {/* Weekly schedule — 7-tile strip, Sun..Sat to match weekSchedule.weekday */}
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 8 }}>
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
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.6, color: "var(--ink-soft)", marginBottom: 4 }}>
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
                <div style={{ fontSize: 10, color: "var(--ink-soft)" }}>Unassigned</div>
              )}
            </div>
          );
        })}
      </div>

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
