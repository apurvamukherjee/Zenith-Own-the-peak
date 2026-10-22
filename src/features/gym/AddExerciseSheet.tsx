import { useState } from "react";
import { App, Input } from "antd";
import { TbPlus, TbSearch } from "react-icons/tb";
import { Sheet } from "../../components/Sheet";
import { useBackClose } from "../../hooks/useBackClose";
import { MUSCLE_LABELS } from "../../config/exerciseLibrary";
import type { DayExerciseDto, MuscleGroup } from "../../db/types";
import { addDayExercise, useExerciseLibrary } from "./useGym";

// Same defaults the Planner uses for a newly added exercise.
const DEFAULT_PLAN = { sets: 3, repLow: 8, repHigh: 12, weightKg: 0, restSec: 90 };

export function AddExerciseSheet({ open, onClose, dayId, dayMuscles, day }: {
  open: boolean; onClose: () => void; dayId: number; dayMuscles: MuscleGroup[]; day: DayExerciseDto[];
}) {
  useBackClose(open, onClose);
  const { message } = App.useApp();
  const library = useExerciseLibrary();
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<MuscleGroup | "all">("all");

  const inDay = new Set(day.map((d) => d.exerciseId));
  const query = q.trim().toLowerCase();
  const list = library
    .filter((e) => e.id != null && !inDay.has(e.id))
    .filter((e) => muscle === "all" || e.primaryMuscle === muscle)
    .filter((e) => !query || e.name.toLowerCase().includes(query))
    // Today's muscle groups float to the top — that's what you're likely adding.
    .sort((a, b) => Number(dayMuscles.includes(b.primaryMuscle)) - Number(dayMuscles.includes(a.primaryMuscle)));

  async function add(id: number, name: string) {
    await addDayExercise(dayId, id, DEFAULT_PLAN);
    message.success(`${name} added`);
    setQ("");
    onClose();
  }

  return (
    <Sheet open={open} onCancel={onClose} footer={null} destroyOnHidden
      title={<div className="ss-title"><span className="ss-title__set">ADD</span>Exercise</div>}>
      <p className="sp-hint">Adds to this day in your plan, at the end of today's list.</p>
      <Input allowClear prefix={<TbSearch />} placeholder="Search exercises" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="ae-chips" role="group" aria-label="Filter by muscle">
        {(["all", ...dayMuscles] as const).map((m) => (
          <button key={m} type="button" className={`ss-quick__btn${muscle === m ? " is-on" : ""}`} onClick={() => setMuscle(m)}>
            {m === "all" ? "All" : MUSCLE_LABELS[m]}
          </button>
        ))}
      </div>
      <div className="sp-list">
        {list.length === 0 && <p className="sp-empty">Nothing matches.</p>}
        {list.slice(0, 60).map((e) => (
          <button key={e.id} type="button" className="sp-row" onClick={() => void add(e.id!, e.name)}>
            <span className="sp-row__name">{e.name}</span>
            <span className="sp-row__meta">{MUSCLE_LABELS[e.primaryMuscle]}</span>
            <TbPlus size={16} />
          </button>
        ))}
      </div>
    </Sheet>
  );
}
