import { MuscleCard, Legend } from "../../components/MuscleCard";
import { ALL_MUSCLES, type Heat } from "../../components/BodyMap";
import { useAllDayExercises, useExerciseLibrary, useWeekSchedule } from "./useGym";
import { fmtSets, volumeStatus, weeklyPlanTally, type VolumeStatus } from "./muscleLoad";

const STATUS_LABEL: Record<VolumeStatus, string> = { none: "Not trained", low: "Low", good: "In range", high: "High" };

// What the whole week of the plan adds up to, per muscle.
export function WeeklyVolumeCard() {
  const schedule = useWeekSchedule();
  const dayExercises = useAllDayExercises();
  const library = useExerciseLibrary();
  const tally = weeklyPlanTally(schedule, dayExercises, library);
  if (Object.keys(tally).length === 0) return null;

  const heat: Heat = {};
  const rows = ALL_MUSCLES.map((m) => ({ m, v: tally[m] ?? 0 })).sort((a, b) => b.v - a.v).map(({ m, v }) => {
    if (v > 0) heat[m] = 0.2 + 0.8 * Math.min(1, v / 20);
    const status = volumeStatus(v);
    return { muscle: m, value: <>{fmtSets(v)}<small> sets</small></>, pct: v / 20, tag: { label: STATUS_LABEL[status], tone: status }, dim: status === "none" };
  });
  const behind = rows.filter((r) => r.tag.tone === "low" || r.tag.tone === "none").length;
  const trainingDays = schedule.filter((s) => s.dayId).length;

  return (
    <MuscleCard eyebrow="Weekly volume" heat={heat} rows={rows}
      aside={<Legend items={[["hot", "10–20 sets"], ["warm", "Fewer"]]} />}
      foot={<>
        {trainingDays} training day{trainingDays === 1 ? "" : "s"} a week. A set counts fully for its main muscle and half for helpers; 10–20 a week is the usual growth range.
        {behind > 0 ? ` ${behind} group${behind === 1 ? " is" : "s are"} under that.` : " Every group is in range."}
      </>} />
  );
}
