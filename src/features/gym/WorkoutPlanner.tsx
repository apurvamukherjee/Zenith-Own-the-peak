import { useState } from "react";
import { Card, Button, Modal, Input, Select, InputNumber, Tag, App, Segmented } from "antd";
import { TbPlus, TbTrash, TbCopy, TbEdit, TbBarbell } from "react-icons/tb";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { MUSCLE_LABELS } from "../../config/exerciseLibrary";
import { MuscleIcon } from "../../components/MuscleIcon";
import type { MuscleGroup, ExerciseDto, DayExerciseDto } from "../../db/types";
import {
  useWorkoutDays, useExerciseLibrary, useDayExercises, useWeekSchedule,
  addWorkoutDay, deleteWorkoutDay, cloneDay,
  addDayExercise, updateDayExercise, removeDayExercise, setWeekday,
} from "./useGym";

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
      {exercises.length === 0 ? (
        <div style={{ color: "var(--ink-soft)", fontSize: 13, padding: 8 }}>No exercises yet</div>
      ) : (
        exercises.map((de) => {
          const ex = library.find((e) => e.id === de.exerciseId);
          return (
            <div key={de.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
              <MuscleIcon muscle={ex?.primaryMuscle as MuscleGroup} size={16} color="var(--accent)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{ex?.name ?? "?"}</div>
                <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                  {de.sets}×{de.repLow}–{de.repHigh} · {de.weightKg}kg · rest {de.restSec}s
                </div>
              </div>
              <Button size="small" type="text" icon={<TbEdit />} onClick={() => setEditEx(de)} />
              <Button size="small" type="text" danger icon={<TbTrash />} onClick={() => de.id && removeDayExercise(de.id)} />
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
              <div style={{ flex: 1 }}><div style={{ fontSize: 12, marginBottom: 4 }}>Sets</div><InputNumber inputMode="decimal" value={editEx.sets} min={1} onChange={(v) => setEditEx({ ...editEx, sets: v ?? 3 })} style={{ width: "100%" }} /></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 12, marginBottom: 4 }}>Rep low</div><InputNumber inputMode="decimal" value={editEx.repLow} min={1} onChange={(v) => setEditEx({ ...editEx, repLow: v ?? 6 })} style={{ width: "100%" }} /></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 12, marginBottom: 4 }}>Rep high</div><InputNumber inputMode="decimal" value={editEx.repHigh} min={1} onChange={(v) => setEditEx({ ...editEx, repHigh: v ?? 12 })} style={{ width: "100%" }} /></div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}><div style={{ fontSize: 12, marginBottom: 4 }}>Weight (kg)</div><InputNumber inputMode="decimal" value={editEx.weightKg} min={0} step={2.5} onChange={(v) => setEditEx({ ...editEx, weightKg: v ?? 0 })} style={{ width: "100%" }} /></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 12, marginBottom: 4 }}>Rest (sec)</div><InputNumber inputMode="decimal" value={editEx.restSec} min={0} step={15} onChange={(v) => setEditEx({ ...editEx, restSec: v ?? 90 })} style={{ width: "100%" }} /></div>
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

  function handleCreate() {
    if (!newName.trim()) return;
    addWorkoutDay(newName.trim(), newMuscles);
    setNewName(""); setNewMuscles([]); setAddOpen(false);
  }

  return (
    <PageTransition>
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
