import { useState } from "react";
import { App, Input } from "antd";
import { TbPlus, TbSearch } from "react-icons/tb";
import { Sheet } from "../../components/Sheet";
import { MuscleGlyph, ALL_MUSCLES } from "../../components/BodyMap";
import { useBackClose } from "../../hooks/useBackClose";
import { MUSCLE_LABELS } from "../../config/exerciseLibrary";
import type { DayExerciseDto, MuscleGroup } from "../../db/types";
import { addDayExercise, useExerciseLibrary } from "./useGym";
import { CustomExerciseForm } from "./CustomExerciseForm";

// Same defaults the Planner uses for a newly added exercise.
const DEFAULT_PLAN = { sets: 3, repLow: 8, repHigh: 12, weightKg: 0, restSec: 90 };

// Library picker for both the Planner and the Train tab. Creating a custom
// exercise swaps the list for a form in the same sheet, rather than stacking
// a second sheet (two useBackClose history entries unwind each other).
export function AddExerciseSheet({ open, onClose, dayId, dayMuscles, day, hint = "Adds to this day in your plan, at the end of today's list." }: {
  open: boolean; onClose: () => void; dayId: number; dayMuscles: MuscleGroup[]; day: DayExerciseDto[]; hint?: string;
}) {
  const { message } = App.useApp();
  const library = useExerciseLibrary();
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<MuscleGroup | "all">("all");
  const [creating, setCreating] = useState<string | null>(null);
  const close = () => { setCreating(null); setQ(""); onClose(); };
  useBackClose(open, close);

  const inDay = new Set(day.map((d) => d.exerciseId));
  const query = q.trim().toLowerCase();
  const list = library
    .filter((e) => e.id != null && !inDay.has(e.id))
    .filter((e) => muscle === "all" || e.primaryMuscle === muscle)
    .filter((e) => !query || e.name.toLowerCase().includes(query))
    // Today's muscle groups float to the top — that's what you're likely adding.
    .sort((a, b) => Number(dayMuscles.includes(b.primaryMuscle)) - Number(dayMuscles.includes(a.primaryMuscle)));
  const chips: (MuscleGroup | "all")[] = ["all", ...dayMuscles, ...ALL_MUSCLES.filter((m) => !dayMuscles.includes(m))];

  async function add(id: number, name: string) {
    await addDayExercise(dayId, id, DEFAULT_PLAN);
    message.success(`${name} added`);
    close();
  }

  return (
    <Sheet open={open} onCancel={close} footer={null} destroyOnHidden
      title={<div className="ss-title"><span className="ss-title__set">{creating === null ? "ADD" : "NEW"}</span>{creating === null ? "Exercise" : "Custom exercise"}</div>}>
      {creating !== null ? (
        <CustomExerciseForm initialName={creating} onCancel={() => setCreating(null)}
          onCreated={(id, name) => void add(id, name)} onUseExisting={(ex) => void add(ex.id!, ex.name)} />
      ) : (
        <>
          <p className="sp-hint">{hint}</p>
          <Input allowClear prefix={<TbSearch />} placeholder="Search exercises" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="ae-chips" role="group" aria-label="Filter by muscle">
            {chips.map((m) => (
              <button key={m} type="button" className={`ss-quick__btn${muscle === m ? " is-on" : ""}${m !== "all" && dayMuscles.includes(m) ? " is-day" : ""}`}
                onClick={() => setMuscle(m)}>
                {m === "all" ? "All" : MUSCLE_LABELS[m]}
              </button>
            ))}
          </div>
          <div className="sp-list">
            <button type="button" className="sp-row sp-row--new" onClick={() => setCreating(q.trim())}>
              <TbPlus size={18} />
              <span className="sp-row__name">{query ? `Create “${q.trim()}”` : "Create custom exercise"}</span>
              <span className="sp-row__meta">{list.length === 0 && query ? "No match" : "Pick muscles"}</span>
            </button>
            {list.slice(0, 60).map((e) => (
              <button key={e.id} type="button" className="sp-row" onClick={() => void add(e.id!, e.name)}>
                <MuscleGlyph muscle={e.primaryMuscle} size={30} />
                <span className="sp-row__name">
                  {e.name}
                  <small>{MUSCLE_LABELS[e.primaryMuscle]}{e.secondaryMuscles.length ? ` · ${e.secondaryMuscles.map((m) => MUSCLE_LABELS[m]).join(", ")}` : ""}</small>
                </span>
                <span className="sp-row__meta">{e.equipment.charAt(0).toUpperCase() + e.equipment.slice(1)}</span>
                <TbPlus size={16} />
              </button>
            ))}
          </div>
        </>
      )}
    </Sheet>
  );
}
