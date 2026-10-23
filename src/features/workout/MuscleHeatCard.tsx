import { useState } from "react";
import { TbArrowDownRight, TbArrowUpRight } from "react-icons/tb";
import { MuscleCard, Legend } from "../../components/MuscleCard";
import { ALL_MUSCLES, type Heat } from "../../components/BodyMap";
import { MUSCLE_LABELS } from "../../config/exerciseLibrary";
import { todayKey } from "../../lib/date.utils";
import { useExerciseLibrary } from "../gym/useGym";
import { fmtSets, loggedTally, volumeStatus } from "../gym/muscleLoad";
import { useLoggedSetsSince } from "./useWorkoutProgress";

const RANGES = [{ key: "4w", label: "4 weeks", days: 28 }, { key: "8w", label: "8 weeks", days: 56 }, { key: "all", label: "All time", days: 0 }] as const;
const DAY_MS = 86_400_000;
const daysAgo = (n: number) => todayKey(new Date(Date.now() - n * DAY_MS));

// Where your logged sets actually went. Brightness is relative to your most
// trained muscle; fixed ranges also compare against the period before.
export function MuscleHeatCard() {
  const [rangeKey, setRangeKey] = useState<(typeof RANGES)[number]["key"]>("4w");
  const range = RANGES.find((r) => r.key === rangeKey)!;
  const start = range.days ? daysAgo(range.days - 1) : null;
  // Fixed ranges load twice their length so the previous period comes along.
  const sets = useLoggedSetsSince(range.days ? daysAgo(range.days * 2 - 1) : null);
  const library = useExerciseLibrary();
  if (!sets || sets.length === 0) return null;

  const current = start ? sets.filter((s) => s.date >= start) : sets;
  const previous = start ? loggedTally(sets.filter((s) => s.date < start), library) : null;
  const tally = loggedTally(current, library);
  const firstDate = current.reduce((min, s) => (s.date < min ? s.date : min), todayKey());
  const weeks = range.days ? range.days / 7 : Math.max(1, (Date.now() - new Date(firstDate).getTime()) / (7 * DAY_MS));
  const max = Math.max(1, ...Object.values(tally).map((v) => v ?? 0));

  const heat: Heat = {};
  const rows = ALL_MUSCLES.map((m) => ({ m, v: tally[m] ?? 0 })).sort((a, b) => b.v - a.v).map(({ m, v }) => {
    if (v > 0) heat[m] = 0.15 + 0.85 * (v / max);
    const perWeek = v / weeks;
    const status = volumeStatus(perWeek);
    const before = previous?.[m] ?? 0;
    const delta = previous && before > 0 ? Math.round(((v - before) / before) * 100) : null;
    return {
      muscle: m, pct: v / max, dim: v === 0,
      value: delta === null ? <>{fmtSets(v)}<small> {v === 1 ? "set" : "sets"}</small></> : (
        <>{fmtSets(v)} <small className={delta >= 0 ? "mc-up" : "mc-down"}>{delta >= 0 ? <TbArrowUpRight size={11} /> : <TbArrowDownRight size={11} />}{Math.abs(delta)}%</small></>
      ),
      tag: { label: v ? `${fmtSets(Math.round(perWeek * 10) / 10)}/wk · ${status === "good" ? "in range" : status}` : "Untrained", tone: status },
    };
  });
  const neglected = rows.filter((r) => r.tag.tone === "none" || r.tag.tone === "low").map((r) => MUSCLE_LABELS[r.muscle]);

  return (
    <MuscleCard eyebrow="Muscle heat" heat={heat} rows={rows}
      aside={<Legend items={[["hot", "Most sets"], ["cold", "Least"]]} />}
      foot={<>
        {current.length} sets logged {range.days ? `in the last ${range.label}` : "since you started"}
        {previous ? ", with change vs the period before" : ""}. Brighter = more sets.
        {neglected.length > 0 && <> Under 10/wk: <b>{neglected.join(", ")}</b>.</>}
      </>}>
      <div className="mc-tabs" role="tablist" aria-label="Time range">
        {RANGES.map((r) => (
          <button key={r.key} type="button" role="tab" aria-selected={r.key === rangeKey} className={r.key === rangeKey ? "is-on" : ""}
            onClick={() => setRangeKey(r.key)}>{r.label}</button>
        ))}
      </div>
    </MuscleCard>
  );
}
