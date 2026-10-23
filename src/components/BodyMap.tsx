import { useId, type CSSProperties, type SVGProps } from "react";
import type { MuscleGroup } from "../db/types";
import { MUSCLE_LABELS } from "../config/exerciseLibrary";
import "./bodymap.css";

// Muscle heat, 0 (untouched) → 1 (fully lit). Anything from GLOW_FROM up also blooms.
export type Heat = Partial<Record<MuscleGroup, number>>;
export type Flash = Partial<Record<MuscleGroup, number>>;
const GLOW_FROM = 0.5;

// Left half of a 100×196 figure; parts without `center` are mirrored onto the
// right half. `bone` parts never light up; muscle parts without `m` are anatomy
// (serratus, adductors, tibialis, hip) that no MuscleGroup owns, so they stay idle.
interface Part { d: string; m?: MuscleGroup; bone?: true; center?: true }
type View = "front" | "back";

const HEAD = "M50,2 C55,2 58.5,6 58.5,12 C58.5,18 55,24 50,24 C45,24 41.5,18 41.5,12 C41.5,6 45,2 50,2 Z";
const NECK = "M45,21 L55,21 L56,31 L44,31 Z";
const HAND = "M21.5,99 L26.5,99 C27.5,103 27.5,107 26,110 C24,112 21,111 20,108 C19.5,105 20.5,102 21.5,99 Z";
const KNEE = "M36,136 C38,138.5 42,138.5 44,136 L43.5,144 C41,145.5 38,145.5 36,144 Z";
const FOOT = "M37,179 L42.5,179 C43.5,184 45,188 44,191 C41,193 36,193 34,191 C34,187 36,183 37,179 Z";
const BONES: Part[] = [{ d: HEAD, bone: true, center: true }, { d: NECK, bone: true, center: true }, { d: HAND, bone: true }, { d: KNEE, bone: true }, { d: FOOT, bone: true }];
const FOREARM: Part[] = [
  { d: "M25,70.5 C22.4,77.5 21.4,86 21.8,97 L23.8,97 C24.2,88 25.8,79 28,70.5 Z", m: "forearms" },
  { d: "M28,70.5 C25.8,79 24.2,88 23.8,97 L26.6,97 C28.4,88.5 30.4,80 31.2,70.5 Z", m: "forearms" },
];

const FRONT: Part[] = [
  ...BONES,
  { d: "M38.5,84 C43,90 57,90 61.5,84 L63,93 C58,99 54,103 50,106 C46,103 42,99 37,93 Z", center: true },
  { d: "M44,25 C41,28.5 37,30.5 33,31.5 L44,31.5 Z", m: "traps" },
  { d: "M33,32 C27,32 23,36 23,42.5 C23,46 23.6,49 24.8,51.5 C25.6,46 27.4,41 30.6,37 C31.4,35 32.4,33.4 33,32 Z", m: "shoulders" },
  { d: "M33,32 C32.4,33.4 31.4,35 30.6,37 C27.4,41 25.6,46 24.8,51.5 C27,46.5 30.5,42.5 36.2,39.5 C37.2,36.5 36,33.5 33,32 Z", m: "shoulders" },
  { d: "M49.3,33.5 L38.8,33.5 C37.6,35.5 36.8,38 36.6,40.5 C41,40.5 45.5,41 49.3,42 Z", m: "chest" },
  { d: "M49.3,42 C45.5,41 41,40.5 36.6,40.5 C36.4,42.5 36.5,44 36.8,45.5 C37.6,50 43,52.5 49.3,51.5 Z", m: "chest" },
  { d: "M37.4,46.5 L35.8,48 L37.2,49.4 L35.9,51 L37.6,52.4 C37,50.4 37,48.4 37.4,46.5 Z" },
  { d: "M25.2,53 C23.2,58 23.2,63.5 25,68.5 L27.6,68.5 C27.2,62 27.6,55 28.6,49.4 C27.2,50.4 26,51.6 25.2,53 Z", m: "biceps" },
  { d: "M28.6,49.4 C27.6,55 27.2,62 27.6,68.5 L30.4,68.5 C31.4,63 31.6,56 31,46.5 C30.1,47.4 29.3,48.4 28.6,49.4 Z", m: "biceps" },
  ...FOREARM,
  { d: "M44.2,54 C46,53.4 48,53.3 49.6,53.6 L49.6,61.4 L44.1,61.8 Z", m: "abs" },
  { d: "M44.1,62.8 L49.6,62.6 L49.6,70.2 L44.1,70.6 Z", m: "abs" },
  { d: "M44.1,71.8 L49.6,71.4 L49.6,78.6 L44.2,79.2 Z", m: "abs" },
  { d: "M44.2,80.4 L49.6,79.8 L49.6,89.4 C47.5,89 45.6,87.6 44.3,85.6 Z", m: "abs" },
  { d: "M42.8,54 L38,53 C36.8,62 36.9,72 38.8,82 L43,87.4 Z", m: "abs" },
  { d: "M37,92 C33.4,104 33,122 35.8,134.8 C36.8,135.6 37.8,136 38.8,136.2 C37.4,124 37.6,108 39.6,96 C38.6,94.8 37.8,93.4 37,92 Z", m: "quads" },
  { d: "M39.6,96 C37.6,108 37.4,124 38.8,136.2 C40,132 41.8,124 43,114 C43.6,108 43.4,102 42.6,98.6 C41.6,97.8 40.6,97 39.6,96 Z", m: "quads" },
  { d: "M43,114 C41.8,124 40,132 38.8,136.2 C40.6,136.6 42.6,136.2 44.2,134.8 C45.2,130 45.4,124 44.6,119 C44.2,117 43.6,115.4 43,114 Z", m: "quads" },
  { d: "M42.6,98.6 C43.4,102 43.6,108 43,114 C43.6,115.4 44.2,117 44.6,119 C46.6,114 48.6,109 49.4,105 C47,103 44.8,100.8 42.6,98.6 Z" },
  { d: "M36,146 C34,156 34.6,168 37,178 L40,178 C40.8,168 40.8,156 40.6,146.8 C39,147 37.4,146.8 36,146 Z" },
  { d: "M40.6,146.8 C40.8,156 40.8,168 40,178 L42.2,178 C42.6,172 43.4,166 43.8,160 C44.2,154 43.8,149 43.4,146 C42.6,146.6 41.6,146.8 40.6,146.8 Z", m: "calves" },
];
const FRONT_LINES = "M46.4,23 L48.8,31 M38.6,58 L42.8,60 M38,65 L42.8,67.4 M38.2,72 L42.8,74.6";

const BACK: Part[] = [
  ...BONES,
  { d: "M50,21 C47.5,24.5 44,27 40,29 C37.5,30.2 35,31 33,31.8 L40.6,36.6 C43.6,34.6 47,33.6 50,33.4 Z", m: "traps" },
  { d: "M50,33.4 C47,33.6 43.6,34.6 40.6,36.6 L43.5,38.5 L50,58 Z", m: "traps" },
  { d: "M32.6,32.5 C26.8,32.5 23,36.5 23,43 C23,46.5 23.6,49.5 24.8,52 C25.4,46.4 27.2,41.4 30.4,37.6 C31.2,35.6 32,34 32.6,32.5 Z", m: "shoulders" },
  { d: "M32.6,32.5 C32,34 31.2,35.6 30.4,37.6 C27.2,41.4 25.4,46.4 24.8,52 C27.4,47 31,43.2 36.4,40.6 Z", m: "shoulders" },
  { d: "M36.4,40.6 L43.5,38.5 L45.6,44.6 C42.6,46 39.6,46.4 37.2,46.2 C36.8,44.4 36.6,42.4 36.4,40.6 Z", m: "back" },
  { d: "M37.2,46.2 C39.6,46.4 42.6,46 45.6,44.6 L49.1,55.6 C47.6,60 46.6,66 46.2,72 C46,74.6 45.8,76.6 45.6,77.8 C42.4,76.4 40,73.6 38.4,70 C36.8,62 36.4,53 37.2,46.2 Z", m: "back" },
  { d: "M49.2,58.4 C47.8,62 46.9,67 46.6,72 C46.4,77 46.6,82 47,87 L49.6,87 L49.6,58.6 Z", m: "back" },
  { d: "M38.4,70 C40,73.6 42.4,76.4 45.6,77.8 C45.8,81 46.2,84 47,87 L37.4,87 C38,81 38.2,75 38.4,70 Z", m: "abs" },
  { d: "M25.2,54 C23.2,59 23.2,64 25,69 L27,69 C27,62.4 27.8,55.6 29,49.2 C27.4,50.6 26,52.2 25.2,54 Z", m: "triceps" },
  { d: "M29,49.2 C27.8,55.6 27,62.4 27,69 L30.4,69 C31.4,63 31.6,56.5 31,47 C30.3,47.7 29.6,48.4 29,49.2 Z", m: "triceps" },
  ...FOREARM,
  { d: "M37.4,87.6 L47,87.6 C43,88.6 39.6,90.6 37.2,93.8 C36.9,91.6 37,89.6 37.4,87.6 Z", m: "glutes" },
  { d: "M49.4,88.8 C43.6,88.4 38.6,90.4 36.6,95.5 C35.6,101 37.2,106.5 41.8,108.6 C45.4,110 48.4,108.6 49.4,106.5 Z", m: "glutes" },
  { d: "M36.4,110.5 C34.2,120 34.2,128.5 36.4,136 L40,136 C40.4,128 41,119 42.2,111.8 C40.2,111.6 38.2,111.2 36.4,110.5 Z", m: "hamstrings" },
  { d: "M42.2,111.8 C41,119 40.4,128 40,136 L43.6,136 C46.2,128 48.4,119 49,111 C46.8,111.8 44.4,112 42.2,111.8 Z", m: "hamstrings" },
  { d: "M36.4,145 C32.8,152 33,160 36.4,167 L39.6,164 C39.4,158 39.6,151 40,146.2 C38.6,146.1 37.4,145.7 36.4,145 Z", m: "calves" },
  { d: "M40,146.2 C39.6,151 39.4,158 39.6,164 L42.6,168 C44.6,160 45.6,152 43.8,145 C42.6,145.8 41.4,146.2 40,146.2 Z", m: "calves" },
  { d: "M36.4,167 L39.6,164 L42.6,168 C42.4,172 42.2,175 41.8,178 C40.2,176 37.8,172 36.4,167 Z", m: "calves" },
];
const BACK_LINES = "M46.4,23 L48.8,30";

const MIRROR = "matrix(-1 0 0 1 100 0)";
const FULL_BOX = "0 0 100 196";

function Figure({ view, heat, flash, onPick, box = FULL_BOX, glow = true }: {
  view: View; heat: Heat; flash?: Flash; onPick?: (m: MuscleGroup) => void; box?: string; glow?: boolean;
}) {
  const glowId = useId();
  const parts = view === "front" ? FRONT : BACK;
  const lines = view === "front" ? FRONT_LINES : BACK_LINES;
  const h = (p: Part) => (p.m ? heat[p.m] ?? 0 : 0);

  // Each part renders once, or twice (left + mirrored right). The part index
  // drives the top-to-bottom ignite stagger.
  const draw = (keep: (p: Part) => boolean, props: (p: Part, i: number) => SVGProps<SVGPathElement>, tag: string) =>
    parts.flatMap((p, i) => {
      if (!keep(p)) return [];
      const base = { d: p.d, ...props(p, i) };
      return p.center ? [<path key={`${tag}${i}`} {...base} />] : [<path key={`${tag}${i}`} {...base} />, <path key={`${tag}${i}r`} {...base} transform={MIRROR} />];
    });
  const pick = (p: Part) => (onPick && p.m ? { onClick: () => onPick(p.m!) } : {});
  const delay = (i: number) => ({ "--d": `${i * 28}ms` }) as CSSProperties;

  return (
    <svg viewBox={box} aria-hidden className={onPick ? "is-pick" : undefined}>
      <defs>
        <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.4" />
        </filter>
      </defs>
      {/* Thick same-colour strokes underneath fuse the parts into one outlined silhouette. */}
      <g className="bm-outline">{draw(() => true, () => ({ pathLength: 1 }), "o")}</g>
      <g>{draw(() => true, (p) => ({ className: p.bone ? "bm-bone" : "bm-idle", ...pick(p) }), "b")}</g>
      <g>{draw((p) => h(p) > 0, (p, i) => ({
        className: `bm-heat${h(p) >= 0.85 ? " is-max" : ""}`, style: { fillOpacity: h(p), ...delay(i) }, ...pick(p),
      }), "h")}</g>
      <path d={lines} className="bm-lines" />
      <path d={lines} className="bm-lines" transform={MIRROR} />
      {glow && (
        <g className="bm-glow" filter={`url(#${glowId})`}>
          {draw((p) => h(p) >= GLOW_FROM, (p, i) => ({ style: { opacity: (h(p) - 0.3) * 1.2, ...delay(i) } }), "g")}
        </g>
      )}
      {/* Keyed on the counter so a bump remounts the path and replays the flash. */}
      {flash && parts.flatMap((p, i) => {
        if (!p.m || !flash[p.m]) return [];
        const k = `f${i}-${flash[p.m]}`;
        return p.center ? [<path key={k} d={p.d} className="bm-flash" />]
          : [<path key={k} d={p.d} className="bm-flash" />, <path key={`${k}r`} d={p.d} className="bm-flash" transform={MIRROR} />];
      })}
    </svg>
  );
}

export function BodyMap({ heat, flash, onPick, className }: {
  heat: Heat; flash?: Flash; onPick?: (m: MuscleGroup) => void; className?: string;
}) {
  const lit = ALL_MUSCLES.filter((m) => (heat[m] ?? 0) > 0);
  const summary = lit.length ? `Muscles: ${lit.map((m) => MUSCLE_LABELS[m]).join(", ")}` : "No muscles selected";
  return (
    <div className={`bm${className ? ` ${className}` : ""}`} role="img" aria-label={summary}>
      {(["front", "back"] as const).map((v) => (
        <figure key={v} className="bm-fig">
          <Figure view={v} heat={heat} flash={flash} onPick={onPick} />
          <figcaption>{v}</figcaption>
        </figure>
      ))}
    </div>
  );
}

// Targets fully lit, assists dimmer.
export function heatOf(targets: MuscleGroup[], assists: MuscleGroup[] = [], assistHeat = 0.4): Heat {
  const heat: Heat = {};
  assists.forEach((m) => { heat[m] = assistHeat; });
  targets.forEach((m) => { heat[m] = 1; });
  return heat;
}

export const ALL_MUSCLES = Object.keys(MUSCLE_LABELS) as MuscleGroup[];
