import { MuscleCard, Legend } from "../../components/MuscleCard";
import type { Flash, Heat } from "../../components/BodyMap";
import type { muscleLoad } from "./muscleLoad";

// Targets start smouldering and burn brighter as their sets get done; each
// logged set flashes its muscle (the flash is keyed on the done count).
export function MuscleTargets({ load, picked }: { load: ReturnType<typeof muscleLoad>; picked: boolean }) {
  const { hot, warm, rows } = load;
  if (hot.length === 0) return null;

  const heat: Heat = {};
  const flash: Flash = {};
  warm.forEach((m) => { heat[m] = 0.22; });
  rows.forEach((r) => {
    heat[r.muscle] = 0.5 + 0.5 * (r.total ? r.done / r.total : 0);
    if (r.done) flash[r.muscle] = r.done;
  });

  return (
    <MuscleCard eyebrow="Muscles today" heat={heat} flash={flash}
      aside={<Legend items={warm.length ? [["hot", "Target"], ["warm", "Assist"]] : [["hot", "Target"]]} />}
      rows={rows.map((r) => ({
        muscle: r.muscle,
        pct: r.total ? r.done / r.total : 0,
        dim: r.total > 0 && r.done >= r.total,
        value: r.total ? <>{r.done}<small>/{r.total}</small></> : <small>no sets</small>,
      }))}
      foot={picked ? undefined : "Lit from this day's exercises — pick target muscles in the Planner to pin them."} />
  );
}
