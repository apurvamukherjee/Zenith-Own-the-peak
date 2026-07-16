import { useEffect, useState } from "react";

// Adaptive theme (Batch 4): a subtle gradient that follows the day.
// Every stop stays within the red-ember-crimson family — no purple, no lavender.
// Dawn (5–8): amber → burnt-orange (embers reawakening).
// Morning (8–12): burnt-orange → blood-red.  Midday (12–15): deep red at peak.
// Afternoon (15–18): red → crimson.  Evening (18–21): crimson → ember-black.
// Wind-down (21–24) + late-night (0–5): deep dried-blood into black.
export interface TimeGradient { grad: string; label: string; }
function pickGradient(h: number): TimeGradient {
  if (h >= 5 && h < 8) return { label: "dawn", grad: "linear-gradient(135deg, #f6b93b, #ff6b3d)" };
  if (h >= 8 && h < 12) return { label: "morning", grad: "linear-gradient(135deg, #ff6b3d, #ff2740)" };
  if (h >= 12 && h < 15) return { label: "midday", grad: "linear-gradient(135deg, #ff2740, #d81f34)" };
  if (h >= 15 && h < 18) return { label: "afternoon", grad: "linear-gradient(135deg, #d81f34, #a8172b)" };
  if (h >= 18 && h < 21) return { label: "evening", grad: "linear-gradient(135deg, #a8172b, #6e0f1c)" };
  if (h >= 21 && h < 24) return { label: "wind-down", grad: "linear-gradient(135deg, #6e0f1c, #1a0509)" };
  return { label: "late-night", grad: "linear-gradient(135deg, #1a0509, #08060a)" };
}

export function useAdaptiveTheme(): TimeGradient {
  const [state, setState] = useState<TimeGradient>(() => pickGradient(new Date().getHours()));
  useEffect(() => {
    const tick = () => setState(pickGradient(new Date().getHours()));
    // Update at the top of every hour (± the current minute) so it stays in sync.
    const now = new Date();
    const msToNextHour = (60 - now.getMinutes()) * 60 * 1000 - now.getSeconds() * 1000;
    const to = window.setTimeout(() => {
      tick();
      // After the aligned tick, re-tick every hour.
      const id = window.setInterval(tick, 60 * 60 * 1000);
      // Store on the closure so the outer cleanup can clear it.
      cleanup.id = id;
    }, msToNextHour);
    const cleanup: { id: number | null } = { id: null };
    return () => { window.clearTimeout(to); if (cleanup.id != null) window.clearInterval(cleanup.id); };
  }, []);
  return state;
}
