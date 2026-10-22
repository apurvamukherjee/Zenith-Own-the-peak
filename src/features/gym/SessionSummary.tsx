import { App } from "antd";
import { motion } from "framer-motion";
import { TbShare2, TbTrendingDown, TbTrendingUp, TbTrophy } from "react-icons/tb";
import type { WorkoutSetDto } from "../../db/types";

// End-of-workout card: replaces the bottom of the list once every set is in.
export function SessionSummary({ dayName, sets, volume, elapsedMin, prevVolume }: {
  dayName: string; sets: WorkoutSetDto[]; volume: number; elapsedMin: number; prevVolume: number | null;
}) {
  const { message } = App.useApp();
  const prs = sets.filter((s) => s.isPR);
  const delta = prevVolume ? Math.round(((volume - prevVolume) / prevVolume) * 100) : null;
  const kg = Math.round(volume).toLocaleString();

  async function share() {
    const text = [
      `${dayName} done — ${sets.length} sets, ${kg} kg in ${elapsedMin} min.`,
      prs.length ? `PRs: ${prs.map((p) => `${p.exerciseName} ${p.weightKg}×${p.reps}`).join(", ")}.` : "",
      "Zenith · Own the peak",
    ].filter(Boolean).join("\n");
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); message.success("Copied to clipboard"); }
    } catch (err) {
      // Closing the share sheet rejects with AbortError — that's a cancel, not a failure.
      if (err instanceof DOMException && err.name === "AbortError") return;
      message.error(`Couldn't share: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return (
    <motion.section className="sm" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} aria-label="Session complete">
      <div className="sm-eyebrow">Session complete</div>
      <div className="sm-title">{dayName}</div>
      <div className="sm-grid">
        <div><b>{elapsedMin}<small>m</small></b><span>Time</span></div>
        <div>
          <b>{kg}<small>kg</small></b>
          <span>
            {delta === null ? "Volume" : (
              <em className={delta >= 0 ? "is-up" : "is-down"}>
                {delta >= 0 ? <TbTrendingUp size={12} /> : <TbTrendingDown size={12} />} {delta >= 0 ? "+" : ""}{delta}% vs last
              </em>
            )}
          </span>
        </div>
        <div><b>{sets.length}</b><span>Sets</span></div>
        <div><b>{prs.length}</b><span>PRs</span></div>
      </div>
      {prs.length > 0 && (
        <ul className="sm-prs">
          {prs.map((p) => (
            <li key={p.id}><TbTrophy size={14} /> <span>{p.exerciseName}</span> <b>{p.weightKg}×{p.reps}</b></li>
          ))}
        </ul>
      )}
      <button type="button" className="sm-share" onClick={() => void share()}><TbShare2 size={16} /> Share</button>
    </motion.section>
  );
}
