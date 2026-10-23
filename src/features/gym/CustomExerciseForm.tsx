import { useState } from "react";
import { Input } from "antd";
import { TbArrowLeft, TbSparkles } from "react-icons/tb";
import { ExerciseMusclePicker } from "../../components/BodyMap";
import type { ExerciseDto, MuscleGroup } from "../../db/types";
import { addCustomExercise, useExerciseLibrary } from "./useGym";
import { guessExercise } from "./muscleLoad";

const EQUIPMENT = ["barbell", "dumbbell", "cable", "machine", "bodyweight", "kettlebell", "band", "other"];

type Muscles = { primary?: MuscleGroup; secondary: MuscleGroup[] };

// New library exercise. Muscles follow the closest existing exercise by name
// until the body map is touched; equipment until an equipment chip is.
export function CustomExerciseForm({ initialName, onCancel, onCreated, onUseExisting }: {
  initialName: string; onCancel: () => void;
  onCreated: (id: number, name: string) => void; onUseExisting: (ex: ExerciseDto) => void;
}) {
  const library = useExerciseLibrary();
  const [name, setName] = useState(initialName);
  const [picked, setPicked] = useState<Muscles | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);
  const [cues, setCues] = useState("");
  const [saving, setSaving] = useState(false);

  const trimmed = name.trim();
  const guess = guessExercise(trimmed, library);
  const muscles: Muscles = picked ?? (guess ? { primary: guess.primaryMuscle, secondary: guess.secondaryMuscles } : { secondary: [] });
  const eq = equipment ?? guess?.equipment ?? "other";
  const existing = library.find((e) => e.name.trim().toLowerCase() === trimmed.toLowerCase());
  const canSave = !!trimmed && !!muscles.primary && !existing && !saving;

  async function save() {
    if (!canSave || !muscles.primary) return;
    setSaving(true);
    try {
      const id = await addCustomExercise({
        name: trimmed, primaryMuscle: muscles.primary, secondaryMuscles: muscles.secondary,
        equipment: eq, cues: cues.trim() || undefined,
      });
      onCreated(id, trimmed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cx">
      <label className="cx-field">
        <span className="ss-field__label">Name</span>
        <Input autoFocus placeholder="e.g. Paused bench press" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      {existing && (
        <button type="button" className="cx-note cx-note--btn" onClick={() => onUseExisting(existing)}>
          “{existing.name}” is already in your library — <b>add it instead</b>
        </button>
      )}

      <div className="cx-field">
        <div className="cx-row">
          <span className="ss-field__label">Muscles</span>
          {guess && !picked && <span className="cx-auto"><TbSparkles size={12} /> From {guess.name}</span>}
        </div>
        <ExerciseMusclePicker primary={muscles.primary} secondary={muscles.secondary} onChange={setPicked} />
      </div>

      <div className="cx-field">
        <span className="ss-field__label">Equipment</span>
        <div className="bm-chips">
          {EQUIPMENT.map((e) => (
            <button key={e} type="button" aria-pressed={eq === e} className={`bm-chip${eq === e ? " is-on" : ""}`} onClick={() => setEquipment(e)}>
              {e[0].toUpperCase() + e.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <label className="cx-field">
        <span className="ss-field__label">Cue (optional)</span>
        <Input placeholder="e.g. 2s pause on the chest" value={cues} onChange={(e) => setCues(e.target.value)} />
      </label>

      <div className="ss-actions">
        <button type="button" className="ss-del cx-back" onClick={onCancel} aria-label="Back to the list"><TbArrowLeft size={20} /></button>
        <button type="button" className="ss-go" disabled={!canSave} onClick={() => void save()}>
          {muscles.primary ? "Create & add" : "Pick a primary muscle"}
        </button>
      </div>
    </div>
  );
}
